export const queryKey = {
    category: {
        all: ["category"] as const,
        list: (param?: Record<string, unknown>) =>
            ["category", "list", param] as const,
        detail: (id: string) => ["category", "detail", id] as const,
    },
    item: {
        all: ["item"] as const,
        list: (param?: Record<string, unknown>) =>
            ["item", "list", param] as const,
        detail: (id: string) => ["item", "detail", id] as const,
    },
    order: {
        all: ["order"] as const,
        list: (param?: Record<string, unknown>) =>
            ["order", "list", param] as const,
        detail: (id: string) => ["order", "detail", id] as const,
    },
};
