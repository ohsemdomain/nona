import { clsx } from "clsx";
import { SkeletonText } from "./Skeleton";

type ListItemVariant = "simple" | "detailed" | "order";

interface SkeletonListItemProp {
	variant?: ListItemVariant;
	className?: string;
}

/**
 * Skeleton for MasterListItem
 * - simple: Single line (CategoryPage)
 * - detailed: Name + subtitle + price (ItemPage)
 * - order: PublicId + date + total + status badge (OrderPage)
 */
export function SkeletonListItem({
	variant = "simple",
	className,
}: SkeletonListItemProp) {
	return (
		<div
			role="presentation"
			aria-hidden="true"
			className={clsx(
				"w-full px-4 py-3 border-b border-zinc-200 ",
				className,
			)}
		>
			{variant === "simple" && <SkeletonText width="3/4" size="base" />}

			{variant === "detailed" && (
				<div className="space-y-2">
					<SkeletonText width="3/4" size="base" />
					<div className="flex items-center justify-between">
						<SkeletonText width="1/2" size="sm" />
						<SkeletonText width="1/4" size="sm" />
					</div>
				</div>
			)}

			{variant === "order" && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<SkeletonText width="1/3" size="base" />
						<div className="h-5 w-16 animate-pulse bg-zinc-200  rounded-full" />
					</div>
					<div className="flex items-center justify-between">
						<SkeletonText width="1/4" size="sm" />
						<SkeletonText width="1/4" size="sm" />
					</div>
				</div>
			)}
		</div>
	);
}

interface SkeletonListProp {
	count?: number;
	variant?: ListItemVariant;
	className?: string;
}

export function SkeletonList({
	count = 5,
	variant = "simple",
	className,
}: SkeletonListProp) {
	return (
		<div role="presentation" aria-hidden="true" className={className}>
			{Array.from({ length: count }).map((_, i) => (
				<SkeletonListItem key={i} variant={variant} />
			))}
		</div>
	);
}
