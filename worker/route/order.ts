import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, isNull, and, sql, inArray } from "drizzle-orm";
import { createDb, order, orderLine, item } from "../db";
import { createOrderSchema, updateOrderSchema } from "../../shared/schema/order";
import {
    generatePublicId,
    timestamps,
    updatedTimestamp,
    listResponse,
    notFound,
    badRequest,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/order - List (paginated, filterable)
app.get("/", async (c) => {
    const db = createDb(c.env.DB);
    const { status, page = "1", pageSize = "20" } = c.req.query();

    const pageNum = Math.max(1, parseInt(page));
    const limit = Math.min(100, Math.max(1, parseInt(pageSize)));
    const offset = (pageNum - 1) * limit;

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
        .where(eq(orderLine.orderId, orderData.id));

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

    // Create order
    const orderResult = await db
        .insert(order)
        .values({
            publicId: generatePublicId(),
            status: "draft",
            total: orderTotal,
            ...timestamps(),
        })
        .returning();

    const newOrder = orderResult[0];

    // Create order lines
    if (lineData.length > 0) {
        await db.insert(orderLine).values(
            lineData.map((line) => ({
                orderId: newOrder.id,
                ...line,
            })),
        );
    }

    // Fetch complete order with lines
    const lineList = await db
        .select()
        .from(orderLine)
        .where(eq(orderLine.orderId, newOrder.id));

    return c.json({ ...newOrder, lineList }, 201);
});

// PUT /api/order/:id - Update
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

    // Update lines if provided
    if (input.lineList) {
        // Get item prices
        const itemIdList = input.lineList.map((line) => line.itemId);
        const itemList = await db
            .select({ id: item.id, price: item.price })
            .from(item)
            .where(and(inArray(item.id, itemIdList), isNull(item.deletedAt)));

        if (itemList.length !== new Set(itemIdList).size) {
            return badRequest(c, "One or more items not found");
        }

        const itemPriceMap = new Map(itemList.map((i) => [i.id, i.price]));

        // Delete existing lines
        await db.delete(orderLine).where(eq(orderLine.orderId, existingOrder.id));

        // Calculate new totals
        orderTotal = 0;
        const lineData = input.lineList.map((line) => {
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

        // Insert new lines
        if (lineData.length > 0) {
            await db.insert(orderLine).values(lineData);
        }
    }

    // Update order
    const result = await db
        .update(order)
        .set({
            status: input.status ?? existingOrder.status,
            total: orderTotal,
            ...updatedTimestamp(),
        })
        .where(eq(order.publicId, publicId))
        .returning();

    // Fetch lines
    const lineList = await db
        .select()
        .from(orderLine)
        .where(eq(orderLine.orderId, existingOrder.id));

    return c.json({ ...result[0], lineList });
});

// DELETE /api/order/:id - Soft delete
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

    await db
        .update(order)
        .set({
            deletedAt: Date.now(),
            ...updatedTimestamp(),
        })
        .where(eq(order.publicId, publicId));

    return c.json({ success: true });
});

export { app as orderRoute };
