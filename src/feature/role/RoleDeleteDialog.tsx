import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfirmDialog } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { api, handleApiError } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import type { Role } from "@/shared/type";

interface RoleDeleteDialogProp {
	id: string;
	onSuccess?: () => void;
}

export function RoleDeleteDialog({ id, onSuccess }: RoleDeleteDialogProp) {
	const { getModalData, closeModal } = useUIStore();
	const queryClient = useQueryClient();

	const role = getModalData<Role>(id);

	const mutation = useMutation({
		mutationFn: (roleId: number) => api.delete<void>(`/role/${roleId}`),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["role"] });
			TOAST.deleted("Role");
			closeModal(id);
			onSuccess?.();
		},
		onError: handleApiError,
	});

	const handleConfirm = async () => {
		if (!role) return;
		mutation.mutate(role.id);
	};

	return (
		<ConfirmDialog
			id={id}
			title="Delete Role"
			message={`Are you sure you want to delete "${role?.name ?? ""}"? This action cannot be undone.`}
			confirmLabel="Delete"
			variant="danger"
			onConfirm={handleConfirm}
			isLoading={mutation.isPending}
		/>
	);
}
