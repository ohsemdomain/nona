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
    LoadingState,
    EmptyState,
} from "@/src/component";
import type { Category } from "@/shared/type";
import { CategoryDetail } from "./CategoryDetail";
import { CategoryFormModal } from "./CategoryFormModal";
import { CategoryDeleteDialog } from "./CategoryDeleteDialog";

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
        selectedId,
        selectedItem,
        setSelectedId,
        search,
        setSearch,
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
            <MasterDetail>
                <MasterList
                    header={
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
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
                    {isLoading ? (
                        <LoadingState message="Loading category..." />
                    ) : list.length === 0 ? (
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
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {category.name}
                                </p>
                            </MasterListItem>
                        ))
                    )}
                </MasterList>

                <DetailPanel>
                    {selectedItem ? (
                        <CategoryDetail
                            category={selectedItem}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ) : (
                        <EmptyState
                            title="No category selected"
                            message="Select a category from the list to view detail."
                        />
                    )}
                </DetailPanel>
            </MasterDetail>

            <CategoryFormModal id={MODAL_ID.create} />
            <CategoryFormModal id={MODAL_ID.edit} />
            <CategoryDeleteDialog id={MODAL_ID.delete} />
        </>
    );
}
