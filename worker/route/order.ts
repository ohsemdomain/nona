import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, sql, inArray } from "drizzle-orm";
import { createDb, order, orderLine, item } from "../db";
import {
	createOrderSchema,
	updateOrderSchema,
} from "../../shared/schema/order";
import {
	generatePublicId,
	timestamps,
	updatedTimestamp,
	listResponse,
	notFound,
	badRequest,
	conflict,
	parsePagination,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/order - List (paginated, filterable)
app.get("/", async (c) => {
	const db = createDb(c.env.DB);
	const query = c.req.query();
	const { status } = query;
	const { offset, limit } = parsePagination(query);

	let whereClause = isNull(order.deletedAt);

	if (status) {
		whereClause = and(whereClause, eq(order.status, status))!;
	}

	const [data, countResult] = await Promise.all([
		db
			.select()
			.from(order)
			.where(whereClause)
			.limit(limit)
			.offset(offset)
			.orderBy(order.createdAt),
		db.select({ count: sql<number>`count(*)` }).from(order).where(whereClause),
	]);

	return listResponse(c, data, countResult[0]?.count ?? 0);
});

// GET /api/order/:id - Detail with lines
app.get("/:id", async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	const orderResult = await db
		.select()
		.from(order)
		.where(and(eq(order.publicId, publicId), isNull(order.deletedAt)))
		.limit(1);

	if (orderResult.length === 0) {
		return notFound(c, "Order not found");
	}

	const orderData = orderResult[0];

	const lineList = await db
		.select({
			id: orderLine.id,
			orderId: orderLine.orderId,
			itemId: orderLine.itemId,
			quantity: orderLine.quantity,
			unitPrice: orderLine.unitPrice,
			lineTotal: orderLine.lineTotal,
			item: {
				id: item.id,
				publicId: item.publicId,
				name: item.name,
				price: item.price,
			},
		})
		.from(orderLine)
		.leftJoin(item, eq(orderLine.itemId, item.id))
		.where(and(eq(orderLine.orderId, orderData.id), isNull(orderLine.deletedAt)));

	return c.json({ ...orderData, lineList });
});

// POST /api/order - Create
app.post("/", zValidator("json", createOrderSchema), async (c) => {
	const db = createDb(c.env.DB);
	const input = c.req.valid("json");

	// Get item prices
	const itemIdList = input.lineList.map((line) => line.itemId);
	const itemList = await db
		.select({ id: item.id, price: item.price })
		.from(item)
		.where(and(inArray(item.id, itemIdList), isNull(item.deletedAt)));

	if (itemList.length !== itemIdList.length) {
		return badRequest(c, "One or more items not found");
	}

	const itemPriceMap = new Map(itemList.map((i) => [i.id, i.price]));

	// Calculate totals
	let orderTotal = 0;
	const lineData = input.lineList.map((line) => {
		const unitPrice = itemPriceMap.get(line.itemId) ?? 0;
		const lineTotal = unitPrice * line.quantity;
		orderTotal += lineTotal;
		return {
			itemId: line.itemId,
			quantity: line.quantity,
			unitPrice,
			lineTotal,
		};
	});

	// Create order with lines in a single transaction
	const newOrder = await db.transaction(async (tx) => {
		const orderResult = await tx
			.insert(order)
			.values({
				publicId: generatePublicId(),
				status: "draft",
				total: orderTotal,
				...timestamps(),
			})
			.returning();

		const created = orderResult[0];

		if (lineData.length > 0) {
			await tx.insert(orderLine).values(
				lineData.map((line) => ({
					orderId: created.id,
					...line,
				})),
			);
		}

		const lineList = await tx
			.select()
			.from(orderLine)
			.where(and(eq(orderLine.orderId, created.id), isNull(orderLine.deletedAt)));

		return { ...created, lineList };
	});

	return c.json(newOrder, 201);
});

