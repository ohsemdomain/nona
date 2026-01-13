import type { ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./Button";

interface ErrorStateProp {
	title?: string;
	message?: string;
	error?: Error;
	onRetry?: () => void;
	onGoHome?: () => void;
	showDetails?: boolean;
	action?: ReactNode;
	className?: string;
}

export function ErrorState({
	title = "Something went wrong",
	message = "An unexpected error occurred. Please try again.",
	error,
	onRetry,
	onGoHome,
	showDetails = false,
	action,
	className,
}: ErrorStateProp) {
	return (
		<div
			className={clsx(
				"flex flex-col items-center justify-center gap-3 py-12 text-center",
				className,
			)}
		>
			<div className="rounded-full bg-red-100 p-3 bg-red-900/20">
				<AlertTriangle className="h-10 w-10 text-red-600 text-red-400" />
			</div>
			<div className="space-y-1">
				<h3 className="text-sm font-medium text-zinc-900 text-zinc-100">
					{title}
				</h3>
				<p className="text-sm text-zinc-500 text-zinc-400">{message}</p>
			</div>
			{showDetails && error && (
				<details className="w-full max-w-md text-left">
					<summary className="cursor-pointer text-xs text-zinc-400 hover:text-zinc-600">
						Technical details
					</summary>
					<pre className="mt-2 overflow-auto rounded bg-zinc-100 p-2 text-xs text-zinc-600 bg-zinc-800 text-zinc-400">
						{error.message}
					</pre>
				</details>
			)}
			{action ?? (
				<div className="mt-2 flex gap-2">
					{onRetry && (
						<Button variant="primary" size="sm" onClick={onRetry}>
							<RefreshCw className="h-4 w-4" />
							Try Again
						</Button>
					)}
					{onGoHome && (
						<Button variant="secondary" size="sm" onClick={onGoHome}>
							<Home className="h-4 w-4" />
							Go Home
						</Button>
					)}
				</div>
			)}
		</div>
	);
}
