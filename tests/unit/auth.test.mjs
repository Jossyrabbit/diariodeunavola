import test from "node:test";
import assert from "node:assert/strict";
import { assertAdminUser } from "../../lib/server/auth.mjs";

test("rechaza una solicitud sin usuario", () => {
  assert.throws(() => assertAdminUser(null), { code: "unauthorized", status: 401 });
});

test("rechaza usuarios Identity sin rol admin", () => {
  assert.throws(() => assertAdminUser({ id: "user-1", email: "lector@example.test", roles: ["editor"] }), {
    code: "forbidden",
    status: 403,
  });
});

test("acepta solo un usuario con rol admin", () => {
  assert.deepEqual(
    assertAdminUser({ id: "admin-1", email: "admin@example.test", roles: ["admin"] }),
    { id: "admin-1", email: "admin@example.test", roles: ["admin"] },
  );
});
