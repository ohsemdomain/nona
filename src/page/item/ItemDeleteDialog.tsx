import { ConfirmDialog } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { useResource } from "@/src/hook/useResource";
import type { Item } from "@/shared/type";

interface ItemDeleteDialogProp {
	id: string;
}

export function ItemDeleteDialog({ id }: ItemDeleteDialogProp) {
	const { getModalData, closeModal } = useUIStore();
	const { remove } = useResource<Item>("item", "Item");

	const item = getModalData<Item>(id);

	const handleConfirm = async () => {
		if (!item) return;

		try {
			await remove.mutateAsync(item.publicId);
			closeModal(id);
		} catch {
			// Error is handled by useResource
		}
	};

	return (
		<ConfirmDialog
			id={id}
			title="Delete Item"
			message={`Are you sure you want to delete "${item?.name ?? ""}"? This action cannot be undone.`}
			confirmLabel="Delete"
			variant="danger"
			onConfirm={handleConfirm}
			isLoading={remove.isPending}
		/>
	);
}
