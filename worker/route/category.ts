import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, like, sql, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { createDb, category, user } from "../db";
import {
	createCategorySchema,
	updateCategorySchema,
} from "../../shared/schema/category";
import { PERMISSION } from "../../shared/constant/permission";
import {
	timestamps,
	updatedTimestamp,
	listResponse,
	notFound,
	conflict,
	checkDependencies,
	parsePagination,
	requirePermission,
	getUserId,
	logAudit,
	createAuditChanges,
	AUDIT_ACTION,
	AUDIT_RESOURCE,
} from "../lib";

// Aliases for creator/updater joins
const creator = alias(user, "creator");
const updater = alias(user, "updater");

const app = new Hono<{ Bindings: Env }>();

// GET /api/category - List (paginated, filterable)
app.get("/", requirePermission(PERMISSION.CATEGORY_READ), async (c) => {
	const db = createDb(c.env.DB);
	const query = c.req.query();
	const { search } = query;
	const { offset, limit } = parsePagination(query);

	const baseWhere = isNull(category.deletedAt);
	const whereClause = search
		? and(baseWhere, like(category.name, `%${search}%`))
		: baseWhere;

	const [data, countResult] = await Promise.all([
		db
			.select({
				id: category.id,
				name: category.name,
				createdAt: category.createdAt,
				updatedAt: category.updatedAt,
				deletedAt: category.deletedAt,
				createdBy: category.createdBy,
				updatedBy: category.updatedBy,
				createdByName: creator.name,
				updatedByName: updater.name,
			})
			.from(category)
			.leftJoin(creator, eq(category.createdBy, creator.id))
			.leftJoin(updater, eq(category.updatedBy, updater.id))
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(category.updatedAt)),
		db
			.select({ count: sql<number>`count(*)` })
			.from(category)
			.where(whereClause),
	]);

	return listResponse(c, data, countResult[0]?.count ?? 0);
});

// GET /api/category/:id - Detail
app.get("/:id", requirePermission(PERMISSION.CATEGORY_READ), async (c) => {
	const db = createDb(c.env.DB);
	const id = Number(c.req.param("id"));

	const result = await db
		.select({
			id: category.id,
			name: category.name,
			createdAt: category.createdAt,
			updatedAt: category.updatedAt,
			deletedAt: category.deletedAt,
			createdBy: category.createdBy,
			updatedBy: category.updatedBy,
			createdByName: creator.name,
			updatedByName: updater.name,
		})
		.from(category)
		.leftJoin(creator, eq(category.createdBy, creator.id))
		.leftJoin(updater, eq(category.updatedBy, updater.id))
		.where(and(eq(category.id, id), isNull(category.deletedAt)))
		.limit(1);

	if (result.length === 0) {
		return notFound(c, "Category not found");
	}

	return c.json(result[0]);
});

// POST /api/category - Create
app.post(
	"/",
	requirePermission(PERMISSION.CATEGORY_CREATE),
	zValidator("json", createCategorySchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const input = c.req.valid("json");
		const userId = getUserId(c);

		const result = await db
			.insert(category)
			.values({
				name: input.name,
				...timestamps(userId),
			})
			.returning();

		const created = result[0];

		// Non-blocking audit log
		c.executionCtx.waitUntil(logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.CREATE,
			resource: AUDIT_RESOURCE.CATEGORY,
			resourceId: String(created.id),
			metadata: { name: created.name },
		}));

		return c.json(created, 201);
	},
);

// PUT /api/category/:id - Update with optimistic locking
app.put(
	"/:id",
	requirePermission(PERMISSION.CATEGORY_UPDATE),
	zValidator("json", updateCategorySchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const id = Number(c.req.param("id"));
		const input = c.req.valid("json");
		const userId = getUserId(c);

		// Get existing data for audit trail
		const existing = await db
			.select({ name: category.name })
			.from(category)
			.where(and(eq(category.id, id), isNull(category.deletedAt)))
			.limit(1);

		if (existing.length === 0) {
			return notFound(c, "Category not found");
		}

		const oldData = existing[0];

		// Update with optimistic locking - check updatedAt matches
		const result = await db
			.update(category)
			.set({
				name: input.name,
				...updatedTimestamp(userId),
			})
			.where(
				and(
					eq(category.id, id),
					isNull(category.deletedAt),
					eq(category.updatedAt, input.updatedAt),
				),
			)
			.returning();

		// If no rows updated, record was modified by another user
		if (result.length === 0) {
			return conflict(
				c,
				"Category was modified. Please refresh and try again.",
			);
		}

		const updated = result[0];

		// Log audit with changes
		const changes = createAuditChanges(
			{ name: oldData.name },
			{ name: updated.name },
			["name"],
		);

		// Non-blocking audit log
		c.executionCtx.waitUntil(logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.UPDATE,
			resource: AUDIT_RESOURCE.CATEGORY,
			resourceId: String(id),
			changes,
			metadata: { name: updated.name },
		}));

		return c.json(updated);
	},
);

// DELETE /api/category/:id - Soft delete with TOCTOU protection
app.delete(
	"/:id",
	requirePermission(PERMISSION.CATEGORY_DELETE),
	async (c) => {
		const db = createDb(c.env.DB);
		const id = Number(c.req.param("id"));
		const userId = getUserId(c);

		const existing = await db
			.select({ id: category.id, name: category.name })
			.from(category)
			.where(and(eq(category.id, id), isNull(category.deletedAt)))
			.limit(1);

		if (existing.length === 0) {
			return notFound(c, "Category not found");
		}

		const toDelete = existing[0];

		// Check dependencies before delete
		const { hasDependencies, message } = await checkDependencies(
			db,
			"category",
			toDelete.id,
		);

		if (hasDependencies) {
			return conflict(c, message!);
		}

		// Soft delete
		await db
			.update(category)
			.set({
				deletedAt: Date.now(),
				...updatedTimestamp(userId),
			})
			.where(eq(category.id, id));

		// Non-blocking audit log
		c.executionCtx.waitUntil(logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.DELETE,
			resource: AUDIT_RESOURCE.CATEGORY,
			resourceId: String(id),
			metadata: { name: toDelete.name },
		}));

		return c.json({ success: true });
	},
);

export { app as categoryRoute };
