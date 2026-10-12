import { HttpError } from "./errors.mjs";

const allowedActions = new Set(["accept_invite", "recover_password"]);

export function normalizeIdentityPasswordInput(input) {
  if (!input || typeof input !== "object") {
    throw new HttpError(400, "invalid_request", "La solicitud no es válida.");
  }
  const action = String(input.action || "");
  const token = String(input.token || "").trim();
  const password = String(input.password || "");
  if (!allowedActions.has(action) || !token || token.length > 4096) {
    throw new HttpError(400, "invalid_identity_token", "El enlace no es válido o ya expiró.");
  }
  if (password.length < 10 || password.length > 128) {
    throw new HttpError(400, "invalid_password", "La contraseña debe tener entre 10 y 128 caracteres.");
  }
  return { action, token, password };
}
