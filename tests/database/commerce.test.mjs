import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { NetlifyDB } from "@netlify/database-dev";
import pg from "pg";
import {
  acceptOrderQuote,
  activatePaidTestOrder,
  quoteOrderShipping,
  replaceCustomerAddress,
  updateDelivery,
} from "../../lib/server/commerce-service.mjs";
import { getServerProduct } from "../../lib/server/catalog.mjs";

let emulator;
let pool;
let database;
let fixtureSequence = 0;
const testActor = { id: "identity-test-admin", email: "admin@example.test" };

before(async () => {
  emulator = new NetlifyDB({ logger: () => {} });
  const connectionString = await emulator.start();
  await emulator.applyMigrations("./netlify/database/migrations");
  pool = new pg.Pool({ connectionString, max: 24 });
  database = { pool };
});

after(async () => {
  await pool?.end();
  await emulator?.stop();
});

async function createFixture(productId) {
  fixtureSequence += 1;
  const product = getServerProduct(productId);
  const email = `cliente-${fixtureSequence}@example.test`;
  const customerResult = await pool.query(
    `INSERT INTO customers (email_normalized, full_name, phone, is_test_data)
     VALUES ($1, $2, $3, true) RETURNING id`,
    [email, `Cliente ficticio ${fixtureSequence}`, "+56000000000"],
  );
  const customerId = customerResult.rows[0].id;
  await pool.query(
    `INSERT INTO customer_addresses
      (customer_id, region, commune, address_line_1, street_number)
     VALUES ($1, 'Región ficticia', 'Comuna ficticia', 'Calle de prueba', '100')`,
    [customerId],
  );
  const orderResult = await pool.query(
    `INSERT INTO orders
      (public_reference, customer_id, product_id, product_sku_snapshot, product_name_snapshot,
       unit_price_clp, shipping_clp, total_clp, status, purchase_terms_version,
       purchase_consent_at, is_test_data)
     VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, 'draft', 'test-v1', now(), true)
     RETURNING id`,
    [`TEST-${String(fixtureSequence).padStart(5, "0")}`, customerId, product.id, product.sku, product.name, product.price_clp],
  );
  return { orderId: orderResult.rows[0].id, customerId, product };
}

async function preparePaidFixture(productId, shippingClp = 0) {
  const fixture = await createFixture(productId);
  await quoteOrderShipping(fixture.orderId, shippingClp, testActor, { database });
  await acceptOrderQuote(fixture.orderId, testActor, { database });
  await pool.query(
    "UPDATE orders SET status = 'payment_pending', payment_status = 'pending' WHERE id = $1",
    [fixture.orderId],
  );
  return fixture;
}

test("la migración deja productos inactivos y exactamente 200 cupos", async () => {
  const products = await pool.query("SELECT id, price_clp, active FROM products ORDER BY price_clp");
  assert.deepEqual(products.rows.map((row) => [row.id, row.price_clp, row.active]), [
    ["caja-ddv-01", 15990, false],
    ["suscripcion-ddv-anual", 29990, false],
    ["club-ddv-anual", 39990, false],
  ]);
  const slots = await pool.query("SELECT count(*)::int AS count FROM collectible_photo_slots");
  assert.equal(slots.rows[0].count, 200);
});

test("Suscripción y Club crean tres entregas y nunca reciben fotografía", async () => {
  for (const productId of ["suscripcion-ddv-anual", "club-ddv-anual"]) {
    const fixture = await preparePaidFixture(productId);
    const result = await activatePaidTestOrder(fixture.orderId, { actor: testActor, database });
    assert.equal(result.deliveryCount, 3);
    assert.equal(result.photoSlot, null);
    const deliveries = await pool.query("SELECT count(*)::int AS count FROM edition_deliveries WHERE order_id = $1", [fixture.orderId]);
    assert.equal(deliveries.rows[0].count, 3);
  }
});

test("la caja individual crea una entrega y la activación es idempotente", async () => {
  const fixture = await preparePaidFixture("caja-ddv-01");
  const first = await activatePaidTestOrder(fixture.orderId, { actor: testActor, database });
  const second = await activatePaidTestOrder(fixture.orderId, { actor: testActor, database });
  assert.equal(first.deliveryCount, 1);
  assert.equal(first.photoSlot, 1);
  assert.equal(second.idempotent, true);
  const deliveries = await pool.query("SELECT count(*)::int AS count FROM edition_deliveries WHERE order_id = $1", [fixture.orderId]);
  assert.equal(deliveries.rows[0].count, 1);
});

