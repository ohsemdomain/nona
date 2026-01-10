import { useRef, useCallback } from "react";
import { useUIStore } from "@/src/store/ui";

export function useInlineModal<T>(
    modalId: string,
    onSuccess: (key: string, entity: T) => void,
) {
    const { openModal } = useUIStore();
    const pendingKeyRef = useRef<string | null>(null);

    // Store callback in ref - always calls latest version
    const callbackRef = useRef(onSuccess);
    callbackRef.current = onSuccess;

    const openCreate = useCallback(
        (key: string) => {
            pendingKeyRef.current = key;
            openModal(modalId); // No data = create mode
        },
        [modalId, openModal],
    );

    const openEdit = useCallback(
        (key: string, data: T) => {
            pendingKeyRef.current = key;
            openModal(modalId, data); // With data = edit mode
        },
        [modalId, openModal],
    );

    // Stable reference - safe to pass as prop
    const handleSuccess = useCallback((entity: T) => {
        if (pendingKeyRef.current) {
            callbackRef.current(pendingKeyRef.current, entity);
            pendingKeyRef.current = null;
        }
    }, []);

    return { openCreate, openEdit, handleSuccess };
}
