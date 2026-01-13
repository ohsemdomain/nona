import { Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { useUIStore } from "@/src/store/ui";
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
import type { Role, RoleWithPermission } from "@/shared/type";
import {
	RoleDetail,
	RoleFormModal,
	RoleDeleteDialog,
} from "@/src/feature/role";

const MODAL_ID = {
	create: "role-create",
	edit: "role-edit",
	delete: "role-delete",
};

export function RolePage() {
	const { openModal } = useUIStore();
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [search, setSearch] = useState("");

	// Fetch role list
	const {
		data: roleList = [],
		isLoading: isListLoading,
		isError: isListError,
		refetch: refetchList,
	} = useQuery({
		queryKey: ["role"],
		queryFn: () => api.get<Role[]>("/role"),
	});

	// Fetch selected role detail
	const {
		data: selectedRole,
		isLoading: isDetailLoading,
		refetch: refetchDetail,
	} = useQuery({
		queryKey: ["role", selectedId],
		queryFn: () => api.get<RoleWithPermission>(`/role/${selectedId}`),
		enabled: selectedId !== null,
	});

	// Filter by search
	const filteredList = roleList.filter((role) =>
		role.name.toLowerCase().includes(search.toLowerCase()),
	);

	// Auto-select first item when list loads
	useEffect(() => {
		if (selectedId === null && filteredList.length > 0) {
			setSelectedId(filteredList[0].id);
		}
	}, [filteredList, selectedId]);

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

	const selectAfterCreate = (role: Role) => {
		setSelectedId(role.id);
	};

	const selectAfterDelete = () => {
		setSelectedId(null);
	};

	return (
		<>
			<MasterDetail>
				<MasterList
					header={
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h1 className="text-lg font-semibold text-zinc-900 ">
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
						{filteredList.length === 0 ? (
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
							filteredList.map((role) => (
								<MasterListItem
									key={role.id}
									isSelected={selectedId === role.id}
									onClick={() => setSelectedId(role.id)}
								>
									<div className="flex items-center justify-between">
										<p className="font-medium text-zinc-900 ">
											{role.name}
										</p>
										<span className="text-xs text-zinc-500 ">
											{role.userCount ?? 0} user
										</span>
									</div>
									{role.description && (
										<p className="text-sm text-zinc-500  truncate">
											{role.description}
										</p>
									)}
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel>
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
