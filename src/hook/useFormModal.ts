import { useState, useEffect, useCallback, useRef } from "react";
import { useUIStore } from "@/src/store/ui";
import { useResource } from "@/src/hook/useResource";
import { useFormDirty } from "@/src/hook/useFormDirty";
import type { Entity } from "@/shared/type";

interface UseFormModalOption<TEntity, TForm, TCreate, TUpdate> {
	id: string;
	resource: Entity;
	resourceLabel: string;
	initialForm: TForm;
	toForm: (entity: TEntity) => TForm;
	toCreateInput: (form: TForm) => TCreate;
	toUpdateInput: (form: TForm, entity: TEntity) => TUpdate; // Entity for optimistic locking
	validate: (form: TForm) => Record<string, string>;
	onSuccess?: (entity: TEntity) => void;
}

interface ConfirmDialogProps {
	id: string;
	title: string;
	message: string;
	confirmLabel: string;
	variant: "danger" | "primary";
	onConfirm: () => void;
	onCancel: () => void;
}

interface UseFormModalReturn<TEntity, TForm> {
	// State
	form: TForm;
	error: Record<string, string>;
	isOpen: boolean;
	isEdit: boolean;
	entity: TEntity | undefined;
	isPending: boolean;
	isDirty: boolean;
	confirmDialogProps: ConfirmDialogProps;

	// Actions
	setForm: React.Dispatch<React.SetStateAction<TForm>>;
	setField: <K extends keyof TForm>(field: K, value: TForm[K]) => void;
	handleSubmit: (e: React.FormEvent) => Promise<void>;
	handleClose: () => void;
	closeModal: () => void;
}

export function useFormModal<
	TEntity extends { id: number },
	TForm,
	TCreate,
	TUpdate,
>({
	id,
	resource,
	resourceLabel,
	initialForm,
	toForm,
	toCreateInput,
	toUpdateInput,
	validate,
	onSuccess,
}: UseFormModalOption<TEntity, TForm, TCreate, TUpdate>): UseFormModalReturn<
	TEntity,
	TForm
> {
	const {
		getModalData,
		closeModal: closeModalStore,
		isModalOpen,
	} = useUIStore();
	const { create, update } = useResource<TEntity, TCreate, TUpdate>(
		resource,
		resourceLabel,
	);

	const entity = getModalData<TEntity>(id);
	const isEdit = !!entity;
	const isOpen = isModalOpen(id);

	const [form, setForm] = useState<TForm>(initialForm);
	const [error, setError] = useState<Record<string, string>>({});

	// Dirty state tracking
	const dirty = useFormDirty({ form, confirmId: `${id}-confirm-discard` });

	// Store functions in refs to avoid dependency issues
	const toFormRef = useRef(toForm);
	const initialFormRef = useRef(initialForm);
	const setOriginalFormRef = useRef(dirty.setOriginalForm);
	const confirmCloseRef = useRef(dirty.confirmClose);
	toFormRef.current = toForm;
	initialFormRef.current = initialForm;
	setOriginalFormRef.current = dirty.setOriginalForm;
	confirmCloseRef.current = dirty.confirmClose;

	// Track previous isOpen to detect open transition
	const wasOpenRef = useRef(false);

	// Auto-reset form when modal opens (isOpen: false -> true)
	useEffect(() => {
		const justOpened = isOpen && !wasOpenRef.current;
		wasOpenRef.current = isOpen;

		if (!justOpened) {
			return;
		}

		const newForm = entity ? toFormRef.current(entity) : initialFormRef.current;
		setForm(newForm);
		setOriginalFormRef.current(newForm);
		setError({});
	}, [isOpen, entity]);

	const setField = useCallback(
		<K extends keyof TForm>(field: K, value: TForm[K]) => {
			setForm((prev) => ({ ...prev, [field]: value }));
		},
		[],
	);

	const handleClose = useCallback(() => {
		setForm(initialFormRef.current);
		setError({});
	}, []);

	const closeModal = useCallback(() => {
		confirmCloseRef.current(() => closeModalStore(id));
	}, [id, closeModalStore]);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			const validationError = validate(form);
			if (Object.keys(validationError).length > 0) {
				setError(validationError);
				return;
			}

			try {
				let result: TEntity;
				if (isEdit && entity) {
					result = await update.mutateAsync({
						id: entity.id,
						data: toUpdateInput(form, entity), // Pass entity for optimistic locking
					});
				} else {
					result = await create.mutateAsync(toCreateInput(form));
				}
				onSuccess?.(result);
				// Close directly without confirm - save was successful
				closeModalStore(id);
			} catch {
				// Error handled by useResource
			}
		},
		[
			form,
			isEdit,
			entity,
			validate,
			toCreateInput,
			toUpdateInput,
			create,
			update,
			onSuccess,
			closeModalStore,
			id,
		],
	);

	return {
		form,
		error,
		isOpen,
		isEdit,
		entity,
		isPending: create.isPending || update.isPending,
		isDirty: dirty.isDirty,
		confirmDialogProps: dirty.confirmDialogProps,
		setForm,
		setField,
		handleSubmit,
		handleClose,
		closeModal,
	};
}
