import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

interface LoadingStateProps {
    message?: string;
    className?: string;
}

export function LoadingState({
    message = "Loading...",
    className,
}: LoadingStateProps) {
    return (
        <div
            className={clsx(
                "flex flex-col items-center justify-center gap-3 py-12",
                className,
            )}
        >
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
        </div>
    );
}
