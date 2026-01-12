import type { Database } from "../db";
import { auditLog } from "../db";

/**
 * Audit action types
 */
export const AUDIT_ACTION = {
	CREATE: "CREATE",
	UPDATE: "UPDATE",
	DELETE: "DELETE",
} as const;

export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];

/**
 * Resource types for audit logging
 */
export const AUDIT_RESOURCE = {
	USER: "user",
	ROLE: "role",
	CATEGORY: "category",
	ITEM: "item",
	ORDER: "order",
} as const;

export type AuditResource = (typeof AUDIT_RESOURCE)[keyof typeof AUDIT_RESOURCE];

/**
 * Changes tracking for audit updates
 */
export interface AuditChanges {
	[field: string]: {
		from: unknown;
		to: unknown;
	};
}

/**
 * Audit entry input
 */
export interface AuditEntryInput {
	actorId: string;
	action: AuditAction;
	resource: AuditResource;
	resourceId: string;
	changes?: AuditChanges;
	metadata?: Record<string, unknown>;
}

/**
 * Log an audit entry to the database
 * This function is designed to not throw - audit logging should not break the main operation
 */
export async function logAudit(
	db: Database,
	entry: AuditEntryInput,
): Promise<void> {
	try {
		await db.insert(auditLog).values({
			actorId: entry.actorId,
			action: entry.action,
			resource: entry.resource,
			resourceId: entry.resourceId,
			changes: entry.changes ? JSON.stringify(entry.changes) : null,
			metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
			createdAt: Date.now(),
		});
	} catch (error) {
		// Log error but don't throw - audit failures shouldn't break the main operation
		console.error("Failed to log audit entry:", error);
	}
}

/**
 * Helper to create audit changes object by comparing old and new values
 */
export function createAuditChanges(
	oldData: Record<string, unknown>,
	newData: Record<string, unknown>,
	fieldsToTrack: string[],
): AuditChanges | undefined {
	const changes: AuditChanges = {};

	for (const field of fieldsToTrack) {
		const oldValue = oldData[field];
		const newValue = newData[field];

		if (oldValue !== newValue) {
			changes[field] = { from: oldValue, to: newValue };
		}
	}

	return Object.keys(changes).length > 0 ? changes : undefined;
}
