import type { ReactNode } from "react";
import { clsx } from "clsx";

interface MasterListProp {
    header?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}

export function MasterList({
    header,
    children,
    footer,
    className,
}: MasterListProp) {
    return (
        <div
            className={clsx(
                "flex h-full flex-col bg-zinc-50 dark:bg-zinc-900",
                className,
            )}
        >
            {header && (
                <div className="shrink-0 border-b border-zinc-200 p-4 dark:border-zinc-700">
                    {header}
                </div>
            )}
            <div className="flex-1 overflow-y-auto">{children}</div>
            {footer && (
                <div className="shrink-0 border-t border-zinc-200 p-4 dark:border-zinc-700">
                    {footer}
                </div>
            )}
        </div>
    );
}

interface MasterListItemProp {
    isSelected?: boolean;
    onClick?: () => void;
    children: ReactNode;
    className?: string;
}

export function MasterListItem({
    isSelected,
    onClick,
    children,
    className,
}: MasterListItemProp) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={clsx(
                "w-full px-4 py-3 text-left transition-colors",
                "border-b border-zinc-200 dark:border-zinc-700",
                "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                isSelected && "bg-zinc-200 dark:bg-zinc-800",
                className,
            )}
        >
            {children}
        </button>
    );
}
