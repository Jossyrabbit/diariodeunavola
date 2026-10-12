import { getAdminOverview } from "../../lib/server/admin-repository.mjs";
import { requireAdmin } from "../../lib/server/auth.mjs";
import { errorResponse, jsonResponse } from "../../lib/server/errors.mjs";

export default async function handler(request) {
  if (request.method !== "GET") return new Response(null, { status: 405, headers: { Allow: "GET" } });
  try {
    await requireAdmin(request);
    return jsonResponse({ overview: await getAdminOverview() });
  } catch (error) {
    return errorResponse(error);
  }
}

export const config = { path: "/api/admin/overview" };
