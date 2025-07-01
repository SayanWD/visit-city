-- 005_create_listings.sql

CREATE TABLE IF NOT EXISTS listings (
  id           SERIAL PRIMARY KEY,
  owner_id     INTEGER       NOT NULL REFERENCES users(id),
  type_id      INTEGER       NOT NULL REFERENCES listing_types(id),
  title        VARCHAR(200)  NOT NULL,
  description  TEXT,
  location     VARCHAR(200),
  price        NUMERIC(10,2),
  gallery      TEXT[]        NOT NULL DEFAULT '{}',  -- массив URL-ов
  fields       JSONB,                         -- произвольные поля по схеме
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
