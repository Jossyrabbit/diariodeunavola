import { validateServerPrice } from "./catalog.mjs";
import { withTransaction } from "./database.mjs";
import { HttpError } from "./errors.mjs";
import { assertDeliveryTransition } from "./states.mjs";

function addressSnapshot(row) {
  return {
    region: row.region,
    commune: row.commune,
    address_line_1: row.address_line_1,
    street_number: row.street_number,
    apartment: row.apartment,
    postal_code: row.postal_code,
    delivery_notes: row.delivery_notes,
  };
}

async function audit(client, actor, action, entityType, entityId, beforeValue, afterValue, requestId = null) {
  await client.query(
    `INSERT INTO admin_audit_log
      (actor_identity_id, actor_email, action, entity_type, entity_id, before_value, after_value, request_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [actor.id, actor.email, action, entityType, String(entityId), beforeValue, afterValue, requestId],
  );
}

export async function activatePaidTestOrder(orderId, { actor = { id: "test-system", email: null }, database } = {}) {
  return withTransaction(async (client) => {
    const orderResult = await client.query(
      `SELECT o.*, p.delivery_count, p.magazines, p.boxes, p.collectible_photo_eligible
       FROM orders o JOIN products p ON p.id = o.product_id
       WHERE o.id = $1 FOR UPDATE OF o`,
      [orderId],
    );
    const order = orderResult.rows[0];
    if (!order) throw new HttpError(404, "order_not_found", "El pedido no existe.");
    if (!order.is_test_data) throw new HttpError(403, "test_order_required", "Fase 1 solo admite pedidos ficticios.");
    if (order.status === "paid") return { orderId, idempotent: true };
    if (order.status !== "payment_pending") {
      throw new HttpError(409, "invalid_order_state", "Solo un pedido de prueba pendiente puede activarse.");
    }

    const product = validateServerPrice(order.product_id, order.unit_price_clp, order.currency);
    if (order.shipping_clp === null || order.total_clp === null) {
      throw new HttpError(409, "shipping_required", "El pedido no tiene un despacho de prueba definido.");
    }

    const paidAt = new Date();
    await client.query("UPDATE orders SET status = 'paid', paid_at = $2, updated_at = $2 WHERE id = $1", [orderId, paidAt]);

    let subscriptionId = null;
    if (product.delivery_count === 3) {
      const subscription = await client.query(
        `INSERT INTO subscriptions
          (order_id, customer_id, product_id, total_deliveries, starts_at, ends_at)
         VALUES ($1, $2, $3, 3, $4::timestamptz, $4::timestamptz + interval '1 year')
         RETURNING id`,
        [orderId, order.customer_id, order.product_id, paidAt],
      );
      subscriptionId = subscription.rows[0].id;
    }

    for (let sequence = 1; sequence <= product.delivery_count; sequence += 1) {
      await client.query(
        `INSERT INTO edition_deliveries
          (order_id, subscription_id, sequence_number, includes_magazine, includes_box)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          orderId,
          subscriptionId,
          sequence,
          product.magazines > 0,
          product.boxes > 0,
        ],
      );
    }

    let photoSlot = null;
    if (product.collectible_photo_eligible && product.id === "caja-ddv-01") {
      const slot = await client.query(
        `UPDATE inventory_locks
         SET next_slot = next_slot + 1
         WHERE lock_key = 'collectible-photo-slots' AND next_slot <= 200
         RETURNING next_slot - 1 AS slot_number`,
      );
      if (slot.rows[0]) {
        photoSlot = slot.rows[0].slot_number;
        await client.query(
          `UPDATE collectible_photo_slots
           SET status = 'assigned', order_id = $2, assigned_at = $3, released_at = NULL
           WHERE slot_number = $1`,
          [photoSlot, orderId, paidAt],
        );
      }
    }

    await audit(client, actor, "test_order_activated", "order", orderId, { status: order.status }, {
      status: "paid",
      delivery_count: product.delivery_count,
      photo_slot: photoSlot,
    });

    return { orderId, subscriptionId, deliveryCount: product.delivery_count, photoSlot, idempotent: false };
  }, database);
}

