import { z } from "zod";

export const categorySchema = z.object({
    id: z.number(),
    publicId: z.string(),
    name: z.string().min(1, "Name is required"),
    createdAt: z.number(),
    updatedAt: z.number(),
    deletedAt: z.number().nullable(),
});

export const createCategorySchema = z.object({
    name: z.string().min(1, "Name is required"),
});

export const updateCategorySchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
});

export type CategorySchema = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
