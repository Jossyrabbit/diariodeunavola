import { acceptInvite, recoverPassword, verifyRequestOrigin } from "@netlify/identity";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";
import { normalizeIdentityPasswordInput } from "../../lib/server/identity-password.mjs";
import { parseJsonBody } from "../../lib/server/validation.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    verifyRequestOrigin(request);
  } catch {
    return jsonResponse({ error: "invalid_origin", message: "El origen de la solicitud no es válido." }, { status: 403 });
  }

  let input;
  try {
    input = normalizeIdentityPasswordInput(await parseJsonBody(request));
  } catch (error) {
    return errorResponse(error);
  }

  try {
    const { action, token, password } = input;
    if (action === "accept_invite") await acceptInvite(token, password);
    else await recoverPassword(token, password);
    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: "invalid_identity_token", message: "El enlace no es válido o ya expiró." }, { status: 400 });
  }
}

export const config = { path: "/api/admin/identity-password" };
