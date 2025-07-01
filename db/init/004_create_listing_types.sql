-- 004_create_listing_types.sql

CREATE TABLE IF NOT EXISTS listing_types (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  schema      JSONB         NOT NULL,
  created_at  TIMESTAMPTZ    NOT NULL DEFAULT now()
);
