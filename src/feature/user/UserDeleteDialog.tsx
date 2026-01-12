import { useMutation } from "@tanstack/react-query";
import { ConfirmDialog } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { api, handleApiError } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import type { User } from "@/shared/type";

interface UserDeleteDialogProp {
	id: string;
	onSuccess?: () => void;
}

export function UserDeleteDialog({ id, onSuccess }: UserDeleteDialogProp) {
	const { getModalData, closeModal } = useUIStore();
	const user = getModalData<User>(id);

	const deleteMutation = useMutation({
		mutationFn: (publicId: string) => api.delete(`/user/${publicId}`),
		onSuccess: () => {
			TOAST.deleted("User");
			closeModal(id);
			onSuccess?.();
		},
		onError: handleApiError,
	});

	const handleConfirm = async () => {
		if (!user) return;
		deleteMutation.mutate(user.publicId);
	};

	return (
		<ConfirmDialog
			id={id}
			title="Delete User"
			message={`Are you sure you want to delete "${user?.name ?? ""}"? This action cannot be undone.`}
			confirmLabel="Delete"
			variant="danger"
			onConfirm={handleConfirm}
			isLoading={deleteMutation.isPending}
		/>
	);
}
