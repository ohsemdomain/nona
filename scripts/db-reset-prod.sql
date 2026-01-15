-- Drop all application tables (order matters due to foreign keys)
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS order_line;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS role_permission;
DROP TABLE IF EXISTS permission;
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS "order";
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS role;

-- Clear migrations table so migrations can be re-run
DELETE FROM d1_migrations;
