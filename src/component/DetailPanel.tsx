import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { clsx } from "clsx";

interface DetailPanelProp {
	header?: ReactNode;
	children: ReactNode;
	footer?: ReactNode;
	onBack?: () => void;
	backLabel?: string;
	className?: string;
}

export function DetailPanel({
	header,
	children,
	footer,
	onBack,
	backLabel = "Back",
	className,
}: DetailPanelProp) {
	return (
		<div
			className={clsx(
				"flex h-full flex-1 flex-col bg-geist-bg",
				className,
			)}
		>
			{/* Mobile back button */}
			{onBack && (
				<div className="shrink-0 border-b border-geist-border p-2 lg:hidden">
					<button
						type="button"
						onClick={onBack}
						className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm font-medium text-geist-fg-secondary hover:bg-geist-bg-secondary hover:text-geist-fg"
					>
						<ArrowLeft className="h-4 w-4" />
						{backLabel}
					</button>
				</div>
			)}
			{header && <div className="shrink-0 p-6">{header}</div>}
			<div className="flex-1 overflow-y-auto p-6">{children}</div>
			{footer && <div className="shrink-0 p-6">{footer}</div>}
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
		<div className={clsx("flex items-center justify-between gap-4", className)}>
			<h2 className="text-base font-semibold text-geist-fg">{title}</h2>
			{action && <div className="flex items-center gap-2">{action}</div>}
		</div>
	);
}
