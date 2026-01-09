import { create } from "zustand";

export interface ModalConfig {
    id: string;
    data?: unknown;
}

interface UIState {
    modalStack: ModalConfig[];
    isLoading: boolean;
    openModal: (id: string, data?: unknown) => void;
    closeModal: (id?: string) => void;
    closeAllModals: () => void;
    getModalData: <T>(id: string) => T | undefined;
    isModalOpen: (id: string) => boolean;
    getModalLevel: (id: string) => number;
    setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
    modalStack: [],
    isLoading: false,

    openModal: (id, data) => {
        set((state) => ({
            modalStack: [...state.modalStack, { id, data }],
        }));
    },

    closeModal: (id) => {
        set((state) => {
            if (id) {
                return {
                    modalStack: state.modalStack.filter((m) => m.id !== id),
                };
            }
            return {
                modalStack: state.modalStack.slice(0, -1),
            };
        });
    },

    closeAllModals: () => {
        set({ modalStack: [] });
    },

    getModalData: <T>(id: string) => {
        const modal = get().modalStack.find((m) => m.id === id);
        return modal?.data as T | undefined;
    },

    isModalOpen: (id) => {
        return get().modalStack.some((m) => m.id === id);
    },

    getModalLevel: (id) => {
        return get().modalStack.findIndex((m) => m.id === id);
    },

    setLoading: (loading) => {
        set({ isLoading: loading });
    },
}));
