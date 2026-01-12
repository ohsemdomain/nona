export type OrderStatus =
	| "draft"
	| "pending"
	| "confirmed"
	| "completed"
	| "cancelled";

export interface OrderLineItem {
	id: number;
	publicId: string;
	name: string;
	price: number;
}

export interface OrderLine {
	id: number;
	orderId: number;
	itemId: number;
	quantity: number;
	unitPrice: number;
	lineTotal: number;
	item: OrderLineItem | null;
}

export interface Order {
	id: number;
	publicId: string;
	status: OrderStatus;
	total: number;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
	createdBy: string | null;
	updatedBy: string | null;
	createdByName: string | null;
	updatedByName: string | null;
	lineList?: OrderLine[];
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
	draft: "Draft",
	pending: "Pending",
	confirmed: "Confirmed",
	completed: "Completed",
	cancelled: "Cancelled",
};

export const ORDER_STATUS_COLOR: Record<OrderStatus, string> = {
	draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
	pending:
		"bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
	confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	completed:
		"bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export interface CreateOrderLineInput {
	itemId: number;
	quantity: number;
}

export interface CreateOrderInput {
	lineList: CreateOrderLineInput[];
}

export interface UpdateOrderInput {
	status?: OrderStatus;
	lineList?: CreateOrderLineInput[];
	updatedAt: number; // Required for optimistic locking
}
