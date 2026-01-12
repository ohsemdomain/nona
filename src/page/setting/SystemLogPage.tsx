import { useState, useMemo } from "react";
import { FileText, X } from "lucide-react";
import {
	Select,
	SearchInput,
	Button,
	Pagination,
	EmptyState,
	PermissionGuard,
} from "@/src/component";
import { HistoryLogItem } from "@/src/component/HistoryLogItem";
import { SkeletonHistoryLog } from "@/src/component/skeleton";
import {
	useSystemAuditLog,
	type SystemAuditLogFilter,
} from "@/src/hook/useSystemAuditLog";
import { PERMISSION } from "@/shared/constant/permission";
import { AUDIT_ACTION, AUDIT_RESOURCE } from "@/shared/type";
import type { AuditAction, AuditResource } from "@/shared/type";

const PAGE_SIZE = 20;

const RESOURCE_OPTION = [
	{ value: "", label: "All Resource" },
	{ value: AUDIT_RESOURCE.USER, label: "User" },
	{ value: AUDIT_RESOURCE.CATEGORY, label: "Category" },
	{ value: AUDIT_RESOURCE.ITEM, label: "Item" },
	{ value: AUDIT_RESOURCE.ORDER, label: "Order" },
	{ value: AUDIT_RESOURCE.AUTH, label: "Auth" },
];

const ACTION_OPTION = [
	{ value: "", label: "All Action" },
	{ value: AUDIT_ACTION.CREATE, label: "Create" },
	{ value: AUDIT_ACTION.UPDATE, label: "Update" },
	{ value: AUDIT_ACTION.DELETE, label: "Delete" },
	{ value: AUDIT_ACTION.LOGIN, label: "Login" },
	{ value: AUDIT_ACTION.LOGOUT, label: "Logout" },
];

export function SystemLogPage() {
	const [page, setPage] = useState(1);
	const [filter, setFilter] = useState<SystemAuditLogFilter>({
		resource: "",
		action: "",
		actorName: "",
	});

	const { data, total, isLoading, isError } = useSystemAuditLog({
		filter,
		page,
		pageSize: PAGE_SIZE,
	});

	// Check if any filter is active
	const hasActiveFilter = useMemo(() => {
		return !!(filter.resource || filter.action || filter.actorName);
	}, [filter]);

	const handleResourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilter((prev) => ({ ...prev, resource: e.target.value as AuditResource | "" }));
		setPage(1);
	};

	const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setFilter((prev) => ({ ...prev, action: e.target.value as AuditAction | "" }));
		setPage(1);
	};

	const handleActorNameChange = (value: string) => {
		setFilter((prev) => ({ ...prev, actorName: value }));
		setPage(1);
	};

	const handleClearFilter = () => {
		setFilter({ resource: "", action: "", actorName: "" });
		setPage(1);
	};

	return (
		<PermissionGuard
			permission={PERMISSION.USER_READ}
			fallback={
				<EmptyState
					title="Access Denied"
					message="You do not have permission to view system log."
				/>
			}
		>
			<div className="flex h-full flex-col">
				{/* Header */}
				<div className="shrink-0 border-b border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
					<div className="flex items-center justify-between">
						<h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
							System Log
						</h1>
						{hasActiveFilter && (
							<Button variant="secondary" size="sm" onClick={handleClearFilter}>
								<X className="h-4 w-4" />
								Clear Filter
							</Button>
						)}
					</div>

					{/* Filter Bar */}
					<div className="mt-4 flex flex-wrap gap-3">
						<div className="w-36">
							<Select
								value={filter.resource}
								onChange={handleResourceChange}
								aria-label="Filter by resource"
							>
								{RESOURCE_OPTION.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</Select>
						</div>
						<div className="w-36">
							<Select
								value={filter.action}
								onChange={handleActionChange}
								aria-label="Filter by action"
							>
								{ACTION_OPTION.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</Select>
						</div>
						<div className="w-48">
							<SearchInput
								value={filter.actorName ?? ""}
								onChange={handleActorNameChange}
								placeholder="Search by actor..."
							/>
						</div>
					</div>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-auto p-4">
					{isLoading ? (
						<SkeletonHistoryLog count={5} />
					) : isError ? (
						<EmptyState
							title="Unable to load log"
							message="There was an error loading the system log. Please try again."
						/>
					) : !data || data.length === 0 ? (
						<EmptyState
							icon={<FileText className="h-12 w-12 text-zinc-300 dark:text-zinc-600" />}
							title="No log found"
							message={
								hasActiveFilter
									? "No log match the current filter. Try adjusting your filter."
									: "No activity has been recorded yet."
							}
						/>
					) : (
						<ul className="space-y-3" role="list" aria-label="System activity log">
							{data.map((entry) => (
								<HistoryLogItem
									key={entry.id}
									entry={entry}
									resourceType={entry.resource}
								/>
							))}
						</ul>
					)}
				</div>

				{/* Pagination */}
				{total > PAGE_SIZE && (
					<div className="shrink-0 border-t border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800">
						<Pagination
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={setPage}
						/>
					</div>
				)}
			</div>
		</PermissionGuard>
	);
}
