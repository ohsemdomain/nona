import { Plus } from "lucide-react";
import { useMasterDetail } from "@/src/hook/useMasterDetail";
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
	PermissionGuard,
} from "@/src/component";
import { PERMISSION } from "@/shared/constant/permission";
import { getRoleColorClasses } from "@/shared/constant/auth";
import type { User } from "@/shared/type";
import {
	UserDetail,
	UserFormModal,
	UserDeleteDialog,
} from "@/src/feature/user";

const MODAL_ID = {
	create: "user-create",
	edit: "user-edit",
	delete: "user-delete",
};

export function UserPage() {
	const { openModal } = useUIStore();

	const {
		list,
		isLoading,
		isError,
		refetch,
		selectedId,
		selectedItem,
		setSelectedId,
		search,
		setSearch,
		selectAfterCreate,
		selectAfterDelete,
	} = useMasterDetail<User>("user");

	const handleCreate = () => {
		openModal(MODAL_ID.create);
	};

	const handleEdit = () => {
		if (selectedItem) {
			openModal(MODAL_ID.edit, selectedItem);
		}
	};

	const handleDelete = () => {
		if (selectedItem) {
			openModal(MODAL_ID.delete, selectedItem);
		}
	};

	return (
		<>
			<MasterDetail selectedId={selectedId}>
				<MasterList
					header={
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h1 className="text-lg font-semibold text-geist-fg">
									User
								</h1>
								<PermissionGuard permission={PERMISSION.USER_CREATE}>
									<Button size="sm" onClick={handleCreate}>
										<Plus className="h-4 w-4" />
										New
									</Button>
								</PermissionGuard>
							</div>
							<SearchInput
								value={search}
								onChange={setSearch}
								placeholder="Search user..."
							/>
						</div>
					}
				>
					<LoadingBoundary
						isLoading={isLoading}
						isError={isError}
						onRetry={refetch}
						loadingFallback={<SkeletonList count={8} variant="detailed" />}
					>
						{list.length === 0 ? (
							<EmptyState
								title="No user"
								message="Create your first user to get started."
								action={
									<PermissionGuard permission={PERMISSION.USER_CREATE}>
										<Button size="sm" onClick={handleCreate}>
											<Plus className="h-4 w-4" />
											Create User
										</Button>
									</PermissionGuard>
								}
							/>
						) : (
							list.map((user) => (
								<MasterListItem
									key={user.publicId}
									isSelected={selectedId === user.publicId}
									onClick={() => setSelectedId(user.publicId)}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="min-w-0 flex-1">
											<p className="font-medium text-geist-fg">
												{user.name}
											</p>
											<p className="text-sm text-geist-fg-muted">
												{user.email}
											</p>
										</div>
										<span
											className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getRoleColorClasses(user.roleName)}`}
										>
											{user.roleName || "No role"}
										</span>
									</div>
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel onBack={() => setSelectedId(null)} backLabel="User">
					{selectedItem ? (
						<UserDetail
							user={selectedItem}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					) : isLoading ? (
						<SkeletonDetailPanel fieldCount={5} />
					) : (
						<EmptyState
							title="No user selected"
							message="Select a user from the list to view detail."
						/>
					)}
				</DetailPanel>
			</MasterDetail>

			<UserFormModal
				id={MODAL_ID.create}
				onSuccess={(user) => selectAfterCreate(user.publicId)}
			/>
			<UserFormModal id={MODAL_ID.edit} />
			<UserDeleteDialog
				id={MODAL_ID.delete}
				onSuccess={selectAfterDelete}
			/>
		</>
	);
}
