-- Seed Permissions with resource and action columns
INSERT OR IGNORE INTO permission (name, resource, action, description) VALUES
  ('category:create', 'category', 'create', 'Create categories'),
  ('category:read', 'category', 'read', 'View categories'),
  ('category:update', 'category', 'update', 'Edit categories'),
  ('category:delete', 'category', 'delete', 'Delete categories'),
  ('item:create', 'item', 'create', 'Create items'),
  ('item:read', 'item', 'read', 'View items'),
  ('item:update', 'item', 'update', 'Edit items'),
  ('item:delete', 'item', 'delete', 'Delete items'),
  ('order:create', 'order', 'create', 'Create orders'),
  ('order:read', 'order', 'read', 'View orders'),
  ('order:update', 'order', 'update', 'Edit orders'),
  ('order:delete', 'order', 'delete', 'Delete orders'),
  ('user:create', 'user', 'create', 'Create users'),
  ('user:read', 'user', 'read', 'View users'),
  ('user:update', 'user', 'update', 'Edit users'),
  ('user:delete', 'user', 'delete', 'Delete users'),
  ('role:create', 'role', 'create', 'Create roles'),
  ('role:read', 'role', 'read', 'View roles'),
  ('role:update', 'role', 'update', 'Edit roles'),
  ('role:delete', 'role', 'delete', 'Delete roles'),
  ('system:admin', 'system', 'admin', 'Full system access - bypasses all permission checks');

-- Remove old role seeds (roles are now dynamic)
-- Keep only necessary seed for first-time setup

-- Admin role: all permissions (created by seed-admin.ts or first user)
-- No pre-seeded roles - admins create them via UI
