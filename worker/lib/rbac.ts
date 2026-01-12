import { eq } from "drizzle-orm";
import { createDb, user, role, permission, rolePermission } from "../db";

/**
 * Permission cache with TTL
 * Note: This cache persists for the lifetime of the Worker instance.
 * In Cloudflare Workers, instances are reused across requests,
 * so this provides effective caching for warm instances.
 */
interface CacheEntry {
	permissions: string[];
	expiresAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 1 minute TTL
const permissionCache = new Map<string, CacheEntry>();

/**
 * Clear expired entries from cache (called periodically)
 */
function cleanupCache(): void {
	const now = Date.now();
	for (const [key, entry] of permissionCache.entries()) {
		if (entry.expiresAt < now) {
			permissionCache.delete(key);
		}
	}
}

/**
 * Invalidate cache for a specific user
 */
export function invalidateUserPermissionCache(userId: string): void {
	permissionCache.delete(userId);
}

/**
 * Invalidate all permission cache entries
 */
export function invalidateAllPermissionCache(): void {
	permissionCache.clear();
}

/**
 * Get all permissions for a user by their ID
 * Uses caching to reduce database queries
 */
export async function getUserPermission(
	d1: D1Database,
	userId: string,
): Promise<string[]> {
	// Check cache first
	const now = Date.now();
	const cached = permissionCache.get(userId);
	if (cached && cached.expiresAt > now) {
		return cached.permissions;
	}

	// Cleanup old entries occasionally (1 in 10 cache misses)
	if (Math.random() < 0.1) {
		cleanupCache();
	}

	const db = createDb(d1);

	// Get user with role
	const userResult = await db
		.select({ roleId: user.roleId })
		.from(user)
		.where(eq(user.id, userId))
		.limit(1);

	if (userResult.length === 0 || !userResult[0].roleId) {
		// Cache empty result too
		permissionCache.set(userId, {
			permissions: [],
			expiresAt: now + CACHE_TTL_MS,
		});
		return [];
	}

	const roleId = userResult[0].roleId;

	// Get permissions for role
	const permissionList = await db
		.select({ name: permission.name })
		.from(rolePermission)
		.innerJoin(permission, eq(rolePermission.permissionId, permission.id))
		.where(eq(rolePermission.roleId, roleId));

	const permissions = permissionList.map((p) => p.name);

	// Store in cache
	permissionCache.set(userId, {
		permissions,
		expiresAt: now + CACHE_TTL_MS,
	});

	return permissions;
}

/**
 * Get user's role name
 */
export async function getUserRole(
	d1: D1Database,
	userId: string,
): Promise<string | null> {
	const db = createDb(d1);

	const result = await db
		.select({ roleName: role.name })
		.from(user)
		.innerJoin(role, eq(user.roleId, role.id))
		.where(eq(user.id, userId))
		.limit(1);

	return result.length > 0 ? result[0].roleName : null;
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(
	d1: D1Database,
	userId: string,
	permissionName: string,
): Promise<boolean> {
	const permissions = await getUserPermission(d1, userId);
	// Admin bypass - system:admin grants all permissions
	if (permissions.includes("system:admin")) return true;
	return permissions.includes(permissionName);
}
