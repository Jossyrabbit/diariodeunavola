import { requireAdmin } from "../../lib/server/auth.mjs";
import { quoteOrderShipping } from "../../lib/server/commerce-service.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";
import { normalizeShippingAmount, parseJsonBody } from "../../lib/server/validation.mjs";

export default async function handler(request, context) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    const actor = await requireAdmin(request, { mutation: true });
    const body = await parseJsonBody(request);
    const quote = await quoteOrderShipping(
      String(body.order_id || ""),
      normalizeShippingAmount(body.shipping_clp),
      actor,
      { requestId: context.requestId },
    );
    return jsonResponse({ quote });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/order-quote" };
