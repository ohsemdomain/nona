import { SkeletonText } from "./Skeleton";

interface SkeletonDetailFieldProp {
	labelWidth?: "1/4" | "1/3" | "1/2";
	valueWidth?: "1/2" | "3/4" | "full";
}

function SkeletonDetailField({
	labelWidth = "1/3",
	valueWidth = "3/4",
}: SkeletonDetailFieldProp) {
	return (
		<div>
			<SkeletonText width={labelWidth} size="sm" className="mb-2" />
			<SkeletonText width={valueWidth} size="base" />
		</div>
	);
}

interface SkeletonDetailPanelProp {
	fieldCount?: number;
	showHeader?: boolean;
	showActions?: boolean;
	className?: string;
}

/**
 * Skeleton for detail panels (CategoryDetail, ItemDetail)
 * Matches the structure: header with title + action buttons, then field list
 */
export function SkeletonDetailPanel({
	fieldCount = 3,
	showHeader = true,
	showActions = true,
	className,
}: SkeletonDetailPanelProp) {
	return (
		<div
			role="presentation"
			aria-hidden="true"
			className={`space-y-6 ${className ?? ""}`}
		>
			{/* Header section matching DetailPanelHeader */}
			{showHeader && (
				<div className="flex items-center justify-between">
					<SkeletonText width="1/2" size="xl" />
					{showActions && (
						<div className="flex gap-2">
							<div className="h-9 w-16 animate-pulse bg-geist-border rounded" />
							<div className="h-9 w-20 animate-pulse bg-geist-border rounded" />
						</div>
					)}
				</div>
			)}

			{/* Field list */}
			<div className="space-y-4">
				{Array.from({ length: fieldCount }).map((_, i) => (
					<SkeletonDetailField key={i} />
				))}
			</div>
		</div>
	);
}

interface SkeletonOrderDetailProp {
	lineCount?: number;
}

/**
 * Skeleton for order detail which has additional order lines table
 */
export function SkeletonOrderDetail({ lineCount = 3 }: SkeletonOrderDetailProp) {
	return (
		<div role="presentation" aria-hidden="true" className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<SkeletonText width="1/3" size="xl" />
				<div className="flex gap-2">
					<div className="h-9 w-16 animate-pulse bg-geist-border rounded" />
					<div className="h-9 w-20 animate-pulse bg-geist-border rounded" />
				</div>
			</div>

			{/* Status and date row */}
			<div className="flex items-center gap-4">
				<div className="h-6 w-20 animate-pulse bg-geist-border rounded-full" />
				<SkeletonText width="1/4" size="sm" />
			</div>

			{/* Order lines section */}
			<div className="space-y-2">
				<SkeletonText width="1/4" size="base" />
				<div className="border border-geist-border rounded-lg overflow-hidden">
					{Array.from({ length: lineCount }).map((_, i) => (
						<div
							key={i}
							className="flex items-center justify-between px-4 py-3 border-b border-geist-border last:border-b-0"
						>
							<SkeletonText width="1/2" size="sm" />
							<div className="flex items-center gap-4">
								<SkeletonText width="1/4" size="sm" className="w-16" />
								<SkeletonText width="1/4" size="sm" className="w-20" />
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Total */}
			<div className="flex justify-end">
				<div className="text-right space-y-1">
					<SkeletonText width="full" size="sm" className="w-24" />
					<SkeletonText width="full" size="lg" className="w-32" />
				</div>
			</div>
		</div>
	);
}
