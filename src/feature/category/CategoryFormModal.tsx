import {
	Modal,
	FormField,
	Input,
	Button,
	ConfirmDialog,
} from "@/src/component";
import { useFormModal } from "@/src/hook/useFormModal";
import type {
	Category,
	CreateCategoryInput,
	UpdateCategoryInput,
} from "@/shared/type";

interface CategoryFormModalProp {
	id: string;
	onSuccess?: (category: Category) => void;
	onClose?: () => void;
}

interface FormState {
	name: string;
}

const initialForm: FormState = {
	name: "",
};

export function CategoryFormModal({
	id,
	onSuccess,
	onClose,
}: CategoryFormModalProp) {
	const modal = useFormModal<
		Category,
		FormState,
		CreateCategoryInput,
		UpdateCategoryInput
	>({
		id,
		resource: "category",
		resourceLabel: "Category",
		initialForm,
		toForm: (category) => ({ name: category.name }),
		toCreateInput: (form) => ({ name: form.name.trim() }),
		toUpdateInput: (form, entity) => ({
			name: form.name.trim(),
			updatedAt: entity.updatedAt, // For optimistic locking
		}),
		validate: (form) => {
			const error: Record<string, string> = {};
			if (!form.name.trim()) {
				error.name = "Name is required";
			}
			return error;
		},
		onSuccess,
	});

	const handleClose = () => {
		modal.handleClose();
		onClose?.();
	};

	return (
		<>
			<Modal
				id={id}
				title={modal.isEdit ? "Edit Category" : "Create Category"}
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
							placeholder="Enter category name"
							disabled={modal.isPending}
						/>
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
							{modal.isEdit ? "Save Changes" : "Create"}
						</Button>
					</div>
				</form>
			</Modal>

			<ConfirmDialog {...modal.confirmDialogProps} />
		</>
	);
}
