import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, like, sql, or } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { nanoid } from "nanoid";
import { createDb, user, account, role } from "../db";
import { createUserSchema, updateUserSchema } from "../../shared/schema/user";
import { PERMISSION } from "../../shared/constant/permission";
import { AUTH_PROVIDER } from "../../shared/constant/auth";
import {
	notFound,
	conflict,
	badRequest,
	parsePagination,
	listResponse,
	requirePermission,
	getSessionFromContext,
	authTimestamps,
	authUpdatedTimestamp,
	generatePublicId,
	userSelectFields,
	formatUserDates,
	formatUserList,
	logAudit,
	AUDIT_ACTION,
	AUDIT_RESOURCE,
	createAuditChanges,
	revokeAllUserSession,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/user - List (paginated, filterable)
app.get("/", requirePermission(PERMISSION.USER_READ), async (c) => {
	const db = createDb(c.env.DB);
	const query = c.req.query();
	const { search } = query;
	const { offset, limit } = parsePagination(query);

	const baseWhere = isNull(user.deletedAt);
	const whereClause = search
		? and(
				baseWhere,
				or(like(user.name, `%${search}%`), like(user.email, `%${search}%`)),
			)
		: baseWhere;

	const [data, countResult] = await Promise.all([
		db
			.select(userSelectFields)
			.from(user)
			.leftJoin(role, eq(user.roleId, role.id))
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(user.createdAt),
		db
			.select({ count: sql<number>`count(*)` })
			.from(user)
			.where(whereClause),
	]);

	return listResponse(c, formatUserList(data), countResult[0]?.count ?? 0);
});

// GET /api/user/:id - Detail (uses publicId)
app.get("/:id", requirePermission(PERMISSION.USER_READ), async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	const result = await db
		.select(userSelectFields)
		.from(user)
		.leftJoin(role, eq(user.roleId, role.id))
		.where(and(eq(user.publicId, publicId), isNull(user.deletedAt)))
		.limit(1);

	if (result.length === 0) {
		return notFound(c, "User not found");
	}

	return c.json(formatUserDates(result[0]));
});

// POST /api/user - Create user (admin only)
app.post(
	"/",
	requirePermission(PERMISSION.USER_CREATE),
	zValidator("json", createUserSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const input = c.req.valid("json");

		// Get current actor for audit
		const session = await getSessionFromContext(c);
		const actorId = session?.user.id ?? "system";

		// Check if email already exists
		const existing = await db
			.select({ id: user.id })
			.from(user)
			.where(eq(user.email, input.email))
			.limit(1);

		if (existing.length > 0) {
			return conflict(c, "Email already exists");
		}

		// Verify role exists if provided
		if (input.roleId) {
			const roleExists = await db
				.select({ id: role.id })
				.from(role)
				.where(eq(role.id, input.roleId))
				.limit(1);

			if (roleExists.length === 0) {
				return badRequest(c, "Role not found");
			}
		}

		// Hash password
		const hashedPassword = await hashPassword(input.password);

		// Generate IDs
		const userId = nanoid();
		const userPublicId = generatePublicId();
		const accountId = nanoid();
		const now = authTimestamps();

		// Insert user and account
		await db.insert(user).values({
			id: userId,
			publicId: userPublicId,
			name: input.name,
			email: input.email,
			emailVerified: false,
			roleId: input.roleId ?? null,
			...now,
		});

		await db.insert(account).values({
			id: accountId,
			accountId: input.email,
			providerId: AUTH_PROVIDER.CREDENTIAL,
			userId: userId,
			password: hashedPassword,
			...now,
		});

		// Non-blocking audit log
		c.executionCtx.waitUntil(logAudit(db, {
			actorId,
			action: AUDIT_ACTION.CREATE,
			resource: AUDIT_RESOURCE.USER,
			resourceId: userPublicId,
			metadata: {
				email: input.email,
				roleId: input.roleId,
			},
		}));

		// Fetch created user with role
		const created = await db
			.select(userSelectFields)
			.from(user)
			.leftJoin(role, eq(user.roleId, role.id))
			.where(eq(user.id, userId))
			.limit(1);

		return c.json(formatUserDates(created[0]), 201);
	},
);

