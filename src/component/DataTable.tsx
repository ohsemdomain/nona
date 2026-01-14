import { useState, type ReactNode } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { clsx } from "clsx";

type SortDirection = "asc" | "desc";

interface Column<T> {
	key: string;
	header: string;
	sortable?: boolean;
	render?: (item: T) => ReactNode;
	className?: string;
}

interface DataTableProp<T> {
	data: T[];
	columnList: Column<T>[];
	keyExtractor: (item: T) => string;
	onSort?: (key: string, direction: SortDirection) => void;
	className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
	data,
	columnList,
	keyExtractor,
	onSort,
	className,
}: DataTableProp<T>) {
	const [sortKey, setSortKey] = useState<string | null>(null);
	const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

	const handleSort = (key: string) => {
		const newDirection =
			sortKey === key && sortDirection === "asc" ? "desc" : "asc";
		setSortKey(key);
		setSortDirection(newDirection);
		onSort?.(key, newDirection);
	};

	return (
		<div className={clsx("overflow-x-auto", className)}>
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-geist-border">
						{columnList.map((column) => (
							<th
								key={column.key}
								className={clsx(
									"px-4 py-2 text-left text-xs font-medium uppercase tracking-wide text-geist-fg-muted",
									column.sortable && "cursor-pointer select-none",
									column.className,
								)}
								onClick={
									column.sortable ? () => handleSort(column.key) : undefined
								}
							>
								<div className="flex items-center gap-1">
									{column.header}
									{column.sortable &&
										sortKey === column.key &&
										(sortDirection === "asc" ? (
											<ChevronUp className="h-3 w-3" />
										) : (
											<ChevronDown className="h-3 w-3" />
										))}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-geist-border">
					{data.map((item) => (
						<tr
							key={keyExtractor(item)}
							className="hover:bg-geist-bg-secondary"
						>
							{columnList.map((column) => (
								<td
									key={column.key}
									className={clsx(
										"px-4 py-2.5 text-geist-fg",
										column.className,
									)}
								>
									{column.render
										? column.render(item)
										: String(item[column.key] ?? "")}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
