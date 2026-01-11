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
import { formatMoney } from "@/src/lib/format";
import type { Item } from "@/shared/type";
import { ItemDetail } from "./ItemDetail";
import { ItemFormModal } from "./ItemFormModal";
import { ItemDeleteDialog } from "./ItemDeleteDialog";

const MODAL_ID = {
	create: "item-create",
	edit: "item-edit",
	delete: "item-delete",
};

export function ItemPage() {
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
	} = useMasterDetail<Item>("item");

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
			<MasterDetail>
				<MasterList
					header={
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
									Item
								</h1>
								<Button size="sm" onClick={handleCreate}>
									<Plus className="h-4 w-4" />
									New
								</Button>
							</div>
							<SearchInput
								value={search}
								onChange={setSearch}
								placeholder="Search item..."
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
								title="No item"
								message="Create your first item to get started."
								action={
									<Button size="sm" onClick={handleCreate}>
										<Plus className="h-4 w-4" />
										Create Item
									</Button>
								}
							/>
						) : (
							list.map((item) => (
								<MasterListItem
									key={item.publicId}
									isSelected={selectedId === item.publicId}
									onClick={() => setSelectedId(item.publicId)}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="min-w-0 flex-1">
											<p className="font-medium text-zinc-900 dark:text-zinc-100">
												{item.name}
											</p>
											<p className="text-sm text-zinc-500 dark:text-zinc-400">
												{item.category?.name ?? "No category"}
											</p>
										</div>
										<span className="shrink-0 text-sm font-medium text-zinc-600 dark:text-zinc-300">
											{formatMoney(item.price)}
										</span>
									</div>
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel>
					{selectedItem ? (
						<ItemDetail
							item={selectedItem}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					) : isLoading ? (
						<SkeletonDetailPanel fieldCount={5} />
					) : (
						<EmptyState
							title="No item selected"
							message="Select an item from the list to view detail."
						/>
					)}
				</DetailPanel>
			</MasterDetail>

			<ItemFormModal
				id={MODAL_ID.create}
				onSuccess={(item) => selectAfterCreate(item.publicId)}
			/>
			<ItemFormModal id={MODAL_ID.edit} />
			<ItemDeleteDialog
				id={MODAL_ID.delete}
				onSuccess={selectAfterDelete}
			/>
		</>
	);
}
