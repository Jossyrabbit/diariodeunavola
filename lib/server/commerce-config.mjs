import { HttpError } from "./errors.mjs";

export const COMMERCE_FLAGS = Object.freeze({
  publicRequestsEnabled: false,
  paymentsEnabled: false,
  paymentProvider: "mercado_pago",
  shippingOrigin: "Santiago, Chile",
  quoteValidityDays: 7,
});

export function assertPublicRequestsEnabled() {
  if (!COMMERCE_FLAGS.publicRequestsEnabled) {
    throw new HttpError(503, "public_requests_disabled", "Las solicitudes públicas todavía no están habilitadas.");
  }
}

export function assertPaymentsEnabled() {
  if (!COMMERCE_FLAGS.paymentsEnabled) {
    throw new HttpError(503, "payments_disabled", "Los pagos todavía no están habilitados.");
  }
}
