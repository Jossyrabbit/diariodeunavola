import { requireAdmin } from "../../lib/server/auth.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
  try {
    const user = await requireAdmin(request);
    return jsonResponse({ user: { id: user.id, email: user.email, roles: user.roles } });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/session" };
