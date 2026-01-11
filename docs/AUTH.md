# Auth & RBAC Spec

## Overview

- better-auth with D1 adapter
- Role-Based Access Control (RBAC)
- **No registration** — admin created via seed script
- **Admin creates all users** and sets their passwords
- **Admin resets passwords** — no self-service password reset
- Shared data (all users access all records, filtered by permission)

---

## Database Schema

```typescript
// worker/db/schema/role.ts
role: (id, name, description, createdAt);

// worker/db/schema/permission.ts
permission: (id, name, description);

// worker/db/schema/rolePermission.ts
rolePermission: (id, roleId(FK), permissionId(FK));

// user table
user: (id, email, password, name, roleId(FK), createdAt, updatedAt, deletedAt);
```

---

## Permission Format

Pattern: `{resource}:{action}`

```typescript
// shared/constants/permission.ts
export const PERMISSION = {
    CATEGORY_CREATE: "category:create",
    CATEGORY_READ: "category:read",
    CATEGORY_UPDATE: "category:update",
    CATEGORY_DELETE: "category:delete",
    ITEM_CREATE: "item:create",
    ITEM_READ: "item:read",
    ITEM_UPDATE: "item:update",
    ITEM_DELETE: "item:delete",
    ORDER_CREATE: "order:create",
    ORDER_READ: "order:read",
    ORDER_UPDATE: "order:update",
    ORDER_DELETE: "order:delete",
    USER_READ: "user:read",
    USER_UPDATE: "user:update",
} as const;

export const ROLE = {
    ADMIN: "admin",
    USER: "user",
    VIEWER: "viewer",
} as const;
```

---

## Default Roles

| Role   | Permissions                  |
| ------ | ---------------------------- |
| admin  | ALL                          |
| user   | category:_, item:_, order:\* |
| viewer | \*:read only                 |

---

## Seed Admin Script

No registration route. Admin created via seed script only.

```typescript
// scripts/seed-admin.ts
import { hashPassword } from "better-auth";

const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

if (!adminEmail || !adminPassword) {
    console.error("❌ Set ADMIN_EMAIL and ADMIN_PASSWORD env variables");
    process.exit(1);
}

// Check if admin exists
const existing = await db.select().from(user).where(eq(user.email, adminEmail));
if (existing.length > 0) {
    console.log("⏭️ Admin already exists, skipping");
    process.exit(0);
}

// Get admin role
const adminRole = await db.select().from(role).where(eq(role.name, "admin"));

// Create admin
await db.insert(user).values({
    email: adminEmail,
    password: await hashPassword(adminPassword),
    name: "Admin",
    roleId: adminRole[0].id,
    createdAt: Date.now(),
});

console.log("✅ Admin created");
```

### Usage

```bash
# Set environment variables
export ADMIN_EMAIL="admin@company.com"
export ADMIN_PASSWORD="your-secure-password"

# Run seed
bun run db:seed-admin
```

After seed, admin logs in and changes password via User Management (edit own profile).

---

## Backend

### Middleware

```typescript
// worker/lib/middleware.ts
export const requirePermission = (...permissions: string[]) => {
    return async (c: Context, next: Next) => {
        const session = await getSession(c);
        if (!session) return c.json({ error: "Unauthorized" }, 401);

        const userPermissions = await getUserPermission(
            c.env.DB,
            session.user.id,
        );
        const hasPermission = permissions.some((p) =>
            userPermissions.includes(p),
        );

        if (!hasPermission) return c.json({ error: "Forbidden" }, 403);
        return next();
    };
};
```

### Apply to Routes

```typescript
// worker/routes/category.ts
app.get('/api/category', requirePermission(PERMISSION.CATEGORY_READ), ...)
app.post('/api/category', requirePermission(PERMISSION.CATEGORY_CREATE), ...)
app.put('/api/category/:id', requirePermission(PERMISSION.CATEGORY_UPDATE), ...)
app.delete('/api/category/:id', requirePermission(PERMISSION.CATEGORY_DELETE), ...)
```

---

## Frontend

### Permission Hook

```typescript
// src/hooks/usePermission.ts
export const usePermission = () => {
    const { session } = useAuth();

    const hasPermission = (permission: string) => {
        return session?.permissions?.includes(permission) ?? false;
    };

    const isAdmin = session?.role?.name === ROLE.ADMIN;

    return { hasPermission, isAdmin };
};
```

### Permission Guard Component

