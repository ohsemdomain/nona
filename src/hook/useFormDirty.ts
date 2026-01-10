import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useUIStore } from "@/src/store/ui";
import { deepEqual } from "@/src/lib/deepEqual";

interface UseFormDirtyOption<TForm> {
	form: TForm;
	confirmId: string; // Modal ID for ConfirmDialog
	blockNavigation?: boolean; // For page forms - add beforeunload
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

interface UseFormDirtyReturn<TForm> {
	isDirty: boolean;
	originalForm: TForm;
	setOriginalForm: (form: TForm) => void;
	confirmClose: (onConfirm: () => void) => void;
	resetDirty: () => void;
	confirmDialogProps: ConfirmDialogProps;
}

export function useFormDirty<TForm>({
	form,
	confirmId,
	blockNavigation = false,
}: UseFormDirtyOption<TForm>): UseFormDirtyReturn<TForm> {
	const { openModal, closeModal } = useUIStore();
	const [originalForm, setOriginalForm] = useState<TForm>(form);
	const pendingConfirmRef = useRef<(() => void) | null>(null);

	// Stable deep comparison with memoization
	const isDirty = useMemo(
		() => !deepEqual(form, originalForm),
		[form, originalForm],
	);

	// Block browser navigation if dirty (page forms)
	useEffect(() => {
		if (!blockNavigation || !isDirty) return;

		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			e.preventDefault();
			e.returnValue = "";
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [blockNavigation, isDirty]);

	// Show confirm dialog if dirty
	const confirmClose = useCallback(
		(onConfirm: () => void) => {
			if (!isDirty) {
				onConfirm();
				return;
			}

			pendingConfirmRef.current = onConfirm;
			openModal(confirmId);
		},
		[isDirty, confirmId, openModal],
	);

	// Handle confirm dialog actions
	const handleConfirm = useCallback(() => {
		closeModal(confirmId);
		pendingConfirmRef.current?.();
		pendingConfirmRef.current = null;
	}, [confirmId, closeModal]);

	const handleCancel = useCallback(() => {
		pendingConfirmRef.current = null;
	}, []);

	// Reset dirty state (after save)
	const resetDirty = useCallback(() => {
		setOriginalForm(form);
	}, [form]);

	// Props for ConfirmDialog component
	const confirmDialogProps: ConfirmDialogProps = {
		id: confirmId,
		title: "Unsaved Changes",
		message: "You have unsaved changes. Are you sure you want to discard them?",
		confirmLabel: "Discard",
		variant: "danger",
		onConfirm: handleConfirm,
		onCancel: handleCancel,
	};

	return {
		isDirty,
		originalForm,
		setOriginalForm,
		confirmClose,
		resetDirty,
		confirmDialogProps,
	};
}
