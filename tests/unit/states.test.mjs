import test from "node:test";
import assert from "node:assert/strict";
import { assertDeliveryTransition } from "../../lib/server/states.mjs";

test("permite el recorrido operativo de una entrega", () => {
  assert.doesNotThrow(() => assertDeliveryTransition("pending", "ready"));
  assert.doesNotThrow(() => assertDeliveryTransition("ready", "shipped"));
  assert.doesNotThrow(() => assertDeliveryTransition("shipped", "delivered"));
});

test("impide saltos y cambios desde estados terminales", () => {
  assert.throws(() => assertDeliveryTransition("pending", "delivered"), { code: "invalid_delivery_transition" });
  assert.throws(() => assertDeliveryTransition("cancelled", "ready"), { code: "invalid_delivery_transition" });
});
