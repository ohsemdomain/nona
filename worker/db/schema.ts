import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Category table
export const category = sqliteTable("category", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull().unique(),
    name: text("name").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
});

export const categoryRelations = relations(category, ({ many }) => ({
    itemList: many(item),
}));

// Item table
export const item = sqliteTable("item", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull().unique(),
    name: text("name").notNull(),
    categoryId: integer("category_id")
        .notNull()
        .references(() => category.id),
    price: integer("price").notNull(), // cents
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
});

export const itemRelations = relations(item, ({ one, many }) => ({
    category: one(category, {
        fields: [item.categoryId],
        references: [category.id],
    }),
    orderLineList: many(orderLine),
}));

// Order table
export const order = sqliteTable("order", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull().unique(),
    status: text("status").notNull().default("draft"), // draft, pending, confirmed, completed, cancelled
    total: integer("total").notNull().default(0), // cents
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
    deletedAt: integer("deleted_at"),
});

export const orderRelations = relations(order, ({ many }) => ({
    lineList: many(orderLine),
}));

// OrderLine table
export const orderLine = sqliteTable("order_line", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    orderId: integer("order_id")
        .notNull()
        .references(() => order.id),
    itemId: integer("item_id")
        .notNull()
        .references(() => item.id),
    quantity: integer("quantity").notNull(),
    unitPrice: integer("unit_price").notNull(), // cents (snapshot at order time)
    lineTotal: integer("line_total").notNull(), // cents
});

export const orderLineRelations = relations(orderLine, ({ one }) => ({
    order: one(order, {
        fields: [orderLine.orderId],
        references: [order.id],
    }),
    item: one(item, {
        fields: [orderLine.itemId],
        references: [item.id],
    }),
}));

// Types
export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;

export type Item = typeof item.$inferSelect;
export type NewItem = typeof item.$inferInsert;

export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;

export type OrderLine = typeof orderLine.$inferSelect;
export type NewOrderLine = typeof orderLine.$inferInsert;
