import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "@/src/lib/auth";
import { LoadingState } from "./LoadingState";

interface ProtectedRouteProp {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProp) {
	const { data: session, isPending } = useSession();
	const location = useLocation();

	if (isPending) {
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
