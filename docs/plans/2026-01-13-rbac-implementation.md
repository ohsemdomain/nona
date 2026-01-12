# RBAC System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement enterprise-grade RBAC with dynamic roles, grouped permissions, and admin bypass.

**Architecture:** Extend existing RBAC schema with resource/action columns for grouping. Add role management UI under Settings. First user gets all permissions via existing seed-admin script approach.

**Tech Stack:** Drizzle ORM, Hono routes, React with TanStack Query, Zustand

---

## Task 1: Database Schema - Add resource/action columns to permission

**Files:**
- Modify: `worker/db/schema.ts:17-22`
- Create: `worker/db/migrations/XXXX_add_permission_columns.sql` (via drizzle-kit)

**Step 1: Update permission table schema**

In `worker/db/schema.ts`, update the permission table:

```typescript
export const permission = sqliteTable("permission", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(), // format: resource:action
	resource: text("resource").notNull(), // e.g., "item", "order", "role"
	action: text("action").notNull(), // e.g., "create", "read", "update", "delete"
	description: text("description"),
});
```

**Step 2: Generate migration**

Run: `bun run db:generate`

**Step 3: Run migration locally**

Run: `bun run db:migrate`

**Step 4: Commit**

```bash
git add worker/db/schema.ts worker/db/migrations/
git commit -m "feat(db): add resource and action columns to permission table"
```

---

## Task 2: Update Permission Constants

**Files:**
- Modify: `shared/constant/permission.ts`

**Step 1: Add role and system permissions**

Update `shared/constant/permission.ts`:

```typescript
// Permission constants - format: {resource}:{action}
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

	// User
	USER_CREATE: "user:create",
	USER_READ: "user:read",
	USER_UPDATE: "user:update",
	USER_DELETE: "user:delete",

	// Role (NEW)
	ROLE_CREATE: "role:create",
	ROLE_READ: "role:read",
	ROLE_UPDATE: "role:update",
	ROLE_DELETE: "role:delete",

	// System (NEW)
	SYSTEM_ADMIN: "system:admin",
} as const;

export type PermissionKey = keyof typeof PERMISSION;
export type PermissionValue = (typeof PERMISSION)[PermissionKey];

// All permissions as array (for seeding)
export const ALL_PERMISSIONS = Object.values(PERMISSION);

// Permission metadata for UI grouping
export const PERMISSION_GROUP: Record<string, { label: string; permission: PermissionValue[] }> = {
	category: {
		label: "Category",
		permission: [
			PERMISSION.CATEGORY_CREATE,
			PERMISSION.CATEGORY_READ,
			PERMISSION.CATEGORY_UPDATE,
			PERMISSION.CATEGORY_DELETE,
		],
	},
	item: {
		label: "Item",
		permission: [
			PERMISSION.ITEM_CREATE,
			PERMISSION.ITEM_READ,
			PERMISSION.ITEM_UPDATE,
			PERMISSION.ITEM_DELETE,
		],
	},
	order: {
		label: "Order",
		permission: [
			PERMISSION.ORDER_CREATE,
			PERMISSION.ORDER_READ,
			PERMISSION.ORDER_UPDATE,
			PERMISSION.ORDER_DELETE,
		],
	},
	user: {
		label: "User",
		permission: [
			PERMISSION.USER_CREATE,
			PERMISSION.USER_READ,
			PERMISSION.USER_UPDATE,
			PERMISSION.USER_DELETE,
		],
	},
	role: {
		label: "Role",
		permission: [
			PERMISSION.ROLE_CREATE,
			PERMISSION.ROLE_READ,
			PERMISSION.ROLE_UPDATE,
			PERMISSION.ROLE_DELETE,
		],
	},
	system: {
		label: "System",
		permission: [PERMISSION.SYSTEM_ADMIN],
	},
};

// Helper to parse permission string
export function parsePermission(permissionName: string): { resource: string; action: string } {
	const [resource, action] = permissionName.split(":");
	return { resource, action };
}
```

**Step 2: Remove hardcoded ROLE constants**

Delete these lines from `shared/constant/permission.ts`:

```typescript
// DELETE THESE:
// Role constants
export const ROLE = { ... } as const;
export type RoleKey = ...;
export type RoleValue = ...;
export const ROLE_PERMISSIONS: Record<...> = { ... };
```

**Step 3: Commit**

```bash
git add shared/constant/permission.ts
git commit -m "feat(permission): add role and system permissions, remove hardcoded roles"
```

---

## Task 3: Update Seed Script

**Files:**
- Modify: `scripts/seed-rbac.sql`

**Step 1: Update seed-rbac.sql**

```sql
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
```

**Step 2: Commit**

```bash
git add scripts/seed-rbac.sql
git commit -m "feat(seed): update permission seed with resource/action columns"
```

---

## Task 4: Backend - Update RBAC Bypass for system:admin

**Files:**
- Modify: `worker/lib/rbac.ts:124-131`
- Modify: `worker/lib/middleware.ts:62-64`

