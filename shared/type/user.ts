import type { RoleValue } from "../constant/permission";

export interface User {
	id: string;
	publicId: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	roleId: number | null;
	roleName: string | null;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

export interface CreateUserInput {
	name: string;
	email: string;
	password: string;
	role: RoleValue;
}

export interface UpdateUserInput {
	name?: string;
	role?: RoleValue;
	password?: string;
	updatedAt: number;
}