test("200 activaciones concurrentes no duplican cupos y el pedido 201 queda fuera", async () => {
  const fixtures = [];
  for (let index = 0; index < 200; index += 1) fixtures.push(await preparePaidFixture("caja-ddv-01"));
  const results = await Promise.all(fixtures.map(({ orderId }) => activatePaidTestOrder(orderId, { actor: testActor, database })));
  const assigned = results.filter((result) => result.photoSlot !== null);
  const excluded = results.filter((result) => result.photoSlot === null);
  assert.equal(assigned.length, 199);
  assert.equal(excluded.length, 1);
  assert.equal(new Set(assigned.map((result) => result.photoSlot)).size, 199);
  const slots = await pool.query("SELECT count(*)::int AS count, count(DISTINCT order_id)::int AS orders FROM collectible_photo_slots WHERE status = 'assigned'");
  assert.deepEqual(slots.rows[0], { count: 200, orders: 200 });
});

test("cambiar dirección conserva historial y una entrega preparada congela su snapshot", async () => {
  const fixture = await preparePaidFixture("suscripcion-ddv-anual");
  await activatePaidTestOrder(fixture.orderId, { actor: testActor, database });
  await replaceCustomerAddress(fixture.customerId, {
    region: "Región ficticia B",
    commune: "Comuna ficticia B",
    address_line_1: "Avenida de prueba",
    street_number: "200",
    apartment: null,
    postal_code: null,
    delivery_notes: null,
  }, testActor, { database });

  const deliveryResult = await pool.query("SELECT id FROM edition_deliveries WHERE order_id = $1 ORDER BY sequence_number LIMIT 1", [fixture.orderId]);
  const deliveryId = deliveryResult.rows[0].id;
  await updateDelivery(deliveryId, { status: "ready", carrier: null, tracking_code: null }, testActor, { database });

  await replaceCustomerAddress(fixture.customerId, {
    region: "Región ficticia C",
    commune: "Comuna ficticia C",
    address_line_1: "Pasaje de prueba",
    street_number: "300",
    apartment: null,
    postal_code: null,
    delivery_notes: null,
  }, testActor, { database });

  const addresses = await pool.query("SELECT valid_until FROM customer_addresses WHERE customer_id = $1 ORDER BY valid_from", [fixture.customerId]);
  assert.equal(addresses.rows.length, 3);
  assert.equal(addresses.rows.filter((row) => row.valid_until === null).length, 1);
  const delivery = await pool.query("SELECT address_snapshot FROM edition_deliveries WHERE id = $1", [deliveryId]);
  assert.equal(delivery.rows[0].address_snapshot.region, "Región ficticia B");
});

test("la cotización dura siete días y calcula el total exclusivamente en servidor", async () => {
  const fixture = await createFixture("caja-ddv-01");
  const now = new Date("2026-10-13T12:00:00.000Z");
  const quote = await quoteOrderShipping(fixture.orderId, 4990, testActor, { database, now });
  assert.equal(quote.amount_clp, 4990);
  assert.equal(quote.product_price_clp, 15990);
  assert.equal(quote.total_clp, 20980);
  assert.equal(quote.covers_deliveries, 1);
  assert.equal(new Date(quote.valid_until).toISOString(), "2026-10-20T12:00:00.000Z");
  const order = await pool.query("SELECT quote_status, payment_status, shipping_clp, total_clp FROM orders WHERE id = $1", [fixture.orderId]);
  assert.deepEqual(order.rows[0], {
    quote_status: "quoted",
    payment_status: "not_requested",
    shipping_clp: 4990,
    total_clp: 20980,
  });
});

test("Suscripción y Club registran un despacho que cubre las tres entregas", async () => {
  for (const productId of ["suscripcion-ddv-anual", "club-ddv-anual"]) {
    const fixture = await createFixture(productId);
    const quote = await quoteOrderShipping(fixture.orderId, 12000, testActor, { database });
    assert.equal(quote.covers_deliveries, 3);
  }
});

test("solo el administrador registra aceptación y no se crean entregas antes del pago", async () => {
  const fixture = await createFixture("caja-ddv-01");
  await quoteOrderShipping(fixture.orderId, 3500, testActor, { database });
  const acceptance = await acceptOrderQuote(fixture.orderId, testActor, { database });
  assert.equal(acceptance.quote_status, "accepted");
  const deliveries = await pool.query("SELECT count(*)::int AS count FROM edition_deliveries WHERE order_id = $1", [fixture.orderId]);
  const photos = await pool.query("SELECT count(*)::int AS count FROM collectible_photo_slots WHERE order_id = $1", [fixture.orderId]);
  assert.equal(deliveries.rows[0].count, 0);
  assert.equal(photos.rows[0].count, 0);
});

test("rechaza la aceptación de una cotización vencida", async () => {
  const fixture = await createFixture("caja-ddv-01");
  const now = new Date("2026-10-13T12:00:00.000Z");
  await quoteOrderShipping(fixture.orderId, 3500, testActor, { database, now });
  await assert.rejects(
    acceptOrderQuote(fixture.orderId, testActor, { database, now: new Date("2026-10-20T12:00:00.001Z") }),
    { code: "quote_expired" },
  );
  const state = await pool.query("SELECT quote_status FROM orders WHERE id = $1", [fixture.orderId]);
  assert.equal(state.rows[0].quote_status, "expired");
});
