import { login, logout, verifyRequestOrigin } from "@netlify/identity";
import { jsonResponse } from "../../lib/server/errors.mjs";
import { parseJsonBody } from "../../lib/server/validation.mjs";

export default async function handler(request) {
  if (request.method !== "POST") return new Response(null, { status: 405, headers: { Allow: "POST" } });
  try {
    try {
      verifyRequestOrigin(request);
    } catch {
      return jsonResponse({ error: "invalid_origin" }, { status: 403 });
    }
    const body = await parseJsonBody(request);
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    if (!email || !password) return Response.json({ error: "missing_credentials" }, { status: 400 });
    const user = await login(email, password);
    if (!Array.isArray(user.roles) || !user.roles.includes("admin")) {
      await logout();
      return jsonResponse({ error: "forbidden" }, { status: 403 });
    }
    return jsonResponse({ ok: true });
  } catch {
    return jsonResponse({ error: "invalid_credentials" }, { status: 401 });
  }
}

export const config = { path: "/api/admin/login" };
