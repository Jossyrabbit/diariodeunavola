import { requireAdmin } from "../../lib/server/auth.mjs";
import { replaceCustomerAddress } from "../../lib/server/commerce-service.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";
import { normalizeAddress, parseJsonBody } from "../../lib/server/validation.mjs";

export default async function handler(request, context) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    const actor = await requireAdmin(request, { mutation: true });
    const body = await parseJsonBody(request);
    const address = await replaceCustomerAddress(String(body.customer_id || ""), normalizeAddress(body.address), actor, {
      requestId: context.requestId,
    });
    return jsonResponse({ address }, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/address" };
