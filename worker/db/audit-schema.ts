import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/**
 * Audit log table for tracking user management actions
 */
export const auditLog = sqliteTable(
	"audit_log",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		actorId: text("actor_id").notNull(), // User ID of who performed the action
		action: text("action").notNull(), // CREATE, UPDATE, DELETE
		resource: text("resource").notNull(), // e.g., "user", "role"
		resourceId: text("resource_id").notNull(), // ID of the affected resource
		changes: text("changes"), // JSON string of changes (optional)
		metadata: text("metadata"), // Additional context (optional JSON)
		createdAt: integer("created_at").notNull(),
	},
	(table) => [
		index("audit_log_actor_id_idx").on(table.actorId),
		index("audit_log_resource_idx").on(table.resource),
		index("audit_log_created_at_idx").on(table.createdAt),
	],
);

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
