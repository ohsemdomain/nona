import type { ReactNode } from "react";
import { clsx } from "clsx";

interface DetailPanelProp {
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
}: DetailPanelProp) {
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

interface DetailPanelHeaderProp {
    title: string;
    action?: ReactNode;
    className?: string;
}

export function DetailPanelHeader({
    title,
    action,
    className,
}: DetailPanelHeaderProp) {
    return (
        <div
            className={clsx("flex items-center justify-between gap-4", className)}
        >
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                {title}
            </h2>
            {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
    );
}
