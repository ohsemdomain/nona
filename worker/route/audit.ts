import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import { createDb, auditLog, user } from "../db";
import { parsePagination, listResponse, requirePermission } from "../lib";
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

export { app as auditRoute };