**Step 1: Update hasPermission in rbac.ts**

```typescript
/**
 * Check if user has a specific permission
 */
export async function hasPermission(
	d1: D1Database,
	userId: string,
	permissionName: string,
): Promise<boolean> {
	const permissions = await getUserPermission(d1, userId);
	// Admin bypass - system:admin grants all permissions
	if (permissions.includes("system:admin")) return true;
	return permissions.includes(permissionName);
}
```

**Step 2: Update requirePermission middleware**

In `worker/lib/middleware.ts`, update the permission check:

```typescript
const hasPermission =
	userPermissions.includes("system:admin") ||
	permissions.some((p) => userPermissions.includes(p));
```

**Step 3: Commit**

```bash
git add worker/lib/rbac.ts worker/lib/middleware.ts
git commit -m "feat(rbac): add system:admin bypass for all permission checks"
```

---

## Task 5: Backend - Create Role Types

**Files:**
- Create: `shared/type/role.ts`
- Modify: `shared/type/index.ts`

**Step 1: Create role type file**

Create `shared/type/role.ts`:

```typescript
export interface Role {
	id: number;
	name: string;
	description: string | null;
	createdAt: number;
	userCount?: number;
}

export interface RoleWithPermission extends Role {
	permissionList: string[];
}

export interface CreateRoleInput {
	name: string;
	description?: string;
}

export interface UpdateRoleInput {
	name?: string;
	description?: string;
}

export interface Permission {
	id: number;
	name: string;
	resource: string;
	action: string;
	description: string | null;
}

export interface PermissionGroup {
	resource: string;
	label: string;
	permissionList: Permission[];
}
```

**Step 2: Update index export**

Add to `shared/type/index.ts`:

```typescript
export * from "./role";
```

**Step 3: Commit**

```bash
git add shared/type/role.ts shared/type/index.ts
git commit -m "feat(type): add Role and Permission types"
```

---

## Task 6: Backend - Create Role Schema

**Files:**
- Create: `shared/schema/role.ts`
- Modify: `shared/schema/index.ts`

**Step 1: Create role schema**

Create `shared/schema/role.ts`:

```typescript
import { z } from "zod";

export const createRoleSchema = z.object({
	name: z.string().min(1, "Name is required").max(50, "Name too long"),
	description: z.string().max(200, "Description too long").optional(),
});

export const updateRoleSchema = z.object({
	name: z.string().min(1, "Name is required").max(50, "Name too long").optional(),
	description: z.string().max(200, "Description too long").optional(),
});

export const updateRolePermissionSchema = z.object({
	permissionList: z.array(z.string()),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionInput = z.infer<typeof updateRolePermissionSchema>;
```

**Step 2: Update index export**

Add to `shared/schema/index.ts`:

```typescript
export * from "./role";
```

**Step 3: Commit**

```bash
git add shared/schema/role.ts shared/schema/index.ts
git commit -m "feat(schema): add Role validation schemas"
```

---

## Task 7: Backend - Create Permission Route

**Files:**
- Create: `worker/route/permission.ts`
- Modify: `worker/route/index.ts`

**Step 1: Create permission route**

Create `worker/route/permission.ts`:

```typescript
import { Hono } from "hono";
import { createDb, permission } from "../db";
import { PERMISSION } from "../../shared/constant/permission";
import { requirePermission } from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/permission - List all permissions grouped by resource
app.get("/", requirePermission(PERMISSION.ROLE_READ), async (c) => {
	const db = createDb(c.env.DB);

	const permissionList = await db
		.select({
			id: permission.id,
			name: permission.name,
			resource: permission.resource,
			action: permission.action,
			description: permission.description,
		})
		.from(permission)
		.orderBy(permission.resource, permission.action);

	// Group by resource
	const grouped = permissionList.reduce(
		(acc, p) => {
			if (!acc[p.resource]) {
				acc[p.resource] = {
					resource: p.resource,
					label: p.resource.charAt(0).toUpperCase() + p.resource.slice(1),
					permissionList: [],
				};
			}
			acc[p.resource].permissionList.push(p);
			return acc;
		},
		{} as Record<string, { resource: string; label: string; permissionList: typeof permissionList }>,
	);

	return c.json(Object.values(grouped));
});

export { app as permissionRoute };
```

**Step 2: Register route in index**

Add to `worker/route/index.ts`:

```typescript
import { permissionRoute } from "./permission";

// In the app.route() section:
app.route("/permission", permissionRoute);
```

**Step 3: Commit**

```bash
git add worker/route/permission.ts worker/route/index.ts
git commit -m "feat(api): add GET /api/permission endpoint"
```

---

## Task 8: Backend - Create Role Route

**Files:**
- Create: `worker/route/role.ts`
- Modify: `worker/route/index.ts`

**Step 1: Create role route**

Create `worker/route/role.ts`:

