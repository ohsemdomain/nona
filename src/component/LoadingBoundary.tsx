import type { ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./Button";

interface LoadingBoundaryProp {
	isLoading: boolean;
	isError?: boolean;
	error?: Error | null;
	onRetry?: () => void;
	loadingFallback?: ReactNode;
	errorFallback?: ReactNode;
	children: ReactNode;
	minHeight?: string;
	className?: string;
}

/**
 * Loading boundary that handles loading, error, and success states.
 * Use with skeleton components for loading fallback.
 *
 * @example
 * <LoadingBoundary
 *   isLoading={isLoading}
 *   isError={isError}
 *   onRetry={refetch}
 *   loadingFallback={<SkeletonList count={8} variant="simple" />}
 * >
 *   {list.length === 0 ? <EmptyState /> : <List />}
 * </LoadingBoundary>
 */
export function LoadingBoundary({
	isLoading,
	isError = false,
	error,
	onRetry,
	loadingFallback,
	errorFallback,
	children,
	minHeight,
	className,
}: LoadingBoundaryProp) {
	if (isLoading) {
		return (
			<div className={clsx(minHeight, className)}>
				{loadingFallback ?? <DefaultLoadingFallback />}
			</div>
		);
	}

	if (isError) {
		return (
			<div className={clsx(minHeight, className)}>
				{errorFallback ?? (
					<DefaultErrorFallback error={error} onRetry={onRetry} />
				)}
			</div>
		);
	}

	return <>{children}</>;
}

function DefaultLoadingFallback() {
	return (
		<div
			role="status"
			aria-label="Loading"
			className="flex items-center justify-center py-12"
		>
			<div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-600 dark:border-zinc-700 dark:border-t-zinc-400" />
		</div>
	);
}

interface DefaultErrorFallbackProp {
	error?: Error | null;
	onRetry?: () => void;
}

function DefaultErrorFallback({ error, onRetry }: DefaultErrorFallbackProp) {
	return (
		<div className="flex items-center justify-center py-12">
			<div className="flex flex-col items-center gap-4 text-center">
				<div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
					<AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
				</div>
				<div className="space-y-1">
					<p className="font-medium text-zinc-900 dark:text-zinc-100">
						Something went wrong
					</p>
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						{error?.message ?? "Failed to load data. Please try again."}
					</p>
				</div>
				{onRetry && (
					<Button variant="secondary" size="sm" onClick={onRetry}>
						<RefreshCw className="h-4 w-4" />
						Try again
					</Button>
				)}
			</div>
		</div>
	);
}
