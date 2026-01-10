import { z } from "zod";

export const orderStatus = z.enum([
	"draft",
	"pending",
	"confirmed",
	"completed",
	"cancelled",
]);

export const orderLineSchema = z.object({
	id: z.number(),
	orderId: z.number(),
	itemId: z.number(),
	quantity: z.number().positive("Quantity must be positive"),
	unitPrice: z.number().min(0),
	lineTotal: z.number().min(0),
});

export const orderSchema = z.object({
	id: z.number(),
	publicId: z.string(),
	status: orderStatus,
	total: z.number().min(0),
	createdAt: z.number(),
	updatedAt: z.number(),
	deletedAt: z.number().nullable(),
});

export const createOrderLineSchema = z.object({
	itemId: z.number().positive("Item is required"),
	quantity: z.number().positive("Quantity must be positive"),
});

export const createOrderSchema = z.object({
	lineList: z.array(createOrderLineSchema).min(1, "At least one item required"),
});

export const updateOrderLineSchema = z.object({
	id: z.number().optional(), // existing line
	itemId: z.number().positive("Item is required"),
	quantity: z.number().positive("Quantity must be positive"),
});

export const updateOrderSchema = z.object({
	status: orderStatus.optional(),
	lineList: z.array(updateOrderLineSchema).optional(),
});

export type OrderStatus = z.infer<typeof orderStatus>;
export type OrderLineSchema = z.infer<typeof orderLineSchema>;
export type OrderSchema = z.infer<typeof orderSchema>;
export type CreateOrderLineInput = z.infer<typeof createOrderLineSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderLineInput = z.infer<typeof updateOrderLineSchema>;
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;
