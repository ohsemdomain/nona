-- Drop all tables in FK-safe order
-- Level 3: Tables with FKs to Level 2
DROP TABLE IF EXISTS order_line;
DROP TABLE IF EXISTS role_permission;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS account;

-- Level 2: Tables with FKs to Level 1
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS user;

-- Level 1: Base tables (no FKs or only referenced)
DROP TABLE IF EXISTS "order";
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS permission;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS audit_log;

-- Drizzle migration tracking table
DROP TABLE IF EXISTS __drizzle_migrations;
