import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Modal, FormField, Input, Select, Button } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { useResource } from "@/src/hook/useResource";
import type { Item, Category } from "@/shared/type";
import { CategoryFormModal } from "@/src/page/category/CategoryFormModal";

interface ItemFormModalProp {
    id: string;
}

interface FormState {
    name: string;
    categoryId: string;
    price: string;
}

const initialFormState: FormState = {
    name: "",
    categoryId: "",
    price: "",
};

const INLINE_CATEGORY_MODAL_ID = "item-inline-category-create";

export function ItemFormModal({ id }: ItemFormModalProp) {
    const { getModalData, closeModal, openModal } = useUIStore();
    const { create, update } = useResource<Item>("item", "Item");
    const categoryResource = useResource<Category>("category", "Category");
    const { data: categoryList = [] } = categoryResource.list();

    const item = getModalData<Item>(id);
    const isEdit = !!item;

    const [form, setForm] = useState<FormState>(initialFormState);
    const [error, setError] = useState<Record<string, string>>({});
    const [pendingCategorySelect, setPendingCategorySelect] = useState(false);

    useEffect(() => {
        if (item) {
            setForm({
                name: item.name,
                categoryId: String(item.categoryId),
                price: String(item.price / 100),
            });
        } else {
            setForm(initialFormState);
        }
        setError({});
    }, [item]);

    // Auto-select newly created category
    useEffect(() => {
        if (pendingCategorySelect && categoryList.length > 0) {
            const newestCategory = categoryList.reduce((a, b) =>
                a.createdAt > b.createdAt ? a : b,
            );
            setForm((prev) => ({ ...prev, categoryId: String(newestCategory.id) }));
            setPendingCategorySelect(false);
        }
    }, [categoryList, pendingCategorySelect]);

    const validate = (): boolean => {
        const newError: Record<string, string> = {};

        if (!form.name.trim()) {
            newError.name = "Name is required";
        }

        if (!form.categoryId) {
            newError.categoryId = "Category is required";
        }

        const priceNum = parseFloat(form.price);
        if (isNaN(priceNum) || priceNum < 0) {
            newError.price = "Price must be a valid positive number";
        }

        setError(newError);
        return Object.keys(newError).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const priceInCents = Math.round(parseFloat(form.price) * 100);

        try {
            if (isEdit && item) {
                await update.mutateAsync({
                    id: item.publicId,
                    data: {
                        name: form.name.trim(),
                        categoryId: parseInt(form.categoryId),
                        price: priceInCents,
                    },
                });
            } else {
                await create.mutateAsync({
                    name: form.name.trim(),
                    categoryId: parseInt(form.categoryId),
                    price: priceInCents,
                });
            }
            closeModal(id);
        } catch {
            // Error is handled by useResource
        }
    };

    const handleClose = () => {
        setForm(initialFormState);
        setError({});
    };

    const handleCreateCategory = () => {
        setPendingCategorySelect(true);
        openModal(INLINE_CATEGORY_MODAL_ID);
    };

    const isPending = create.isPending || update.isPending;

    return (
        <>
            <Modal
                id={id}
                title={isEdit ? "Edit Item" : "Create Item"}
                onClose={handleClose}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <FormField
                        label="Name"
                        htmlFor={`${id}-name`}
                        error={error.name}
                        required
                    >
                        <Input
                            id={`${id}-name`}
                            value={form.name}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, name: e.target.value }))
                            }
                            placeholder="Enter item name"
                            disabled={isPending}
                        />
                    </FormField>

                    <FormField
                        label="Category"
                        htmlFor={`${id}-category`}
                        error={error.categoryId}
                        required
                    >
                        <div className="flex gap-2">
                            <Select
                                id={`${id}-category`}
                                value={form.categoryId}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        categoryId: e.target.value,
                                    }))
                                }
                                disabled={isPending}
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
                                onClick={handleCreateCategory}
                                disabled={isPending}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </FormField>

                    <FormField
                        label="Price"
                        htmlFor={`${id}-price`}
                        error={error.price}
                        required
                    >
                        <Input
                            id={`${id}-price`}
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.price}
                            onChange={(e) =>
                                setForm((prev) => ({ ...prev, price: e.target.value }))
                            }
                            placeholder="0.00"
                            disabled={isPending}
                        />
                    </FormField>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => closeModal(id)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={isPending}>
                            {isEdit ? "Save Changes" : "Create"}
                        </Button>
                    </div>
                </form>
            </Modal>

            <CategoryFormModal id={INLINE_CATEGORY_MODAL_ID} />
        </>
    );
}
