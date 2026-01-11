export function nowUnix(): number {
	return Date.now();
}

export function timestamps() {
	const now = nowUnix();
	return {
		createdAt: now,
		updatedAt: now,
	};
}

export function updatedTimestamp() {
	return {
		updatedAt: nowUnix(),
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
