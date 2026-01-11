import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, like, sql } from "drizzle-orm";
import { createDb, category } from "../db";
import {
	createCategorySchema,
	updateCategorySchema,
} from "../../shared/schema/category";
import { PERMISSION } from "../../shared/constant/permission";
import {
	generatePublicId,
	timestamps,
	updatedTimestamp,
	listResponse,
	notFound,
	conflict,
	checkDependencies,
	parsePagination,
	requirePermission,
} from "../lib";

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
app.get("/:id", requirePermission(PERMISSION.CATEGORY_READ), async (c) => {
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
app.post(
	"/",
	requirePermission(PERMISSION.CATEGORY_CREATE),
	zValidator("json", createCategorySchema),
	async (c) => {
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
	},
);

// PUT /api/category/:id - Update with optimistic locking
app.put(
	"/:id",
	requirePermission(PERMISSION.CATEGORY_UPDATE),
	zValidator("json", updateCategorySchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const publicId = c.req.param("id");
		const input = c.req.valid("json");

		// Update with optimistic locking - check updatedAt matches
		const result = await db
			.update(category)
			.set({
				name: input.name,
				...updatedTimestamp(),
			})
			.where(
				and(
					eq(category.publicId, publicId),
					isNull(category.deletedAt),
					eq(category.updatedAt, input.updatedAt),
				),
			)
			.returning();

		// If no rows updated, check if record exists or was modified
		if (result.length === 0) {
			const current = await db
				.select()
				.from(category)
				.where(and(eq(category.publicId, publicId), isNull(category.deletedAt)))
				.limit(1);

			if (current.length > 0) {
				return conflict(
					c,
					"Category was modified. Please refresh and try again.",
				);
			}
			return notFound(c, "Category not found");
		}

		return c.json(result[0]);
	},
);

// DELETE /api/category/:id - Soft delete with TOCTOU protection
app.delete(
	"/:id",
	requirePermission(PERMISSION.CATEGORY_DELETE),
	async (c) => {
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

		// Check dependencies before delete
		const { hasDependencies, message } = await checkDependencies(
			db,
			"category",
			existing[0].id,
		);

		if (hasDependencies) {
			return conflict(c, message!);
		}

		// Soft delete
		await db
			.update(category)
			.set({
				deletedAt: Date.now(),
				...updatedTimestamp(),
			})
			.where(eq(category.publicId, publicId));

		return c.json({ success: true });
	},
);

export { app as categoryRoute };
