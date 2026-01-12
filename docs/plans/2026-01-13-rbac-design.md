# RBAC System Design

Enterprise-grade Role-Based Access Control for Nona.

## Decisions

| Decision | Choice |
|----------|--------|
| Permission model | Resource-based (`resource:action`) |
| Roles | Dynamic, created via UI |
| Role hierarchy | None (flat) |
| Permissions | Pre-seeded in migrations |
| Super admin | First user gets all permissions |
| UI level | Standard (grouped permissions, user-role visibility) |

## Database Schema

### Existing Tables (No Changes)

- `role` (id, name, description, createdAt)
- `role_permission` (id, roleId, permissionId)
- `user.roleId` foreign key

### Permission Table (Modified)

Add columns for UI grouping:

```sql
ALTER TABLE permission ADD COLUMN resource TEXT;
ALTER TABLE permission ADD COLUMN action TEXT;
```

Schema:
```
permission
├── id
├── name (e.g., "item:create")
├── resource (e.g., "item")
├── action (e.g., "create")
└── description
```

### Seeded Permissions

```
item:create, item:read, item:update, item:delete
order:create, order:read, order:update, order:delete
category:create, category:read, category:update, category:delete
user:create, user:read, user:update, user:delete
role:create, role:read, role:update, role:delete
system:admin (wildcard - bypasses all checks)
```

## First User Setup

When the first user registers:

1. System detects no other users exist (`SELECT COUNT(*) FROM user`)
2. System creates "Administrator" role
3. System assigns ALL permissions to this role
4. System assigns this role to the first user

Implementation location: Registration hook in `worker/lib/auth.ts`

Subsequent users register with no role. First user assigns roles via UI.

## Backend API

### New: `worker/route/role.ts`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/role` | `role:read` | List all roles with user count |
| GET | `/api/role/:id` | `role:read` | Get role with its permissions |
| POST | `/api/role` | `role:create` | Create new role |
| PUT | `/api/role/:id` | `role:update` | Update role name/description |
| DELETE | `/api/role/:id` | `role:delete` | Delete role (fails if users assigned) |
| PUT | `/api/role/:id/permission` | `role:update` | Set permissions for role |

### New: `worker/route/permission.ts`

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/api/permission` | `role:read` | List all permissions grouped by resource |

### Modified: `worker/route/user.ts`

- `PUT /api/user/:id` can update `roleId`
- `GET /api/user` returns `roleName`

### Modified: `worker/route/me.ts`

- Returns current user's permissions array for frontend authorization

## Backend Permission Checks

### Middleware Enhancement

Add `system:admin` bypass in `worker/lib/rbac.ts`:

```typescript
export async function hasPermission(
  d1: D1Database,
  userId: string,
  permissionName: string,
): Promise<boolean> {
  const permissions = await getUserPermission(d1, userId);
  if (permissions.includes('system:admin')) return true;
  return permissions.includes(permissionName);
}
```

Update `requirePermission` middleware:

```typescript
const hasPermission =
  userPermissions.includes('system:admin') ||
  permissions.some((p) => userPermissions.includes(p));
```

### Route Protection

| Route | Permission |
|-------|------------|
| `/api/item/*` | `item:*` |
| `/api/order/*` | `order:*` |
| `/api/category/*` | `category:*` |
| `/api/user/*` | `user:*` |
| `/api/role/*` | `role:*` |
| `/api/permission` | `role:read` |
| `/api/me` | `requireAuth` only |

## Frontend

### New Feature: `src/feature/role/`

```
src/feature/role/
├── index.ts
├── RoleDetail.tsx
├── RoleFormModal.tsx
├── RoleDeleteDialog.tsx
└── RolePermissionEditor.tsx
```

### New Page: `src/page/RolePage.tsx`

Master-detail layout matching UserPage pattern:
- Left: list of roles with user count
- Right: selected role details and permissions

### Permission Editor UX

```
┌─────────────────────────────────────────┐
│ Role: Sales Manager                     │
├─────────────────────────────────────────┤
│ Item                                    │
│   ☑ Create  ☑ Read  ☑ Update  ☐ Delete │
├─────────────────────────────────────────┤
│ Order                                   │
│   ☑ Create  ☑ Read  ☑ Update  ☑ Delete │
├─────────────────────────────────────────┤
│ Category                                │
│   ☐ Create  ☑ Read  ☐ Update  ☐ Delete │
└─────────────────────────────────────────┘
```

### Permission Hook: `src/hook/usePermission.ts`

```typescript
const canCreateItem = usePermission('item:create')
const canManageRole = usePermission('role:create', 'role:update')

{canCreateItem && <Button>Add Item</Button>}
```

Implementation:
- Reads from Zustand auth store
- Returns `true` if user has ANY specified permission
- `system:admin` always returns true

### Where to Apply

- Hide "Add" buttons without create permission
- Hide "Edit"/"Delete" buttons without update/delete permission
- Hide menu items without read permission
- Disable form fields for view-only

### Permission Refresh

- Invalidate on role change
- Re-fetch `/api/me` for updated permissions

## Migration Strategy

### 1. Schema Migration

```sql
ALTER TABLE permission ADD COLUMN resource TEXT;
ALTER TABLE permission ADD COLUMN action TEXT;
```

### 2. Seed Permissions

Create `scripts/seed-permission.ts`:
- Use `INSERT OR IGNORE` to avoid duplicates
- Safe to run multiple times
- Add new permissions here when adding features

### 3. First User Detection

In registration hook:
- Check user count before insert
- If zero: create Administrator role, assign all permissions, assign to user

### 4. Existing Data Migration

For current users:
1. Run schema migration
2. Run permission seed
3. Create admin role via SQL
4. Assign to existing admin user
