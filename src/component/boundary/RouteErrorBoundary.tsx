import { useRouteError, isRouteErrorResponse, useNavigate } from "react-router-dom";
import { ErrorState } from "../molecule/ErrorState";

export function RouteErrorBoundary() {
	const error = useRouteError();
	const navigate = useNavigate();

	let title = "Page Error";
	let message = "Something went wrong loading this page.";

	if (isRouteErrorResponse(error)) {
		if (error.status === 404) {
			title = "Page Not Found";
			message = "The page you're looking for doesn't exist.";
		} else if (error.status === 403) {
			title = "Access Denied";
			message = "You don't have permission to view this page.";
		}
	}

	return (
		<div className="flex h-full min-h-[400px] items-center justify-center">
			<ErrorState
				title={title}
				message={message}
				error={error instanceof Error ? error : undefined}
				onRetry={() => navigate(0)}
				onGoHome={() => navigate("/")}
				showDetails={import.meta.env.DEV}
			/>
		</div>
	);
}
