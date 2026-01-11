# Auth & RBAC Spec

## Overview

- better-auth with D1 adapter
- Role-Based Access Control (RBAC)
- **No registration** — admin created via seed script
- **Admin creates all users** and sets their passwords
- **Admin resets passwords** — no self-service password reset
- Shared data (all users access all records, filtered by permission)
- **Fast session caching** — localStorage with signed tokens for instant auth

---

## Database Schema

```
Tables:
├── role (id, name, description, created_at)
├── permission (id, name, description)
├── role_permission (id, role_id→role, permission_id→permission)
├── user (id, public_id, name, email, email_verified, image, role_id→role, created_at, updated_at, deleted_at)
├── session (id, expires_at, token, user_id→user, ip_address, user_agent, created_at, updated_at)
├── account (id, account_id, provider_id, user_id→user, password, access_token, ..., created_at, updated_at)
├── verification (id, identifier, value, expires_at, created_at, updated_at)
└── audit_log (id, actor_id, action, resource, resource_id, changes, metadata, created_at)
```

---

## Permission Format

Pattern: `{resource}:{action}`

```typescript
// shared/constant/permission.ts
export const PERMISSION = {
    // Category
    CATEGORY_CREATE: "category:create",
    CATEGORY_READ: "category:read",
    CATEGORY_UPDATE: "category:update",
    CATEGORY_DELETE: "category:delete",
    // Item
    ITEM_CREATE: "item:create",
    ITEM_READ: "item:read",
    ITEM_UPDATE: "item:update",
    ITEM_DELETE: "item:delete",
    // Order
    ORDER_CREATE: "order:create",
    ORDER_READ: "order:read",
    ORDER_UPDATE: "order:update",
    ORDER_DELETE: "order:delete",
    // User (admin only)
    USER_CREATE: "user:create",
    USER_READ: "user:read",
    USER_UPDATE: "user:update",
    USER_DELETE: "user:delete",
} as const;

export const ROLE = {
    ADMIN: "admin",
    USER: "user",
    VIEWER: "viewer",
} as const;
```

---

## Default Roles

| Role   | Permissions                         |
| ------ | ----------------------------------- |
| admin  | ALL (16 permissions)                |
| user   | category:*, item:*, order:* (12)    |
| viewer | *:read only (4)                     |

---

## Session Token Flow (Fast Auth)

```
Login:
┌─────────────────────────────────────────────────────────────┐
│ 1. User logs in via /api/auth/sign-in                       │
│ 2. better-auth creates session (httpOnly cookie)            │
│ 3. Frontend fetches /api/session/token                      │
│ 4. Backend returns signed token (user + role + permissions) │
│ 5. Frontend stores in localStorage                          │
└─────────────────────────────────────────────────────────────┘

Page Load (Fast):
┌─────────────────────────────────────────────────────────────┐
│ 1. Read localStorage (instant, no network)                  │
│ 2. If valid & not expired → render immediately              │
│ 3. Background: POST /api/session/validate                   │
│ 4. If invalid → logout; If needs refresh → fetch new token  │
└─────────────────────────────────────────────────────────────┘

Token Structure:
{
  payload: {
    userId, publicId, email, name, role, permissions[],
    issuedAt, expiresAt (7 days)
  },
  signature: "HMAC-SHA256 signature"
}
```

---

## API Endpoints

### Auth (better-auth)

```
POST /api/auth/sign-in/*     - Login (rate limited)
POST /api/auth/sign-out      - Logout
GET  /api/auth/session       - Get current session
```

### Session Token (fast caching)

```
GET  /api/session/token      - Get signed session token
POST /api/session/validate   - Validate session (background)
```

### Current User

```
GET  /api/me                 - Get current user with role/permissions
```

### User Management (admin only)

```
GET    /api/user             - List users (paginated, searchable)
GET    /api/user/:id         - User detail (by publicId)
POST   /api/user             - Create user
PUT    /api/user/:id         - Update user (including password reset)
DELETE /api/user/:id         - Soft delete user
```

---

## Backend Middleware

```typescript
// worker/lib/middleware.ts

// Require authentication
export const requireAuth = async (c, next) => { ... }

// Require specific permission(s)
export const requirePermission = (...permissions: string[]) => {
    return async (c: Context, next: Next) => {
        const session = await getSessionFromContext(c);
        if (!session) return c.json({ error: "Unauthorized" }, 401);

        const userPermissions = await getUserPermission(c.env.DB, session.user.id);
        const hasPermission = permissions.some((p) => userPermissions.includes(p));

        if (!hasPermission) return c.json({ error: "Forbidden" }, 403);
        return next();
    };
};
```

### Apply to Routes

