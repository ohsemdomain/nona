import type { ReactNode } from "react";
import { clsx } from "clsx";

interface MasterDetailProp {
    children: ReactNode;
    className?: string;
}

export function MasterDetail({ children, className }: MasterDetailProp) {
    return (
        <div
            className={clsx(
                "grid h-full grid-cols-[minmax(280px,_1fr)_2fr] divide-x divide-zinc-200 dark:divide-zinc-700",
                className,
            )}
        >
            {children}
        </div>
    );
}
