import { z } from "zod";

export const createRoleSchema = z.object({
	name: z.string().min(1, "Name is required").max(50, "Name too long"),
	description: z.string().max(200, "Description too long").optional(),
});

export const updateRoleSchema = z.object({
	name: z.string().min(1, "Name is required").max(50, "Name too long").optional(),
	description: z.string().max(200, "Description too long").optional(),
});

export const updateRolePermissionSchema = z.object({
	permissionList: z.array(z.string()),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionInput = z.infer<typeof updateRolePermissionSchema>;
