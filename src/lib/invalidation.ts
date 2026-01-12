import type { QueryClient } from "@tanstack/react-query";
import { queryKey } from "./queryKey";
import type { Entity } from "@/shared/type";

/**
 * Entity Dependency Map - Defines transitive cache invalidation relationships.
 *
 * When an entity is modified, related entities that depend on it must also
 * be invalidated to prevent stale data. This follows the data model hierarchy:
 *
 * ```
 * category ──► item ──► order
 *    │          │         │
 *    │          └─────────┤
 *    └───────────────────►│
 *
 * user (independent - no cascading dependencies)
 * ```
 *
 * Examples:
 * - Category renamed → Items showing category name become stale
 * - Category deleted → Items in that category need refresh
 * - Item price changed → Orders containing that item need refresh
 * - User changed → No cascade (user data embedded at order creation time)
 *
 * This map is intentionally kept simple. More complex dependency graphs
 * should be handled at the API level with proper data denormalization.
 */
const relatedEntityMap: Record<Entity, Entity[]> = {
	category: ["item", "order"], // Category affects items (via categoryId) and orders (via item references)
	item: ["order"], // Item affects orders (via order lines)
	order: [], // Orders are leaf nodes - no dependents
	user: [], // Users are independent - name changes don't cascade
};

/**
 * Invalidate cache for an entity and all its dependents.
 *
 * This function implements a "write-through" invalidation strategy:
 * 1. Invalidate the modified entity's cache
 * 2. Invalidate all dependent entity caches (transitive)
 * 3. Invalidate audit logs (all entity changes are logged)
 *
 * Called after successful create/update/delete mutations in useResource.
 *
 * @param queryClient - TanStack Query client instance
 * @param entity - The entity type that was modified
 *
 * @example
 * // After updating a category
 * invalidateRelated(queryClient, "category");
 * // Invalidates: ["category"], ["item"], ["order"], ["audit"]
 *
 * @example
 * // After updating an item
 * invalidateRelated(queryClient, "item");
 * // Invalidates: ["item"], ["order"], ["audit"]
 */
export function invalidateRelated(
	queryClient: QueryClient,
	entity: Entity,
): void {
	// 1. Invalidate the modified entity
	queryClient.invalidateQueries({ queryKey: queryKey[entity].all });

	// 2. Invalidate dependent entities (transitive cascade)
	for (const related of relatedEntityMap[entity]) {
		queryClient.invalidateQueries({ queryKey: queryKey[related].all });
	}

	// 3. Invalidate audit logs - all entity changes create audit entries
	// This ensures system log and entity history panels stay fresh
	queryClient.invalidateQueries({ queryKey: queryKey.audit.all });
}
