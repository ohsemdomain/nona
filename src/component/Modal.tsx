import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { useUIStore } from "@/src/store/ui";
import { Z_INDEX } from "@/src/lib/zIndex";

interface ModalProp {
	id: string;
	title: string;
	children: ReactNode;
	onClose?: () => void;
	size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyleMap = {
	sm: "lg:max-w-sm",
	md: "lg:max-w-md",
	lg: "lg:max-w-lg",
	xl: "lg:max-w-xl",
};

export function Modal({
	id,
	title,
	children,
	onClose,
	size = "md",
}: ModalProp) {
	const { isModalOpen, closeModal, getModalLevel } = useUIStore();
	const isOpen = isModalOpen(id);
	const level = getModalLevel(id);

	const handleClose = useCallback(() => {
		closeModal(id);
		onClose?.();
	}, [closeModal, id, onClose]);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") {
				handleClose();
			}
		},
		[handleClose],
	);

	useEffect(() => {
		if (isOpen) {
			document.addEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "hidden";
			return () => {
				document.removeEventListener("keydown", handleKeyDown);
				document.body.style.overflow = "";
			};
		}
	}, [isOpen, handleKeyDown]);

	if (!isOpen) return null;

	const overlayZIndex = Z_INDEX.modalOverlay + level * 200;
	const modalZIndex = Z_INDEX.modal + level * 200;

	return createPortal(
		<>
			{/* Backdrop - hidden on mobile, visible on desktop */}
			<div
				className="fixed inset-0 hidden bg-black/50 transition-opacity lg:block"
				style={{ zIndex: overlayZIndex }}
				onClick={handleClose}
				aria-hidden="true"
			/>
			{/* Modal container */}
			<div
				className="fixed inset-0 flex items-start lg:items-center lg:justify-center lg:p-4"
				style={{ zIndex: modalZIndex }}
			>
				<div
					className={clsx(
						"flex h-full w-full flex-col bg-white",
						"lg:h-auto lg:rounded-lg lg:border lg:border-zinc-200",
						sizeStyleMap[size],
					)}
					role="dialog"
					aria-modal="true"
					aria-labelledby={`${id}-title`}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3">
						<h2
							id={`${id}-title`}
							className="text-lg font-semibold text-zinc-900"
						>
							{title}
						</h2>
						<button
							type="button"
							onClick={handleClose}
							className="rounded-sm p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
						>
							<X className="h-5 w-5" />
							<span className="sr-only">Close</span>
						</button>
					</div>
					<div className="flex-1 overflow-y-auto p-4">{children}</div>
				</div>
			</div>
		</>,
		document.body,
	);
}
