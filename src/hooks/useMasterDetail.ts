import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { useFilter } from "./useFilter";
import { usePagination } from "./usePagination";

type Entity = "category" | "item" | "order";

interface ListResponse<T> {
    data: T[];
    total: number;
}

interface HasPublicId {
    publicId: string;
}

interface UseMasterDetailOptions {
    autoSelectFirst?: boolean;
}

interface UseMasterDetailReturn<T> {
    list: T[];
    total: number;
    isLoading: boolean;
    isError: boolean;
    selectedId: string | null;
    selectedItem: T | undefined;
    setSelectedId: (id: string | null) => void;
    selectFirst: () => void;
    selectAfterCreate: (id: string) => void;
    selectAfterDelete: () => void;
    search: string;
    setSearch: (value: string) => void;
    filters: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    clearFilters: () => void;
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
}

export function useMasterDetail<T extends HasPublicId>(
    entity: Entity,
    options: UseMasterDetailOptions = {},
): UseMasterDetailReturn<T> {
    const { autoSelectFirst = true } = options;
    const [searchParams, setSearchParams] = useSearchParams();

    const selectedId = searchParams.get("selected");

    const {
        search,
        setSearch,
        filters,
        setFilter,
        clearFilters,
        queryParams,
    } = useFilter();

    const { page, pageSize, setPage, reset: resetPagination } = usePagination();

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: queryKey[entity].list({ ...queryParams, page, pageSize }),
        queryFn: () =>
            api.get<ListResponse<T>>(
                `/${entity}?${new URLSearchParams({
                    ...queryParams,
                    page: String(page),
                    pageSize: String(pageSize),
                })}`,
            ),
    });

    const list = data?.data ?? [];
    const total = data?.total ?? 0;

    const selectedItem = useMemo(
        () => list.find((item) => item.publicId === selectedId),
        [list, selectedId],
    );

    const setSelectedId = useCallback(
        (id: string | null) => {
            const newParams = new URLSearchParams(searchParams);
            if (id) {
                newParams.set("selected", id);
            } else {
                newParams.delete("selected");
            }
            setSearchParams(newParams, { replace: true });
        },
        [searchParams, setSearchParams],
    );

    const selectFirst = useCallback(() => {
        if (list.length > 0) {
            setSelectedId(list[0].publicId);
        } else {
            setSelectedId(null);
        }
    }, [list, setSelectedId]);

    const selectAfterCreate = useCallback(
        (id: string) => {
            setSelectedId(id);
        },
        [setSelectedId],
    );

    const selectAfterDelete = useCallback(() => {
        if (!selectedId || list.length === 0) {
            setSelectedId(null);
            return;
        }

        const currentIndex = list.findIndex(
            (item) => item.publicId === selectedId,
        );

        if (currentIndex === -1) {
            selectFirst();
            return;
        }

        if (list.length === 1) {
            setSelectedId(null);
            return;
        }

        const nextIndex =
            currentIndex < list.length - 1 ? currentIndex + 1 : currentIndex - 1;
        setSelectedId(list[nextIndex].publicId);
    }, [selectedId, list, setSelectedId, selectFirst]);

    useEffect(() => {
        if (autoSelectFirst && !isLoading && !selectedId && list.length > 0) {
            selectFirst();
        }
    }, [autoSelectFirst, isLoading, selectedId, list.length, selectFirst]);

    useEffect(() => {
        resetPagination();
    }, [queryParams, resetPagination]);

    return {
        list,
        total,
        isLoading,
        isError,
        selectedId,
        selectedItem,
        setSelectedId,
        selectFirst,
        selectAfterCreate,
        selectAfterDelete,
        search,
        setSearch,
        filters,
        setFilter,
        clearFilters,
        page,
        pageSize,
        setPage,
    };
}