```typescript
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, sql, inArray } from "drizzle-orm";
import { createDb, role, rolePermission, permission, user } from "../db";
import {
	createRoleSchema,
	updateRoleSchema,
	updateRolePermissionSchema,
} from "../../shared/schema/role";
import { PERMISSION } from "../../shared/constant/permission";
import {
	notFound,
	conflict,
	requirePermission,
	getUserId,
	logAudit,
	AUDIT_ACTION,
	AUDIT_RESOURCE,
	invalidateAllPermissionCache,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/role - List all roles with user count
app.get("/", requirePermission(PERMISSION.ROLE_READ), async (c) => {
	const db = createDb(c.env.DB);

	const roleList = await db
		.select({
			id: role.id,
			name: role.name,
			description: role.description,
			createdAt: role.createdAt,
			userCount: sql<number>`(SELECT COUNT(*) FROM user WHERE role_id = ${role.id} AND deleted_at IS NULL)`,
		})
		.from(role)
		.orderBy(role.name);

	return c.json(roleList);
});

// GET /api/role/:id - Get role with permissions
app.get("/:id", requirePermission(PERMISSION.ROLE_READ), async (c) => {
	const db = createDb(c.env.DB);
	const roleId = Number.parseInt(c.req.param("id"), 10);

	if (Number.isNaN(roleId)) {
		return notFound(c, "Role not found");
	}

	const roleResult = await db
		.select({
			id: role.id,
			name: role.name,
			description: role.description,
			createdAt: role.createdAt,
		})
		.from(role)
		.where(eq(role.id, roleId))
		.limit(1);

	if (roleResult.length === 0) {
		return notFound(c, "Role not found");
	}

	// Get permissions for this role
	const permissionList = await db
		.select({ name: permission.name })
		.from(rolePermission)
		.innerJoin(permission, eq(rolePermission.permissionId, permission.id))
		.where(eq(rolePermission.roleId, roleId));

	return c.json({
		...roleResult[0],
		permissionList: permissionList.map((p) => p.name),
	});
});

// POST /api/role - Create role
app.post(
	"/",
	requirePermission(PERMISSION.ROLE_CREATE),
	zValidator("json", createRoleSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const input = c.req.valid("json");
		const userId = getUserId(c);

		// Check if name already exists
		const existing = await db
			.select({ id: role.id })
			.from(role)
			.where(eq(role.name, input.name))
			.limit(1);

		if (existing.length > 0) {
			return conflict(c, "Role name already exists");
		}

		const result = await db
			.insert(role)
			.values({
				name: input.name,
				description: input.description ?? null,
				createdAt: Date.now(),
			})
			.returning();

		const created = result[0];

		await logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.CREATE,
			resource: AUDIT_RESOURCE.ROLE,
			resourceId: String(created.id),
			metadata: { name: created.name },
		});

		return c.json({ ...created, permissionList: [] }, 201);
	},
);

// PUT /api/role/:id - Update role name/description
app.put(
	"/:id",
	requirePermission(PERMISSION.ROLE_UPDATE),
	zValidator("json", updateRoleSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const roleId = Number.parseInt(c.req.param("id"), 10);
		const input = c.req.valid("json");
		const userId = getUserId(c);

		if (Number.isNaN(roleId)) {
			return notFound(c, "Role not found");
		}

		const existing = await db
			.select({ id: role.id, name: role.name })
			.from(role)
			.where(eq(role.id, roleId))
			.limit(1);

		if (existing.length === 0) {
			return notFound(c, "Role not found");
		}

		// Check name uniqueness if changing
		if (input.name && input.name !== existing[0].name) {
			const nameExists = await db
				.select({ id: role.id })
				.from(role)
				.where(eq(role.name, input.name))
				.limit(1);

			if (nameExists.length > 0) {
				return conflict(c, "Role name already exists");
			}
		}

		const updates: Partial<{ name: string; description: string | null }> = {};
		if (input.name) updates.name = input.name;
		if (input.description !== undefined) updates.description = input.description ?? null;

		const result = await db
			.update(role)
			.set(updates)
			.where(eq(role.id, roleId))
			.returning();

		await logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.UPDATE,
			resource: AUDIT_RESOURCE.ROLE,
			resourceId: String(roleId),
			metadata: { name: result[0].name },
		});

		return c.json(result[0]);
	},
);

// PUT /api/role/:id/permission - Set permissions for role
app.put(
	"/:id/permission",
	requirePermission(PERMISSION.ROLE_UPDATE),
	zValidator("json", updateRolePermissionSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const roleId = Number.parseInt(c.req.param("id"), 10);
		const input = c.req.valid("json");
		const userId = getUserId(c);

		if (Number.isNaN(roleId)) {
			return notFound(c, "Role not found");
		}

		// Verify role exists
		const existing = await db
			.select({ id: role.id, name: role.name })
			.from(role)
			.where(eq(role.id, roleId))
			.limit(1);

		if (existing.length === 0) {
			return notFound(c, "Role not found");
		}

		// Get permission IDs for the given names
		const permissionResult = await db
			.select({ id: permission.id, name: permission.name })
			.from(permission)
			.where(inArray(permission.name, input.permissionList));

		const permissionIdList = permissionResult.map((p) => p.id);

		// Delete existing role permissions
		await db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));

		// Insert new permissions
		if (permissionIdList.length > 0) {
			await db.insert(rolePermission).values(
				permissionIdList.map((permissionId) => ({
					roleId,
					permissionId,
				})),
			);
		}

		// Invalidate permission cache for all users (role permissions changed)
		invalidateAllPermissionCache();

		await logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.UPDATE,
			resource: AUDIT_RESOURCE.ROLE,
			resourceId: String(roleId),
			metadata: {
				name: existing[0].name,
				action: "permission_update",
				permissionCount: permissionIdList.length,
			},
		});

		return c.json({ success: true, permissionCount: permissionIdList.length });
	},
);

// DELETE /api/role/:id - Delete role
app.delete("/:id", requirePermission(PERMISSION.ROLE_DELETE), async (c) => {
	const db = createDb(c.env.DB);
	const roleId = Number.parseInt(c.req.param("id"), 10);
	const userId = getUserId(c);

	if (Number.isNaN(roleId)) {
		return notFound(c, "Role not found");
	}

	const existing = await db
		.select({ id: role.id, name: role.name })
		.from(role)
		.where(eq(role.id, roleId))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "Role not found");
	}

	// Check if any users have this role
	const userCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(user)
		.where(eq(user.roleId, roleId));

	if (userCount[0].count > 0) {
		return conflict(c, `Cannot delete role. ${userCount[0].count} user(s) have this role assigned.`);
	}

	// Delete role permissions first
	await db.delete(rolePermission).where(eq(rolePermission.roleId, roleId));

	// Delete role
	await db.delete(role).where(eq(role.id, roleId));

	await logAudit(db, {
		actorId: userId,
		action: AUDIT_ACTION.DELETE,
		resource: AUDIT_RESOURCE.ROLE,
		resourceId: String(roleId),
		metadata: { name: existing[0].name },
	});

	return c.json({ success: true });
});

export { app as roleRoute };
```

