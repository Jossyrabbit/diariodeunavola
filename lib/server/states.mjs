import { HttpError } from "./errors.mjs";

export const ORDER_STATES = Object.freeze([
  "draft",
  "payment_pending",
  "paid",
  "cancelled",
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

export function assertDeliveryTransition(from, to) {
  if (from === to) return;
  if (!DELIVERY_STATES.includes(from) || !DELIVERY_STATES.includes(to)) {
    throw new HttpError(400, "invalid_delivery_state", "El estado de entrega no es válido.");
  }
  if (!deliveryTransitions[from].has(to)) {
    throw new HttpError(409, "invalid_delivery_transition", `No se puede cambiar una entrega de ${from} a ${to}.`);
  }
}
