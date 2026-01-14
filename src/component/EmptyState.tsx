import type { ReactNode } from "react";
import { Inbox } from "lucide-react";
import { clsx } from "clsx";

interface EmptyStateProp {
	title?: string;
	message?: string;
	icon?: ReactNode;
	action?: ReactNode;
	className?: string;
}

export function EmptyState({
	title = "No data",
	message = "There is no data to display.",
	icon,
	action,
	className,
}: EmptyStateProp) {
	return (
		<div
			className={clsx(
				"flex flex-col items-center justify-center gap-3 py-12 text-center",
				className,
			)}
		>
			{icon ?? <Inbox className="h-12 w-12 text-geist-fg-muted" />}
			<div className="space-y-1">
				<h3 className="text-sm font-medium text-geist-fg">
					{title}
				</h3>
				<p className="text-sm text-geist-fg-muted">{message}</p>
			</div>
			{action && <div className="mt-2">{action}</div>}
		</div>
	);
}
