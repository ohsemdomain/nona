import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { CONFIG } from "@/src/lib/config";

interface UsePaginationReturn {
	page: number;
	pageSize: number;
	offset: number;
	setPage: (page: number) => void;
	nextPage: () => void;
	prevPage: () => void;
	reset: () => void;
}

export function usePagination(
	initialPageSize: number = CONFIG.pageSize,
): UsePaginationReturn {
	const [searchParams, setSearchParams] = useSearchParams();

	// Read from URL, fallback to defaults (handle invalid values)
	const page = Math.max(
		1,
		parseInt(searchParams.get("page") || "1", 10) || 1,
	);
	const pageSize = Math.max(
		1,
		parseInt(searchParams.get("pageSize") || String(initialPageSize), 10) ||
			initialPageSize,
	);

	const setPage = useCallback(
		(newPage: number) => {
			setSearchParams((prev) => {
				const validated = Math.max(1, newPage);
				if (validated === 1) {
					prev.delete("page"); // Clean URL for page 1
				} else {
					prev.set("page", String(validated));
				}
				return prev;
			});
		},
		[setSearchParams],
	);

	const nextPage = useCallback(() => {
		setSearchParams((prev) => {
			const currentPage = parseInt(prev.get("page") || "1", 10) || 1;
			prev.set("page", String(currentPage + 1));
			return prev;
		});
	}, [setSearchParams]);

	const prevPage = useCallback(() => {
		setSearchParams((prev) => {
			const currentPage = parseInt(prev.get("page") || "1", 10) || 1;
			const newPage = Math.max(1, currentPage - 1);
			if (newPage === 1) {
				prev.delete("page"); // Clean URL for page 1
			} else {
				prev.set("page", String(newPage));
			}
			return prev;
		});
	}, [setSearchParams]);

	const reset = useCallback(() => {
		setSearchParams((prev) => {
			prev.delete("page");
			return prev;
		});
	}, [setSearchParams]);

	return {
		page,
		pageSize,
		offset: (page - 1) * pageSize,
		setPage,
		nextPage,
		prevPage,
		reset,
	};
}
