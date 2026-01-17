import { ConfirmDialog } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { useResource } from "@/src/hook/useResource";
import type { Category } from "@/shared/type";

interface CategoryDeleteDialogProp {
	id: string;
	onSuccess?: () => void;
}

export function CategoryDeleteDialog({ id, onSuccess }: CategoryDeleteDialogProp) {
	const { getModalData, closeModal } = useUIStore();
	const { remove } = useResource<Category>("category", "Category");

	const category = getModalData<Category>(id);

	const handleConfirm = async () => {
		if (!category) return;

		try {
			await remove.mutateAsync(category.id);
			closeModal(id);
			onSuccess?.();
		} catch {
			// Error is handled by useResource
		}
	};

	return (
		<ConfirmDialog
			id={id}
			title="Delete Category"
			message={`Are you sure you want to delete "${category?.name ?? ""}"? This action cannot be undone.`}
			confirmLabel="Delete"
			variant="danger"
			onConfirm={handleConfirm}
			isLoading={remove.isPending}
		/>
	);
}
