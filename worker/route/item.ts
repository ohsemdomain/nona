import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, like, sql, desc } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { createDb, item, category, user } from "../db";
import { createItemSchema, updateItemSchema } from "../../shared/schema/item";
import { PERMISSION } from "../../shared/constant/permission";
import {
	generatePublicId,
	timestamps,
	updatedTimestamp,
	listResponse,
	notFound,
	badRequest,
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

// GET /api/item - List (paginated, filterable)
app.get("/", requirePermission(PERMISSION.ITEM_READ), async (c) => {
	const db = createDb(c.env.DB);
	const query = c.req.query();
	const { search, categoryId } = query;
	const { offset, limit } = parsePagination(query);

	let whereClause = isNull(item.deletedAt);

	if (search) {
		whereClause = and(whereClause, like(item.name, `%${search}%`)) ?? whereClause;
	}

	if (categoryId) {
		const categoryIdNum = parseInt(categoryId, 10);
		if (isNaN(categoryIdNum)) {
			return c.json({ error: "Invalid category ID" }, 400);
		}
		whereClause = and(whereClause, eq(item.categoryId, categoryIdNum)) ?? whereClause;
	}

	const [data, countResult] = await Promise.all([
		db
			.select({
				id: item.id,
				publicId: item.publicId,
				name: item.name,
				categoryId: item.categoryId,
				price: item.price,
				createdAt: item.createdAt,
				updatedAt: item.updatedAt,
				deletedAt: item.deletedAt,
				createdBy: item.createdBy,
				updatedBy: item.updatedBy,
				createdByName: creator.name,
				updatedByName: updater.name,
				category: {
					id: category.id,
					publicId: category.publicId,
					name: category.name,
				},
			})
			.from(item)
			.leftJoin(category, eq(item.categoryId, category.id))
			.leftJoin(creator, eq(item.createdBy, creator.id))
			.leftJoin(updater, eq(item.updatedBy, updater.id))
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(desc(item.updatedAt)),
		db.select({ count: sql<number>`count(*)` }).from(item).where(whereClause),
	]);

	return listResponse(c, data, countResult[0]?.count ?? 0);
});

// GET /api/item/:id - Detail
app.get("/:id", requirePermission(PERMISSION.ITEM_READ), async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	const result = await db
		.select({
			id: item.id,
			publicId: item.publicId,
			name: item.name,
			categoryId: item.categoryId,
			price: item.price,
			createdAt: item.createdAt,
			updatedAt: item.updatedAt,
			deletedAt: item.deletedAt,
			createdBy: item.createdBy,
			updatedBy: item.updatedBy,
			createdByName: creator.name,
			updatedByName: updater.name,
			category: {
				id: category.id,
				publicId: category.publicId,
				name: category.name,
			},
		})
		.from(item)
		.leftJoin(category, eq(item.categoryId, category.id))
		.leftJoin(creator, eq(item.createdBy, creator.id))
		.leftJoin(updater, eq(item.updatedBy, updater.id))
		.where(and(eq(item.publicId, publicId), isNull(item.deletedAt)))
		.limit(1);

	if (result.length === 0) {
		return notFound(c, "Item not found");
	}

	return c.json(result[0]);
});

// POST /api/item - Create
app.post(
	"/",
	requirePermission(PERMISSION.ITEM_CREATE),
	zValidator("json", createItemSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const input = c.req.valid("json");
		const userId = getUserId(c);

		// Verify category exists
		const categoryExists = await db
			.select({ id: category.id })
			.from(category)
			.where(
				and(eq(category.id, input.categoryId), isNull(category.deletedAt)),
			)
			.limit(1);

		if (categoryExists.length === 0) {
			return badRequest(c, "Category not found");
		}

		const result = await db
			.insert(item)
			.values({
				publicId: generatePublicId(),
				name: input.name,
				categoryId: input.categoryId,
				price: input.price,
				...timestamps(userId),
			})
			.returning();

		const created = result[0];

		// Non-blocking audit log
		c.executionCtx.waitUntil(logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.CREATE,
			resource: AUDIT_RESOURCE.ITEM,
			resourceId: created.publicId,
			metadata: { name: created.name, price: created.price },
		}));

		return c.json(created, 201);
	},
);

// PUT /api/item/:id - Update with optimistic locking
app.put(
	"/:id",
	requirePermission(PERMISSION.ITEM_UPDATE),
	zValidator("json", updateItemSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const publicId = c.req.param("id");
		const input = c.req.valid("json");
		const userId = getUserId(c);

		// Get existing data for audit trail
		const existing = await db
			.select({ name: item.name, categoryId: item.categoryId, price: item.price })
			.from(item)
			.where(and(eq(item.publicId, publicId), isNull(item.deletedAt)))
			.limit(1);

		if (existing.length === 0) {
			return notFound(c, "Item not found");
		}

		const oldData = existing[0];

		// Verify category if changing
		if (input.categoryId) {
			const categoryExists = await db
				.select({ id: category.id })
				.from(category)
				.where(
					and(eq(category.id, input.categoryId), isNull(category.deletedAt)),
				)
				.limit(1);

			if (categoryExists.length === 0) {
				return badRequest(c, "Category not found");
			}
		}

		// Update with optimistic locking - check updatedAt matches
		const { updatedAt, ...updateData } = input;
		const result = await db
			.update(item)
			.set({
				...updateData,
				...updatedTimestamp(userId),
			})
			.where(
				and(
					eq(item.publicId, publicId),
					isNull(item.deletedAt),
					eq(item.updatedAt, updatedAt),
				),
			)
			.returning();

		// If no rows updated, record was modified by another user
		if (result.length === 0) {
			return conflict(c, "Item was modified. Please refresh and try again.");
		}

		const updated = result[0];

		// Log audit with changes
		const changes = createAuditChanges(
			{ name: oldData.name, categoryId: oldData.categoryId, price: oldData.price },
			{ name: updated.name, categoryId: updated.categoryId, price: updated.price },
			["name", "categoryId", "price"],
		);

		// Non-blocking audit log
		c.executionCtx.waitUntil(logAudit(db, {
			actorId: userId,
			action: AUDIT_ACTION.UPDATE,
			resource: AUDIT_RESOURCE.ITEM,
			resourceId: publicId,
			changes,
			metadata: { name: updated.name },
		}));

		return c.json(updated);
	},
);

// DELETE /api/item/:id - Soft delete with TOCTOU protection
app.delete("/:id", requirePermission(PERMISSION.ITEM_DELETE), async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");
	const userId = getUserId(c);

	const existing = await db
		.select({ id: item.id, name: item.name })
		.from(item)
		.where(and(eq(item.publicId, publicId), isNull(item.deletedAt)))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "Item not found");
	}

	const toDelete = existing[0];

	// Check dependencies before delete
	const { hasDependencies, message } = await checkDependencies(
		db,
		"item",
		toDelete.id,
	);

	if (hasDependencies) {
		return conflict(c, message!);
	}

	// Soft delete
	await db
		.update(item)
		.set({
			deletedAt: Date.now(),
			...updatedTimestamp(userId),
		})
		.where(eq(item.publicId, publicId));

	// Non-blocking audit log
	c.executionCtx.waitUntil(logAudit(db, {
		actorId: userId,
		action: AUDIT_ACTION.DELETE,
		resource: AUDIT_RESOURCE.ITEM,
		resourceId: publicId,
		metadata: { name: toDelete.name },
	}));

	return c.json({ success: true });
});

export { app as itemRoute };
