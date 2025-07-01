-- 002_add_password_to_users.sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(60) NOT NULL;
