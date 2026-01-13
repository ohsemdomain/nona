import { useState, useEffect, useCallback, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Modal,
	FormField,
	Input,
	Button,
	ConfirmDialog,
} from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { api, handleApiError } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import type { Role, CreateRoleInput, UpdateRoleInput } from "@/shared/type";

interface RoleFormModalProp {
	id: string;
	onSuccess?: (role: Role) => void;
	onClose?: () => void;
}

interface FormState {
	name: string;
	description: string;
}

const initialForm: FormState = {
	name: "",
	description: "",
};

export function RoleFormModal({ id, onSuccess, onClose }: RoleFormModalProp) {
	const queryClient = useQueryClient();
	const confirmId = `${id}-confirm-discard`;
	const {
		getModalData,
		closeModal: closeModalStore,
		isModalOpen,
		openModal,
	} = useUIStore();

	const role = getModalData<Role>(id);
	const isEdit = !!role;
	const isOpen = isModalOpen(id);

	const [form, setForm] = useState<FormState>(initialForm);
	const [error, setError] = useState<Record<string, string>>({});
	const [originalForm, setOriginalForm] = useState<FormState>(initialForm);
	const pendingActionRef = useRef<(() => void) | null>(null);

	// Track previous isOpen to detect open transition
	const wasOpenRef = useRef(false);

	// Auto-reset form when modal opens
	useEffect(() => {
		const justOpened = isOpen && !wasOpenRef.current;
		wasOpenRef.current = isOpen;

		if (!justOpened) return;

		const newForm = role
			? { name: role.name, description: role.description ?? "" }
			: initialForm;
		setForm(newForm);
		setOriginalForm(newForm);
		setError({});
	}, [isOpen, role]);

	const isDirty =
		form.name !== originalForm.name ||
		form.description !== originalForm.description;

	const createMutation = useMutation({
		mutationFn: (data: CreateRoleInput) => api.post<Role>("/role", data),
		onSuccess: (newRole) => {
			queryClient.invalidateQueries({ queryKey: ["role"] });
			TOAST.created("Role");
			closeModalStore(id);
			onSuccess?.(newRole);
		},
		onError: handleApiError,
	});

	const updateMutation = useMutation({
		mutationFn: ({ roleId, data }: { roleId: number; data: UpdateRoleInput }) =>
			api.put<Role>(`/role/${roleId}`, data),
		onSuccess: (updatedRole) => {
			queryClient.invalidateQueries({ queryKey: ["role"] });
			TOAST.updated("Role");
			closeModalStore(id);
			onSuccess?.(updatedRole);
		},
		onError: handleApiError,
	});

	const isPending = createMutation.isPending || updateMutation.isPending;

	const setField = useCallback(
		<K extends keyof FormState>(field: K, value: FormState[K]) => {
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const validate = (formData: FormState): Record<string, string> => {
		const formError: Record<string, string> = {};
		if (!formData.name.trim()) {
			formError.name = "Name is required";
		} else if (formData.name.length > 50) {
			formError.name = "Name too long (max 50 characters)";
		}
		if (formData.description && formData.description.length > 200) {
			formError.description = "Description too long (max 200 characters)";
		}
		return formError;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		const validationError = validate(form);
		if (Object.keys(validationError).length > 0) {
			setError(validationError);
			return;
		}

		if (isEdit && role) {
			updateMutation.mutate({
				roleId: role.id,
				data: {
					name: form.name.trim(),
					description: form.description.trim() || undefined,
				},
			});
		} else {
			createMutation.mutate({
				name: form.name.trim(),
				description: form.description.trim() || undefined,
			});
		}
	};

	const handleClose = useCallback(() => {
		setForm(initialForm);
		setError({});
		onClose?.();
	}, [onClose]);

	const closeModal = useCallback(() => {
		if (isDirty) {
			pendingActionRef.current = () => closeModalStore(id);
			openModal(confirmId);
		} else {
			closeModalStore(id);
		}
	}, [isDirty, closeModalStore, id, openModal, confirmId]);

	const handleConfirmDiscard = useCallback(() => {
		closeModalStore(confirmId);
		if (pendingActionRef.current) {
			pendingActionRef.current();
			pendingActionRef.current = null;
		}
	}, [closeModalStore, confirmId]);

	const handleCancelDiscard = useCallback(() => {
		pendingActionRef.current = null;
	}, []);

	return (
		<>
			<Modal
				id={id}
				title={isEdit ? "Edit Role" : "Create Role"}
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
							onChange={(e) => setField("name", e.target.value)}
							placeholder="Enter role name"
							disabled={isPending}
						/>
					</FormField>

					<FormField
						label="Description"
						htmlFor={`${id}-description`}
						error={error.description}
					>
						<textarea
							id={`${id}-description`}
							value={form.description}
							onChange={(e) => setField("description", e.target.value)}
							placeholder="Enter role description (optional)"
							disabled={isPending}
							rows={3}
							className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-zinc-50 disabled:text-zinc-500      "
						/>
					</FormField>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="button"
							variant="secondary"
							onClick={closeModal}
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

			<ConfirmDialog
				id={confirmId}
				title="Discard Changes?"
				message="You have unsaved changes. Are you sure you want to discard them?"
				confirmLabel="Discard"
				variant="danger"
				onConfirm={handleConfirmDiscard}
				onCancel={handleCancelDiscard}
			/>
		</>
	);
}
