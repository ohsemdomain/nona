import { Plus } from "lucide-react";
import { Modal, FormField, Input, Select, Button } from "@/src/component";
import { useFormModal } from "@/src/hook/useFormModal";
import { useInlineModal } from "@/src/hook/useInlineModal";
import { useResource } from "@/src/hook/useResource";
import type { Item, Category, CreateItemInput, UpdateItemInput } from "@/shared/type";
import { CategoryFormModal } from "@/src/page/category/CategoryFormModal";

interface ItemFormModalProp {
    id: string;
    onSuccess?: (item: Item) => void;
    onClose?: () => void;
}

interface FormState {
    name: string;
    categoryId: string;
    price: string;
}

const initialForm: FormState = {
    name: "",
    categoryId: "",
    price: "",
};

const INLINE_CATEGORY_MODAL_ID = "item-inline-category";

export function ItemFormModal({ id, onSuccess, onClose }: ItemFormModalProp) {
    const categoryResource = useResource<Category>("category", "Category");
    const { data: categoryList = [] } = categoryResource.list();

    const modal = useFormModal<Item, FormState, CreateItemInput, UpdateItemInput>({
        id,
        resource: "item",
        resourceLabel: "Item",
        initialForm,
        toForm: (item) => ({
            name: item.name,
            categoryId: String(item.categoryId),
            price: String(item.price / 100),
        }),
        toCreateInput: (form) => ({
            name: form.name.trim(),
            categoryId: parseInt(form.categoryId),
            price: Math.round(parseFloat(form.price) * 100),
        }),
        toUpdateInput: (form) => ({
            name: form.name.trim(),
            categoryId: parseInt(form.categoryId),
            price: Math.round(parseFloat(form.price) * 100),
        }),
        validate: (form) => {
            const error: Record<string, string> = {};
            if (!form.name.trim()) {
                error.name = "Name is required";
            }
            if (!form.categoryId) {
                error.categoryId = "Category is required";
            }
            const priceNum = parseFloat(form.price);
            if (isNaN(priceNum) || priceNum < 0) {
                error.price = "Price must be a valid positive number";
            }
            return error;
        },
        onSuccess,
    });

    // Inline modal hook for category - handleSuccess is stable
    const categoryModal = useInlineModal<Category>(
        INLINE_CATEGORY_MODAL_ID,
        (_key, category) => {
            modal.setField("categoryId", String(category.id));
        },
    );

    const handleClose = () => {
        modal.handleClose();
        onClose?.();
    };

    return (
        <>
            <Modal
                id={id}
                title={modal.isEdit ? "Edit Item" : "Create Item"}
                onClose={handleClose}
            >
                <form onSubmit={modal.handleSubmit} className="space-y-4">
                    <FormField
                        label="Name"
                        htmlFor={`${id}-name`}
                        error={modal.error.name}
                        required
                    >
                        <Input
                            id={`${id}-name`}
                            value={modal.form.name}
                            onChange={(e) => modal.setField("name", e.target.value)}
                            placeholder="Enter item name"
                            disabled={modal.isPending}
                        />
                    </FormField>

                    <FormField
                        label="Category"
                        htmlFor={`${id}-category`}
                        error={modal.error.categoryId}
                        required
                    >
                        <div className="flex gap-2">
                            <Select
                                id={`${id}-category`}
                                value={modal.form.categoryId}
                                onChange={(e) => modal.setField("categoryId", e.target.value)}
                                disabled={modal.isPending}
                            >
                                <option value="">Select category...</option>
                                {categoryList.map((cat) => (
                                    <option key={cat.publicId} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </Select>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => categoryModal.openCreate("category")}
                                disabled={modal.isPending}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </FormField>

                    <FormField
                        label="Price"
                        htmlFor={`${id}-price`}
                        error={modal.error.price}
                        required
                    >
                        <Input
                            id={`${id}-price`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={modal.form.price}
                            onChange={(e) => modal.setField("price", e.target.value)}
                            placeholder="0.00"
                            disabled={modal.isPending}
                        />
                    </FormField>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={modal.closeModal}
                            disabled={modal.isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={modal.isPending}>
                            {modal.isEdit ? "Save Changes" : "Create"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <CategoryFormModal
                id={INLINE_CATEGORY_MODAL_ID}
                onSuccess={categoryModal.handleSuccess}
                onClose={categoryModal.clearPending}
            />
        </>
    );
}
