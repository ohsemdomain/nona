import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import type { AuditLogListResponse, AuditResource } from "@/shared/type";

interface UseAuditLogOption {
	resource: AuditResource;
	resourceId: string;
	page?: number;
	pageSize?: number;
	enabled?: boolean;
}

interface UseAuditLogReturn {
	data: AuditLogListResponse["data"] | undefined;
	total: number;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
}

/**
 * Hook to fetch audit logs for a specific resource.
 */
export function useAuditLog({
	resource,
	resourceId,
	page = 1,
	pageSize = 20,
	enabled = true,
}: UseAuditLogOption): UseAuditLogReturn {
	const param = { page, pageSize };

	const { data, isLoading, isError, error } = useQuery({
		queryKey: queryKey.audit.resource(resource, resourceId, param),
		queryFn: () =>
			api.get<AuditLogListResponse>(
				`/audit/${resource}/${resourceId}?page=${page}&pageSize=${pageSize}`,
			),
		enabled: enabled && !!resourceId,
	});

	return {
		data: data?.data,
		total: data?.total ?? 0,
		isLoading,
		isError,
		error: error as Error | null,
	};
}
