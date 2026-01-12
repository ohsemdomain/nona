import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import type {
	AuditLogListResponse,
	AuditResource,
	AuditAction,
} from "@/shared/type";

export interface SystemAuditLogFilter {
	resource?: AuditResource | "";
	action?: AuditAction | "";
	actorName?: string;
	dateFrom?: number;
	dateTo?: number;
}

interface UseSystemAuditLogOption {
	filter?: SystemAuditLogFilter;
	page?: number;
	pageSize?: number;
	enabled?: boolean;
}

interface UseSystemAuditLogReturn {
	data: AuditLogListResponse["data"] | undefined;
	total: number;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
}

/**
 * Hook to fetch system-wide audit logs with filtering.
 */
export function useSystemAuditLog({
	filter = {},
	page = 1,
	pageSize = 20,
	enabled = true,
}: UseSystemAuditLogOption): UseSystemAuditLogReturn {
	// Build query params
	const param: Record<string, string | number> = { page, pageSize };

	if (filter.resource) {
		param.resource = filter.resource;
	}
	if (filter.action) {
		param.action = filter.action;
	}
	if (filter.actorName) {
		param.actorName = filter.actorName;
	}
	if (filter.dateFrom) {
		param.dateFrom = filter.dateFrom;
	}
	if (filter.dateTo) {
		param.dateTo = filter.dateTo;
	}

	// Build query string
	const queryString = new URLSearchParams(
		Object.entries(param).map(([k, v]) => [k, String(v)]),
	).toString();

	const { data, isLoading, isError, error } = useQuery({
		queryKey: queryKey.audit.system(param),
		queryFn: () => api.get<AuditLogListResponse>(`/audit/system?${queryString}`),
		enabled,
	});

	return {
		data: data?.data,
		total: data?.total ?? 0,
		isLoading,
		isError,
		error: error as Error | null,
	};
}
