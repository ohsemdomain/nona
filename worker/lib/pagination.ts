import { paginationSchema } from "@/shared/schema/pagination";

interface PaginationResult {
	page: number;
	pageSize: number;
	offset: number;
	limit: number;
}

export function parsePagination(
	query: Record<string, string | undefined>,
): PaginationResult {
	const result = paginationSchema.safeParse({
		page: query.page,
		pageSize: query.pageSize,
	});

	if (!result.success) {
		return { page: 1, pageSize: 20, offset: 0, limit: 20 };
	}

	const { page, pageSize } = result.data;
	return {
		page,
		pageSize,
		offset: (page - 1) * pageSize,
		limit: pageSize,
	};
}