```typescript
// src/components/PermissionGuard.tsx
export const PermissionGuard = ({
    permission,
    children,
    fallback = null,
}: {
    permission: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}) => {
    const { hasPermission } = usePermission();
    return hasPermission(permission) ? children : fallback;
};
```

### Usage

```tsx
// Hide delete button for users without permission
<PermissionGuard permission={PERMISSION.CATEGORY_DELETE}>
  <Button variant="danger" onClick={handleDelete}>Delete</Button>
</PermissionGuard>

// In hooks/logic
const { hasPermission, isAdmin } = usePermission()
if (hasPermission(PERMISSION.ORDER_CREATE)) { ... }
```

---

## Fetch Permissions

On app load, fetch user with permissions:

```typescript
// API response shape
interface AuthUser {
    id: string;
    name: string;
    email: string;
    role: {
        id: number;
        name: string;
    };
    permissions: string[]; // ['category:read', 'category:create', ...]
}
```

Store in Zustand auth store. If API returns 403, refetch permissions.

---

## API Endpoints

### Auth (better-auth handles)

```
POST /api/auth/sign-in        - Login
POST /api/auth/sign-out       - Logout
GET  /api/auth/session        - Get current session
```

No sign-up route. No forgot password. No self-service password change.

### User Management (admin only)

```
GET    /api/user              - List user
GET    /api/user/:id          - User detail
POST   /api/user              - Create user
PUT    /api/user/:id          - Update user (including password reset)
DELETE /api/user/:id          - Soft delete user
```

### Admin Creates User

```typescript
// POST /api/user
{
  email: "staff@company.com",
  name: "Staff Name",
  password: "password-given-by-boss",
  roleId: 2
}
```

### Admin Resets Password

```typescript
// PUT /api/user/:id
{
    password: "new-password-given-by-boss"; // Optional, only if resetting
}
```

### Password Flow

```
Forgot password?
  → Staff tells boss
  → Boss goes to User Management
  → Boss edits user, sets new password
  → Boss gives new password on paper
  → Staff logs in with new password
```

---

## Files Structure

```
/scripts
  seed-admin.ts               ← Create first admin
  seed-rbac.ts                ← Seed roles & permissions

/shared
  /constants
    permission.ts             ← PERMISSION, ROLE constants

/worker
  /db/schema
    role.ts                   ← role table
    permission.ts             ← permission table
    rolePermission.ts         ← mapping table
    user.ts                   ← user table
  /lib
    middleware.ts             ← requirePermission(), requireAuth()
    rbac.ts                   ← getUserPermission()
  /routes
    auth.ts                   ← better-auth routes (sign-in, sign-out, session only)
    user.ts                   ← user CRUD (admin only)

/src
  /hooks
    usePermission.ts          ← hasPermission(), isAdmin
  /components
    PermissionGuard.tsx       ← UI guard component
  /store
    auth.ts                   ← useAuthStore (session + permissions)
  /pages
    Login.tsx                 ← Login only (no register, no forgot password)
    admin/
      User.tsx                ← User management (create, edit, reset password)
```

---

## Strict Rules

1. **Use PERMISSION constants** — No hardcoded strings like `'category:delete'`
2. **Named exports** — No default exports
3. **Singular naming** — `permission.ts` not `permissions.ts`
4. **Check permission via hook** — No direct session access in components
5. **Backend always validates** — Never trust frontend permission check alone
6. **403 handling** — Frontend handles 403 gracefully (show message or refetch)

---

## Build Order

1. Database schema + migration
2. Seed roles & permissions script
3. Seed admin script
4. Backend middleware `requirePermission()`, `requireAuth()`
5. Auth routes (sign-in, sign-out, session only)
6. User CRUD routes (admin only)
7. Apply permissions to all routes
8. Frontend login page (no register, no forgot password)
9. Frontend `usePermission` hook
10. Frontend `<PermissionGuard>` component
11. User management page (admin creates/edits/resets password)
12. Test all roles

---

## Success Criteria

- [ ] No registration route exists
- [ ] No forgot password route exists
- [ ] No self-service password change
- [ ] Admin created via seed script
- [ ] Admin can create users with password
- [ ] Admin can reset user password
- [ ] Admin can CRUD roles and permissions
- [ ] User can CRUD category/item/order (based on role)
- [ ] Viewer can only read
- [ ] Delete button hidden for viewer (frontend)
- [ ] API returns 403 for unauthorized (backend)
- [ ] Permission constants used everywhere
- [ ] Login page has no "Register" or "Forgot Password" link
