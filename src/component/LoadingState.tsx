import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface LoadingStateProp {
	className?: string;
}

export function LoadingState({ className }: LoadingStateProp) {
	return (
		<div
			role="status"
			aria-label="Loading"
			className={clsx(
				"flex items-center justify-center py-12",
				className,
			)}
		>
			<Loader2 className="h-8 w-8 animate-spin text-geist-fg-muted" />
		</div>
	);
}
