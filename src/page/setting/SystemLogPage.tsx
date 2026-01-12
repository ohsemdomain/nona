import { useState, useMemo } from "react";
import { FileText, X } from "lucide-react";
import {
	Select,
	SearchInput,
	Button,
	Pagination,
	EmptyState,
	PermissionGuard,
	CompactLogItem,
} from "@/src/component";
import {
	useSystemAuditLog,
	type SystemAuditLogFilter,
} from "@/src/hook/useSystemAuditLog";
import { PERMISSION } from "@/shared/constant/permission";
import { AUDIT_ACTION, AUDIT_RESOURCE } from "@/shared/type";
import type { AuditAction, AuditResource } from "@/shared/type";

const PAGE_SIZE = 50;

const RESOURCE_OPTION = [
	{ value: "", label: "All" },
	{ value: AUDIT_RESOURCE.USER, label: "User" },
	{ value: AUDIT_RESOURCE.CATEGORY, label: "Category" },
	{ value: AUDIT_RESOURCE.ITEM, label: "Item" },
	{ value: AUDIT_RESOURCE.ORDER, label: "Order" },
	{ value: AUDIT_RESOURCE.AUTH, label: "Auth" },
];

const ACTION_OPTION = [
	{ value: "", label: "All" },
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
				<div className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
								System Log
							</h1>
							{total > 0 && (
								<span className="text-sm text-zinc-500 dark:text-zinc-400">
									{total} entries
								</span>
							)}
						</div>
						{hasActiveFilter && (
							<Button variant="secondary" size="sm" onClick={handleClearFilter}>
								<X className="h-4 w-4" />
								Clear
							</Button>
						)}
					</div>
					<div className="mt-3 flex items-center gap-2">
						<Select
							value={filter.resource}
							onChange={handleResourceChange}
							aria-label="Filter by resource"
							className="w-28"
						>
							{RESOURCE_OPTION.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</Select>
						<Select
							value={filter.action}
							onChange={handleActionChange}
							aria-label="Filter by action"
							className="w-28"
						>
							{ACTION_OPTION.map((opt) => (
								<option key={opt.value} value={opt.value}>
									{opt.label}
								</option>
							))}
						</Select>
						<div className="w-40">
							<SearchInput
								value={filter.actorName ?? ""}
								onChange={handleActorNameChange}
								placeholder="Search actor..."
							/>
						</div>
					</div>
				</div>

				{/* Log */}
				<div className="flex-1 overflow-auto bg-white py-1 dark:bg-zinc-900">
					{isLoading ? (
						<div className="space-y-0.5 px-3">
							{Array.from({ length: 20 }).map((_, i) => (
								<div
									key={i}
									className="h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
								/>
							))}
						</div>
					) : isError ? (
						<EmptyState
							title="Unable to load log"
							message="There was an error loading the system log."
						/>
					) : !data || data.length === 0 ? (
						<EmptyState
							icon={<FileText className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />}
							title="No log found"
							message={
								hasActiveFilter
									? "No log match the current filter."
									: "No activity recorded yet."
							}
						/>
					) : (
						data.map((entry) => (
							<CompactLogItem
								key={entry.id}
								entry={entry}
								resourceType={entry.resource}
							/>
						))
					)}
				</div>

				{/* Pagination */}
				{total > PAGE_SIZE && (
					<div className="shrink-0 border-t border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800">
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
