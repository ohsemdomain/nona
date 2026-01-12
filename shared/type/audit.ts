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
 * Resource types that support audit logging
 */
export const AUDIT_RESOURCE = {
	CATEGORY: "category",
	ITEM: "item",
	ORDER: "order",
	USER: "user",
} as const;

export type AuditResource = (typeof AUDIT_RESOURCE)[keyof typeof AUDIT_RESOURCE];

/**
 * Single field change representation
 */
export interface AuditFieldChange {
	field: string;
	from: unknown;
	to: unknown;
}

/**
 * Actor information for audit entries
 */
export interface AuditActor {
	id: string;
	name: string;
}

/**
 * Single audit log entry as returned by the API
 */
export interface AuditLogEntry {
	id: number;
	action: AuditAction;
	resource: AuditResource;
	resourceId: string;
	actor: AuditActor;
	changes: AuditFieldChange[];
	metadata: Record<string, unknown>;
	createdAt: number;
}

/**
 * Paginated response for audit log list
 */
export interface AuditLogListResponse {
	data: AuditLogEntry[];
	total: number;
}
