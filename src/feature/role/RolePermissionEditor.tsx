import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, LoadingBoundary, SkeletonList, PermissionMatrix } from "@/src/component";
import { api, handleApiError } from "@/src/lib/api";
import { TOAST } from "@/src/lib/toast";
import type { PermissionGroup } from "@/shared/type";

interface RolePermissionEditorProp {
	roleId: number;
	currentPermissionList: string[];
	onSave?: () => void;
}

export function RolePermissionEditor({
	roleId,
	currentPermissionList,
	onSave,
}: RolePermissionEditorProp) {
	const queryClient = useQueryClient();
	const [selectedPermissionList, setSelectedPermissionList] = useState<Set<string>>(
		new Set(currentPermissionList),
	);
	const [hasChanges, setHasChanges] = useState(false);

	// Reset when role changes
	useEffect(() => {
		setSelectedPermissionList(new Set(currentPermissionList));
		setHasChanges(false);
	}, [currentPermissionList, roleId]);

	const {
		data: permissionGroupList,
		isLoading,
		isError,
		refetch,
	} = useQuery({
		queryKey: ["permission"],
		queryFn: () => api.get<PermissionGroup[]>("/permission"),
	});

	const mutation = useMutation({
		mutationFn: async (permissionList: string[]) => {
			return api.put(`/role/${roleId}/permission`, { permissionList });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["role", roleId] });
			queryClient.invalidateQueries({ queryKey: ["role"] });
			TOAST.updated("Permission");
			setHasChanges(false);
			onSave?.();
		},
		onError: handleApiError,
	});

	const handleChange = (permissionList: Set<string>) => {
		setSelectedPermissionList(permissionList);
		setHasChanges(true);
	};

	const handleSave = () => {
		mutation.mutate(Array.from(selectedPermissionList));
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<p className="text-sm text-zinc-500 dark:text-zinc-400">
					Select permission for this role
				</p>
				{hasChanges && (
					<Button size="sm" onClick={handleSave} isLoading={mutation.isPending}>
						Save Change
					</Button>
				)}
			</div>

			<LoadingBoundary
				isLoading={isLoading}
				isError={isError}
				onRetry={refetch}
				loadingFallback={<SkeletonList count={4} variant="simple" />}
			>
				{permissionGroupList && (
					<PermissionMatrix
						permissionGroupList={permissionGroupList}
						selectedPermissionList={selectedPermissionList}
						onChange={handleChange}
						disabled={mutation.isPending}
					/>
				)}
			</LoadingBoundary>
		</div>
	);
}
