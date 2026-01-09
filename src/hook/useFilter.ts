import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

interface UseFilterOption {
    syncUrl?: boolean;
    debounceMs?: number;
}

interface UseFilterReturn {
    search: string;
    setSearch: (value: string) => void;
    filterMap: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    clearFilter: () => void;
    queryParam: Record<string, string>;
}

export function useFilter(option: UseFilterOption = {}): UseFilterReturn {
    const { syncUrl = true, debounceMs = 300 } = option;
    const [urlParam, setUrlParam] = useSearchParams();

    const [search, setSearchInternal] = useState(() =>
        syncUrl ? urlParam.get("search") || "" : "",
    );

    const [filterMap, setFilterMap] = useState<Record<string, string>>(() => {
        if (!syncUrl) return {};
        const initial: Record<string, string> = {};
        for (const [key, value] of urlParam.entries()) {
            if (key !== "search" && key !== "selected") {
                initial[key] = value;
            }
        }
        return initial;
    });

    const [debouncedSearch, setDebouncedSearch] = useState(search);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, debounceMs);
        return () => clearTimeout(timer);
    }, [search, debounceMs]);

    useEffect(() => {
        if (!syncUrl) return;

        const newParam = new URLSearchParams(urlParam);

        if (debouncedSearch) {
            newParam.set("search", debouncedSearch);
        } else {
            newParam.delete("search");
        }

        for (const [key, value] of Object.entries(filterMap)) {
            if (value) {
                newParam.set(key, value);
            } else {
                newParam.delete(key);
            }
        }

        setUrlParam(newParam, { replace: true });
    }, [debouncedSearch, filterMap, syncUrl, urlParam, setUrlParam]);

    const setSearch = useCallback((value: string) => {
        setSearchInternal(value);
    }, []);

    const setFilter = useCallback((key: string, value: string) => {
        setFilterMap((prev) => ({ ...prev, [key]: value }));
    }, []);

    const clearFilter = useCallback(() => {
        setSearchInternal("");
        setFilterMap({});
    }, []);

    const queryParam = useMemo(() => {
        const param: Record<string, string> = {};
        if (debouncedSearch) param.search = debouncedSearch;
        return { ...param, ...filterMap };
    }, [debouncedSearch, filterMap]);

    return {
        search,
        setSearch,
        filterMap,
        setFilter,
        clearFilter,
        queryParam,
    };
}