**Step 2: Register route in index**

Add to `worker/route/index.ts`:

```typescript
import { roleRoute } from "./role";

// In the app.route() section:
app.route("/role", roleRoute);
```

**Step 3: Add ROLE to AUDIT_RESOURCE**

In `worker/lib/audit.ts`, add:

```typescript
export const AUDIT_RESOURCE = {
	// ... existing
	ROLE: "role",
} as const;
```

**Step 4: Commit**

```bash
git add worker/route/role.ts worker/route/index.ts worker/lib/audit.ts
git commit -m "feat(api): add role CRUD and permission assignment endpoints"
```

---

## Task 9: Frontend - Update usePermission Hook

**Files:**
- Modify: `src/hook/usePermission.ts`

**Step 1: Remove hardcoded role checks**

Update `src/hook/usePermission.ts`:

```typescript
import { useCallback } from "react";
import { useAuth } from "@/src/lib/AuthProvider";
import type { PermissionValue } from "@/shared/constant/permission";

export function usePermission() {
	const { role, permissions } = useAuth();

	const hasPermission = useCallback(
		(permission: PermissionValue | string): boolean => {
			// system:admin bypasses all checks
			if (permissions.includes("system:admin")) return true;
			return permissions.includes(permission);
		},
		[permissions],
	);

	const hasAnyPermission = useCallback(
		(...requiredPermissions: (PermissionValue | string)[]): boolean => {
			if (permissions.includes("system:admin")) return true;
			return requiredPermissions.some((p) => permissions.includes(p));
		},
		[permissions],
	);

	const hasAllPermissions = useCallback(
		(...requiredPermissions: (PermissionValue | string)[]): boolean => {
			if (permissions.includes("system:admin")) return true;
			return requiredPermissions.every((p) => permissions.includes(p));
		},
		[permissions],
	);

	const isAdmin = permissions.includes("system:admin");

	return {
		role,
		permissions,
		hasPermission,
		hasAnyPermission,
		hasAllPermissions,
		isAdmin,
	};
}
```

**Step 2: Commit**

```bash
git add src/hook/usePermission.ts
git commit -m "feat(hook): update usePermission with system:admin bypass"
```

---

## Task 10: Frontend - Create Role Feature Components

**Files:**
- Create: `src/feature/role/index.ts`
- Create: `src/feature/role/RoleDetail.tsx`
- Create: `src/feature/role/RoleFormModal.tsx`
- Create: `src/feature/role/RoleDeleteDialog.tsx`
- Create: `src/feature/role/RolePermissionEditor.tsx`

**Step 1: Create index.ts**

Create `src/feature/role/index.ts`:

```typescript
export { RoleDetail } from "./RoleDetail";
export { RoleFormModal } from "./RoleFormModal";
export { RoleDeleteDialog } from "./RoleDeleteDialog";
export { RolePermissionEditor } from "./RolePermissionEditor";
```

