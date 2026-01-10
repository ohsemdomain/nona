import { ChevronLeft, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "./Button";

interface PaginationProp {
	page: number;
	pageSize: number;
	total: number;
	onPageChange: (page: number) => void;
	className?: string;
}

export function Pagination({
	page,
	pageSize,
	total,
	onPageChange,
	className,
}: PaginationProp) {
	const totalPages = Math.ceil(total / pageSize);
	const start = (page - 1) * pageSize + 1;
	const end = Math.min(page * pageSize, total);

	if (total === 0) return null;

	return (
		<div className={clsx("flex items-center justify-between gap-4", className)}>
			<p className="text-sm text-zinc-500 dark:text-zinc-400">
				Showing {start} to {end} of {total}
			</p>
			<div className="flex items-center gap-2">
				<Button
					variant="secondary"
					size="sm"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
				>
					<ChevronLeft className="h-4 w-4" />
					<span className="sr-only">Previous page</span>
				</Button>
				<span className="text-sm text-zinc-600 dark:text-zinc-400">
					Page {page} of {totalPages}
				</span>
				<Button
					variant="secondary"
					size="sm"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
				>
					<ChevronRight className="h-4 w-4" />
					<span className="sr-only">Next page</span>
				</Button>
			</div>
		</div>
	);
}
