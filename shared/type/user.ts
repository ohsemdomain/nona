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
	roleId?: number;
}

export interface UpdateUserInput {
	name?: string;
	roleId?: number | null;
	password?: string;
	updatedAt: number;
}