// PUT /api/order/:id - Update with optimistic locking
app.put("/:id", zValidator("json", updateOrderSchema), async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");
	const input = c.req.valid("json");

	const existing = await db
		.select()
		.from(order)
		.where(and(eq(order.publicId, publicId), isNull(order.deletedAt)))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "Order not found");
	}

	const existingOrder = existing[0];
	let orderTotal = existingOrder.total;
	let lineData: {
		orderId: number;
		itemId: number;
		quantity: number;
		unitPrice: number;
		lineTotal: number;
	}[] = [];

	// Validate items and calculate totals BEFORE transaction
	if (input.lineList) {
		const itemIdList = input.lineList.map((line) => line.itemId);
		const itemList = await db
			.select({ id: item.id, price: item.price })
			.from(item)
			.where(and(inArray(item.id, itemIdList), isNull(item.deletedAt)));

		if (itemList.length !== new Set(itemIdList).size) {
			return badRequest(c, "One or more items not found");
		}

		const itemPriceMap = new Map(itemList.map((i) => [i.id, i.price]));

		orderTotal = 0;
		lineData = input.lineList.map((line) => {
			const unitPrice = itemPriceMap.get(line.itemId) ?? 0;
			const lineTotal = unitPrice * line.quantity;
			orderTotal += lineTotal;
			return {
				orderId: existingOrder.id,
				itemId: line.itemId,
				quantity: line.quantity,
				unitPrice,
				lineTotal,
			};
		});
	}

	// Update order and lines in a single transaction with optimistic locking
	try {
		const updatedOrder = await db.transaction(async (tx) => {
			// Replace lines if provided
			if (input.lineList) {
				// Soft delete existing lines
				await tx
					.update(orderLine)
					.set({ deletedAt: Date.now() })
					.where(and(eq(orderLine.orderId, existingOrder.id), isNull(orderLine.deletedAt)));

				if (lineData.length > 0) {
					await tx.insert(orderLine).values(lineData);
				}
			}

			// Update order with optimistic locking - check updatedAt matches
			const result = await tx
				.update(order)
				.set({
					status: input.status ?? existingOrder.status,
					total: orderTotal,
					...updatedTimestamp(),
				})
				.where(
					and(
						eq(order.publicId, publicId),
						eq(order.updatedAt, input.updatedAt),
					),
				)
				.returning();

			// If no rows updated, order was modified by another user
			if (result.length === 0) {
				throw new Error("CONFLICT");
			}

			// Fetch lines
			const lineList = await tx
				.select()
				.from(orderLine)
				.where(and(eq(orderLine.orderId, existingOrder.id), isNull(orderLine.deletedAt)));

			return { ...result[0], lineList };
		});

		return c.json(updatedOrder);
	} catch (e) {
		if (e instanceof Error && e.message === "CONFLICT") {
			return conflict(c, "Order was modified. Please refresh and try again.");
		}
		throw e;
	}
});

// DELETE /api/order/:id - Soft delete (cascades to order lines)
app.delete("/:id", async (c) => {
	const db = createDb(c.env.DB);
	const publicId = c.req.param("id");

	const existing = await db
		.select()
		.from(order)
		.where(and(eq(order.publicId, publicId), isNull(order.deletedAt)))
		.limit(1);

	if (existing.length === 0) {
		return notFound(c, "Order not found");
	}

	// Soft delete order and lines in a single transaction
	const now = Date.now();
	await db.transaction(async (tx) => {
		// Soft delete order lines
		await tx
			.update(orderLine)
			.set({ deletedAt: now })
			.where(and(eq(orderLine.orderId, existing[0].id), isNull(orderLine.deletedAt)));

		// Soft delete order
		await tx
			.update(order)
			.set({
				deletedAt: now,
				...updatedTimestamp(),
			})
			.where(eq(order.publicId, publicId));
	});

	return c.json({ success: true });
});

export { app as orderRoute };
