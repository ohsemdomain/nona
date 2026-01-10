export interface ItemCategory {
    id: number;
    publicId: string;
    name: string;
}

export interface Item {
    id: number;
    publicId: string;
    name: string;
    categoryId: number;
    price: number;
    createdAt: number;
    updatedAt: number;
    deletedAt: number | null;
    category: ItemCategory | null;
}

export interface CreateItemInput {
    name: string;
    categoryId: number;
    price: number;
}

export interface UpdateItemInput {
    name: string;
    categoryId: number;
    price: number;
}
