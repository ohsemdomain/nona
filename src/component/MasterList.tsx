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
				"flex h-full w-full flex-col rounded-lg border border-geist-border bg-geist-bg lg:w-80 lg:shrink-0",
				className,
			)}
		>
			{header && <div className="shrink-0 p-5">{header}</div>}
			<div className="flex-1 overflow-y-auto">{children}</div>
			{footer && <div className="shrink-0 p-5">{footer}</div>}
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
				"w-full px-5 py-3 text-left transition-colors",
				"border-b border-geist-border",
				"hover:bg-geist-bg-secondary",
				isSelected && "bg-geist-bg-secondary",
				className,
			)}
		>
			{children}
		</button>
	);
}
