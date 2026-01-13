import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import type { ReactNode } from "react";
import { ErrorState } from "./ErrorState";

function RootFallback({ error, resetErrorBoundary }: FallbackProps) {
	return (
		<div className="flex min-h-screen items-center justify-center bg-zinc-50 ">
			<ErrorState
				title="Application Error"
				message="The application encountered an unexpected error."
				error={error}
				onRetry={resetErrorBoundary}
				onGoHome={() => {
					window.location.href = "/";
				}}
				showDetails={import.meta.env.DEV}
			/>
		</div>
	);
}

interface RootErrorBoundaryProp {
	children: ReactNode;
}

export function RootErrorBoundary({ children }: RootErrorBoundaryProp) {
	return (
		<ErrorBoundary
			FallbackComponent={RootFallback}
			onError={(error, info) => {
				console.error("Root Error Boundary:", error);
				console.error("Component stack:", info.componentStack);
			}}
		>
			{children}
		</ErrorBoundary>
	);
}
