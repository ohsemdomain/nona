import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, like, sql } from "drizzle-orm";
import { createDb, item, category } from "../db";
import { createItemSchema, updateItemSchema } from "../../shared/schema/item";
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
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/item - List (paginated, filterable)
app.get("/", async (c) => {
	const db = createDb(c.env.DB);
	const query = c.req.query();
	const { search, categoryId } = query;
	const { offset, limit } = parsePagination(query);

	let whereClause = isNull(item.deletedAt);

	if (search) {
		whereClause = and(whereClause, like(item.name, `%${search}%`))!;
	}

	if (categoryId) {
		whereClause = and(whereClause, eq(item.categoryId, parseInt(categoryId)))!;
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
				category: {
					id: category.id,
					publicId: category.publicId,
					name: category.name,
				},
			})
			.from(item)
			.leftJoin(category, eq(item.categoryId, category.id))
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(item.createdAt),
		db.select({ count: sql<number>`count(*)` }).from(item).where(whereClause),
	]);

	return listResponse(c, data, countResult[0]?.count ?? 0);
});

// GET /api/item/:id - Detail
app.get("/:id", async (c) => {
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
			category: {
				id: category.id,
				publicId: category.publicId,
				name: category.name,
			},
		})
		.from(item)
		.leftJoin(category, eq(item.categoryId, category.id))
		.where(and(eq(item.publicId, publicId), isNull(item.deletedAt)))
		.limit(1);

	if (result.length === 0) {
		return notFound(c, "Item not found");
	}

	return c.json(result[0]);
});

// POST /api/item - Create
app.post("/", zValidator("json", createItemSchema), async (c) => {
	const db = createDb(c.env.DB);
	const input = c.req.valid("json");

	// Verify category exists
	const categoryExists = await db
		.select({ id: category.id })
		.from(category)
		.where(and(eq(category.id, input.categoryId), isNull(category.deletedAt)))
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
			...timestamps(),
		})
		.returning();

	return c.json(result[0], 201);
});

// PUT /api/item/:id - Update with optimistic locking
app.put("/:id", zValidator("json", updateItemSchema), async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");
	const input = c.req.valid("json");

	// Verify category if changing
	if (input.categoryId) {
		const categoryExists = await db
			.select({ id: category.id })
			.from(category)
			.where(and(eq(category.id, input.categoryId), isNull(category.deletedAt)))
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
			...updatedTimestamp(),
		})
		.where(
			and(
				eq(item.publicId, publicId),
				isNull(item.deletedAt),
				eq(item.updatedAt, updatedAt),
			),
		)
		.returning();

	// If no rows updated, check if record exists or was modified
	if (result.length === 0) {
		const current = await db
			.select()
			.from(item)
			.where(and(eq(item.publicId, publicId), isNull(item.deletedAt)))
			.limit(1);

		if (current.length > 0) {
			return conflict(c, "Item was modified. Please refresh and try again.");
		}
		return notFound(c, "Item not found");
	}

	return c.json(result[0]);
});

// DELETE /api/item/:id - Soft delete with TOCTOU protection
app.delete("/:id", async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	const existing = await db
		.select()
		.from(item)
		.where(and(eq(item.publicId, publicId), isNull(item.deletedAt)))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "Item not found");
	}

	// Check dependencies before delete
	const { hasDependencies, message } = await checkDependencies(
		db,
		"item",
		existing[0].id,
	);

	if (hasDependencies) {
		return conflict(c, message!);
	}

	// Soft delete
	await db
		.update(item)
		.set({
			deletedAt: Date.now(),
			...updatedTimestamp(),
		})
		.where(eq(item.publicId, publicId));

	return c.json({ success: true });
});

export { app as itemRoute };
