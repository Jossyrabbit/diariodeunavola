import { getUser, verifyRequestOrigin } from "@netlify/identity";
import { HttpError } from "./errors.mjs";

export function assertAdminUser(user) {
  if (!user) throw new HttpError(401, "unauthorized", "Debes iniciar sesión.");
  if (!Array.isArray(user.roles) || !user.roles.includes("admin")) {
    throw new HttpError(403, "forbidden", "Tu cuenta no tiene el rol de administración.");
  }
  return {
    id: user.id,
    email: user.email || null,
    roles: [...user.roles],
  };
}

export async function requireAdmin(request, { mutation = false } = {}) {
  if (mutation) {
    try {
      verifyRequestOrigin(request);
    } catch {
      throw new HttpError(403, "invalid_origin", "El origen de la solicitud no es válido.");
    }
  }
  return assertAdminUser(await getUser());
}
