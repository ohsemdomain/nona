export const queryKey = {
	audit: {
		all: ["audit"] as const,
		resource: (resource: string, resourceId: string, param?: Record<string, unknown>) =>
			["audit", resource, resourceId, param] as const,
		system: (param?: Record<string, unknown>) =>
			["audit", "system", param] as const,
	},
	category: {
		all: ["category"] as const,
		list: (param?: Record<string, unknown>) =>
			["category", "list", param] as const,
		detail: (id: string) => ["category", "detail", id] as const,
	},
	item: {
		all: ["item"] as const,
		list: (param?: Record<string, unknown>) => ["item", "list", param] as const,
		detail: (id: string) => ["item", "detail", id] as const,
	},
	order: {
		all: ["order"] as const,
		list: (param?: Record<string, unknown>) =>
			["order", "list", param] as const,
		detail: (id: string) => ["order", "detail", id] as const,
	},
	role: {
		all: ["role"] as const,
		list: (param?: Record<string, unknown>) =>
			["role", "list", param] as const,
		detail: (id: number) => ["role", "detail", id] as const,
	},
	user: {
		all: ["user"] as const,
		list: (param?: Record<string, unknown>) => ["user", "list", param] as const,
		detail: (id: string) => ["user", "detail", id] as const,
	},
};
