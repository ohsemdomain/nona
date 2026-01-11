-- Seed Roles
INSERT OR IGNORE INTO role (name, description, created_at) VALUES
  ('admin', 'Administrator with full access', strftime('%s', 'now') * 1000),
  ('user', 'Standard user with CRUD access', strftime('%s', 'now') * 1000),
  ('viewer', 'Read-only access', strftime('%s', 'now') * 1000);

-- Seed Permissions
INSERT OR IGNORE INTO permission (name, description) VALUES
  ('category:create', 'Create categories'),
  ('category:read', 'View categories'),
  ('category:update', 'Edit categories'),
  ('category:delete', 'Delete categories'),
  ('item:create', 'Create items'),
  ('item:read', 'View items'),
  ('item:update', 'Edit items'),
  ('item:delete', 'Delete items'),
  ('order:create', 'Create orders'),
  ('order:read', 'View orders'),
  ('order:update', 'Edit orders'),
  ('order:delete', 'Delete orders'),
  ('user:create', 'Create users'),
  ('user:read', 'View users'),
  ('user:update', 'Edit users'),
  ('user:delete', 'Delete users');

-- Admin role: all permissions
INSERT OR IGNORE INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'admin';

-- User role: category, item, order (not user management)
INSERT OR IGNORE INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'user'
  AND (p.name LIKE 'category:%' OR p.name LIKE 'item:%' OR p.name LIKE 'order:%');

-- Viewer role: read only
INSERT OR IGNORE INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r, permission p
WHERE r.name = 'viewer'
  AND p.name LIKE '%:read';
