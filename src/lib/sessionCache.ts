/**
 * Session Cache Utilities
 *
 * Manages signed session tokens in localStorage for instant auth checks.
 * The signature prevents tampering - any modification invalidates the token.
 */

const CACHE_KEY = "auth_session_cache";

// Refresh threshold: 1 day remaining
const REFRESH_THRESHOLD_MS = 1 * 24 * 60 * 60 * 1000;

export interface SessionPayload {
	userId: string;
	publicId: string;
	email: string;
	name: string;
	role: string | null;
	permissions: string[];
	issuedAt: number;
	expiresAt: number;
}

export interface CachedSession {
	payload: SessionPayload;
	signature: string;
}

export function readSessionCache(): CachedSession | null {
	try {
		const cached = localStorage.getItem(CACHE_KEY);
		if (!cached) {
			return null;
		}
		return JSON.parse(cached) as CachedSession;
	} catch {
		// Invalid JSON or storage error
		clearSessionCache();
		return null;
	}
}

export function writeSessionCache(session: CachedSession): void {
	try {
		localStorage.setItem(CACHE_KEY, JSON.stringify(session));
	} catch {
		// Ignore storage errors (e.g., quota exceeded, private browsing)
	}
}

export function clearSessionCache(): void {
	try {
		localStorage.removeItem(CACHE_KEY);
	} catch {
		// Ignore storage errors
	}
}

export function isSessionExpired(session: CachedSession): boolean {
	return session.payload.expiresAt < Date.now();
}

export function shouldRefreshSession(session: CachedSession): boolean {
	const timeRemaining = session.payload.expiresAt - Date.now();
	return timeRemaining < REFRESH_THRESHOLD_MS;
}

export function sessionToUser(session: CachedSession) {
	const { payload } = session;
	return {
		id: payload.userId,
		publicId: payload.publicId,
		name: payload.name,
		email: payload.email,
		role: payload.role,
		permissions: payload.permissions,
	};
}
