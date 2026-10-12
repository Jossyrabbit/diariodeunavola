import test from "node:test";
import assert from "node:assert/strict";
import { EDITORIAL_PRODUCTS, getServerProduct, validateServerPrice } from "../../lib/server/catalog.mjs";

test("el catálogo de servidor conserva los tres precios aprobados y está desactivado", () => {
  assert.deepEqual(
    EDITORIAL_PRODUCTS.map(({ id, price_clp, active }) => ({ id, price_clp, active })),
    [
      { id: "caja-ddv-01", price_clp: 15990, active: false },
      { id: "suscripcion-ddv-anual", price_clp: 29990, active: false },
      { id: "club-ddv-anual", price_clp: 39990, active: false },
    ],
  );
});

test("solo la caja individual es elegible para fotografía", () => {
  assert.equal(getServerProduct("caja-ddv-01").collectible_photo_eligible, true);
  assert.equal(getServerProduct("suscripcion-ddv-anual").collectible_photo_eligible, false);
  assert.equal(getServerProduct("club-ddv-anual").collectible_photo_eligible, false);
});

test("el servidor rechaza precios alterados", () => {
  assert.throws(() => validateServerPrice("caja-ddv-01", 1), { code: "catalog_mismatch", status: 409 });
});