**Step 2: Create RoleDetail.tsx**

Create `src/feature/role/RoleDetail.tsx`:

```typescript
import { Pencil, Trash2 } from "lucide-react";
import {
	Button,
	DetailPanelHeader,
	TabGroup,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	HistoryLogPanel,
} from "@/src/component";
import { formatDateTime } from "@/src/lib/date";
import { RolePermissionEditor } from "./RolePermissionEditor";
import type { RoleWithPermission } from "@/shared/type";

interface RoleDetailProp {
	role: RoleWithPermission;
	onEdit: () => void;
	onDelete: () => void;
	onPermissionChange: () => void;
}

export function RoleDetail({
	role,
	onEdit,
	onDelete,
	onPermissionChange,
}: RoleDetailProp) {
	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={role.name}
				action={
					<>
						<Button variant="secondary" size="sm" onClick={onEdit}>
							<Pencil className="h-4 w-4" />
							Edit
						</Button>
						<Button variant="danger" size="sm" onClick={onDelete}>
							<Trash2 className="h-4 w-4" />
							Delete
						</Button>
					</>
				}
			/>

			<TabGroup defaultTab="permission">
				<TabList aria-label="Role detail navigation">
					<Tab id="permission">Permission</Tab>
					<Tab id="detail">Detail</Tab>
					<Tab id="history">History</Tab>
				</TabList>

				<TabPanels>
					<TabPanel id="permission">
						<RolePermissionEditor
							roleId={role.id}
							currentPermissionList={role.permissionList}
							onSave={onPermissionChange}
						/>
					</TabPanel>

					<TabPanel id="detail">
						<div className="space-y-4">
							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Name
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{role.name}
								</dd>
							</div>

							{role.description && (
								<div>
									<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
										Description
									</dt>
									<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
										{role.description}
									</dd>
								</div>
							)}

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									User Count
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{role.userCount ?? 0}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Created
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{formatDateTime(role.createdAt)}
								</dd>
							</div>
						</div>
					</TabPanel>

					<TabPanel id="history">
						<HistoryLogPanel
							resourceType="role"
							resourceId={String(role.id)}
							resourceName={role.name}
						/>
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
```

**Step 3: Create RoleFormModal.tsx**

Create `src/feature/role/RoleFormModal.tsx`:

```typescript
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Modal,
	ModalHeader,
	ModalBody,
	ModalFooter,
	Button,
	Input,
	Textarea,
} from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { api } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import { createRoleSchema, type CreateRoleInput } from "@/shared/schema/role";
import type { Role } from "@/shared/type";

interface RoleFormModalProp {
	id: string;
	onSuccess?: (role: Role) => void;
}

export function RoleFormModal({ id, onSuccess }: RoleFormModalProp) {
	const { modalState, closeModal } = useUIStore();
	const queryClient = useQueryClient();

	const isOpen = modalState[id]?.isOpen ?? false;
	const editData = modalState[id]?.data as Role | undefined;
	const isEdit = !!editData;

	const {
		register,
		handleSubmit,
		reset,
		formState: { errors, isSubmitting },
	} = useForm<CreateRoleInput>({
		resolver: zodResolver(createRoleSchema),
	});

	useEffect(() => {
		if (isOpen) {
			reset({
				name: editData?.name ?? "",
				description: editData?.description ?? "",
			});
		}
	}, [isOpen, editData, reset]);

	const mutation = useMutation({
		mutationFn: async (data: CreateRoleInput) => {
			if (isEdit) {
				return api.put<Role>(`/role/${editData.id}`, data);
			}
			return api.post<Role>("/role", data);
		},
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["role"] });
			TOAST.success(isEdit ? "Role updated" : "Role created");
			closeModal(id);
			onSuccess?.(data);
		},
		onError: (error: Error) => {
			TOAST.error(error.message);
		},
	});

	const onSubmit = (data: CreateRoleInput) => {
		mutation.mutate(data);
	};

	return (
		<Modal isOpen={isOpen} onClose={() => closeModal(id)}>
			<form onSubmit={handleSubmit(onSubmit)}>
				<ModalHeader>{isEdit ? "Edit Role" : "Create Role"}</ModalHeader>
				<ModalBody>
					<div className="space-y-4">
						<Input
							label="Name"
							{...register("name")}
							error={errors.name?.message}
							autoFocus
						/>
						<Textarea
							label="Description"
							{...register("description")}
							error={errors.description?.message}
							row={3}
						/>
					</div>
				</ModalBody>
				<ModalFooter>
					<Button
						type="button"
						variant="secondary"
						onClick={() => closeModal(id)}
					>
						Cancel
					</Button>
					<Button type="submit" isLoading={isSubmitting || mutation.isPending}>
						{isEdit ? "Save" : "Create"}
					</Button>
				</ModalFooter>
			</form>
		</Modal>
	);
}
```

