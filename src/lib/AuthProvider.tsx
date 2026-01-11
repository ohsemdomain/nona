import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	type ReactNode,
} from "react";
import { getSession } from "./auth";
import { queryClient } from "./queryClient";
import { authClient } from "./auth";
import { api } from "./api";
import { TOAST } from "./toast";
import {
	readSessionCache,
	writeSessionCache,
	clearSessionCache,
	isSessionExpired,
	shouldRefreshSession,
	type CachedSession,
} from "./sessionCache";

interface User {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

interface Session {
	user: User;
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	};
}

interface AuthContextValue {
	session: Session | null;
	role: string | null;
	permissions: string[];
	isLoading: boolean;
	permissionError: boolean;
	logout: () => Promise<void>;
	refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [permissionError, setPermissionError] = useState(false);

	// Track if we've done initial cache check
	const initializedRef = useRef(false);
	// Track if validation is in progress
	const validatingRef = useRef(false);

	// Fetch fresh session token from server
	const fetchSessionToken = useCallback(async (): Promise<CachedSession | null> => {
		try {
			const token = await api.get<CachedSession>("/session/token");
			writeSessionCache(token);
			return token;
		} catch {
			return null;
		}
	}, []);

	// Validate session in background (non-blocking)
	const validateSessionInBackground = useCallback(async () => {
		if (validatingRef.current) return;
		validatingRef.current = true;

		try {
			const cached = readSessionCache();
			const response = await api.post<{ valid: boolean; needsRefresh?: boolean; reason?: string }>(
				"/session/validate",
				{ token: cached },
			);

			if (!response.valid) {
				// Session invalid - clear cache and logout
				clearSessionCache();
				queryClient.clear();
				await authClient.signOut();
				setSession(null);
				setRole(null);
				setPermissions([]);
				return;
			}

			if (response.needsRefresh) {
				// Token needs refresh - fetch new one in background
				await fetchSessionToken();
			}
		} catch {
			// Network error - keep using cached session
			// Don't logout on network failures
		} finally {
			validatingRef.current = false;
		}
	}, [fetchSessionToken]);

	// Convert cached session to Session object for compatibility
	const applyCache = useCallback((cached: CachedSession) => {
		const { payload } = cached;

		// Create a minimal Session object from cache
		const sessionData: Session = {
			user: {
				id: payload.userId,
				name: payload.name,
				email: payload.email,
				emailVerified: true, // Assume verified if cached
				image: null,
				createdAt: new Date(payload.issuedAt),
				updatedAt: new Date(payload.issuedAt),
			},
			session: {
				id: payload.userId, // Use userId as session id placeholder
				userId: payload.userId,
				expiresAt: new Date(payload.expiresAt),
			},
		};

		setSession(sessionData);
		setRole(payload.role);
		setPermissions(payload.permissions);
		setPermissionError(false);
		setIsLoading(false);
	}, []);

	// Full session fetch (used when no cache or cache expired)
	const fetchSession = useCallback(async () => {
		try {
			const result = await getSession();
			const sessionData = result.data as Session | null;

			if (sessionData) {
				// Fetch signed session token (includes role + permissions)
				const token = await fetchSessionToken();

				if (token) {
					applyCache(token);
				} else {
					// Fallback: set session without permissions
					setSession(sessionData);
					setRole(null);
					setPermissions([]);
					setPermissionError(true);
					setIsLoading(false);
					TOAST.error("Failed to load permissions. Some features may be unavailable.");
				}
			} else {
				// No session
				setSession(null);
				setRole(null);
				setPermissions([]);
				setPermissionError(false);
				setIsLoading(false);
				clearSessionCache();
			}
		} catch {
			setSession(null);
			setRole(null);
			setPermissions([]);
			setPermissionError(false);
			setIsLoading(false);
			clearSessionCache();
		}
	}, [fetchSessionToken, applyCache]);

	// Initial mount - optimistic loading
	useEffect(() => {
		if (initializedRef.current) return;
		initializedRef.current = true;

		// Step 1: Check localStorage cache (sync, instant)
		const cached = readSessionCache();

		if (cached && !isSessionExpired(cached)) {
			// Cache hit - apply immediately (no loading screen!)
			applyCache(cached);

			// Background validation
			validateSessionInBackground();

			// Check if refresh needed
			if (shouldRefreshSession(cached)) {
				fetchSessionToken();
			}
		} else {
			// No cache or expired - full fetch
			clearSessionCache();
			fetchSession();
		}
	}, [applyCache, fetchSession, fetchSessionToken, validateSessionInBackground]);

	const logout = useCallback(async () => {
		queryClient.clear();
		clearSessionCache();
		await authClient.signOut();
		setSession(null);
		setRole(null);
		setPermissions([]);
		setPermissionError(false);
	}, []);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		clearSessionCache();
		await fetchSession();
	}, [fetchSession]);

	return (
		<AuthContext.Provider
			value={{
				session,
				role,
				permissions,
				isLoading,
				permissionError,
				logout,
				refresh,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
}
