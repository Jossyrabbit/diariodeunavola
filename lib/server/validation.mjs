import { HttpError } from "./errors.mjs";

const addressFields = ["region", "commune", "address_line_1"];

export function parseJsonBody(request) {
  const type = request.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("application/json")) {
    throw new HttpError(415, "unsupported_media_type", "La solicitud debe usar application/json.");
  }
  return request.json().catch(() => {
    throw new HttpError(400, "invalid_json", "El contenido JSON no es válido.");
  });
}

export function normalizeAddress(input) {
  if (!input || typeof input !== "object") throw new HttpError(400, "invalid_address", "Falta la dirección.");
  const result = {};
  for (const field of addressFields) {
    const value = String(input[field] || "").trim();
    if (!value || value.length > 160) throw new HttpError(400, "invalid_address", `El campo ${field} es obligatorio.`);
    result[field] = value;
  }
  for (const field of ["street_number", "apartment", "postal_code", "delivery_notes"]) {
    const value = String(input[field] || "").trim();
    if (value.length > 240) throw new HttpError(400, "invalid_address", `El campo ${field} es demasiado largo.`);
    result[field] = value || null;
  }
  return result;
}

export function parseLimit(value, fallback = 50, maximum = 100) {
  const parsed = Number.parseInt(value || "", 10);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maximum);
}

export function normalizeShippingAmount(value) {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1_000_000) {
    throw new HttpError(400, "invalid_shipping_amount", "El valor de despacho debe ser un monto entero válido en CLP.");
  }
  return amount;
}
