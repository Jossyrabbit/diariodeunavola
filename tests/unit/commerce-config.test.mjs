import test from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCE_FLAGS,
  assertPaymentsEnabled,
  assertPublicRequestsEnabled,
} from "../../lib/server/commerce-config.mjs";

test("solicitudes públicas y pagos permanecen desactivados", () => {
  assert.equal(COMMERCE_FLAGS.publicRequestsEnabled, false);
  assert.equal(COMMERCE_FLAGS.paymentsEnabled, false);
  assert.equal(COMMERCE_FLAGS.shippingOrigin, "Santiago, Chile");
  assert.equal(COMMERCE_FLAGS.quoteValidityDays, 7);
  assert.throws(assertPublicRequestsEnabled, { code: "public_requests_disabled", status: 503 });
  assert.throws(assertPaymentsEnabled, { code: "payments_disabled", status: 503 });
});
