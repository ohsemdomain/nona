export interface Role {
	id: number;
	name: string;
	description: string | null;
	createdAt: number;
	userCount?: number;
}

export interface RoleWithPermission extends Role {
	permissionList: string[];
}

export interface CreateRoleInput {
	name: string;
	description?: string;
}

export interface UpdateRoleInput {
	name?: string;
	description?: string;
}

export interface Permission {
	id: number;
	name: string;
	resource: string;
	action: string;
	description: string | null;
}

export interface PermissionGroup {
	resource: string;
	label: string;
	permissionList: Permission[];
}