**Step 4: Create RoleDeleteDialog.tsx**

Create `src/feature/role/RoleDeleteDialog.tsx`:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { api } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import type { Role } from "@/shared/type";

interface RoleDeleteDialogProp {
	id: string;
	onSuccess?: () => void;
}

export function RoleDeleteDialog({ id, onSuccess }: RoleDeleteDialogProp) {
	const { modalState, closeModal } = useUIStore();
	const queryClient = useQueryClient();

	const isOpen = modalState[id]?.isOpen ?? false;
	const role = modalState[id]?.data as Role | undefined;

	const mutation = useMutation({
		mutationFn: async () => {
			if (!role) throw new Error("No role selected");
			return api.delete(`/role/${role.id}`);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["role"] });
			TOAST.success("Role deleted");
			closeModal(id);
			onSuccess?.();
		},
		onError: (error: Error) => {
			TOAST.error(error.message);
		},
	});

	return (
		<Modal isOpen={isOpen} onClose={() => closeModal(id)}>
			<ModalHeader>Delete Role</ModalHeader>
			<ModalBody>
				<p className="text-zinc-600 dark:text-zinc-400">
					Are you sure you want to delete <strong>{role?.name}</strong>?
					This action cannot be undone.
				</p>
			</ModalBody>
			<ModalFooter>
				<Button variant="secondary" onClick={() => closeModal(id)}>
					Cancel
				</Button>
				<Button
					variant="danger"
					onClick={() => mutation.mutate()}
					isLoading={mutation.isPending}
				>
					Delete
				</Button>
			</ModalFooter>
		</Modal>
	);
}
```

**Step 5: Create RolePermissionEditor.tsx**

Create `src/feature/role/RolePermissionEditor.tsx`:

```typescript
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button, LoadingBoundary, SkeletonList } from "@/src/component";
import { api } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import type { PermissionGroup } from "@/shared/type";

interface RolePermissionEditorProp {
	roleId: number;
	currentPermissionList: string[];
	onSave?: () => void;
}

