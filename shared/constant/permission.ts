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

	// User (admin only)
	USER_CREATE: "user:create",
	USER_READ: "user:read",
	USER_UPDATE: "user:update",
	USER_DELETE: "user:delete",
} as const;

export type PermissionKey = keyof typeof PERMISSION;
export type PermissionValue = (typeof PERMISSION)[PermissionKey];

// All permissions as array (for seeding)
export const ALL_PERMISSIONS = Object.values(PERMISSION);

// Role constants
export const ROLE = {
	ADMIN: "admin",
	USER: "user",
	VIEWER: "viewer",
} as const;

export type RoleKey = keyof typeof ROLE;
export type RoleValue = (typeof ROLE)[RoleKey];

// Role permission mappings (for seeding)
export const ROLE_PERMISSIONS: Record<RoleValue, PermissionValue[]> = {
	[ROLE.ADMIN]: ALL_PERMISSIONS,
	[ROLE.USER]: [
		PERMISSION.CATEGORY_CREATE,
		PERMISSION.CATEGORY_READ,
		PERMISSION.CATEGORY_UPDATE,
		PERMISSION.CATEGORY_DELETE,
		PERMISSION.ITEM_CREATE,
		PERMISSION.ITEM_READ,
		PERMISSION.ITEM_UPDATE,
		PERMISSION.ITEM_DELETE,
		PERMISSION.ORDER_CREATE,
		PERMISSION.ORDER_READ,
		PERMISSION.ORDER_UPDATE,
		PERMISSION.ORDER_DELETE,
	],
	[ROLE.VIEWER]: [
		PERMISSION.CATEGORY_READ,
		PERMISSION.ITEM_READ,
		PERMISSION.ORDER_READ,
	],
};
