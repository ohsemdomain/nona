import { useEffect, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { clsx } from "clsx";
import { useUIStore } from "@/src/store/ui";
import { Z_INDEX } from "@/src/lib/zIndex";

interface ModalProps {
    id: string;
    title: string;
    children: ReactNode;
    onClose?: () => void;
    size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
};

export function Modal({
    id,
    title,
    children,
    onClose,
    size = "md",
}: ModalProps) {
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
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                style={{ zIndex: overlayZIndex }}
                onClick={handleClose}
                aria-hidden="true"
            />
            <div
                className="fixed inset-0 flex items-center justify-center p-4"
                style={{ zIndex: modalZIndex }}
            >
                <div
                    className={clsx(
                        "w-full rounded-lg bg-white shadow-xl dark:bg-zinc-900",
                        sizeStyles[size],
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`${id}-title`}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
                        <h2
                            id={`${id}-title`}
                            className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                        >
                            {title}
                        </h2>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                        >
                            <X className="h-5 w-5" />
                            <span className="sr-only">Close</span>
                        </button>
                    </div>
                    <div className="p-4">{children}</div>
                </div>
            </div>
        </>,
        document.body,
    );
}
