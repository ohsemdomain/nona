import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/src/lib/AuthProvider";
import { LoadingState } from "./LoadingState";

interface ProtectedRouteProp {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProp) {
	const { session, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) {
		return (
			<div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
				<LoadingState message="Checking authentication..." />
			</div>
		);
	}

	if (!session) {
		return <Navigate to="/login" state={{ from: location }} replace />;
	}

	return <>{children}</>;
}
