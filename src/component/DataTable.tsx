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
					<tr className="border-b border-zinc-200 dark:border-zinc-700">
						{columnList.map((column) => (
							<th
								key={column.key}
								className={clsx(
									"px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400",
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
											<ChevronUp className="h-4 w-4" />
										) : (
											<ChevronDown className="h-4 w-4" />
										))}
								</div>
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
					{data.map((item) => (
						<tr
							key={keyExtractor(item)}
							className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
						>
							{columnList.map((column) => (
								<td
									key={column.key}
									className={clsx(
										"px-4 py-3 text-zinc-900 dark:text-zinc-100",
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
