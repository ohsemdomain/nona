import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";
import { user } from "./auth-schema";

// ============================================
// RBAC Tables
// ============================================

// Role table
export const role = sqliteTable("role", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(),
	description: text("description"),
	createdAt: integer("created_at").notNull(),
});

// Permission table
export const permission = sqliteTable("permission", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull().unique(), // format: resource:action
	resource: text("resource").notNull(), // e.g., "item", "order", "role"
	action: text("action").notNull(), // e.g., "create", "read", "update", "delete"
	description: text("description"),
});

// Role-Permission mapping (many-to-many)
export const rolePermission = sqliteTable(
	"role_permission",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		roleId: integer("role_id")
			.notNull()
			.references(() => role.id),
		permissionId: integer("permission_id")
			.notNull()
			.references(() => permission.id),
	},
	(table) => [
		index("role_permission_role_id_idx").on(table.roleId),
		index("role_permission_permission_id_idx").on(table.permissionId),
	],
);

export const roleRelation = relations(role, ({ many }) => ({
	rolePermissionList: many(rolePermission),
}));

export const permissionRelation = relations(permission, ({ many }) => ({
	rolePermissionList: many(rolePermission),
}));

export const rolePermissionRelation = relations(rolePermission, ({ one }) => ({
	role: one(role, {
		fields: [rolePermission.roleId],
		references: [role.id],
	}),
	permission: one(permission, {
		fields: [rolePermission.permissionId],
		references: [permission.id],
	}),
}));

// RBAC Types
export type Role = typeof role.$inferSelect;
export type NewRole = typeof role.$inferInsert;

export type Permission = typeof permission.$inferSelect;
export type NewPermission = typeof permission.$inferInsert;

export type RolePermission = typeof rolePermission.$inferSelect;
export type NewRolePermission = typeof rolePermission.$inferInsert;

// ============================================
// Application Tables
// ============================================

// Category table
export const category = sqliteTable(
	"category",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		publicId: text("public_id").notNull().unique(),
		name: text("name").notNull(),
		createdAt: integer("created_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
		deletedAt: integer("deleted_at"),
		createdBy: text("created_by").references(() => user.id),
		updatedBy: text("updated_by").references(() => user.id),
	},
	(table) => [
		index("category_created_by_idx").on(table.createdBy),
		index("category_updated_by_idx").on(table.updatedBy),
	],
);

export const categoryRelation = relations(category, ({ many }) => ({
	itemList: many(item),
}));

// Item table
export const item = sqliteTable(
	"item",
	{
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
		createdBy: text("created_by").references(() => user.id),
		updatedBy: text("updated_by").references(() => user.id),
	},
	(table) => [
		index("item_category_id_idx").on(table.categoryId),
		index("item_created_by_idx").on(table.createdBy),
		index("item_updated_by_idx").on(table.updatedBy),
	],
);

export const itemRelation = relations(item, ({ one, many }) => ({
	category: one(category, {
		fields: [item.categoryId],
		references: [category.id],
	}),
	orderLineList: many(orderLine),
}));

// Order table
export const order = sqliteTable(
	"order",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		publicId: text("public_id").notNull().unique(),
		orderNumber: text("order_number").unique(), // Human-readable formatted order number
		status: text("status").notNull().default("draft"), // draft, pending, confirmed, completed, cancelled
		total: integer("total").notNull().default(0), // cents
		createdAt: integer("created_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
		deletedAt: integer("deleted_at"),
		createdBy: text("created_by").references(() => user.id),
		updatedBy: text("updated_by").references(() => user.id),
	},
	(table) => [
		index("order_status_idx").on(table.status),
		index("order_created_by_idx").on(table.createdBy),
		index("order_updated_by_idx").on(table.updatedBy),
	],
);

export const orderRelation = relations(order, ({ many }) => ({
	lineList: many(orderLine),
}));

// OrderLine table
export const orderLine = sqliteTable(
	"order_line",
	{
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
		deletedAt: integer("deleted_at"), // Soft delete with parent order
	},
	(table) => [
		index("order_line_order_id_idx").on(table.orderId),
		index("order_line_item_id_idx").on(table.itemId),
	],
);

export const orderLineRelation = relations(orderLine, ({ one }) => ({
	order: one(order, {
		fields: [orderLine.orderId],
		references: [order.id],
	}),
	item: one(item, {
		fields: [orderLine.itemId],
		references: [item.id],
	}),
}));

// ============================================
// Public Link Tables
// ============================================

// PublicLink table - centralized shareable links for any resource
export const publicLink = sqliteTable(
	"public_link",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		linkId: text("link_id").notNull().unique(), // 9-char nanoid
		resourceType: text("resource_type").notNull(), // "order", "item", etc.
		resourceId: text("resource_id").notNull(), // publicId of the linked resource
		expiresAt: integer("expires_at").notNull(),
		createdAt: integer("created_at").notNull(),
		createdBy: text("created_by").references(() => user.id),
	},
	(table) => [
		index("public_link_link_id_idx").on(table.linkId),
		index("public_link_resource_idx").on(table.resourceType, table.resourceId),
	],
);

// AppSetting table - global application settings
export const appSetting = sqliteTable("app_setting", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	key: text("key").notNull().unique(), // e.g., "public_link_expiry_day:order"
	value: text("value").notNull(), // JSON or simple value
	updatedAt: integer("updated_at").notNull(),
	updatedBy: text("updated_by").references(() => user.id),
});

// Types
export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;

export type Item = typeof item.$inferSelect;
export type NewItem = typeof item.$inferInsert;

export type Order = typeof order.$inferSelect;
export type NewOrder = typeof order.$inferInsert;

export type OrderLine = typeof orderLine.$inferSelect;
export type NewOrderLine = typeof orderLine.$inferInsert;

export type PublicLink = typeof publicLink.$inferSelect;
export type NewPublicLink = typeof publicLink.$inferInsert;

export type AppSetting = typeof appSetting.$inferSelect;
export type NewAppSetting = typeof appSetting.$inferInsert;
