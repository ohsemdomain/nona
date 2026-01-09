import { useState, useCallback } from "react";
import { CONFIG } from "@/src/lib/config";

interface PaginationState {
    page: number;
    pageSize: number;
}

interface UsePaginationReturn {
    page: number;
    pageSize: number;
    offset: number;
    setPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    reset: () => void;
}

export function usePagination(
    initialPageSize: number = CONFIG.pageSize,
): UsePaginationReturn {
    const [state, setState] = useState<PaginationState>({
        page: 1,
        pageSize: initialPageSize,
    });

    const setPage = useCallback((page: number) => {
        setState((prev) => ({ ...prev, page: Math.max(1, page) }));
    }, []);

    const nextPage = useCallback(() => {
        setState((prev) => ({ ...prev, page: prev.page + 1 }));
    }, []);

    const prevPage = useCallback(() => {
        setState((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }));
    }, []);

    const reset = useCallback(() => {
        setState((prev) => ({ ...prev, page: 1 }));
    }, []);

    return {
        page: state.page,
        pageSize: state.pageSize,
        offset: (state.page - 1) * state.pageSize,
        setPage,
        nextPage,
        prevPage,
        reset,
    };
}
