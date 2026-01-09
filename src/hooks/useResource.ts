import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { invalidateRelated } from "@/src/lib/invalidation";
import { TOAST } from "@/src/lib/toast";

type Entity = "category" | "item" | "order";

interface ListResponse<T> {
    data: T[];
    total: number;
}

interface UseResourceReturn<T, CreateInput, UpdateInput> {
    list: (params?: Record<string, unknown>) => {
        data: T[] | undefined;
        total: number;
        isLoading: boolean;
        isError: boolean;
    };
    detail: (id: string) => {
        data: T | undefined;
        isLoading: boolean;
        isError: boolean;
    };
    create: {
        mutate: (data: CreateInput) => void;
        mutateAsync: (data: CreateInput) => Promise<T>;
        isPending: boolean;
    };
    update: {
        mutate: (params: { id: string; data: UpdateInput }) => void;
        mutateAsync: (params: { id: string; data: UpdateInput }) => Promise<T>;
        isPending: boolean;
    };
    remove: {
        mutate: (id: string) => void;
        mutateAsync: (id: string) => Promise<void>;
        isPending: boolean;
    };
}

export function useResource<T, CreateInput = Partial<T>, UpdateInput = Partial<T>>(
    entity: Entity,
    entityLabel: string = entity,
): UseResourceReturn<T, CreateInput, UpdateInput> {
    const queryClient = useQueryClient();

    const list = (params?: Record<string, unknown>) => {
        const { data, isLoading, isError } = useQuery({
            queryKey: queryKey[entity].list(params),
            queryFn: () => {
                const searchParams = new URLSearchParams();
                if (params) {
                    for (const [key, value] of Object.entries(params)) {
                        if (value !== undefined && value !== null) {
                            searchParams.set(key, String(value));
                        }
                    }
                }
                const query = searchParams.toString();
                return api.get<ListResponse<T>>(
                    `/${entity}${query ? `?${query}` : ""}`,
                );
            },
        });

        return {
            data: data?.data,
            total: data?.total ?? 0,
            isLoading,
            isError,
        };
    };

    const detail = (id: string) => {
        const { data, isLoading, isError } = useQuery({
            queryKey: queryKey[entity].detail(id),
            queryFn: () => api.get<T>(`/${entity}/${id}`),
            enabled: !!id,
        });

        return { data, isLoading, isError };
    };

    const createMutation = useMutation({
        mutationFn: (data: CreateInput) =>
            api.post<T>(`/${entity}`, data),
        onSuccess: () => {
            invalidateRelated(queryClient, entity);
            TOAST.created(entityLabel);
        },
        onError: handleApiError,
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateInput }) =>
            api.put<T>(`/${entity}/${id}`, data),
        onSuccess: () => {
            invalidateRelated(queryClient, entity);
            TOAST.updated(entityLabel);
        },
        onError: handleApiError,
    });

    const removeMutation = useMutation({
        mutationFn: (id: string) => api.delete<void>(`/${entity}/${id}`),
        onSuccess: () => {
            invalidateRelated(queryClient, entity);
            TOAST.deleted(entityLabel);
        },
        onError: handleApiError,
    });

    return {
        list,
        detail,
        create: {
            mutate: createMutation.mutate,
            mutateAsync: createMutation.mutateAsync,
            isPending: createMutation.isPending,
        },
        update: {
            mutate: updateMutation.mutate,
            mutateAsync: updateMutation.mutateAsync,
            isPending: updateMutation.isPending,
        },
        remove: {
            mutate: removeMutation.mutate,
            mutateAsync: removeMutation.mutateAsync,
            isPending: removeMutation.isPending,
        },
    };
}
