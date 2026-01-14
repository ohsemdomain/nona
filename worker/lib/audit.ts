import { lt, sql, and, eq } from "drizzle-orm";
import type { Database } from "../db";
import { auditLog } from "../db";

/**
 * Audit log retention periods (in days)
 * Configurable per resource type for compliance requirements
 */
export const AUDIT_RETENTION_DAYS = {
	// Financial/order data - keep longer for compliance
	order: 2555, // ~7 years (financial record keeping)
	// Auth events - medium retention for security analysis
	auth: 365, // 1 year
	// General CRUD operations - standard retention
	default: 365, // 1 year
} as const;

/**
 * Audit action types
 */
export const AUDIT_ACTION = {
	CREATE: "CREATE",
	UPDATE: "UPDATE",
	DELETE: "DELETE",
	LOGIN: "LOGIN",
	LOGOUT: "LOGOUT",
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
	AUTH: "auth",
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

/**
 * Get retention cutoff date for a specific resource type
 */
function getRetentionCutoff(resource: string): number {
	const retentionDays =
		AUDIT_RETENTION_DAYS[resource as keyof typeof AUDIT_RETENTION_DAYS] ??
		AUDIT_RETENTION_DAYS.default;

	const cutoffDate = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
	return cutoffDate;
}

/**
 * Clean up audit logs older than retention period
 * Returns count of deleted records per resource type
 */
export async function cleanupAuditLog(
	db: Database,
): Promise<{ total: number; byResource: Record<string, number> }> {
	const result: { total: number; byResource: Record<string, number> } = {
		total: 0,
		byResource: {},
	};

	// Get distinct resource types
	const resourceList = Object.values(AUDIT_RESOURCE);

	for (const resource of resourceList) {
		const cutoff = getRetentionCutoff(resource);

		try {
			// Count records to be deleted first
			const countResult = await db
				.select({ count: sql<number>`count(*)` })
				.from(auditLog)
				.where(
					and(eq(auditLog.resource, resource), lt(auditLog.createdAt, cutoff)),
				);

			const toDeleteCount = countResult[0]?.count ?? 0;

			if (toDeleteCount > 0) {
				await db
					.delete(auditLog)
					.where(
						and(eq(auditLog.resource, resource), lt(auditLog.createdAt, cutoff)),
					);
			}

			result.byResource[resource] = toDeleteCount;
			result.total += toDeleteCount;
		} catch (error) {
			console.error(`Failed to cleanup audit logs for ${resource}:`, error);
			result.byResource[resource] = 0;
		}
	}

	return result;
}

/**
 * Get audit log statistics for monitoring
 */
export async function getAuditLogStats(
	db: Database,
): Promise<{
	totalCount: number;
	oldestRecord: number | null;
	byResource: Record<string, number>;
}> {
	const [totalResult, oldestResult, resourceCounts] = await Promise.all([
		db.select({ count: sql<number>`count(*)` }).from(auditLog),
		db
			.select({ oldest: sql<number>`min(created_at)` })
			.from(auditLog),
		db
			.select({
				resource: auditLog.resource,
				count: sql<number>`count(*)`,
			})
			.from(auditLog)
			.groupBy(auditLog.resource),
	]);

	return {
		totalCount: totalResult[0]?.count ?? 0,
		oldestRecord: oldestResult[0]?.oldest ?? null,
		byResource: Object.fromEntries(
			resourceCounts.map((r) => [r.resource, r.count]),
		),
	};
}

/**
 * Preview what would be deleted by cleanup (dry run)
 */
export async function previewAuditLogCleanup(
	db: Database,
): Promise<Record<string, { count: number; cutoffDate: Date }>> {
	const result: Record<string, { count: number; cutoffDate: Date }> = {};

	const resourceList = Object.values(AUDIT_RESOURCE);

	for (const resource of resourceList) {
		const cutoff = getRetentionCutoff(resource);

		const countResult = await db
			.select({ count: sql<number>`count(*)` })
			.from(auditLog)
			.where(
				and(eq(auditLog.resource, resource), lt(auditLog.createdAt, cutoff)),
			);

		result[resource] = {
			count: countResult[0]?.count ?? 0,
			cutoffDate: new Date(cutoff),
		};
	}

	return result;
}
