import { useQuery } from "@tanstack/react-query";
import {
	Modal,
	FormField,
	Input,
	Select,
	Button,
	ConfirmDialog,
} from "@/src/component";
import { useFormModal } from "@/src/hook/useFormModal";
import { api } from "@/src/lib/api";
import type { User, CreateUserInput, UpdateUserInput, Role } from "@/shared/type";

interface UserFormModalProp {
	id: string;
	onSuccess?: (user: User) => void;
	onClose?: () => void;
}

interface FormState {
	name: string;
	email: string;
	password: string;
	roleId: string; // String for form state, converted to number for API
}

const initialForm: FormState = {
	name: "",
	email: "",
	password: "",
	roleId: "",
};

export function UserFormModal({ id, onSuccess, onClose }: UserFormModalProp) {
	const { data: roleList = [] } = useQuery({
		queryKey: ["role"],
		queryFn: () => api.get<Role[]>("/role"),
	});

	const modal = useFormModal<User, FormState, CreateUserInput, UpdateUserInput>(
		{
			id,
			resource: "user",
			resourceLabel: "User",
			initialForm,
			toForm: (user) => ({
				name: user.name,
				email: user.email,
				password: "", // Never show password when editing
				roleId: user.roleId ? String(user.roleId) : "",
			}),
			toCreateInput: (form) => ({
				name: form.name.trim(),
				email: form.email.trim(),
				password: form.password,
				roleId: form.roleId ? Number.parseInt(form.roleId, 10) : undefined,
			}),
			toUpdateInput: (form, entity) => {
				const data: UpdateUserInput = {
					name: form.name.trim(),
					roleId: form.roleId ? Number.parseInt(form.roleId, 10) : null,
					updatedAt: entity.updatedAt,
				};
				// Only include password if changed (not empty)
				if (form.password) {
					data.password = form.password;
				}
				return data;
			},
			validate: (form) => {
				const error: Record<string, string> = {};

				if (!form.name.trim()) {
					error.name = "Name is required";
				}

				// Email validation only for create (can't change on edit)
				if (!modal.isEdit) {
					if (!form.email.trim()) {
						error.email = "Email is required";
					} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
						error.email = "Invalid email format";
					}
				}

				// Password required for create, optional for edit
				if (!modal.isEdit && !form.password) {
					error.password = "Password is required";
				} else if (form.password && form.password.length < 6) {
					error.password = "Password must be at least 6 characters";
				}

				return error;
			},
			onSuccess,
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
				title={modal.isEdit ? "Edit User" : "Create User"}
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
							placeholder="Enter name"
							disabled={modal.isPending}
						/>
					</FormField>

					<FormField
						label="Email"
						htmlFor={`${id}-email`}
						error={modal.error.email}
						required
					>
						<Input
							id={`${id}-email`}
							type="email"
							value={modal.form.email}
							onChange={(e) => modal.setField("email", e.target.value)}
							placeholder="Enter email"
							disabled={modal.isPending || modal.isEdit}
						/>
					</FormField>

					<FormField
						label={
							modal.isEdit
								? "New Password (leave empty to keep current)"
								: "Password"
						}
						htmlFor={`${id}-password`}
						error={modal.error.password}
						required={!modal.isEdit}
					>
						<Input
							id={`${id}-password`}
							type="password"
							value={modal.form.password}
							onChange={(e) => modal.setField("password", e.target.value)}
							placeholder={
								modal.isEdit ? "Leave empty to keep current" : "Enter password"
							}
							disabled={modal.isPending}
						/>
					</FormField>

					<FormField
						label="Role"
						htmlFor={`${id}-role`}
						error={modal.error.roleId}
					>
						<Select
							id={`${id}-role`}
							value={modal.form.roleId}
							onChange={(e) => modal.setField("roleId", e.target.value)}
							disabled={modal.isPending}
						>
							<option value="">No role</option>
							{roleList.map((role) => (
								<option key={role.id} value={role.id}>
									{role.name}
								</option>
							))}
						</Select>
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
							{modal.isEdit ? "Save Changes" : "Create User"}
						</Button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog {...modal.confirmDialogProps} />
		</>
	);
}
