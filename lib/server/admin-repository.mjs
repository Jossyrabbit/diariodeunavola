import { getDdvDatabase } from "./database.mjs";

export async function getAdminOverview(database = getDdvDatabase()) {
  const { rows } = await database.pool.query(`
    SELECT
      (SELECT count(*)::int FROM orders) AS orders_total,
      (SELECT count(*)::int FROM orders WHERE status = 'paid') AS orders_paid,
      (SELECT count(*)::int FROM orders WHERE quote_status = 'pending_quote') AS quotes_pending,
      (SELECT count(*)::int FROM orders WHERE quote_status = 'quoted') AS quotes_waiting_acceptance,
      (SELECT count(*)::int FROM subscriptions WHERE status = 'active') AS subscriptions_active,
      (SELECT count(*)::int FROM edition_deliveries WHERE status = 'pending') AS deliveries_pending,
      (SELECT count(*)::int FROM edition_deliveries WHERE status = 'ready') AS deliveries_ready,
      (SELECT count(*)::int FROM collectible_photo_slots WHERE status = 'assigned') AS photo_slots_assigned
  `);
  return rows[0];
}

export async function listOrders({ status = null, limit = 50 } = {}, database = getDdvDatabase()) {
  const values = [];
  const where = [];
  if (status) {
    values.push(status);
    where.push(`o.status = $${values.length}`);
  }
  values.push(limit);
  const { rows } = await database.pool.query(
    `SELECT o.id, o.public_reference, o.status, o.quote_status, o.payment_status,
            o.product_name_snapshot, o.unit_price_clp, o.shipping_clp, o.total_clp,
            o.currency, o.shipping_origin, o.created_at, o.paid_at,
            c.full_name, c.email_normalized, c.phone,
            quote.id AS shipping_quote_id, quote.valid_until AS quote_valid_until,
            quote.covers_deliveries,
            s.id AS subscription_id,
            photo.slot_number AS collectible_photo_slot
     FROM orders o
     JOIN customers c ON c.id = o.customer_id
     LEFT JOIN shipping_quotes quote ON quote.order_id = o.id AND quote.status IN ('quoted', 'accepted')
     LEFT JOIN subscriptions s ON s.order_id = o.id
     LEFT JOIN collectible_photo_slots photo ON photo.order_id = o.id AND photo.status = 'assigned'
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY o.created_at DESC
     LIMIT $${values.length}`,
    values,
  );
  return rows;
}

export async function listSubscriptions({ limit = 50 } = {}, database = getDdvDatabase()) {
  const { rows } = await database.pool.query(
    `SELECT s.id, s.status, s.total_deliveries, s.starts_at, s.ends_at,
            o.public_reference, o.product_name_snapshot,
            c.id AS customer_id, c.full_name, c.email_normalized,
            address.region, address.commune, address.address_line_1, address.street_number,
            count(d.id)::int AS deliveries_created,
            count(d.id) FILTER (WHERE d.status = 'delivered')::int AS deliveries_completed
     FROM subscriptions s
     JOIN orders o ON o.id = s.order_id
     JOIN customers c ON c.id = s.customer_id
     LEFT JOIN LATERAL (
       SELECT region, commune, address_line_1, street_number
       FROM customer_addresses
       WHERE customer_id = c.id AND valid_until IS NULL
       LIMIT 1
     ) address ON true
     LEFT JOIN edition_deliveries d ON d.subscription_id = s.id
     GROUP BY s.id, o.id, c.id, address.region, address.commune, address.address_line_1, address.street_number
     ORDER BY s.created_at DESC
     LIMIT $1`,
    [limit],
  );
  return rows;
}

export async function listDeliveries({ status = null, limit = 100 } = {}, database = getDdvDatabase()) {
  const values = [];
  const where = [];
  if (status) {
    values.push(status);
    where.push(`d.status = $${values.length}`);
  }
  values.push(limit);
  const { rows } = await database.pool.query(
    `SELECT d.id, d.sequence_number, d.includes_magazine, d.includes_box, d.status,
            d.carrier, d.tracking_code, d.prepared_at, d.shipped_at, d.delivered_at,
            o.public_reference, o.product_name_snapshot,
            c.id AS customer_id, c.full_name, c.email_normalized
     FROM edition_deliveries d
     JOIN orders o ON o.id = d.order_id
     JOIN customers c ON c.id = o.customer_id
     ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
     ORDER BY d.created_at, d.sequence_number
     LIMIT $${values.length}`,
    values,
  );
  return rows;
}
