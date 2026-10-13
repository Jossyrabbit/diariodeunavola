import { HttpError } from "./errors.mjs";

export const ORDER_STATES = Object.freeze([
  "draft",
  "payment_pending",
  "paid",
  "cancelled",
  "refunded",
  "chargeback",
]);

export const QUOTE_STATES = Object.freeze([
  "pending_quote",
  "quoted",
  "accepted",
  "declined",
  "expired",
  "cancelled",
]);

export const PAYMENT_STATES = Object.freeze([
  "not_requested",
  "pending",
  "approved",
  "rejected",
  "expired",
  "refunded",
  "chargeback",
]);

export const DELIVERY_STATES = Object.freeze([
  "pending",
  "ready",
  "shipped",
  "delivered",
  "returned",
  "cancelled",
]);

const deliveryTransitions = Object.freeze({
  pending: new Set(["ready", "cancelled"]),
  ready: new Set(["pending", "shipped", "cancelled"]),
  shipped: new Set(["delivered", "returned"]),
  delivered: new Set(["returned"]),
  returned: new Set(),
  cancelled: new Set(),
});

const quoteTransitions = Object.freeze({
  pending_quote: new Set(["quoted", "cancelled"]),
  quoted: new Set(["accepted", "declined", "expired", "cancelled"]),
  accepted: new Set(["cancelled"]),
  declined: new Set(["quoted", "cancelled"]),
  expired: new Set(["quoted", "cancelled"]),
  cancelled: new Set(),
});

export function assertQuoteTransition(from, to) {
  if (from === to) return;
  if (!QUOTE_STATES.includes(from) || !QUOTE_STATES.includes(to)) {
    throw new HttpError(400, "invalid_quote_state", "El estado de cotización no es válido.");
  }
  if (!quoteTransitions[from].has(to)) {
    throw new HttpError(409, "invalid_quote_transition", `No se puede cambiar una cotización de ${from} a ${to}.`);
  }
}

export function assertDeliveryTransition(from, to) {
  if (from === to) return;
  if (!DELIVERY_STATES.includes(from) || !DELIVERY_STATES.includes(to)) {
    throw new HttpError(400, "invalid_delivery_state", "El estado de entrega no es válido.");
  }
  if (!deliveryTransitions[from].has(to)) {
    throw new HttpError(409, "invalid_delivery_transition", `No se puede cambiar una entrega de ${from} a ${to}.`);
  }
}
