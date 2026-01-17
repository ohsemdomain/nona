import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, handleApiError } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { invalidateRelated } from "@/src/lib/invalidation";
import { TOAST } from "@/src/lib/toast";
import type { Entity } from "@/shared/type";

interface ListResponse<T> {
	data: T[];
	total: number;
}

interface UseResourceReturn<T, CreateInput, UpdateInput> {
	list: (param?: Record<string, unknown>) => {
		data: T[] | undefined;
		total: number;
		isLoading: boolean;
		isError: boolean;
	};
	detail: (id: number | string) => {
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
		mutate: (arg: { id: number | string; data: UpdateInput }) => void;
		mutateAsync: (arg: { id: number | string; data: UpdateInput }) => Promise<T>;
		isPending: boolean;
	};
	remove: {
		mutate: (id: number | string) => void;
		mutateAsync: (id: number | string) => Promise<void>;
		isPending: boolean;
	};
}

export function useResource<
	T,
	CreateInput = Partial<T>,
	UpdateInput = Partial<T>,
>(
	entity: Entity,
	entityLabel: string = entity,
): UseResourceReturn<T, CreateInput, UpdateInput> {
	const queryClient = useQueryClient();

	const list = (param?: Record<string, unknown>) => {
		const { data, isLoading, isError } = useQuery({
			queryKey: queryKey[entity].list(param),
			queryFn: () => {
				const searchParam = new URLSearchParams();
				if (param) {
					for (const [key, value] of Object.entries(param)) {
						if (value !== undefined && value !== null) {
							searchParam.set(key, String(value));
						}
					}
				}
				const query = searchParam.toString();
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

	const detail = (id: number | string) => {
		const { data, isLoading, isError } = useQuery({
			queryKey: queryKey[entity].detail(id),
			queryFn: () => api.get<T>(`/${entity}/${id}`),
			enabled: !!id,
		});

		return { data, isLoading, isError };
	};

	const createMutation = useMutation({
		mutationFn: (data: CreateInput) => api.post<T>(`/${entity}`, data),
		onSuccess: (newEntity) => {
			// Optimistically add to all list caches so it's immediately available
			queryClient.setQueriesData<ListResponse<T>>(
				{ queryKey: queryKey[entity].all },
				(old) => {
					if (!old?.data) return old;
					return {
						data: [...old.data, newEntity],
						total: old.total + 1,
					};
				},
			);
			invalidateRelated(queryClient, entity);
			TOAST.created(entityLabel);
		},
		onError: handleApiError,
	});

	const updateMutation = useMutation({
		mutationFn: ({ id, data }: { id: number | string; data: UpdateInput }) =>
			api.put<T>(`/${entity}/${id}`, data),
		onSuccess: (updatedEntity) => {
			// Optimistically update in all list caches
			queryClient.setQueriesData<ListResponse<T>>(
				{ queryKey: queryKey[entity].all },
				(old) => {
					if (!old?.data) return old;
					return {
						...old,
						data: old.data.map((item) =>
							(item as { id?: number | string }).id ===
							(updatedEntity as { id?: number | string }).id
								? updatedEntity
								: item,
						),
					};
				},
			);
			invalidateRelated(queryClient, entity);
			TOAST.updated(entityLabel);
		},
		onError: handleApiError,
	});

	const removeMutation = useMutation({
		mutationFn: (id: number | string) => api.delete<void>(`/${entity}/${id}`),
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
