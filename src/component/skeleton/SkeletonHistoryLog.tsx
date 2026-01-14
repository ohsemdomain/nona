import { clsx } from "clsx";
import { SkeletonText, SkeletonCircle } from "./Skeleton";

interface SkeletonHistoryLogItemProp {
	showChanges?: boolean;
}

function SkeletonHistoryLogItem({
	showChanges = false,
}: SkeletonHistoryLogItemProp) {
	return (
		<div className="flex gap-3 rounded-lg border border-geist-border bg-geist-bg p-4">
			<SkeletonCircle size="md" />
			<div className="min-w-0 flex-1 space-y-2">
				<SkeletonText width="3/4" size="sm" />
				{showChanges && (
					<div className="space-y-1">
						<SkeletonText width="1/2" size="xs" />
						<SkeletonText width="1/3" size="xs" />
					</div>
				)}
				<SkeletonText width="1/4" size="xs" />
			</div>
		</div>
	);
}

interface SkeletonHistoryLogProp {
	count?: number;
	className?: string;
}

/**
 * Skeleton loading state for HistoryLogPanel
 */
export function SkeletonHistoryLog({
	count = 3,
	className,
}: SkeletonHistoryLogProp) {
	return (
		<div
			role="presentation"
			aria-hidden="true"
			className={clsx("space-y-3", className)}
		>
			{Array.from({ length: count }).map((_, i) => (
				<SkeletonHistoryLogItem key={i} showChanges={i === 1} />
			))}
		</div>
	);
}
