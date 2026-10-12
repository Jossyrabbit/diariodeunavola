import { logout, verifyRequestOrigin } from "@netlify/identity";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    try {
      verifyRequestOrigin(request);
    } catch {
      return jsonResponse({ error: "invalid_origin" }, { status: 403 });
    }
    await logout();
    return jsonResponse({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/logout" };
