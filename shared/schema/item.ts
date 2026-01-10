import { z } from "zod";

export const itemSchema = z.object({
	id: z.number(),
	publicId: z.string(),
	name: z.string().min(1, "Name is required"),
	categoryId: z.number(),
	price: z.number().min(0, "Price must be positive"),
	createdAt: z.number(),
	updatedAt: z.number(),
	deletedAt: z.number().nullable(),
});

export const createItemSchema = z.object({
	name: z.string().min(1, "Name is required"),
	categoryId: z.number().positive("Category is required"),
	price: z.number().min(0, "Price must be positive"),
});

export const updateItemSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	categoryId: z.number().positive("Category is required").optional(),
	price: z.number().min(0, "Price must be positive").optional(),
	updatedAt: z.number().int(), // Required for optimistic locking
});

export type ItemSchema = z.infer<typeof itemSchema>;
export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
