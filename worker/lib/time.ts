export function nowUnix(): number {
	return Date.now();
}

export function timestamps(userId?: string) {
	const now = nowUnix();
	return {
		createdAt: now,
		updatedAt: now,
		createdBy: userId,
		updatedBy: userId,
	};
}

export function updatedTimestamp(userId?: string) {
	return {
		updatedAt: nowUnix(),
		updatedBy: userId,
	};
}

/**
 * Timestamps for auth tables that use Date mode in Drizzle
 */
export function authTimestamps() {
	const now = new Date();
	return {
		createdAt: now,
		updatedAt: now,
	};
}

/**
 * Updated timestamp for auth tables that use Date mode in Drizzle
 */
export function authUpdatedTimestamp() {
	return {
		updatedAt: new Date(),
	};
}
