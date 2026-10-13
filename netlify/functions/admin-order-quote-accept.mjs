import { requireAdmin } from "../../lib/server/auth.mjs";
import { acceptOrderQuote } from "../../lib/server/commerce-service.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";
import { parseJsonBody } from "../../lib/server/validation.mjs";

export default async function handler(request, context) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    const actor = await requireAdmin(request, { mutation: true });
    const body = await parseJsonBody(request);
    const result = await acceptOrderQuote(String(body.order_id || ""), actor, { requestId: context.requestId });
    return jsonResponse({ acceptance: result });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/order-quote-accept" };
