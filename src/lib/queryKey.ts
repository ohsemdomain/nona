export const queryKey = {
    category: {
        all: ["category"] as const,
        list: (params?: Record<string, unknown>) =>
            ["category", "list", params] as const,
        detail: (id: string) => ["category", "detail", id] as const,
    },
    item: {
        all: ["item"] as const,
        list: (params?: Record<string, unknown>) =>
            ["item", "list", params] as const,
        detail: (id: string) => ["item", "detail", id] as const,
    },
    order: {
        all: ["order"] as const,
        list: (params?: Record<string, unknown>) =>
            ["order", "list", params] as const,
        detail: (id: string) => ["order", "detail", id] as const,
    },
};
