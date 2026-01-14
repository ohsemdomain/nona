import { Hono } from "hono";
import { eq, and, desc, sql, like, gte, lte } from "drizzle-orm";
import { createDb, auditLog, user } from "../db";
import {
	parsePagination,
	listResponse,
	requirePermission,
	cleanupAuditLog,
	getAuditLogStats,
	previewAuditLogCleanup,
	AUDIT_RETENTION_DAYS,
} from "../lib";
import { PERMISSION } from "../../shared/constant/permission";
import type {
	AuditLogEntry,
	AuditFieldChange,
	AuditAction,
	AuditResource,
} from "../../shared/type/audit";

const app = new Hono<{ Bindings: Env }>();

/**
 * Permission mapping for each resource type
 */
const RESOURCE_PERMISSION_MAP: Record<string, string> = {
	category: PERMISSION.CATEGORY_READ,
	item: PERMISSION.ITEM_READ,
	order: PERMISSION.ORDER_READ,
	user: PERMISSION.USER_READ,
};

/**
 * Parse JSON changes string into AuditFieldChange array
 */
function parseChanges(changesJson: string | null): AuditFieldChange[] {
	if (!changesJson) return [];

	try {
		const parsed = JSON.parse(changesJson);
		return Object.entries(parsed).map(([field, change]) => ({
			field,
			from: (change as { from: unknown; to: unknown }).from,
			to: (change as { from: unknown; to: unknown }).to,
		}));
	} catch {
		return [];
	}
}

/**
 * GET /api/audit/system
 *
 * Fetches system-wide audit logs with filtering.
 * Admin-only (requires USER_READ permission).
 * Query params: resource, action, actorName, dateFrom, dateTo, page, pageSize
 */
