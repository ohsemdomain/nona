export interface Category {
	id: number;
	publicId: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
	createdBy: string | null;
	updatedBy: string | null;
	createdByName: string | null;
	updatedByName: string | null;
}

export interface CreateCategoryInput {
	name: string;
}

export interface UpdateCategoryInput {
	name: string;
}
