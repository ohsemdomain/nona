import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useUIStore } from "@/src/store/ui";
import { useIsMobile } from "@/src/hook/useIsMobile";
import { useFilter } from "@/src/hook/useFilter";
import { usePagination } from "@/src/hook/usePagination";
import {
	MasterDetail,
	MasterList,
	MasterListItem,
	DetailPanel,
	SearchInput,
	Button,
	LoadingBoundary,
	EmptyState,
	SkeletonList,
	SkeletonDetailPanel,
} from "@/src/component";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import type { Role, RoleWithPermission } from "@/shared/type";
import {
	RoleDetail,
	RoleFormModal,
	RoleDeleteDialog,
} from "@/src/feature/role";

interface ListResponse {
	data: Role[];
	total: number;
}

const MODAL_ID = {
	create: "role-create",
	edit: "role-edit",
	delete: "role-delete",
};

export function RolePage() {
	const { openModal } = useUIStore();
	const isMobile = useIsMobile();
	const [selectedId, setSelectedId] = useState<number | null>(null);

	const { search, setSearch, queryParam } = useFilter();
	const { page, pageSize, reset: resetPagination } = usePagination();

	// Fetch role list with server-side search and pagination
	const {
		data,
		isLoading: isListLoading,
		isError: isListError,
		refetch: refetchList,
	} = useQuery({
		queryKey: queryKey.role.list({ ...queryParam, page, pageSize }),
		queryFn: () =>
			api.get<ListResponse>(
				`/role?${new URLSearchParams({
					...queryParam,
					page: String(page),
					pageSize: String(pageSize),
				})}`,
			),
	});

	const roleList = data?.data ?? [];

	// Fetch selected role detail
	const {
		data: selectedRole,
		isLoading: isDetailLoading,
		refetch: refetchDetail,
	} = useQuery({
		queryKey: queryKey.role.detail(selectedId!),
		queryFn: () => api.get<RoleWithPermission>(`/role/${selectedId}`),
		enabled: selectedId !== null,
	});

	// Auto-select first item when list loads (desktop only)
	const computedSelectedId = useMemo(() => {
		// If we have a selection and it exists in the list, keep it
		if (selectedId !== null) {
			const exists = roleList.some((role) => role.id === selectedId);
			if (exists) return selectedId;
		}

		// Auto-select first on desktop if no selection
		if (!isMobile && roleList.length > 0) {
			return roleList[0].id;
		}

		return null;
	}, [selectedId, roleList, isMobile]);

	// Sync computed selection back to state
	useEffect(() => {
		if (computedSelectedId !== selectedId) {
			setSelectedId(computedSelectedId);
		}
	}, [computedSelectedId, selectedId]);

	// Reset pagination when search changes
	useEffect(() => {
		resetPagination();
	}, [queryParam, resetPagination]);

	const handleCreate = () => {
		openModal(MODAL_ID.create);
	};

	const handleEdit = () => {
		if (selectedRole) {
			openModal(MODAL_ID.edit, selectedRole);
		}
	};

	const handleDelete = () => {
		if (selectedRole) {
			openModal(MODAL_ID.delete, selectedRole);
		}
	};

	const selectAfterCreate = useCallback((role: Role) => {
		setSelectedId(role.id);
	}, []);

	const selectAfterDelete = useCallback(() => {
		// Select next item or null
		if (roleList.length <= 1) {
			setSelectedId(null);
			return;
		}

		const currentIndex = roleList.findIndex((r) => r.id === selectedId);
		if (currentIndex === -1) {
			setSelectedId(roleList[0]?.id ?? null);
			return;
		}

		const nextIndex =
			currentIndex < roleList.length - 1 ? currentIndex + 1 : currentIndex - 1;
		setSelectedId(roleList[nextIndex]?.id ?? null);
	}, [roleList, selectedId]);

	return (
		<>
			<MasterDetail selectedId={selectedId}>
				<MasterList
					header={
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h1 className="text-lg font-semibold text-geist-fg">
									Role
								</h1>
								<Button size="sm" onClick={handleCreate}>
									<Plus className="h-4 w-4" />
									New
								</Button>
							</div>
							<SearchInput
								value={search}
								onChange={setSearch}
								placeholder="Search role..."
							/>
						</div>
					}
				>
					<LoadingBoundary
						isLoading={isListLoading}
						isError={isListError}
						onRetry={refetchList}
						loadingFallback={<SkeletonList count={5} variant="simple" />}
					>
						{roleList.length === 0 ? (
							<EmptyState
								title="No role"
								message="Create your first role to get started."
								action={
									<Button size="sm" onClick={handleCreate}>
										<Plus className="h-4 w-4" />
										Create Role
									</Button>
								}
							/>
						) : (
							roleList.map((role) => (
								<MasterListItem
									key={role.id}
									isSelected={selectedId === role.id}
									onClick={() => setSelectedId(role.id)}
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-geist-fg">
											{role.name}
										</p>
										<span className="text-xs text-geist-fg-muted">
											{role.userCount ?? 0} user
										</span>
									</div>
									{role.description && (
										<p className="text-sm text-geist-fg-muted truncate">
											{role.description}
										</p>
									)}
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel onBack={() => setSelectedId(null)} backLabel="Role">
					{selectedRole ? (
						<RoleDetail
							role={selectedRole}
							onEdit={handleEdit}
							onDelete={handleDelete}
							onPermissionChange={refetchDetail}
						/>
					) : isDetailLoading ? (
						<SkeletonDetailPanel fieldCount={4} />
					) : (
						<EmptyState
							title="No role selected"
							message="Select a role from the list to view detail."
						/>
					)}
				</DetailPanel>
			</MasterDetail>

			<RoleFormModal
				id={MODAL_ID.create}
				onSuccess={selectAfterCreate}
			/>
			<RoleFormModal id={MODAL_ID.edit} onSuccess={() => refetchDetail()} />
			<RoleDeleteDialog
				id={MODAL_ID.delete}
				onSuccess={selectAfterDelete}
			/>
		</>
	);
}
