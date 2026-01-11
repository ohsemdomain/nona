import {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
	type ReactNode,
} from "react";
import { getSession } from "./auth";
import { queryClient } from "./queryClient";
import { authClient } from "./auth";
import { api } from "./api";
import { TOAST } from "./toast";

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

interface MeResponse {
	id: string;
	name: string;
	email: string;
	emailVerified: boolean;
	image: string | null;
	role: string | null;
	permissions: string[];
	createdAt: number;
	updatedAt: number;
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

// Session storage keys for permission caching
const PERMISSION_CACHE_KEY = "auth_permissions";
const ROLE_CACHE_KEY = "auth_role";
const CACHE_USER_ID_KEY = "auth_cache_user_id";

interface CachedPermissions {
	role: string | null;
	permissions: string[];
	userId: string;
}

function getCachedPermissions(userId: string): CachedPermissions | null {
	try {
		const cachedUserId = sessionStorage.getItem(CACHE_USER_ID_KEY);
		if (cachedUserId !== userId) {
			// Cache is for a different user, clear it
			clearPermissionCache();
			return null;
		}

		const permissions = sessionStorage.getItem(PERMISSION_CACHE_KEY);
		const role = sessionStorage.getItem(ROLE_CACHE_KEY);

		if (permissions) {
			return {
				role: role || null,
				permissions: JSON.parse(permissions),
				userId,
			};
		}
	} catch {
		// Ignore storage errors
	}
	return null;
}

function setCachedPermissions(
	userId: string,
	role: string | null,
	permissions: string[],
): void {
	try {
		sessionStorage.setItem(CACHE_USER_ID_KEY, userId);
		sessionStorage.setItem(ROLE_CACHE_KEY, role || "");
		sessionStorage.setItem(PERMISSION_CACHE_KEY, JSON.stringify(permissions));
	} catch {
		// Ignore storage errors (e.g., quota exceeded)
	}
}

function clearPermissionCache(): void {
	try {
		sessionStorage.removeItem(CACHE_USER_ID_KEY);
		sessionStorage.removeItem(ROLE_CACHE_KEY);
		sessionStorage.removeItem(PERMISSION_CACHE_KEY);
	} catch {
		// Ignore storage errors
	}
}

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [role, setRole] = useState<string | null>(null);
	const [permissions, setPermissions] = useState<string[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [permissionError, setPermissionError] = useState(false);

	const fetchSession = useCallback(async () => {
		try {
			const result = await getSession();
			const sessionData = result.data as Session | null;
			setSession(sessionData);

			// If we have a session, fetch role and permissions
			if (sessionData) {
				const userId = sessionData.user.id;

				// Check cache first
				const cached = getCachedPermissions(userId);
				if (cached) {
					setRole(cached.role);
					setPermissions(cached.permissions);
					setPermissionError(false);
					return;
				}

				// Fetch from API
				try {
					const meData = await api.get<MeResponse>("/me");
					setRole(meData.role);
					setPermissions(meData.permissions);
					setPermissionError(false);

					// Cache the result
					setCachedPermissions(userId, meData.role, meData.permissions);
				} catch {
					// If /me fails, show error but keep session
					setRole(null);
					setPermissions([]);
					setPermissionError(true);
					TOAST.error(
						"Failed to load permissions. Some features may be unavailable.",
					);
				}
			} else {
				setRole(null);
				setPermissions([]);
				setPermissionError(false);
				clearPermissionCache();
			}
		} catch {
			setSession(null);
			setRole(null);
			setPermissions([]);
			setPermissionError(false);
			clearPermissionCache();
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSession();
	}, [fetchSession]);

	const logout = useCallback(async () => {
		queryClient.clear();
		clearPermissionCache();
		await authClient.signOut();
		setSession(null);
		setRole(null);
		setPermissions([]);
		setPermissionError(false);
	}, []);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		clearPermissionCache(); // Force fresh fetch on refresh
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
