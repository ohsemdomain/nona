import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, eq, inArray, isNull, sql, like, desc } from "drizzle-orm";
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
	listResponse,
	parsePagination,
	AUDIT_ACTION,
	AUDIT_RESOURCE,
	invalidateAllPermissionCache,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/role - List roles with search and pagination
app.get("/", requirePermission(PERMISSION.ROLE_READ), async (c) => {
	const db = createDb(c.env.DB);
	const query = c.req.query();
	const { search } = query;
	const { offset, limit } = parsePagination(query);

	let whereClause = sql`1=1`;

	if (search) {
		whereClause = like(role.name, `%${search}%`);
	}

	const [data, countResult] = await Promise.all([
		db
			.select({
				id: role.id,
				name: role.name,
				description: role.description,
				createdAt: role.createdAt,
				userCount: sql<number>`(SELECT COUNT(*) FROM user WHERE role_id = ${role.id} AND deleted_at IS NULL)`,
			})
			.from(role)
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(role.createdAt)),
		db.select({ count: sql<number>`count(*)` }).from(role).where(whereClause),
	]);

	return listResponse(c, data, countResult[0]?.count ?? 0);
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

	// Check if any active users have this role
	const userCount = await db
		.select({ count: sql<number>`count(*)` })
		.from(user)
		.where(and(eq(user.roleId, roleId), isNull(user.deletedAt)));

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
