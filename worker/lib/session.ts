/**
 * Session Management Utilities
 *
 * Provides functions for session revocation and cleanup.
 * Used for security compliance (forced logout, password change invalidation).
 */

import { eq, lt, and, ne, sql } from "drizzle-orm";
import type { Database } from "../db";
import { session } from "../db";

/**
 * Revoke all sessions for a specific user
 * Use when: password changed, account compromised, admin force-logout
 */
export async function revokeAllUserSession(
	db: Database,
	userId: string,
): Promise<number> {
	// Count first for return value
	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(session)
		.where(eq(session.userId, userId));

	const count = countResult[0]?.count ?? 0;

	if (count > 0) {
		await db.delete(session).where(eq(session.userId, userId));
	}

	return count;
}

/**
 * Revoke all sessions for a user except the current one
 * Use when: user wants to log out all other devices
 */
export async function revokeOtherUserSession(
	db: Database,
	userId: string,
	currentSessionToken: string,
): Promise<number> {
	// Count sessions to revoke
	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(session)
		.where(
			and(eq(session.userId, userId), ne(session.token, currentSessionToken)),
		);

	const count = countResult[0]?.count ?? 0;

	if (count > 0) {
		await db
			.delete(session)
			.where(
				and(eq(session.userId, userId), ne(session.token, currentSessionToken)),
			);
	}

	return count;
}

/**
 * Revoke a specific session by ID
 */
export async function revokeSessionById(
	db: Database,
	sessionId: string,
): Promise<boolean> {
	const existing = await db
		.select({ id: session.id })
		.from(session)
		.where(eq(session.id, sessionId))
		.limit(1);

	if (existing.length === 0) {
		return false;
	}

	await db.delete(session).where(eq(session.id, sessionId));
	return true;
}

/**
 * Clean up expired sessions
 * Should be called periodically (e.g., via cron or scheduled worker)
 */
export async function cleanupExpiredSession(db: Database): Promise<number> {
	const now = Date.now();

	// Count expired sessions
	const countResult = await db
		.select({ count: sql<number>`count(*)` })
		.from(session)
		.where(lt(session.expiresAt, new Date(now)));

	const count = countResult[0]?.count ?? 0;

	if (count > 0) {
		await db.delete(session).where(lt(session.expiresAt, new Date(now)));
	}

	return count;
}

/**
 * Get active session count for a user
 */
export async function getActiveSessionCount(
	db: Database,
	userId: string,
): Promise<number> {
	const now = new Date();
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(session)
		.where(and(eq(session.userId, userId), sql`${session.expiresAt} > ${now}`));

	return result[0]?.count ?? 0;
}
