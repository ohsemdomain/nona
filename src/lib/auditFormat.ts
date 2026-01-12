import { formatMoney } from "./format";
import { formatDateTime } from "./date";
import type { AuditResource } from "@/shared/type";
import { ORDER_STATUS_LABEL } from "@/shared/type";

/**
 * Field type definitions for formatting
 */
type FieldType = "string" | "number" | "price" | "date" | "datetime" | "boolean" | "status";

interface FieldConfig {
	label: string;
	type: FieldType;
}

/**
 * Field configuration per resource type
 */
const FIELD_CONFIG: Record<AuditResource, Record<string, FieldConfig>> = {
	category: {
		name: { label: "Name", type: "string" },
	},
	item: {
		name: { label: "Name", type: "string" },
		price: { label: "Price", type: "price" },
		categoryId: { label: "Category", type: "number" },
	},
	order: {
		status: { label: "Status", type: "status" },
		total: { label: "Total", type: "price" },
	},
	user: {
		name: { label: "Name", type: "string" },
		roleId: { label: "Role", type: "number" },
		email: { label: "Email", type: "string" },
	},
	auth: {},
};

/**
 * Get human-readable label for a field
 */
export function getFieldLabel(resource: AuditResource, field: string): string {
	const config = FIELD_CONFIG[resource]?.[field];
	if (config) return config.label;

	// Fallback: convert camelCase to Title Case
	return field
		.replace(/([A-Z])/g, " $1")
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
}

/**
 * Format a field value for display based on its type
 */
export function formatFieldValue(
	resource: AuditResource,
	field: string,
	value: unknown,
): string {
	// Handle null/undefined
	if (value === null || value === undefined) {
		return "(empty)";
	}

	const config = FIELD_CONFIG[resource]?.[field];
	const type = config?.type ?? "string";

	switch (type) {
		case "price":
			return typeof value === "number" ? formatMoney(value) : String(value);

		case "date":
		case "datetime":
			return typeof value === "number" ? formatDateTime(value) : String(value);

		case "boolean":
			return value ? "Yes" : "No";

		case "status":
			// Order status formatting
			if (typeof value === "string" && value in ORDER_STATUS_LABEL) {
				return ORDER_STATUS_LABEL[value as keyof typeof ORDER_STATUS_LABEL];
			}
			return String(value);

		case "number":
			return String(value);

		case "string":
		default:
			return String(value);
	}
}

/**
 * Resource labels for human-readable display
 */
export const RESOURCE_LABEL: Record<AuditResource, string> = {
	category: "Category",
	item: "Item",
	order: "Order",
	user: "User",
	auth: "User",
};
