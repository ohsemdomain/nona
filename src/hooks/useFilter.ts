import { useState, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

interface UseFilterOptions {
    syncUrl?: boolean;
    debounceMs?: number;
}

interface UseFilterReturn {
    search: string;
    setSearch: (value: string) => void;
    filters: Record<string, string>;
    setFilter: (key: string, value: string) => void;
    clearFilters: () => void;
    queryParams: Record<string, string>;
}

export function useFilter(options: UseFilterOptions = {}): UseFilterReturn {
    const { syncUrl = true, debounceMs = 300 } = options;
    const [searchParams, setSearchParams] = useSearchParams();

    const [search, setSearchInternal] = useState(() =>
        syncUrl ? searchParams.get("search") || "" : "",
    );

    const [filters, setFilters] = useState<Record<string, string>>(() => {
        if (!syncUrl) return {};
        const initial: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
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

        const newParams = new URLSearchParams(searchParams);

        if (debouncedSearch) {
            newParams.set("search", debouncedSearch);
        } else {
            newParams.delete("search");
        }

        for (const [key, value] of Object.entries(filters)) {
            if (value) {
                newParams.set(key, value);
            } else {
                newParams.delete(key);
            }
        }

        setSearchParams(newParams, { replace: true });
    }, [debouncedSearch, filters, syncUrl, searchParams, setSearchParams]);

    const setSearch = useCallback((value: string) => {
        setSearchInternal(value);
    }, []);

    const setFilter = useCallback((key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const clearFilters = useCallback(() => {
        setSearchInternal("");
        setFilters({});
    }, []);

    const queryParams = useMemo(() => {
        const params: Record<string, string> = {};
        if (debouncedSearch) params.search = debouncedSearch;
        return { ...params, ...filters };
    }, [debouncedSearch, filters]);

    return {
        search,
        setSearch,
        filters,
        setFilter,
        clearFilters,
        queryParams,
    };
}
