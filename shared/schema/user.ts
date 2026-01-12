import { z } from "zod";

export const userSchema = z.object({
	id: z.string(),
	publicId: z.string(),
	name: z.string(),
	email: z.string().email(),
	emailVerified: z.boolean(),
	image: z.string().nullable(),
	roleId: z.number().nullable(),
	roleName: z.string().nullable(),
	createdAt: z.number(),
	updatedAt: z.number(),
	deletedAt: z.number().nullable(),
});

export const createUserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email address"),
	password: z.string().min(6, "Password must be at least 6 characters"),
	roleId: z.number().int().positive().optional(),
});

export const updateUserSchema = z.object({
	name: z.string().min(1, "Name is required").optional(),
	roleId: z.number().int().positive().nullable().optional(),
	password: z
		.string()
		.min(6, "Password must be at least 6 characters")
		.optional(),
	updatedAt: z.number().int(), // Required for optimistic locking
});

export type UserSchema = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
