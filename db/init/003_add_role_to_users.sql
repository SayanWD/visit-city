-- 003_add_role_to_users.sql
-- Добавление поля role с дефолтным значением 'user'
ALTER TABLE users
  ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user';
