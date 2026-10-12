import test from "node:test";
import assert from "node:assert/strict";
import { normalizeIdentityPasswordInput } from "../../lib/server/identity-password.mjs";

test("acepta solamente invitación o recuperación con contraseña robusta", () => {
  assert.deepEqual(normalizeIdentityPasswordInput({
    action: "recover_password",
    token: "token-de-prueba",
    password: "frase-segura-2026",
  }), {
    action: "recover_password",
    token: "token-de-prueba",
    password: "frase-segura-2026",
  });
});

test("rechaza acciones, tokens y contraseñas inválidas", () => {
  assert.throws(() => normalizeIdentityPasswordInput({ action: "signup", token: "token", password: "frase-segura-2026" }), { code: "invalid_identity_token" });
  assert.throws(() => normalizeIdentityPasswordInput({ action: "accept_invite", token: "", password: "frase-segura-2026" }), { code: "invalid_identity_token" });
  assert.throws(() => normalizeIdentityPasswordInput({ action: "accept_invite", token: "token", password: "corta" }), { code: "invalid_password" });
});