```typescript
// worker/route/category.ts
app.get("/", requirePermission(PERMISSION.CATEGORY_READ), ...)
app.post("/", requirePermission(PERMISSION.CATEGORY_CREATE), ...)
app.put("/:id", requirePermission(PERMISSION.CATEGORY_UPDATE), ...)
app.delete("/:id", requirePermission(PERMISSION.CATEGORY_DELETE), ...)
```

---

## Frontend

### Permission Hook

```typescript
// src/hook/usePermission.ts
export function usePermission() {
    const { permissions, role } = useAuth();

    const can = useCallback((permission: string) => {
        return permissions.includes(permission);
    }, [permissions]);

    const isAdmin = role === ROLE.ADMIN;

    return { can, isAdmin, role };
}
```

### Permission Guard Component

```typescript
// src/component/PermissionGuard.tsx
export function PermissionGuard({ permission, children, fallback = null }) {
    const { can } = usePermission();
    return can(permission) ? children : fallback;
}
```

### Usage

```tsx
// Hide button for users without permission
<PermissionGuard permission={PERMISSION.CATEGORY_DELETE}>
  <Button onClick={handleDelete}>Delete</Button>
</PermissionGuard>

// In logic
const { can, isAdmin } = usePermission();
if (can(PERMISSION.ORDER_CREATE)) { ... }
```

---

## Files Structure

```
/scripts
  db-reset.ts              ← Full database reset script
  drop-tables.sql          ← FK-safe table drop order
  seed-admin.ts            ← Create first admin user
  seed-rbac.sql            ← Seed roles & permissions

/shared
  /constant
    permission.ts          ← PERMISSION, ROLE, ROLE_PERMISSIONS
    auth.ts                ← AUTH_PROVIDER, ROLE_COLORS

/worker
  /db
    schema.ts              ← Business tables (category, item, order, role, permission)
    auth-schema.ts         ← Auth tables (user, session, account, verification)
    audit-schema.ts        ← Audit log table
  /lib
    middleware.ts          ← requireAuth(), requirePermission()
    rbac.ts                ← getUserPermission() with caching
    session-token.ts       ← HMAC signing for fast auth
    audit.ts               ← Audit logging utilities
  /route
    auth.ts                ← better-auth routes
    session-token.ts       ← Session token endpoints
    me.ts                  ← Current user endpoint
    user.ts                ← User CRUD (admin only)

/src
  /hook
    usePermission.ts       ← can(), isAdmin
  /component
    PermissionGuard.tsx    ← UI guard component
  /lib
    AuthProvider.tsx       ← Auth context with optimistic loading
    sessionCache.ts        ← localStorage cache utilities
  /page
    auth/LoginPage.tsx     ← Login only (no register)
    user/UserPage.tsx      ← User management (admin)
```

---

## Adding New Features

### 1. Add New Permission

```typescript
// 1. shared/constant/permission.ts
export const PERMISSION = {
    // ... existing
    REPORT_CREATE: "report:create",
    REPORT_READ: "report:read",
    // ...
};

// 2. Update ROLE_PERMISSIONS if needed
export const ROLE_PERMISSIONS = {
    [ROLE.ADMIN]: ALL_PERMISSIONS,
    [ROLE.USER]: [...existing, PERMISSION.REPORT_CREATE, PERMISSION.REPORT_READ],
    // ...
};
```

### 2. Update seed-rbac.sql

```sql
-- Add new permissions
INSERT OR IGNORE INTO permission (name, description) VALUES
  ('report:create', 'Create reports'),
  ('report:read', 'View reports');

-- Update role mappings as needed
```

### 3. Run db:reset or manually seed

```bash
# Full reset (drops everything)
bun run db:reset --local-only

# Or just seed RBAC (if tables exist)
bun run db:seed-rbac
```

---

## Environment Variables

```bash
# Required for production
SESSION_TOKEN_SECRET     # HMAC secret for signing tokens (set via wrangler secret)

# For seeding admin
ADMIN_EMAIL              # Admin email (default: admin@test.com)
ADMIN_PASSWORD           # Admin password (default: random)
ADMIN_NAME               # Admin name (default: Admin)
```

---

## Strict Rules

1. **Use PERMISSION constants** — No hardcoded strings
2. **Named exports** — No default exports
3. **Singular naming** — `permission.ts` not `permissions.ts`
4. **Check permission via hook** — No direct session access in components
5. **Backend always validates** — Never trust frontend permission check
6. **publicId for API** — Use publicId in URLs, not internal id
7. **Audit sensitive actions** — Log user create/update/delete

---

## Success Criteria

- [x] No registration route exists
- [x] No forgot password route exists
- [x] Admin created via seed script
- [x] Admin can create users with password
- [x] Admin can reset user password
- [x] Permission-based access control
- [x] Fast auth (no "Checking authentication..." delay)
- [x] Audit logging for user management
- [x] Permission constants used everywhere
- [x] Login page has no "Register" or "Forgot Password" link
