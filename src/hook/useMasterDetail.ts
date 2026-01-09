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

interface UseMasterDetailOption {
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
    filterMap: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    clearFilter: () => void;
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
}

export function useMasterDetail<T extends HasPublicId>(
    entity: Entity,
    option: UseMasterDetailOption = {},
): UseMasterDetailReturn<T> {
    const { autoSelectFirst = true } = option;
    const [searchParam, setSearchParam] = useSearchParams();

    const selectedId = searchParam.get("selected");

    const {
        search,
        setSearch,
        filterMap,
        setFilter,
        clearFilter,
        queryParam,
    } = useFilter();

    const { page, pageSize, setPage, reset: resetPagination } = usePagination();

    const {
        data,
        isLoading,
        isError,
    } = useQuery({
        queryKey: queryKey[entity].list({ ...queryParam, page, pageSize }),
        queryFn: () =>
            api.get<ListResponse<T>>(
                `/${entity}?${new URLSearchParams({
                    ...queryParam,
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
            const newParam = new URLSearchParams(searchParam);
            if (id) {
                newParam.set("selected", id);
            } else {
                newParam.delete("selected");
            }
            setSearchParam(newParam, { replace: true });
        },
        [searchParam, setSearchParam],
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
    }, [queryParam, resetPagination]);

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
        filterMap,
        setFilter,
        clearFilter,
        page,
        pageSize,
        setPage,
    };
}
