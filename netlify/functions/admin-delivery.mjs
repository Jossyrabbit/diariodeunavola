import { requireAdmin } from "../../lib/server/auth.mjs";
import { updateDelivery } from "../../lib/server/commerce-service.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";
import { DELIVERY_STATES } from "../../lib/server/states.mjs";
import { parseJsonBody } from "../../lib/server/validation.mjs";

export default async function handler(request, context) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    const actor = await requireAdmin(request, { mutation: true });
    const body = await parseJsonBody(request);
    if (!DELIVERY_STATES.includes(body.status)) return jsonResponse({ error: "invalid_status" }, { status: 400 });
    const delivery = await updateDelivery(String(body.delivery_id || ""), {
      status: body.status,
      carrier: String(body.carrier || "").trim().slice(0, 120) || null,
      tracking_code: String(body.tracking_code || "").trim().slice(0, 160) || null,
    }, actor, { requestId: context.requestId });
    return jsonResponse({ delivery });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/delivery" };
