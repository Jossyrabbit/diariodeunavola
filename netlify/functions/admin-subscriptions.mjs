import { listSubscriptions } from "../../lib/server/admin-repository.mjs";
import { requireAdmin } from "../../lib/server/auth.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";
import { parseLimit } from "../../lib/server/validation.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
  try {
    await requireAdmin(request);
    const url = new URL(request.url);
    return jsonResponse({ subscriptions: await listSubscriptions({ limit: parseLimit(url.searchParams.get("limit")) }) });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/subscriptions" };
