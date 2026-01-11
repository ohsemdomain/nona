import { useState, useEffect, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { Modal, FormField, Input, Select, Button } from "@/src/component";
import { useUIStore } from "@/src/store/ui";
import { api, handleApiError } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import { ROLE, type RoleValue } from "@/shared/constant/permission";
import type { User, CreateUserInput, UpdateUserInput } from "@/shared/type";

interface UserFormModalProp {
	id: string;
	onSuccess?: (user: User) => void;
	onClose?: () => void;
}

interface FormState {
	name: string;
	email: string;
	password: string;
	role: RoleValue;
}

interface FormError {
	name?: string;
	email?: string;
	password?: string;
	role?: string;
}

const initialForm: FormState = {
	name: "",
	email: "",
	password: "",
	role: ROLE.USER,
};

const roleOptions = [
	{ value: ROLE.ADMIN, label: "Admin" },
	{ value: ROLE.USER, label: "User" },
	{ value: ROLE.VIEWER, label: "Viewer" },
];

export function UserFormModal({ id, onSuccess, onClose }: UserFormModalProp) {
	const { isModalOpen, getModalData, closeModal } = useUIStore();
	const isOpen = isModalOpen(id);
	const editUser = getModalData<User>(id);
	const isEdit = !!editUser;

	const [form, setForm] = useState<FormState>(initialForm);
	const [error, setError] = useState<FormError>({});

	// Reset form when modal opens
	useEffect(() => {
		if (isOpen) {
			if (editUser) {
				setForm({
					name: editUser.name,
					email: editUser.email,
					password: "", // Don't show password when editing
					role: (editUser.roleName as RoleValue) || ROLE.USER,
				});
			} else {
				setForm(initialForm);
			}
			setError({});
		}
	}, [isOpen, editUser]);

	const createMutation = useMutation({
		mutationFn: (data: CreateUserInput) => api.post<User>("/user", data),
		onSuccess: (user) => {
			TOAST.created("User");
			closeModal(id);
			onSuccess?.(user);
		},
		onError: handleApiError,
	});

	const updateMutation = useMutation({
		mutationFn: ({ publicId, data }: { publicId: string; data: UpdateUserInput }) =>
			api.put<User>(`/user/${publicId}`, data),
		onSuccess: (user) => {
			TOAST.updated("User");
			closeModal(id);
			onSuccess?.(user);
		},
		onError: handleApiError,
	});

	const isPending = createMutation.isPending || updateMutation.isPending;

	const validate = (): boolean => {
		const newError: FormError = {};

		if (!form.name.trim()) {
			newError.name = "Name is required";
		}

		if (!form.email.trim()) {
			newError.email = "Email is required";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
			newError.email = "Invalid email format";
		}

		// Password required for create, optional for edit
		if (!isEdit && !form.password) {
			newError.password = "Password is required";
		} else if (form.password && form.password.length < 6) {
			newError.password = "Password must be at least 6 characters";
		}

		if (!form.role) {
			newError.role = "Role is required";
		}

		setError(newError);
		return Object.keys(newError).length === 0;
	};

	const handleSubmit = async (e: FormEvent) => {
		e.preventDefault();
		if (!validate()) return;

		if (isEdit && editUser) {
			const updateData: UpdateUserInput = {
				name: form.name.trim(),
				role: form.role,
				updatedAt: editUser.updatedAt,
			};

			// Only include password if it was changed
			if (form.password) {
				updateData.password = form.password;
			}

			updateMutation.mutate({ publicId: editUser.publicId, data: updateData });
		} else {
			createMutation.mutate({
				name: form.name.trim(),
				email: form.email.trim(),
				password: form.password,
				role: form.role,
			});
		}
	};

	const handleClose = () => {
		closeModal(id);
		onClose?.();
	};

	return (
		<Modal
			id={id}
			title={isEdit ? "Edit User" : "Create User"}
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
						onChange={(e) => setForm({ ...form, name: e.target.value })}
						placeholder="Enter name"
						disabled={isPending}
					/>
				</FormField>

				<FormField
					label="Email"
					htmlFor={`${id}-email`}
					error={error.email}
					required
				>
					<Input
						id={`${id}-email`}
						type="email"
						value={form.email}
						onChange={(e) => setForm({ ...form, email: e.target.value })}
						placeholder="Enter email"
						disabled={isPending || isEdit} // Can't change email when editing
					/>
				</FormField>

				<FormField
					label={isEdit ? "New Password (leave empty to keep current)" : "Password"}
					htmlFor={`${id}-password`}
					error={error.password}
					required={!isEdit}
				>
					<Input
						id={`${id}-password`}
						type="password"
						value={form.password}
						onChange={(e) => setForm({ ...form, password: e.target.value })}
						placeholder={isEdit ? "Leave empty to keep current" : "Enter password"}
						disabled={isPending}
					/>
				</FormField>

				<FormField
					label="Role"
					htmlFor={`${id}-role`}
					error={error.role}
					required
				>
					<Select
						id={`${id}-role`}
						value={form.role}
						onChange={(e) => setForm({ ...form, role: e.target.value as RoleValue })}
						disabled={isPending}
					>
						{roleOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</Select>
				</FormField>

				<div className="flex justify-end gap-3 pt-2">
					<Button
						type="button"
						variant="secondary"
						onClick={handleClose}
						disabled={isPending}
					>
						Cancel
					</Button>
					<Button type="submit" isLoading={isPending}>
						{isEdit ? "Save Changes" : "Create User"}
					</Button>
				</div>
			</form>
		</Modal>
	);
}
