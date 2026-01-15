import { Children, type ReactNode } from "react";
import { clsx } from "clsx";

interface MasterDetailProp {
	children: ReactNode;
	selectedId?: string | number | null;
	className?: string;
}

export function MasterDetail({ children, selectedId, className }: MasterDetailProp) {
	const childrenArray = Children.toArray(children);
	const [masterList, detailPanel] = childrenArray;

	return (
		<div className={clsx("mx-auto flex h-full flex-col lg:flex-row lg:gap-4 lg:max-w-6xl", className)}>
			{/* MasterList: show on mobile when no selection, always show on desktop */}
			<div className={clsx("h-full", selectedId ? "hidden lg:block" : "block")}>
				{masterList}
			</div>
			{/* DetailPanel: show on mobile when selection, always show on desktop */}
			<div className={clsx("h-full flex-1", selectedId ? "block" : "hidden lg:block")}>
				{detailPanel}
			</div>
		</div>
	);
}
