-- FireFork Reservation & POS System Schema
-- Run after schema.sql

BEGIN;

-- Restaurant Tables
CREATE TABLE IF NOT EXISTS restaurant_tables (
  id BIGSERIAL PRIMARY KEY,
  table_code VARCHAR(10) NOT NULL UNIQUE,
  capacity INT NOT NULL CHECK (capacity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(phone)
);

-- Reservation Status Enum
DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('confirmed', 'occupied', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Reservations
CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  table_id BIGINT NOT NULL REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 120,
  party_size INT NOT NULL CHECK (party_size > 0),
  status reservation_status NOT NULL DEFAULT 'confirmed',
  dietary_preference VARCHAR(40),
  special_requests TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (booking_time >= '14:00' AND booking_time <= '20:00')
);

CREATE INDEX idx_reservations_date_time ON reservations(booking_date, booking_time);
CREATE INDEX idx_reservations_table ON reservations(table_id, booking_date);
CREATE INDEX idx_reservations_status ON reservations(status);

-- Order Status Enum
DO $$ BEGIN
  CREATE TYPE order_status AS ENUM ('active', 'finalized', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  reservation_id BIGINT NOT NULL REFERENCES reservations(id) ON DELETE RESTRICT,
  table_id BIGINT NOT NULL REFERENCES restaurant_tables(id) ON DELETE RESTRICT,
  order_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  grand_total DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (grand_total >= 0),
  status order_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  UNIQUE(reservation_id)
);

CREATE INDEX idx_orders_reservation ON orders(reservation_id);
CREATE INDEX idx_orders_table_date ON orders(table_id, order_date);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id BIGSERIAL PRIMARY KEY,
  order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

COMMIT;
