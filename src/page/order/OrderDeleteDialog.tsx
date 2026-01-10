import { ConfirmDialog } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { useResource } from "@/src/hook/useResource";
import type { Order } from "@/shared/type";

interface OrderDeleteDialogProp {
	id: string;
}

export function OrderDeleteDialog({ id }: OrderDeleteDialogProp) {
	const { getModalData, closeModal } = useUIStore();
	const { remove } = useResource<Order>("order", "Order");

	const order = getModalData<Order>(id);

	const handleConfirm = async () => {
		if (!order) return;

		try {
			await remove.mutateAsync(order.publicId);
			closeModal(id);
		} catch {
			// Error is handled by useResource
		}
	};

	return (
		<ConfirmDialog
			id={id}
			title="Delete Order"
			message={`Are you sure you want to delete order #${order?.publicId ?? ""}? This action cannot be undone.`}
			confirmLabel="Delete"
			variant="danger"
			onConfirm={handleConfirm}
			isLoading={remove.isPending}
		/>
	);
}
