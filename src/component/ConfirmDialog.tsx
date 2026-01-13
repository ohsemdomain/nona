import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { useUIStore } from "@/src/store/ui";

interface ConfirmDialogProp {
	id: string;
	title?: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	variant?: "danger" | "primary";
	onConfirm: () => void;
	onCancel?: () => void;
	isLoading?: boolean;
}

export function ConfirmDialog({
	id,
	title = "Confirm",
	message,
	confirmLabel = "Confirm",
	cancelLabel = "Cancel",
	variant = "danger",
	onConfirm,
	onCancel,
	isLoading = false,
}: ConfirmDialogProp) {
	const { closeModal } = useUIStore();

	const handleCancel = () => {
		closeModal(id);
		onCancel?.();
	};

	const handleConfirm = () => {
		onConfirm();
	};

	return (
		<Modal id={id} title={title} size="sm">
			<div className="space-y-4">
				<div className="flex gap-3">
					{variant === "danger" && (
						<div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 ">
							<AlertTriangle className="h-5 w-5 text-red-600 " />
						</div>
					)}
					<p className="text-sm text-zinc-600 ">{message}</p>
				</div>
				<div className="flex justify-end gap-3">
					<Button
						variant="secondary"
						onClick={handleCancel}
						disabled={isLoading}
					>
						{cancelLabel}
					</Button>
					<Button
						variant={variant}
						onClick={handleConfirm}
						isLoading={isLoading}
					>
						{confirmLabel}
					</Button>
				</div>
			</div>
		</Modal>
	);
}
