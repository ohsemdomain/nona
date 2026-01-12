import type { QueryClient } from "@tanstack/react-query";
import { queryKey } from "./queryKey";

type Entity = "category" | "item" | "order" | "user";

const relatedEntityMap: Record<Entity, Entity[]> = {
	category: ["item", "order"], // Transitive: category affects item AND order
	item: ["order"],
	order: [],
	user: [],
};

export function invalidateRelated(
	queryClient: QueryClient,
	entity: Entity,
): void {
	queryClient.invalidateQueries({ queryKey: queryKey[entity].all });

	for (const related of relatedEntityMap[entity]) {
		queryClient.invalidateQueries({ queryKey: queryKey[related].all });
	}

	// Invalidate audit logs (system-wide and entity-specific)
	queryClient.invalidateQueries({ queryKey: queryKey.audit.all });
}
