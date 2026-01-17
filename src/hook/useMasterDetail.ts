import { useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { useFilter } from "./useFilter";
import { usePagination } from "./usePagination";
import { useIsMobile } from "./useIsMobile";
import type { Entity } from "@/shared/type";

interface ListResponse<T> {
	data: T[];
	total: number;
}

interface HasId {
	id: number | string;
}

interface UseMasterDetailOption {
	autoSelectFirst?: boolean;
	idType?: "number" | "string"; // Default: "number"
}

interface UseMasterDetailReturn<T, TId extends number | string = number> {
	list: T[];
	total: number;
	isLoading: boolean;
	isError: boolean;
	refetch: () => void;
	selectedId: TId | null;
	selectedItem: T | undefined;
	setSelectedId: (id: TId | null) => void;
	selectFirst: () => void;
	selectAfterCreate: (id: TId) => void;
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

export function useMasterDetail<T extends HasId, TId extends number | string = number>(
	entity: Entity,
	option: UseMasterDetailOption = {},
): UseMasterDetailReturn<T, TId> {
	const { autoSelectFirst = true, idType = "number" } = option;
	const isMobile = useIsMobile();
	const [searchParam, setSearchParam] = useSearchParams();

	const { search, setSearch, filterMap, setFilter, clearFilter, queryParam } =
		useFilter();

	const { page, pageSize, setPage, reset: resetPagination } = usePagination();

	const { data, isLoading, isError, refetch } = useQuery({
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

	// Read URL selection - parse based on idType
	const urlSelectedIdStr = searchParam.get("selected");
	const urlSelectedId = urlSelectedIdStr
		? (idType === "number" ? Number(urlSelectedIdStr) : urlSelectedIdStr) as TId | null
		: null;

	// Compute effective selection DURING RENDER (not in effect)
	// This ensures UI shows correct selection immediately
	const computedSelectedId = useMemo((): TId | null => {
		// Case 1: URL has selection - validate it exists in list
		if (urlSelectedId !== null) {
			const exists = list.length === 0 || list.some((item) => item.id === urlSelectedId);
			if (exists) return urlSelectedId as TId;
			// Invalid selection - fall through to auto-select
		}

		// Case 2: No selection or invalid - auto-select first if enabled (desktop only)
		// On mobile, we want to show the list first, not auto-select
		if (autoSelectFirst && !isMobile && list.length > 0) {
			return list[0].id as TId;
		}

		// Case 3: No auto-select, mobile, or empty list
		return null;
	}, [urlSelectedId, list, autoSelectFirst, isMobile]);

	const selectedItem = useMemo(
		() => list.find((item) => item.id === computedSelectedId),
		[list, computedSelectedId],
	);

	// Sync URL when computed selection differs from URL
	// This runs AFTER render, so UI is already correct
	useEffect(() => {
		if (computedSelectedId !== urlSelectedId) {
			const newParam = new URLSearchParams(searchParam);
			if (computedSelectedId !== null) {
				newParam.set("selected", String(computedSelectedId));
			} else {
				newParam.delete("selected");
			}
			setSearchParam(newParam, { replace: true });
		}
	}, [computedSelectedId, urlSelectedId, searchParam, setSearchParam]);

	const setSelectedId = useCallback(
		(id: TId | null) => {
			const newParam = new URLSearchParams(searchParam);
			if (id !== null) {
				newParam.set("selected", String(id));
			} else {
				newParam.delete("selected");
			}
			setSearchParam(newParam, { replace: true });
		},
		[searchParam, setSearchParam],
	);

	const selectFirst = useCallback(() => {
		if (list.length > 0) {
			setSelectedId(list[0].id as TId);
		} else {
			setSelectedId(null);
		}
	}, [list, setSelectedId]);

	const selectAfterCreate = useCallback(
		(id: TId) => {
			setSelectedId(id);
		},
		[setSelectedId],
	);

	const selectAfterDelete = useCallback(() => {
		if (computedSelectedId === null || list.length === 0) {
			setSelectedId(null);
			return;
		}

		const currentIndex = list.findIndex((item) => item.id === computedSelectedId);

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
		setSelectedId(list[nextIndex].id as TId);
	}, [computedSelectedId, list, setSelectedId, selectFirst]);

	useEffect(() => {
		resetPagination();
	}, [queryParam, resetPagination]);

	return {
		list,
		total,
		isLoading,
		isError,
		refetch,
		selectedId: computedSelectedId,
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
