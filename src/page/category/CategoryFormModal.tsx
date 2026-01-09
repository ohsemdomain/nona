import { useState, useEffect } from "react";
import { Modal, FormField, Input, Button } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { useResource } from "@/src/hook/useResource";
import type { Category } from "@/shared/type";

interface CategoryFormModalProp {
    id: string;
}

interface FormState {
    name: string;
}

const initialFormState: FormState = {
    name: "",
};

export function CategoryFormModal({ id }: CategoryFormModalProp) {
    const { getModalData, closeModal } = useUIStore();
    const { create, update } = useResource<Category>("category", "Category");

    const category = getModalData<Category>(id);
    const isEdit = !!category;

    const [form, setForm] = useState<FormState>(initialFormState);
    const [error, setError] = useState<Record<string, string>>({});

    useEffect(() => {
        if (category) {
            setForm({ name: category.name });
        } else {
            setForm(initialFormState);
        }
        setError({});
    }, [category]);

    const validate = (): boolean => {
        const newError: Record<string, string> = {};

        if (!form.name.trim()) {
            newError.name = "Name is required";
        }

        setError(newError);
        return Object.keys(newError).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        try {
            if (isEdit && category) {
                await update.mutateAsync({
                    id: category.publicId,
                    data: { name: form.name.trim() },
                });
            } else {
                await create.mutateAsync({ name: form.name.trim() });
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

    const isPending = create.isPending || update.isPending;

    return (
        <Modal
            id={id}
            title={isEdit ? "Edit Category" : "Create Category"}
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
                        placeholder="Enter category name"
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
    );
}