export function RolePermissionEditor({
	roleId,
	currentPermissionList,
	onSave,
}: RolePermissionEditorProp) {
	const queryClient = useQueryClient();
	const [selectedPermissionList, setSelectedPermissionList] = useState<Set<string>>(
		new Set(currentPermissionList),
	);
	const [hasChanges, setHasChanges] = useState(false);

	// Reset when role changes
	useEffect(() => {
		setSelectedPermissionList(new Set(currentPermissionList));
		setHasChanges(false);
	}, [currentPermissionList, roleId]);

	const { data: permissionGroupList, isLoading, isError, refetch } = useQuery({
		queryKey: ["permission"],
		queryFn: () => api.get<PermissionGroup[]>("/permission"),
	});

	const mutation = useMutation({
		mutationFn: async (permissionList: string[]) => {
			return api.put(`/role/${roleId}/permission`, { permissionList });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["role", roleId] });
			queryClient.invalidateQueries({ queryKey: ["role"] });
			TOAST.success("Permission updated");
			setHasChanges(false);
			onSave?.();
		},
		onError: (error: Error) => {
			TOAST.error(error.message);
		},
	});

	const togglePermission = (permissionName: string) => {
		setSelectedPermissionList((prev) => {
			const next = new Set(prev);
			if (next.has(permissionName)) {
				next.delete(permissionName);
			} else {
				next.add(permissionName);
			}
			return next;
		});
		setHasChanges(true);
	};

	const toggleGroup = (group: PermissionGroup) => {
		const groupPermissionList = group.permissionList.map((p) => p.name);
		const allSelected = groupPermissionList.every((p) =>
			selectedPermissionList.has(p),
		);

		setSelectedPermissionList((prev) => {
			const next = new Set(prev);
			for (const p of groupPermissionList) {
				if (allSelected) {
					next.delete(p);
				} else {
					next.add(p);
				}
			}
			return next;
		});
		setHasChanges(true);
	};

	const handleSave = () => {
		mutation.mutate(Array.from(selectedPermissionList));
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-zinc-500 dark:text-zinc-400">
					Select permission for this role
				</p>
				{hasChanges && (
					<Button size="sm" onClick={handleSave} isLoading={mutation.isPending}>
						Save Change
					</Button>
				)}
			</div>

			<LoadingBoundary
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				loadingFallback={<SkeletonList count={4} variant="simple" />}
			>
				<div className="space-y-6">
					{permissionGroupList?.map((group) => {
						const groupPermissionList = group.permissionList.map((p) => p.name);
						const selectedCount = groupPermissionList.filter((p) =>
							selectedPermissionList.has(p),
						).length;
						const allSelected = selectedCount === groupPermissionList.length;
						const someSelected = selectedCount > 0 && !allSelected;

						return (
							<div key={group.resource} className="space-y-2">
								<button
									type="button"
									onClick={() => toggleGroup(group)}
									className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
								>
									<div
										className={`h-4 w-4 rounded border flex items-center justify-center ${
											allSelected
												? "bg-blue-600 border-blue-600"
												: someSelected
													? "bg-blue-100 border-blue-600 dark:bg-blue-900"
													: "border-zinc-300 dark:border-zinc-600"
										}`}
									>
										{(allSelected || someSelected) && (
											<Check className="h-3 w-3 text-white" />
										)}
									</div>
									{group.label}
									<span className="text-zinc-400">
										({selectedCount}/{groupPermissionList.length})
									</span>
								</button>

								<div className="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
									{group.permissionList.map((permission) => {
										const isSelected = selectedPermissionList.has(permission.name);
										const action = permission.action.charAt(0).toUpperCase() + permission.action.slice(1);

										return (
											<button
												key={permission.id}
												type="button"
												onClick={() => togglePermission(permission.name)}
												className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
													isSelected
														? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
														: "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
												}`}
											>
												<div
													className={`h-4 w-4 rounded border flex items-center justify-center ${
														isSelected
															? "bg-blue-600 border-blue-600"
															: "border-zinc-300 dark:border-zinc-600"
													}`}
												>
													{isSelected && <Check className="h-3 w-3 text-white" />}
												</div>
												{action}
											</button>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</LoadingBoundary>
		</div>
	);
}
```

**Step 6: Commit**

```bash
git add src/feature/role/
git commit -m "feat(ui): add Role feature components"
```

---

## Task 11: Frontend - Create RolePage

**Files:**
- Create: `src/page/role/RolePage.tsx`
- Create: `src/page/role/index.ts`

**Step 1: Create RolePage.tsx**

Create `src/page/role/RolePage.tsx`:

```typescript
import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useUIStore } from "@/src/store/ui";
import {
	MasterDetail,
	MasterList,
	MasterListItem,
	DetailPanel,
	SearchInput,
	Button,
	LoadingBoundary,
	EmptyState,
	SkeletonList,
	SkeletonDetailPanel,
} from "@/src/component";
import { api } from "@/src/lib/api";
import type { Role, RoleWithPermission } from "@/shared/type";
import {
	RoleDetail,
	RoleFormModal,
	RoleDeleteDialog,
} from "@/src/feature/role";

const MODAL_ID = {
	create: "role-create",
	edit: "role-edit",
	delete: "role-delete",
};

export function RolePage() {
	const { openModal } = useUIStore();
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [search, setSearch] = useState("");

	// Fetch role list
	const {
		data: roleList = [],
		isLoading: isListLoading,
		isError: isListError,
		refetch: refetchList,
	} = useQuery({
		queryKey: ["role"],
		queryFn: () => api.get<Role[]>("/role"),
	});

	// Fetch selected role detail
	const {
		data: selectedRole,
		isLoading: isDetailLoading,
		refetch: refetchDetail,
	} = useQuery({
		queryKey: ["role", selectedId],
		queryFn: () => api.get<RoleWithPermission>(`/role/${selectedId}`),
		enabled: selectedId !== null,
	});

	// Filter by search
	const filteredList = roleList.filter((role) =>
		role.name.toLowerCase().includes(search.toLowerCase()),
	);

	const handleCreate = () => {
		openModal(MODAL_ID.create);
	};

	const handleEdit = () => {
		if (selectedRole) {
			openModal(MODAL_ID.edit, selectedRole);
		}
	};

	const handleDelete = () => {
		if (selectedRole) {
			openModal(MODAL_ID.delete, selectedRole);
		}
	};

	const selectAfterCreate = (role: Role) => {
		setSelectedId(role.id);
	};

	const selectAfterDelete = () => {
		setSelectedId(null);
	};

	return (
		<>
			<MasterDetail>
				<MasterList
					header={
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
									Role
								</h1>
								<Button size="sm" onClick={handleCreate}>
									<Plus className="h-4 w-4" />
									New
								</Button>
							</div>
							<SearchInput
								value={search}
								onChange={setSearch}
								placeholder="Search role..."
							/>
						</div>
					}
				>
					<LoadingBoundary
						isLoading={isListLoading}
						isError={isListError}
						onRetry={refetchList}
						loadingFallback={<SkeletonList count={5} variant="simple" />}
					>
						{filteredList.length === 0 ? (
							<EmptyState
								title="No role"
								message="Create your first role to get started."
								action={
									<Button size="sm" onClick={handleCreate}>
										<Plus className="h-4 w-4" />
										Create Role
									</Button>
								}
							/>
						) : (
							filteredList.map((role) => (
								<MasterListItem
									key={role.id}
									isSelected={selectedId === role.id}
									onClick={() => setSelectedId(role.id)}
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-zinc-900 dark:text-zinc-100">
											{role.name}
										</p>
										<span className="text-xs text-zinc-500 dark:text-zinc-400">
											{role.userCount ?? 0} user
										</span>
									</div>
									{role.description && (
										<p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">
											{role.description}
										</p>
									)}
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel>
					{selectedRole ? (
						<RoleDetail
							role={selectedRole}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onPermissionChange={refetchDetail}
						/>
					) : isDetailLoading ? (
						<SkeletonDetailPanel fieldCount={4} />
					) : (
						<EmptyState
							title="No role selected"
							message="Select a role from the list to view detail."
						/>
					)}
				</DetailPanel>
			</MasterDetail>

			<RoleFormModal
				id={MODAL_ID.create}
				onSuccess={selectAfterCreate}
			/>
			<RoleFormModal id={MODAL_ID.edit} onSuccess={refetchDetail} />
			<RoleDeleteDialog
				id={MODAL_ID.delete}
				onSuccess={selectAfterDelete}
			/>
		</>
	);
}
```

**Step 2: Create index.ts**

Create `src/page/role/index.ts`:

```typescript
export { RolePage } from "./RolePage";
```

**Step 3: Commit**

```bash
git add src/page/role/
git commit -m "feat(page): add RolePage with master-detail layout"
```

---

## Task 12: Frontend - Update Router and Navigation

**Files:**
- Modify: `src/router.tsx`
- Modify: `src/page/setting/SettingNav.tsx`
- Modify: `src/page/setting/index.ts`

**Step 1: Update router**

In `src/router.tsx`, add the role route:

```typescript
import { RolePage } from "@/src/page/role";

// Inside the setting children array:
{
	path: "role",
	element: <RolePage />,
	errorElement: <RouteErrorBoundary />,
},
```

**Step 2: Update SettingNav**

In `src/page/setting/SettingNav.tsx`:

```typescript
import { NavLink } from "react-router-dom";
import { Users, FileText, Shield } from "lucide-react";

const navItemList = [
	{ to: "/setting/user", label: "User", icon: Users },
	{ to: "/setting/role", label: "Role", icon: Shield },
	{ to: "/setting/log", label: "Log", icon: FileText },
];
```

**Step 3: Update setting index export**

In `src/page/setting/index.ts`, ensure exports are correct (no changes needed if only exporting SettingPage and SystemLogPage).

**Step 4: Commit**

```bash
git add src/router.tsx src/page/setting/SettingNav.tsx
git commit -m "feat(router): add Role page to settings navigation"
```

---

## Task 13: Update User Form to Use Dynamic Roles

**Files:**
- Modify: `src/feature/user/UserFormModal.tsx`

**Step 1: Fetch roles dynamically**

Update the user form modal to fetch roles from API instead of using hardcoded constants:

```typescript
// Add this query
const { data: roleList = [] } = useQuery({
	queryKey: ["role"],
	queryFn: () => api.get<Role[]>("/role"),
});

// Replace hardcoded role options with:
<Select
	label="Role"
	{...register("role")}
	error={errors.role?.message}
>
	<option value="">Select role</option>
	{roleList.map((role) => (
		<option key={role.id} value={role.name}>
			{role.name}
		</option>
	))}
</Select>
```

**Step 2: Commit**

```bash
git add src/feature/user/UserFormModal.tsx
git commit -m "feat(user): use dynamic role list in user form"
```

---

## Task 14: Run Full Test

**Step 1: Reset database and run migrations**

```bash
bun run db:reset
bun run db:migrate
```

**Step 2: Run seed scripts**

```bash
# Seed permissions
wrangler d1 execute nona-db --local --file=scripts/seed-rbac.sql

# Seed admin user
ADMIN_EMAIL="admin@test.com" ADMIN_PASSWORD="test123" bun run db:seed-admin
```

**Step 3: Start dev server and test**

```bash
bun run dev
```

Test checklist:
- [ ] Login as admin
- [ ] Navigate to Setting > Role
- [ ] Create a new role
- [ ] Assign permissions to the role
- [ ] Create a user with the new role
- [ ] Login as the new user
- [ ] Verify permission restrictions work

**Step 4: Final commit**

```bash
git add .
git commit -m "feat(rbac): complete enterprise RBAC implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add resource/action columns to permission | `worker/db/schema.ts` |
| 2 | Update permission constants | `shared/constant/permission.ts` |
| 3 | Update seed script | `scripts/seed-rbac.sql` |
| 4 | Add system:admin bypass | `worker/lib/rbac.ts`, `worker/lib/middleware.ts` |
| 5 | Create Role types | `shared/type/role.ts` |
| 6 | Create Role schema | `shared/schema/role.ts` |
| 7 | Create Permission route | `worker/route/permission.ts` |
| 8 | Create Role route | `worker/route/role.ts` |
| 9 | Update usePermission hook | `src/hook/usePermission.ts` |
| 10 | Create Role feature components | `src/feature/role/*` |
| 11 | Create RolePage | `src/page/role/*` |
| 12 | Update router and navigation | `src/router.tsx`, `src/page/setting/SettingNav.tsx` |
| 13 | Update UserFormModal | `src/feature/user/UserFormModal.tsx` |
| 14 | Full integration test | - |
