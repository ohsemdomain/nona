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
} from "@/src/component";
import type { Category } from "@/shared/type";
import {
	CategoryDetail,
	CategoryFormModal,
	CategoryDeleteDialog,
} from "@/src/feature/category";

const MODAL_ID = {
	create: "category-create",
	edit: "category-edit",
	delete: "category-delete",
};

export function CategoryPage() {
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
	} = useMasterDetail<Category>("category");

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
						<div className="space-y-3 border-b border-geist-border px-5 py-5">
							<div className="flex items-center justify-between">
								<h1 className="text-lg font-semibold text-geist-fg">
									Category
								</h1>
								<Button size="sm" onClick={handleCreate}>
									<Plus className="h-4 w-4" />
									New
								</Button>
							</div>
							<SearchInput
								value={search}
								onChange={setSearch}
								placeholder="Search category..."
							/>
						</div>
					}
				>
					<LoadingBoundary
						isLoading={isLoading}
						isError={isError}
						onRetry={refetch}
						loadingFallback={<SkeletonList count={8} variant="simple" />}
					>
						{list.length === 0 ? (
							<EmptyState
								title="No category"
								message="Create your first category to get started."
								action={
									<Button size="sm" onClick={handleCreate}>
										<Plus className="h-4 w-4" />
										Create Category
									</Button>
								}
							/>
						) : (
							list.map((category) => (
								<MasterListItem
									key={category.publicId}
									isSelected={selectedId === category.publicId}
									onClick={() => setSelectedId(category.publicId)}
								>
									<p className="font-medium text-geist-fg">
										{category.name}
									</p>
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel onBack={() => setSelectedId(null)} backLabel="Category">
					{selectedItem ? (
						<CategoryDetail
							category={selectedItem}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					) : isLoading ? (
						<SkeletonDetailPanel fieldCount={3} />
					) : (
						<EmptyState
							title="No category selected"
							message="Select a category from the list to view detail."
						/>
					)}
				</DetailPanel>
			</MasterDetail>

			<CategoryFormModal
				id={MODAL_ID.create}
				onSuccess={(category) => selectAfterCreate(category.publicId)}
			/>
			<CategoryFormModal id={MODAL_ID.edit} />
			<CategoryDeleteDialog
				id={MODAL_ID.delete}
				onSuccess={selectAfterDelete}
			/>
		</>
	);
}
