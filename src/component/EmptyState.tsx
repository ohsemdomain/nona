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
    message = "There are no items to display.",
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
            {icon ?? (
                <Inbox className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />
            )}
            <div className="space-y-1">
                <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {title}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {message}
                </p>
            </div>
            {action && <div className="mt-2">{action}</div>}
        </div>
    );
}
