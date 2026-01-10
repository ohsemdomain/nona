import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, like, sql } from "drizzle-orm";
import { createDb, category } from "../db";
import {
	createCategorySchema,
	updateCategorySchema,
} from "../../shared/schema/category";
import {
	generatePublicId,
	timestamps,
	updatedTimestamp,
	listResponse,
	notFound,
	conflict,
	checkDependencies,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/category - List (paginated, filterable)
app.get("/", async (c) => {
	const db = createDb(c.env.DB);
	const { search, page = "1", pageSize = "20" } = c.req.query();

	const pageNum = Math.max(1, parseInt(page));
	const limit = Math.min(100, Math.max(1, parseInt(pageSize)));
	const offset = (pageNum - 1) * limit;

	const baseWhere = isNull(category.deletedAt);
	const whereClause = search
		? and(baseWhere, like(category.name, `%${search}%`))
		: baseWhere;

	const [data, countResult] = await Promise.all([
		db
			.select()
			.from(category)
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(category.createdAt),
		db
			.select({ count: sql<number>`count(*)` })
			.from(category)
			.where(whereClause),
	]);

	return listResponse(c, data, countResult[0]?.count ?? 0);
});

// GET /api/category/:id - Detail
app.get("/:id", async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	const result = await db
		.select()
		.from(category)
		.where(and(eq(category.publicId, publicId), isNull(category.deletedAt)))
		.limit(1);

	if (result.length === 0) {
		return notFound(c, "Category not found");
	}

	return c.json(result[0]);
});

// POST /api/category - Create
app.post("/", zValidator("json", createCategorySchema), async (c) => {
	const db = createDb(c.env.DB);
	const input = c.req.valid("json");

	const result = await db
		.insert(category)
		.values({
			publicId: generatePublicId(),
			name: input.name,
			...timestamps(),
		})
		.returning();

	return c.json(result[0], 201);
});

// PUT /api/category/:id - Update
app.put("/:id", zValidator("json", updateCategorySchema), async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");
	const input = c.req.valid("json");

	const existing = await db
		.select()
		.from(category)
		.where(and(eq(category.publicId, publicId), isNull(category.deletedAt)))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "Category not found");
	}

	const result = await db
		.update(category)
		.set({
			...input,
			...updatedTimestamp(),
		})
		.where(eq(category.publicId, publicId))
		.returning();

	return c.json(result[0]);
});

// DELETE /api/category/:id - Soft delete
app.delete("/:id", async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	const existing = await db
		.select()
		.from(category)
		.where(and(eq(category.publicId, publicId), isNull(category.deletedAt)))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "Category not found");
	}

	// Check for dependent items
	const { hasDependencies, message } = await checkDependencies(
		db,
		"category",
		existing[0].id,
	);

	if (hasDependencies) {
		return conflict(c, message!);
	}

	await db
		.update(category)
		.set({
			deletedAt: Date.now(),
			...updatedTimestamp(),
		})
		.where(eq(category.publicId, publicId));

	return c.json({ success: true });
});

export { app as categoryRoute };
