import { useMemo, useState } from "react";
import { FileText, X, Filter } from "lucide-react";
import {
	MasterDetail,
	MasterList,
	Button,
	Pagination,
	EmptyState,
	PermissionGuard,
} from "@/src/component";
import { CompactLogItem } from "@/src/feature/audit/component";
import { useFilter } from "@/src/hook/useFilter";
import { usePagination } from "@/src/hook/usePagination";
import {
	useSystemAuditLog,
	type SystemAuditLogFilter,
} from "@/src/hook/useSystemAuditLog";
import { PERMISSION } from "@/shared/constant/permission";
import { AUDIT_ACTION, AUDIT_RESOURCE } from "@/shared/type";
import type { AuditAction, AuditResource } from "@/shared/type";

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
	const { search, setSearch, filterMap, setFilter, clearFilter } = useFilter();
	const { page, pageSize, setPage } = usePagination(50);
	const [showMobileFilter, setShowMobileFilter] = useState(false);

	const filter = useMemo((): SystemAuditLogFilter => ({
		resource: (filterMap.resource as AuditResource) || "",
		action: (filterMap.action as AuditAction) || "",
		actorName: search,
	}), [filterMap.resource, filterMap.action, search]);

	const { data, total, isLoading, isError } = useSystemAuditLog({
		filter,
		page,
		pageSize,
	});

	const hasActiveFilter = useMemo(() => {
		return !!(filterMap.resource || filterMap.action || search);
	}, [filterMap.resource, filterMap.action, search]);

	const FilterContent = () => (
		<div className="space-y-4 p-5">
			<div>
				<label htmlFor="filter-resource" className="block text-xs font-medium text-geist-fg-muted mb-2">
					Resource
				</label>
				<select
					id="filter-resource"
					value={filterMap.resource || ""}
					onChange={(e) => setFilter("resource", e.target.value)}
					className="w-full rounded border border-geist-border bg-geist-bg px-3 py-2 text-sm text-geist-fg focus:border-geist-fg focus:outline-none"
				>
					{RESOURCE_OPTION.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			<div>
				<label htmlFor="filter-action" className="block text-xs font-medium text-geist-fg-muted mb-2">
					Action
				</label>
				<select
					id="filter-action"
					value={filterMap.action || ""}
					onChange={(e) => setFilter("action", e.target.value)}
					className="w-full rounded border border-geist-border bg-geist-bg px-3 py-2 text-sm text-geist-fg focus:border-geist-fg focus:outline-none"
				>
					{ACTION_OPTION.map((opt) => (
						<option key={opt.value} value={opt.value}>
							{opt.label}
						</option>
					))}
				</select>
			</div>

			<div>
				<label htmlFor="filter-actor" className="block text-xs font-medium text-geist-fg-muted mb-2">
					Actor
				</label>
				<input
					id="filter-actor"
					type="text"
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search actor..."
					className="w-full rounded border border-geist-border bg-geist-bg px-3 py-2 text-sm text-geist-fg placeholder:text-geist-fg-muted focus:border-geist-fg focus:outline-none"
				/>
			</div>

			{hasActiveFilter && (
				<Button
					variant="secondary"
					size="sm"
					onClick={clearFilter}
					className="w-full"
				>
					<X className="h-4 w-4" />
					Clear All
				</Button>
			)}
		</div>
	);

	// Use a dummy selectedId to keep sidebar visible on desktop
	const dummySelectedId = "log";

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
			<MasterDetail selectedId={dummySelectedId}>
				<MasterList
					header={
						<div className="border-b border-geist-border px-5 py-5">
							<h1 className="text-lg font-semibold text-geist-fg">Filter</h1>
						</div>
					}
				>
					<FilterContent />
				</MasterList>

				<div className="flex h-full flex-1 flex-col bg-geist-bg">
					{/* Header */}
					<div className="shrink-0 border-b border-geist-border px-5 py-5">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3">
								<h2 className="text-base font-semibold text-geist-fg">
									System Log
								</h2>
								{total > 0 && (
									<span className="text-sm text-geist-fg-muted">
										{total} entries
									</span>
								)}
							</div>
							{/* Mobile filter toggle */}
							<Button
								variant="secondary"
								size="sm"
								onClick={() => setShowMobileFilter(!showMobileFilter)}
								className="lg:hidden"
							>
								<Filter className="h-4 w-4" />
								Filter
								{hasActiveFilter && (
									<span className="ml-1 h-2 w-2 rounded-full bg-geist-success" />
								)}
							</Button>
						</div>

						{/* Mobile filter panel */}
						{showMobileFilter && (
							<div className="mt-4 border-t border-geist-border pt-4 lg:hidden">
								<FilterContent />
							</div>
						)}
					</div>

					{/* Log List */}
					<div className="flex-1 overflow-auto py-1">
						{isLoading ? (
							<div className="space-y-0.5 px-3">
								{Array.from({ length: 20 }).map((_, i) => (
									<div
										key={i}
										className="h-4 animate-pulse rounded bg-geist-bg-secondary"
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
								icon={<FileText className="h-8 w-8 text-geist-fg-muted" />}
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
					{total > pageSize && (
						<div className="shrink-0 border-t border-geist-border px-4 py-2">
							<Pagination
								page={page}
								pageSize={pageSize}
								total={total}
								onPageChange={setPage}
							/>
						</div>
					)}
				</div>
			</MasterDetail>
		</PermissionGuard>
	);
}
