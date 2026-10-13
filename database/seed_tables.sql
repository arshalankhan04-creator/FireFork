-- Seed restaurant tables
-- 5 tables for 2, 4 tables for 4, 2 tables for 6, 1 table for 8

BEGIN;

INSERT INTO restaurant_tables (table_code, capacity) VALUES
  ('T01', 2), ('T02', 2), ('T03', 2), ('T04', 2), ('T05', 2),
  ('T06', 4), ('T07', 4), ('T08', 4), ('T09', 4),
  ('T10', 6), ('T11', 6),
  ('T12', 8)
ON CONFLICT (table_code) DO NOTHING;

COMMIT;
