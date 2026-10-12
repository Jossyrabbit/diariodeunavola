CREATE TABLE products (
  id text PRIMARY KEY,
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  price_clp integer NOT NULL CHECK (price_clp > 0),
  currency text NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  magazines integer NOT NULL CHECK (magazines >= 0),
  boxes integer NOT NULL CHECK (boxes >= 0),
  delivery_count integer NOT NULL CHECK (delivery_count IN (1, 3)),
  collectible_photo_eligible boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT false,
  catalog_version integer NOT NULL DEFAULT 1 CHECK (catalog_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_normalized text NOT NULL UNIQUE CHECK (email_normalized = lower(email_normalized)),
  full_name text NOT NULL,
  phone text,
  is_test_data boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE customer_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  region text NOT NULL,
  commune text NOT NULL,
  address_line_1 text NOT NULL,
  street_number text,
  apartment text,
  postal_code text,
  delivery_notes text,
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  created_by_identity_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until >= valid_from)
);

CREATE UNIQUE INDEX customer_addresses_one_current
  ON customer_addresses (customer_id)
  WHERE valid_until IS NULL;

CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_reference text NOT NULL UNIQUE,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  product_id text NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_sku_snapshot text NOT NULL,
  product_name_snapshot text NOT NULL,
  unit_price_clp integer NOT NULL CHECK (unit_price_clp > 0),
  shipping_clp integer CHECK (shipping_clp >= 0),
  total_clp integer CHECK (total_clp >= unit_price_clp),
  currency text NOT NULL DEFAULT 'CLP' CHECK (currency = 'CLP'),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'payment_pending', 'paid', 'cancelled', 'refunded', 'chargeback')),
  purchase_terms_version text NOT NULL,
  purchase_consent_at timestamptz NOT NULL,
  newsletter_opt_in boolean NOT NULL DEFAULT false,
  newsletter_consent_at timestamptz,
  is_test_data boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((newsletter_opt_in = false AND newsletter_consent_at IS NULL) OR (newsletter_opt_in = true AND newsletter_consent_at IS NOT NULL)),
  CHECK (status <> 'paid' OR (total_clp IS NOT NULL AND paid_at IS NOT NULL))
);

CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX orders_status_idx ON orders (status);
CREATE INDEX orders_customer_idx ON orders (customer_id);

CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  product_id text NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'refunded', 'on_hold')),
  total_deliveries integer NOT NULL CHECK (total_deliveries = 3),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

CREATE TABLE edition_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE RESTRICT,
  sequence_number integer NOT NULL CHECK (sequence_number BETWEEN 1 AND 3),
  includes_magazine boolean NOT NULL,
  includes_box boolean NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'ready', 'shipped', 'delivered', 'returned', 'cancelled')),
  address_id uuid REFERENCES customer_addresses(id) ON DELETE RESTRICT,
  address_snapshot jsonb,
  carrier text,
  tracking_code text,
  prepared_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, sequence_number),
  CHECK (status IN ('pending', 'cancelled') OR address_snapshot IS NOT NULL)
);

CREATE INDEX edition_deliveries_status_idx ON edition_deliveries (status);
CREATE INDEX edition_deliveries_subscription_idx ON edition_deliveries (subscription_id);

CREATE TABLE collectible_photo_slots (
  slot_number integer PRIMARY KEY CHECK (slot_number BETWEEN 1 AND 200),
  order_id uuid UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'released')),
  assigned_at timestamptz,
  released_at timestamptz,
  CHECK (
    (status = 'available' AND order_id IS NULL AND assigned_at IS NULL)
    OR (status = 'assigned' AND order_id IS NOT NULL AND assigned_at IS NOT NULL)
    OR (status = 'released' AND order_id IS NULL AND released_at IS NOT NULL)
  )
);

CREATE TABLE inventory_locks (
  lock_key text PRIMARY KEY,
  description text NOT NULL,
  next_slot integer NOT NULL DEFAULT 1 CHECK (next_slot BETWEEN 1 AND 201)
);

CREATE TABLE admin_audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_identity_id text NOT NULL,
  actor_email text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  before_value jsonb,
  after_value jsonb,
  request_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX admin_audit_log_entity_idx ON admin_audit_log (entity_type, entity_id, created_at DESC);

INSERT INTO products (
  id, sku, name, price_clp, currency, magazines, boxes, delivery_count,
  collectible_photo_eligible, active, catalog_version
) VALUES
  ('caja-ddv-01', 'DDV-BOX-01', 'Caja DDV N.º 01', 15990, 'CLP', 1, 1, 1, true, false, 1),
  ('suscripcion-ddv-anual', 'DDV-SUB-ANUAL', 'Suscripción DDV', 29990, 'CLP', 3, 0, 3, false, false, 1),
  ('club-ddv-anual', 'DDV-CLUB-ANUAL', 'Club DDV', 39990, 'CLP', 3, 3, 3, false, false, 1);

INSERT INTO collectible_photo_slots (slot_number)
SELECT number FROM generate_series(1, 200) AS number;

INSERT INTO inventory_locks (lock_key, description, next_slot)
VALUES ('collectible-photo-slots', 'Serializa la asignación de los 200 cupos de fotografía DDV N.º 01.', 1);

COMMENT ON TABLE orders IS 'Pedidos editoriales DDV. No existe endpoint público de creación en Fase 1.';
COMMENT ON COLUMN products.active IS 'Debe permanecer false mientras despacho y checkout estén deshabilitados.';
COMMENT ON TABLE collectible_photo_slots IS 'Cupos exclusivos para las primeras 200 cajas individuales DDV N.º 01 pagadas.';
