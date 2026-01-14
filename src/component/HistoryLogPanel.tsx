import { useState } from "react";
import { History } from "lucide-react";
import { useAuditLog } from "@/src/hook/useAuditLog";
import { EmptyState } from "./EmptyState";
import { Pagination } from "./Pagination";
import { HistoryLogList } from "./HistoryLogList";
import { SkeletonHistoryLog } from "./skeleton";
import type { AuditResource } from "@/shared/type";

interface HistoryLogPanelProp {
	resourceType: AuditResource;
	resourceId: string;
	resourceName?: string;
	pageSize?: number;
	className?: string;
}

/**
 * Container component for displaying audit history of a resource.
 */
export function HistoryLogPanel({
	resourceType,
	resourceId,
	resourceName,
	pageSize = 10,
	className,
}: HistoryLogPanelProp) {
	const [page, setPage] = useState(1);

	const { data, total, isLoading, isError } = useAuditLog({
		resource: resourceType,
		resourceId,
		page,
		pageSize,
	});

	// Loading state
	if (isLoading) {
		return <SkeletonHistoryLog count={3} className={className} />;
	}

	// Error state
	if (isError) {
		return (
			<EmptyState
				title="Unable to load history"
				message="There was an error loading the audit history. Please try again."
				className={className}
			/>
		);
	}

	// Empty state
	if (!data || data.length === 0) {
		return (
			<EmptyState
				icon={<History className="h-12 w-12 text-geist-fg-muted" />}
				title="No history yet"
				message={`No changes have been recorded for this ${resourceType}.`}
				className={className}
			/>
		);
	}

	return (
		<div className={className}>
			<HistoryLogList
				entries={data}
				resourceType={resourceType}
				resourceName={resourceName}
			/>

			{total > pageSize && (
				<div className="mt-4">
					<Pagination
						page={page}
						pageSize={pageSize}
						total={total}
						onPageChange={setPage}
					/>
				</div>
			)}
		</div>
	);
}
