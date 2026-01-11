import { SkeletonText } from "./Skeleton";

interface SkeletonTableRowProp {
	columns?: number;
	hasActions?: boolean;
	hasRoleBadge?: boolean;
}

/**
 * Skeleton for table rows (UserPage)
 */
export function SkeletonTableRow({
	columns = 4,
	hasActions = true,
	hasRoleBadge = true,
}: SkeletonTableRowProp) {
	return (
		<tr
			role="presentation"
			aria-hidden="true"
			className="border-b border-zinc-200 dark:border-zinc-700"
		>
			{/* Name column */}
			<td className="px-4 py-3">
				<SkeletonText width="3/4" size="base" />
			</td>

			{/* Email column */}
			<td className="px-4 py-3">
				<SkeletonText width="full" size="sm" />
			</td>

			{/* Role column with badge */}
			{hasRoleBadge && (
				<td className="px-4 py-3">
					<div className="h-6 w-16 animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded-full" />
				</td>
			)}

			{/* Actions column */}
			{hasActions && (
				<td className="px-4 py-3">
					<div className="flex gap-2">
						<div className="h-8 w-14 animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded" />
						<div className="h-8 w-16 animate-pulse bg-zinc-200 dark:bg-zinc-700 rounded" />
					</div>
				</td>
			)}

			{/* Additional generic columns if needed */}
			{Array.from({ length: Math.max(0, columns - 4) }).map((_, i) => (
				<td key={i} className="px-4 py-3">
					<SkeletonText width="1/2" size="sm" />
				</td>
			))}
		</tr>
	);
}

interface SkeletonTableProp {
	rows?: number;
	columns?: number;
	hasActions?: boolean;
	hasRoleBadge?: boolean;
	showHeader?: boolean;
}

export function SkeletonTable({
	rows = 5,
	columns = 4,
	hasActions = true,
	hasRoleBadge = true,
	showHeader = true,
}: SkeletonTableProp) {
	return (
		<div className="overflow-x-auto" role="presentation" aria-hidden="true">
			<table className="w-full text-sm">
				{showHeader && (
					<thead>
						<tr className="border-b border-zinc-200 dark:border-zinc-700">
							<th className="px-4 py-3 text-left">
								<SkeletonText width="1/2" size="sm" />
							</th>
							<th className="px-4 py-3 text-left">
								<SkeletonText width="1/2" size="sm" />
							</th>
							{hasRoleBadge && (
								<th className="px-4 py-3 text-left">
									<SkeletonText width="1/3" size="sm" />
								</th>
							)}
							{hasActions && (
								<th className="px-4 py-3 text-left">
									<SkeletonText width="1/3" size="sm" />
								</th>
							)}
						</tr>
					</thead>
				)}
				<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
					{Array.from({ length: rows }).map((_, i) => (
						<SkeletonTableRow
							key={i}
							columns={columns}
							hasActions={hasActions}
							hasRoleBadge={hasRoleBadge}
						/>
					))}
				</tbody>
			</table>
		</div>
	);
}