// PUT /api/user/:id - Update user (uses publicId, including password reset)
app.put(
	"/:id",
	requirePermission(PERMISSION.USER_UPDATE),
	zValidator("json", updateUserSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const publicId = c.req.param("id");
		const input = c.req.valid("json");

		// Get current actor for audit
		const session = await getSessionFromContext(c);
		const actorId = session?.user.id ?? "system";

		// Check user exists and get current data
		const existing = await db
			.select({
				id: user.id,
				name: user.name,
				roleId: user.roleId,
				updatedAt: user.updatedAt,
			})
			.from(user)
			.where(and(eq(user.publicId, publicId), isNull(user.deletedAt)))
			.limit(1);

		if (existing.length === 0) {
			return notFound(c, "User not found");
		}

		const existingUser = existing[0];

		// Optimistic locking check
		const existingUpdatedAt =
			existingUser.updatedAt instanceof Date
				? existingUser.updatedAt.getTime()
				: existingUser.updatedAt;

		if (existingUpdatedAt !== input.updatedAt) {
			return conflict(c, "User was modified. Please refresh and try again.");
		}

		// Build update object
		const updates: Record<string, unknown> = {
			...authUpdatedTimestamp(),
		};

		if (input.name) {
			updates.name = input.name;
		}

		// Update role if provided (including null to remove role)
		if (input.roleId !== undefined) {
			if (input.roleId !== null) {
				// Verify role exists
				const roleExists = await db
					.select({ id: role.id })
					.from(role)
					.where(eq(role.id, input.roleId))
					.limit(1);

				if (roleExists.length === 0) {
					return badRequest(c, "Role not found");
				}
			}
			updates.roleId = input.roleId;
		}

		// Update user
		await db.update(user).set(updates).where(eq(user.id, existingUser.id));

		// Update password if provided
		if (input.password) {
			const hashedPassword = await hashPassword(input.password);

			// Find and update credential account
			await db
				.update(account)
				.set({
					password: hashedPassword,
					...authUpdatedTimestamp(),
				})
				.where(
					and(
						eq(account.userId, existingUser.id),
						eq(account.providerId, AUTH_PROVIDER.CREDENTIAL),
					),
				);

			// Security: Revoke all existing sessions after password change
			// This forces re-authentication on all devices
			await revokeAllUserSession(db, existingUser.id);
		}

		// Log audit with changes
		const changes = createAuditChanges(
			{ name: existingUser.name, roleId: existingUser.roleId },
			{
				name: input.name ?? existingUser.name,
				roleId: updates.roleId !== undefined ? updates.roleId : existingUser.roleId,
			},
			["name", "roleId"],
		);

		// Non-blocking audit log
		c.executionCtx.waitUntil(logAudit(db, {
			actorId,
			action: AUDIT_ACTION.UPDATE,
			resource: AUDIT_RESOURCE.USER,
			resourceId: publicId,
			changes,
			metadata: {
				passwordChanged: !!input.password,
				newRoleId: input.roleId,
			},
		}));

		// Fetch updated user
		const updated = await db
			.select(userSelectFields)
			.from(user)
			.leftJoin(role, eq(user.roleId, role.id))
			.where(eq(user.id, existingUser.id))
			.limit(1);

		return c.json(formatUserDates(updated[0]));
	},
);

// DELETE /api/user/:id - Soft delete (uses publicId)
app.delete("/:id", requirePermission(PERMISSION.USER_DELETE), async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	// Get current actor for audit
	const session = await getSessionFromContext(c);
	const actorId = session?.user.id ?? "system";

	const existing = await db
		.select({ id: user.id, email: user.email, name: user.name })
		.from(user)
		.where(and(eq(user.publicId, publicId), isNull(user.deletedAt)))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "User not found");
	}

	// Soft delete using Date for auth tables
	const now = new Date();
	await db
		.update(user)
		.set({
			deletedAt: now,
			updatedAt: now,
		})
		.where(eq(user.id, existing[0].id));

	// Non-blocking audit log
	c.executionCtx.waitUntil(logAudit(db, {
		actorId,
		action: AUDIT_ACTION.DELETE,
		resource: AUDIT_RESOURCE.USER,
		resourceId: publicId,
		metadata: {
			email: existing[0].email,
			name: existing[0].name,
		},
	}));

	return c.json({ success: true });
});

// POST /api/user/:id/revoke-session - Force logout user (admin only)
app.post(
	"/:id/revoke-session",
	requirePermission(PERMISSION.USER_UPDATE),
	async (c) => {
		const db = createDb(c.env.DB);
		const publicId = c.req.param("id");

		// Get current actor for audit
		const session = await getSessionFromContext(c);
		const actorId = session?.user.id ?? "system";

		// Find user by publicId
		const existing = await db
			.select({ id: user.id, name: user.name, email: user.email })
			.from(user)
			.where(and(eq(user.publicId, publicId), isNull(user.deletedAt)))
			.limit(1);

		if (existing.length === 0) {
			return notFound(c, "User not found");
		}

		const targetUser = existing[0];

		// Revoke all sessions for this user
		const revokedCount = await revokeAllUserSession(db, targetUser.id);

		// Audit log
		c.executionCtx.waitUntil(
			logAudit(db, {
				actorId,
				action: AUDIT_ACTION.UPDATE,
				resource: AUDIT_RESOURCE.USER,
				resourceId: publicId,
				metadata: {
					action: "session_revocation",
					revokedSessionCount: revokedCount,
					targetEmail: targetUser.email,
				},
			}),
		);

		return c.json({
			success: true,
			revokedSessionCount: revokedCount,
		});
	},
);

export { app as userRoute };
