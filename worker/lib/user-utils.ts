import { eq } from "drizzle-orm";
import type { Database } from "../db";
import { user, role } from "../db";

/**
 * Reusable select fields for user queries with role join
 */
export const userSelectFields = {
	id: user.id,
	publicId: user.publicId,
	name: user.name,
	email: user.email,
	emailVerified: user.emailVerified,
	image: user.image,
	roleId: user.roleId,
	roleName: role.name,
	createdAt: user.createdAt,
	updatedAt: user.updatedAt,
	deletedAt: user.deletedAt,
};

/**
 * Raw user data from database (with Date objects from Drizzle timestamp mode)
 */
interface RawUserData {
	id: string;
	publicId: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	roleId: number | null;
	roleName: string | null;
	createdAt: Date | number;
	updatedAt: Date | number;
	deletedAt: Date | number | null;
}

/**
 * Formatted user data with numeric timestamps
 */
export interface FormattedUser {
	id: string;
	publicId: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	roleId: number | null;
	roleName: string | null;
	createdAt: number;
	updatedAt: number;
	deletedAt: number | null;
}

/**
 * Convert Date objects to timestamps for consistent API responses
 */
function toTimestamp(value: Date | number): number {
	return value instanceof Date ? value.getTime() : value;
}

/**
 * Format a single user record, converting Date objects to timestamps
 */
export function formatUserDates(data: RawUserData): FormattedUser {
	return {
		...data,
		createdAt: toTimestamp(data.createdAt),
		updatedAt: toTimestamp(data.updatedAt),
		deletedAt: data.deletedAt ? toTimestamp(data.deletedAt) : null,
	};
}

/**
 * Format multiple user records
 */
export function formatUserList(dataList: RawUserData[]): FormattedUser[] {
	return dataList.map(formatUserDates);
}

/**
 * Find a role by its name
 * @returns The role record or null if not found
 */
export async function findRoleByName(
	db: Database,
	roleName: string,
): Promise<{ id: number; name: string } | null> {
	const result = await db
		.select({ id: role.id, name: role.name })
		.from(role)
		.where(eq(role.name, roleName))
		.limit(1);

	return result.length > 0 ? result[0] : null;
}
