import { listOrders } from "../../lib/server/admin-repository.mjs";
import { requireAdmin } from "../../lib/server/auth.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";
import { ORDER_STATES } from "../../lib/server/states.mjs";
import { parseLimit } from "../../lib/server/validation.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    if (status && !ORDER_STATES.includes(status)) return jsonResponse({ error: "invalid_status" }, { status: 400 });
    return jsonResponse({ orders: await listOrders({ status, limit: parseLimit(url.searchParams.get("limit")) }) });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/orders" };
