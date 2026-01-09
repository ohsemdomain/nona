import type { ReactNode } from "react";
import { clsx } from "clsx";

interface DetailPanelProps {
    header?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export function DetailPanel({
    header,
    children,
    footer,
    className,
}: DetailPanelProps) {
    return (
        <div
            className={clsx(
                "flex h-full flex-col bg-white dark:bg-zinc-950",
                className,
            )}
        >
            {header && (
                <div className="shrink-0 border-b border-zinc-200 p-4 dark:border-zinc-700">
                    {header}
                </div>
            )}
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
            {footer && (
                <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-700">
                    {footer}
                </div>
            )}
        </div>
    );
}

interface DetailPanelHeaderProps {
    title: string;
    actions?: ReactNode;
    className?: string;
}

export function DetailPanelHeader({
    title,
    actions,
    className,
}: DetailPanelHeaderProps) {
    return (
        <div
            className={clsx("flex items-center justify-between gap-4", className)}
        >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
            </h2>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
    );
}