export async function replaceCustomerAddress(customerId, address, actor, { database, requestId = null } = {}) {
  return withTransaction(async (client) => {
    const customerResult = await client.query("SELECT id FROM customers WHERE id = $1 FOR UPDATE", [customerId]);
    if (!customerResult.rows[0]) throw new HttpError(404, "customer_not_found", "El cliente no existe.");

    const currentResult = await client.query(
      "SELECT * FROM customer_addresses WHERE customer_id = $1 AND valid_until IS NULL FOR UPDATE",
      [customerId],
    );
    const current = currentResult.rows[0] || null;
    const changedAt = new Date();
    if (current) {
      await client.query("UPDATE customer_addresses SET valid_until = $2 WHERE id = $1", [current.id, changedAt]);
    }

    const inserted = await client.query(
      `INSERT INTO customer_addresses
        (customer_id, region, commune, address_line_1, street_number, apartment, postal_code, delivery_notes, valid_from, created_by_identity_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        customerId,
        address.region,
        address.commune,
        address.address_line_1,
        address.street_number,
        address.apartment,
        address.postal_code,
        address.delivery_notes,
        changedAt,
        actor.id,
      ],
    );
    const next = inserted.rows[0];
    await audit(client, actor, "address_replaced", "customer", customerId, current && addressSnapshot(current), addressSnapshot(next), requestId);
    return next;
  }, database);
}

export async function updateDelivery(deliveryId, input, actor, { database, requestId = null } = {}) {
  return withTransaction(async (client) => {
    const deliveryResult = await client.query(
      `SELECT d.*, o.customer_id FROM edition_deliveries d
       JOIN orders o ON o.id = d.order_id
       WHERE d.id = $1 FOR UPDATE OF d`,
      [deliveryId],
    );
    const delivery = deliveryResult.rows[0];
    if (!delivery) throw new HttpError(404, "delivery_not_found", "La entrega no existe.");
    assertDeliveryTransition(delivery.status, input.status);

    let addressId = delivery.address_id;
    let snapshot = delivery.address_snapshot;
    if (input.status === "ready" && delivery.status !== "ready") {
      const addressResult = await client.query(
        "SELECT * FROM customer_addresses WHERE customer_id = $1 AND valid_until IS NULL",
        [delivery.customer_id],
      );
      const currentAddress = addressResult.rows[0];
      if (!currentAddress) throw new HttpError(409, "address_required", "El cliente no tiene una dirección vigente.");
      addressId = currentAddress.id;
      snapshot = addressSnapshot(currentAddress);
    }

    const changedAt = new Date();
    const result = await client.query(
      `UPDATE edition_deliveries SET
        status = $2,
        address_id = $3,
        address_snapshot = $4,
        carrier = COALESCE($5, carrier),
        tracking_code = COALESCE($6, tracking_code),
        prepared_at = CASE WHEN $2 = 'ready' AND prepared_at IS NULL THEN $7 ELSE prepared_at END,
        shipped_at = CASE WHEN $2 = 'shipped' AND shipped_at IS NULL THEN $7 ELSE shipped_at END,
        delivered_at = CASE WHEN $2 = 'delivered' AND delivered_at IS NULL THEN $7 ELSE delivered_at END,
        updated_at = $7
       WHERE id = $1 RETURNING *`,
      [deliveryId, input.status, addressId, snapshot, input.carrier || null, input.tracking_code || null, changedAt],
    );
    const next = result.rows[0];
    await audit(client, actor, "delivery_updated", "delivery", deliveryId, {
      status: delivery.status,
      carrier: delivery.carrier,
      tracking_code: delivery.tracking_code,
    }, {
      status: next.status,
      carrier: next.carrier,
      tracking_code: next.tracking_code,
    }, requestId);
    return next;
  }, database);
}
