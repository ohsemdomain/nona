import { eq, and, isNull, count } from "drizzle-orm";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "@/worker/db/schema";

// Both DrizzleD1Database and SQLiteTransaction extend BaseSQLiteDatabase
// biome-ignore lint/suspicious/noExplicitAny: Both db and transaction use this same base interface
type DbOrTransaction = BaseSQLiteDatabase<"async", any, typeof schema>;

interface DependencyResult {
	hasDependencies: boolean;
	message?: string;
}

/**
 * Check if a category has dependent item (non-deleted)
 */
async function checkCategoryDependencies(
	db: DbOrTransaction,
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
		return {
			hasDependencies: true,
			message: `Cannot delete: ${result.count} item still reference this category`,
		};
	}

	return { hasDependencies: false };
}

/**
 * Check if an item has dependent order line (in non-deleted order)
 */
async function checkItemDependencies(
	db: DbOrTransaction,
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
		return {
			hasDependencies: true,
			message: `Cannot delete: ${result.count} order still reference this item`,
		};
	}

	return { hasDependencies: false };
}

type Entity = "category" | "item";

const checkFnMap: Record<
	Entity,
	(db: DbOrTransaction, id: number) => Promise<DependencyResult>
> = {
	category: checkCategoryDependencies,
	item: checkItemDependencies,
};

/**
 * Check if an entity has dependencies that would prevent deletion.
 * Can be called inside a transaction for TOCTOU-safe delete operations.
 */
export async function checkDependencies(
	db: DbOrTransaction,
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