app.get("/system", requirePermission(PERMISSION.USER_READ), async (c) => {
	const db = createDb(c.env.DB);
	const query = c.req.query();
	const { offset, limit } = parsePagination(query);

	// Build dynamic filter conditions
	const filterList: ReturnType<typeof eq>[] = [];

	if (query.resource) {
		filterList.push(eq(auditLog.resource, query.resource));
	}

	if (query.action) {
		filterList.push(eq(auditLog.action, query.action));
	}

	if (query.dateFrom) {
		filterList.push(gte(auditLog.createdAt, Number(query.dateFrom)));
	}

	if (query.dateTo) {
		filterList.push(lte(auditLog.createdAt, Number(query.dateTo)));
	}

	if (query.actorName) {
		filterList.push(like(user.name, `%${query.actorName}%`));
	}

	const whereClause = filterList.length > 0 ? and(...filterList) : undefined;

	const [data, countResult] = await Promise.all([
		db
			.select({
				id: auditLog.id,
				actorId: auditLog.actorId,
				action: auditLog.action,
				resource: auditLog.resource,
				resourceId: auditLog.resourceId,
				changes: auditLog.changes,
				metadata: auditLog.metadata,
				createdAt: auditLog.createdAt,
				actorName: user.name,
			})
			.from(auditLog)
			.leftJoin(user, eq(auditLog.actorId, user.id))
			.where(whereClause)
			.orderBy(desc(auditLog.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(auditLog)
			.leftJoin(user, eq(auditLog.actorId, user.id))
			.where(whereClause),
	]);

	// Transform to frontend format
	const entries: AuditLogEntry[] = data.map((row) => ({
		id: row.id,
		action: row.action as AuditAction,
		resource: row.resource as AuditResource,
		resourceId: row.resourceId,
		actor: {
			id: row.actorId,
			name: row.actorName ?? "Unknown User",
		},
		changes: parseChanges(row.changes),
		metadata: row.metadata ? JSON.parse(row.metadata) : {},
		createdAt: row.createdAt,
	}));

	return listResponse(c, entries, countResult[0]?.count ?? 0);
});

/**
 * GET /api/audit/:resource/:resourceId
 *
 * Fetches audit logs for a specific resource instance.
 * Permission check is done dynamically based on resource type.
 */
app.get("/:resource/:resourceId", async (c) => {
	const db = createDb(c.env.DB);
	const resource = c.req.param("resource");
	const resourceId = c.req.param("resourceId");
	const query = c.req.query();
	const { offset, limit } = parsePagination(query);

	// Validate resource type and get required permission
	const requiredPermission = RESOURCE_PERMISSION_MAP[resource];
	if (!requiredPermission) {
		return c.json({ error: "Invalid resource type" }, 400);
	}

	// Check permission using middleware helper
	const permissionCheck = requirePermission(requiredPermission);
	const checkResult = await new Promise<Response | null>((resolve) => {
		permissionCheck(c, async () => {
			resolve(null);
		}).catch((err) => {
			if (err instanceof Response) {
				resolve(err);
			}
		});
	});

	if (checkResult) {
		return checkResult;
	}

	const whereClause = and(
		eq(auditLog.resource, resource),
		eq(auditLog.resourceId, resourceId),
	);

	const [data, countResult] = await Promise.all([
		db
			.select({
				id: auditLog.id,
				actorId: auditLog.actorId,
				action: auditLog.action,
				resource: auditLog.resource,
				resourceId: auditLog.resourceId,
				changes: auditLog.changes,
				metadata: auditLog.metadata,
				createdAt: auditLog.createdAt,
				actorName: user.name,
			})
			.from(auditLog)
			.leftJoin(user, eq(auditLog.actorId, user.id))
			.where(whereClause)
			.orderBy(desc(auditLog.createdAt))
			.limit(limit)
			.offset(offset),
		db
			.select({ count: sql<number>`count(*)` })
			.from(auditLog)
			.where(whereClause),
	]);

	// Transform to frontend format
	const entries: AuditLogEntry[] = data.map((row) => ({
		id: row.id,
		action: row.action as AuditAction,
		resource: row.resource as AuditResource,
		resourceId: row.resourceId,
		actor: {
			id: row.actorId,
			name: row.actorName ?? "Unknown User",
		},
		changes: parseChanges(row.changes),
		metadata: row.metadata ? JSON.parse(row.metadata) : {},
		createdAt: row.createdAt,
	}));

	return listResponse(c, entries, countResult[0]?.count ?? 0);
});

/**
 * GET /api/audit/admin/stats
 *
 * Get audit log statistics for monitoring.
 * Admin-only (requires USER_READ permission).
 */
app.get("/admin/stats", requirePermission(PERMISSION.USER_READ), async (c) => {
	const db = createDb(c.env.DB);

	const stats = await getAuditLogStats(db);

	return c.json({
		...stats,
		retentionPolicy: AUDIT_RETENTION_DAYS,
		oldestRecordDate: stats.oldestRecord
			? new Date(stats.oldestRecord).toISOString()
			: null,
	});
});

/**
 * GET /api/audit/admin/cleanup-preview
 *
 * Preview what records would be deleted by cleanup (dry run).
 * Admin-only (requires USER_READ permission).
 */
app.get(
	"/admin/cleanup-preview",
	requirePermission(PERMISSION.USER_READ),
	async (c) => {
		const db = createDb(c.env.DB);

		const preview = await previewAuditLogCleanup(db);

		// Calculate total
		const totalToDelete = Object.values(preview).reduce(
			(sum, r) => sum + r.count,
			0,
		);

		return c.json({
			totalToDelete,
			byResource: Object.fromEntries(
				Object.entries(preview).map(([resource, data]) => [
					resource,
					{
						count: data.count,
						cutoffDate: data.cutoffDate.toISOString(),
						retentionDays:
							AUDIT_RETENTION_DAYS[
								resource as keyof typeof AUDIT_RETENTION_DAYS
							] ?? AUDIT_RETENTION_DAYS.default,
					},
				]),
			),
		});
	},
);

/**
 * POST /api/audit/admin/cleanup
 *
 * Execute audit log cleanup based on retention policy.
 * Admin-only (requires USER_READ permission).
 * This is an administrative action that permanently deletes old records.
 */
app.post(
	"/admin/cleanup",
	requirePermission(PERMISSION.USER_READ),
	async (c) => {
		const db = createDb(c.env.DB);

		const result = await cleanupAuditLog(db);

		return c.json({
			success: true,
			deletedCount: result.total,
			byResource: result.byResource,
			timestamp: new Date().toISOString(),
		});
	},
);

export { app as auditRoute };
