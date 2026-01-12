import { create } from "zustand";

/**
 * Modal configuration for the modal stack.
 *
 * The `data` field uses `unknown` intentionally - type safety is enforced
 * at the point of use via `getModalData<T>(id)`. This allows the store to
 * remain generic while consumers specify the expected type.
 *
 * @example
 * // Opening a modal with typed data
 * openModal("edit-category", selectedCategory);
 *
 * // Retrieving typed data in modal component
 * const category = getModalData<Category>("edit-category");
 */
export interface ModalConfig {
	id: string;
	data?: unknown;
}

/**
 * UI Store - Client-only state for modals and global loading.
 *
 * This store manages purely client-side UI concerns:
 * - Modal stack (open/close state, transient data passing)
 * - Global loading indicator
 *
 * Server state (API data, caching) is handled by TanStack Query.
 * This separation ensures:
 * - No duplicate caching of server data
 * - Clear ownership of state
 * - Predictable data flow
 */
interface UIState {
	/** Stack of open modals (supports nested modals) */
	modalStack: ModalConfig[];
	/** Global loading state for blocking operations */
	isLoading: boolean;

	/**
	 * Open a modal with optional data.
	 * Data is transient - cleared when modal closes.
	 * @param id - Unique modal identifier
	 * @param data - Optional data to pass to modal (e.g., entity for edit)
	 */
	openModal: (id: string, data?: unknown) => void;

	/**
	 * Close a modal by ID, or close the topmost modal if no ID provided.
	 * @param id - Optional modal ID to close
	 */
	closeModal: (id?: string) => void;

	/** Close all open modals */
	closeAllModal: () => void;

	/**
	 * Get typed data for a modal.
	 * @param id - Modal ID
	 * @returns Typed data or undefined if modal not found
	 * @example const user = getModalData<User>("edit-user");
	 */
	getModalData: <T>(id: string) => T | undefined;

	/** Check if a modal is currently open */
	isModalOpen: (id: string) => boolean;

	/** Get the stack level of a modal (for z-index) */
	getModalLevel: (id: string) => number;

	/** Set global loading state */
	setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
	modalStack: [],
	isLoading: false,

	openModal: (id, data) => {
		set((state) => {
			// Prevent duplicate modals
			if (state.modalStack.some((m) => m.id === id)) {
				return state;
			}
			return {
				modalStack: [...state.modalStack, { id, data }],
			};
		});
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

	closeAllModal: () => {
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
