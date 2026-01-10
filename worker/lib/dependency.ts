import { eq, and, isNull, count } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import * as schema from "@/worker/db/schema";

type Db = DrizzleD1Database<typeof schema>;

interface DependencyResult {
	hasDependencies: boolean;
	message?: string;
}

/**
 * Check if a category has dependent items (non-deleted)
 */
async function checkCategoryDependencies(
	db: Db,
	categoryId: number,
): Promise<DependencyResult> {
	const [result] = await db
		.select({ count: count() })
		.from(schema.item)
		.where(
			and(
				eq(schema.item.categoryId, categoryId),
				isNull(schema.item.deletedAt),
			),
		);

	if (result.count > 0) {
		const label = result.count === 1 ? "item" : "items";
		return {
			hasDependencies: true,
			message: `Cannot delete: ${result.count} ${label} still reference this category`,
		};
	}

	return { hasDependencies: false };
}

/**
 * Check if an item has dependent order lines (in non-deleted orders)
 */
async function checkItemDependencies(
	db: Db,
	itemId: number,
): Promise<DependencyResult> {
	// OrderLine doesn't have deletedAt - check via parent order
	const [result] = await db
		.select({ count: count() })
		.from(schema.orderLine)
		.innerJoin(schema.order, eq(schema.orderLine.orderId, schema.order.id))
		.where(
			and(eq(schema.orderLine.itemId, itemId), isNull(schema.order.deletedAt)),
		);

	if (result.count > 0) {
		const label = result.count === 1 ? "order" : "orders";
		return {
			hasDependencies: true,
			message: `Cannot delete: ${result.count} ${label} still reference this item`,
		};
	}

	return { hasDependencies: false };
}

type Entity = "category" | "item";

const checkFnMap: Record<
	Entity,
	(db: Db, id: number) => Promise<DependencyResult>
> = {
	category: checkCategoryDependencies,
	item: checkItemDependencies,
};

/**
 * Check if an entity has dependencies that would prevent deletion
 */
export async function checkDependencies(
	db: Db,
	entity: string,
	id: number,
): Promise<DependencyResult> {
	const checkFn = checkFnMap[entity as Entity];

	if (!checkFn) {
		console.warn(
			`[checkDependencies] No dependency check for entity: ${entity}`,
		);
		return { hasDependencies: false };
	}

	return checkFn(db, id);
}
