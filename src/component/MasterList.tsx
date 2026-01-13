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
				"flex h-full w-80 shrink-0 flex-col rounded-xl border border-zinc-200 bg-white",
				className,
			)}
		>
			{header && <div className="shrink-0 p-4">{header}</div>}
			<div className="flex-1 overflow-y-auto">{children}</div>
			{footer && <div className="shrink-0 p-4">{footer}</div>}
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
				"border-b border-zinc-100",
				"hover:bg-zinc-50",
				isSelected && "bg-zinc-100",
				className,
			)}
		>
			{children}
		</button>
	);
}
