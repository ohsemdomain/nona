import type { QueryClient } from "@tanstack/react-query";
import { queryKey } from "./queryKey";

type Entity = "category" | "item" | "order";

const relatedEntityMap: Record<Entity, Entity[]> = {
	category: ["item"],
	item: ["order"],
	order: [],
};

export function invalidateRelated(
	queryClient: QueryClient,
	entity: Entity,
): void {
	queryClient.invalidateQueries({ queryKey: queryKey[entity].all });

	for (const related of relatedEntityMap[entity]) {
		queryClient.invalidateQueries({ queryKey: queryKey[related].all });
	}
}
