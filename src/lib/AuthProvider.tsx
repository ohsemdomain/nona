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
	isLoading: boolean;
	logout: () => Promise<void>;
	refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<Session | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const fetchSession = useCallback(async () => {
		try {
			const result = await getSession();
			setSession(result.data as Session | null);
		} catch {
			setSession(null);
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSession();
	}, [fetchSession]);

	const logout = useCallback(async () => {
		queryClient.clear();
		await authClient.signOut();
		setSession(null);
	}, []);

	const refresh = useCallback(async () => {
		setIsLoading(true);
		await fetchSession();
	}, [fetchSession]);

	return (
		<AuthContext.Provider value={{ session, isLoading, logout, refresh }}>
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
