import type { ReactNode } from "react";
import { clsx } from "clsx";

interface MasterDetailProp {
	children: ReactNode;
	className?: string;
}

export function MasterDetail({ children, className }: MasterDetailProp) {
	return (
		<div className={clsx("mx-auto flex h-full gap-4 max-w-6xl", className)}>{children}</div>
	);
}
