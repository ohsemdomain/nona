import { useMemo } from "react";
import { FileText, X, ChevronDown } from "lucide-react";
import {
	SearchInput,
	Button,
	Pagination,
	EmptyState,
	PermissionGuard,
	Dropdown,
	DropdownTrigger,
	DropdownContent,
	DropdownRadioGroup,
	DropdownRadioItem,
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
	const { search, setSearch, filterMap, setFilter, clearFilter } = useFilter();
	const { page, pageSize, setPage } = usePagination(50);

	// Map useFilter state to the hook's expected format
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
				<div className="shrink-0 border-b border-geist-border bg-geist-bg px-4 py-3">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<h1 className="text-lg font-semibold text-geist-fg">
								System Log
							</h1>
							{total > 0 && (
								<span className="text-sm text-geist-fg-muted">
									{total} entries
								</span>
							)}
						</div>
						{hasActiveFilter && (
							<Button variant="secondary" size="sm" onClick={clearFilter}>
								<X className="h-4 w-4" />
								Clear
							</Button>
						)}
					</div>
					<div className="mt-3 flex items-center gap-2">
						<Dropdown>
							<DropdownTrigger asChild>
								<Button variant="secondary" size="md" className="min-w-[200px] justify-start">
									<span className="flex-1 text-left">
										{RESOURCE_OPTION.find((o) => o.value === filterMap.resource)?.label ?? "All"}
									</span>
									<ChevronDown className="h-3 w-3" />
								</Button>
							</DropdownTrigger>
							<DropdownContent align="start">
								<DropdownRadioGroup
									value={filterMap.resource || ""}
									onValueChange={(value) => setFilter("resource", value)}
								>
									{RESOURCE_OPTION.map((opt) => (
										<DropdownRadioItem key={opt.value} value={opt.value}>
											{opt.label}
										</DropdownRadioItem>
									))}
								</DropdownRadioGroup>
							</DropdownContent>
						</Dropdown>
						<Dropdown>
							<DropdownTrigger asChild>
								<Button variant="secondary" size="md" className="min-w-[200px] justify-start">
									<span className="flex-1 text-left">
										{ACTION_OPTION.find((o) => o.value === filterMap.action)?.label ?? "All"}
									</span>
									<ChevronDown className="h-3 w-3" />
								</Button>
							</DropdownTrigger>
							<DropdownContent align="start">
								<DropdownRadioGroup
									value={filterMap.action || ""}
									onValueChange={(value) => setFilter("action", value)}
								>
									{ACTION_OPTION.map((opt) => (
										<DropdownRadioItem key={opt.value} value={opt.value}>
											{opt.label}
										</DropdownRadioItem>
									))}
								</DropdownRadioGroup>
							</DropdownContent>
						</Dropdown>
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder="Search actor..."
							className="w-40"
						/>
					</div>
				</div>

				{/* Log */}
				<div className="flex-1 overflow-auto bg-geist-bg py-1">
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
					<div className="shrink-0 border-t border-geist-border bg-geist-bg px-4 py-2">
						<Pagination
							page={page}
							pageSize={pageSize}
							total={total}
							onPageChange={setPage}
						/>
					</div>
				)}
			</div>
		</PermissionGuard>
	);
}
