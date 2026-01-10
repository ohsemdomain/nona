export interface Category {
	id: number;
	publicId: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

export interface CreateCategoryInput {
	name: string;
}

export interface UpdateCategoryInput {
	name: string;
}
