import test from "node:test";
import assert from "node:assert/strict";
import { assertDeliveryTransition, assertQuoteTransition } from "../../lib/server/states.mjs";

test("permite el recorrido operativo de una entrega", () => {
  assert.doesNotThrow(() => assertDeliveryTransition("pending", "ready"));
  assert.doesNotThrow(() => assertDeliveryTransition("ready", "shipped"));
  assert.doesNotThrow(() => assertDeliveryTransition("shipped", "delivered"));
});

test("la cotización exige el orden pendiente, cotizada y aceptada", () => {
  assert.doesNotThrow(() => assertQuoteTransition("pending_quote", "quoted"));
  assert.doesNotThrow(() => assertQuoteTransition("quoted", "accepted"));
  assert.throws(() => assertQuoteTransition("pending_quote", "accepted"), { code: "invalid_quote_transition" });
  assert.throws(() => assertQuoteTransition("accepted", "quoted"), { code: "invalid_quote_transition" });
});

test("impide saltos y cambios desde estados terminales", () => {
  assert.throws(() => assertDeliveryTransition("pending", "delivered"), { code: "invalid_delivery_transition" });
  assert.throws(() => assertDeliveryTransition("cancelled", "ready"), { code: "invalid_delivery_transition" });
});
