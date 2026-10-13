import { requireAdmin } from "../../lib/server/auth.mjs";
import { assertPaymentsEnabled } from "../../lib/server/commerce-config.mjs";
import { errorResponse } from "../../lib/server/errors.mjs";
import { parseJsonBody } from "../../lib/server/validation.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    await requireAdmin(request, { mutation: true });
    await parseJsonBody(request);
    assertPaymentsEnabled();
    throw new Error("Mercado Pago no está configurado.");
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/payment-request" };
