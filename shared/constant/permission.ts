// Permission constants - format: {resource}:{action}
export const PERMISSION = {
	// Category
	CATEGORY_CREATE: "category:create",
	CATEGORY_READ: "category:read",
	CATEGORY_UPDATE: "category:update",
	CATEGORY_DELETE: "category:delete",

	// Item
	ITEM_CREATE: "item:create",
	ITEM_READ: "item:read",
	ITEM_UPDATE: "item:update",
	ITEM_DELETE: "item:delete",

	// Order
	ORDER_CREATE: "order:create",
	ORDER_READ: "order:read",
	ORDER_UPDATE: "order:update",
	ORDER_DELETE: "order:delete",

	// User
	USER_CREATE: "user:create",
	USER_READ: "user:read",
	USER_UPDATE: "user:update",
	USER_DELETE: "user:delete",

	// Role (NEW)
	ROLE_CREATE: "role:create",
	ROLE_READ: "role:read",
	ROLE_UPDATE: "role:update",
	ROLE_DELETE: "role:delete",

	// System (NEW)
	SYSTEM_ADMIN: "system:admin",
} as const;

export type PermissionKey = keyof typeof PERMISSION;
export type PermissionValue = (typeof PERMISSION)[PermissionKey];

// All permissions as array (for seeding)
export const ALL_PERMISSIONS = Object.values(PERMISSION);

// Permission metadata for UI grouping
export const PERMISSION_GROUP: Record<string, { label: string; permission: PermissionValue[] }> = {
	category: {
		label: "Category",
		permission: [
			PERMISSION.CATEGORY_CREATE,
			PERMISSION.CATEGORY_READ,
			PERMISSION.CATEGORY_UPDATE,
			PERMISSION.CATEGORY_DELETE,
		],
	},
	item: {
		label: "Item",
		permission: [
			PERMISSION.ITEM_CREATE,
			PERMISSION.ITEM_READ,
			PERMISSION.ITEM_UPDATE,
			PERMISSION.ITEM_DELETE,
		],
	},
	order: {
		label: "Order",
		permission: [
			PERMISSION.ORDER_CREATE,
			PERMISSION.ORDER_READ,
			PERMISSION.ORDER_UPDATE,
			PERMISSION.ORDER_DELETE,
		],
	},
	user: {
		label: "User",
		permission: [
			PERMISSION.USER_CREATE,
			PERMISSION.USER_READ,
			PERMISSION.USER_UPDATE,
			PERMISSION.USER_DELETE,
		],
	},
	role: {
		label: "Role",
		permission: [
			PERMISSION.ROLE_CREATE,
			PERMISSION.ROLE_READ,
			PERMISSION.ROLE_UPDATE,
			PERMISSION.ROLE_DELETE,
		],
	},
	system: {
		label: "System",
		permission: [PERMISSION.SYSTEM_ADMIN],
	},
};

// Helper to parse permission string
export function parsePermission(permissionName: string): { resource: string; action: string } {
	const [resource, action] = permissionName.split(":");
	return { resource, action };
}
