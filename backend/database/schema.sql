-- FireFork database schema (PostgreSQL)
-- Create database separately: CREATE DATABASE firefork_db;

BEGIN;

-- Menu
CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(60) NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS menu_items (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(140) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  is_veg BOOLEAN NOT NULL DEFAULT FALSE,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
