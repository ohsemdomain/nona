import { Plus, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
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
	Dropdown,
	DropdownTrigger,
	DropdownContent,
	DropdownRadioGroup,
	DropdownRadioItem,
} from "@/src/component";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { formatMoney } from "@/src/lib/format";
import type { Item, Category } from "@/shared/type";
import {
	ItemDetail,
	ItemFormModal,
	ItemDeleteDialog,
} from "@/src/feature/item";

const MODAL_ID = {
	create: "item-create",
	edit: "item-edit",
	delete: "item-delete",
};

interface CategoryListResponse {
	data: Category[];
	total: number;
}

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
		filterMap,
		setFilter,
		selectAfterCreate,
		selectAfterDelete,
	} = useMasterDetail<Item>("item");

	// Fetch category list for filter dropdown
	const { data: categoryData } = useQuery({
		queryKey: queryKey.category.list(),
		queryFn: () => api.get<CategoryListResponse>("/category"),
	});

	const categoryList = categoryData?.data ?? [];

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
							<Dropdown>
								<DropdownTrigger asChild>
									<Button variant="secondary" size="md" className="w-full min-w-[120px] justify-start">
										<span className="flex-1 text-left">
											{filterMap.categoryId
												? categoryList.find((c) => String(c.id) === filterMap.categoryId)?.name ?? "Category"
												: "All Category"}
										</span>
										<ChevronDown className="h-3 w-3" />
									</Button>
								</DropdownTrigger>
								<DropdownContent align="start">
									<DropdownRadioGroup
										value={filterMap.categoryId || ""}
										onValueChange={(value) => setFilter("categoryId", value)}
									>
										<DropdownRadioItem value="">All Category</DropdownRadioItem>
										{categoryList.map((cat) => (
											<DropdownRadioItem key={cat.publicId} value={String(cat.id)}>
												{cat.name}
											</DropdownRadioItem>
										))}
									</DropdownRadioGroup>
								</DropdownContent>
							</Dropdown>
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
											<p className="font-medium text-geist-fg">
												{item.name}
											</p>
											<p className="text-sm text-geist-fg-muted">
												{item.category?.name ?? "No category"}
											</p>
										</div>
										<span className="shrink-0 text-sm font-medium text-geist-fg-secondary">
											{formatMoney(item.price)}
										</span>
									</div>
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel onBack={() => setSelectedId(null)} backLabel="Item">
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
