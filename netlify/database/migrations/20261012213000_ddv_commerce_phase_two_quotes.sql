ALTER TABLE orders
  ADD COLUMN quote_status text NOT NULL DEFAULT 'pending_quote'
    CHECK (quote_status IN ('pending_quote', 'quoted', 'accepted', 'declined', 'expired', 'cancelled')),
  ADD COLUMN payment_status text NOT NULL DEFAULT 'not_requested'
    CHECK (payment_status IN ('not_requested', 'pending', 'approved', 'rejected', 'expired', 'refunded', 'chargeback')),
  ADD COLUMN shipping_origin text NOT NULL DEFAULT 'Santiago, Chile',
  ADD COLUMN quote_accepted_at timestamptz,
  ADD COLUMN quote_accepted_by_identity_id text;

UPDATE orders SET
  payment_status = CASE status
    WHEN 'payment_pending' THEN 'pending'
    WHEN 'paid' THEN 'approved'
    WHEN 'refunded' THEN 'refunded'
    WHEN 'chargeback' THEN 'chargeback'
    ELSE 'not_requested'
  END,
  quote_status = CASE
    WHEN shipping_clp IS NOT NULL AND total_clp IS NOT NULL THEN 'accepted'
    ELSE 'pending_quote'
  END;

CREATE INDEX orders_quote_status_idx ON orders (quote_status);
CREATE INDEX orders_payment_status_idx ON orders (payment_status);

CREATE TABLE shipping_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  amount_clp integer NOT NULL CHECK (amount_clp >= 0),
  currency text NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  covers_deliveries integer NOT NULL CHECK (covers_deliveries IN (1, 3)),
  origin text NOT NULL DEFAULT 'Santiago, Chile',
  status text NOT NULL DEFAULT 'quoted' CHECK (status IN ('quoted', 'accepted', 'replaced', 'declined', 'expired', 'cancelled')),
  valid_until timestamptz NOT NULL,
  quoted_by_identity_id text NOT NULL,
  quoted_by_email text,
  accepted_at timestamptz,
  accepted_by_identity_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until > created_at),
  CHECK ((status = 'accepted' AND accepted_at IS NOT NULL) OR status <> 'accepted')
);

CREATE UNIQUE INDEX shipping_quotes_one_current
  ON shipping_quotes (order_id)
  WHERE status IN ('quoted', 'accepted');
CREATE INDEX shipping_quotes_order_idx ON shipping_quotes (order_id, created_at DESC);
CREATE INDEX shipping_quotes_expiry_idx ON shipping_quotes (status, valid_until);

CREATE TABLE payment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  shipping_quote_id uuid NOT NULL REFERENCES shipping_quotes(id) ON DELETE RESTRICT,
  provider text NOT NULL DEFAULT 'mercado_pago' CHECK (provider = 'mercado_pago'),
  amount_clp integer NOT NULL CHECK (amount_clp > 0),
  currency text NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'pending', 'approved', 'rejected', 'cancelled', 'expired', 'refunded', 'chargeback')),
  external_preference_id text UNIQUE,
  external_payment_id text UNIQUE,
  checkout_url text,
  expires_at timestamptz,
  created_by_identity_id text NOT NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payment_requests_order_idx ON payment_requests (order_id, created_at DESC);
CREATE INDEX payment_requests_status_idx ON payment_requests (status);

CREATE TABLE payment_webhook_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider text NOT NULL DEFAULT 'mercado_pago' CHECK (provider = 'mercado_pago'),
  provider_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  external_payment_id text,
  processing_status text NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'ignored', 'failed')),
  payload_digest text,
  error_code text,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX payment_webhook_events_payment_idx ON payment_webhook_events (external_payment_id);

COMMENT ON TABLE shipping_quotes IS 'Historial de cotizaciones manuales de despacho desde Santiago. Suscripción y Club cubren tres entregas.';
COMMENT ON TABLE payment_requests IS 'Solicitudes de pago preparadas en servidor. No contiene datos de tarjetas.';
COMMENT ON TABLE payment_webhook_events IS 'Control idempotente de notificaciones de pago; conserva solo identificadores y digest, no datos sensibles.';
COMMENT ON COLUMN orders.quote_status IS 'Flujo de cotización independiente del estado de pago.';
COMMENT ON COLUMN orders.payment_status IS 'Solo puede pasar a approved tras verificación server-side del proveedor.';
