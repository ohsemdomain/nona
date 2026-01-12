import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check } from "lucide-react";
import { Button, LoadingBoundary, SkeletonList } from "@/src/component";
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
	const [selectedPermissionList, setSelectedPermissionList] = useState<
		Set<string>
	>(new Set(currentPermissionList));
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

	const togglePermission = (permissionName: string) => {
		setSelectedPermissionList((prev) => {
			const next = new Set(prev);
			if (next.has(permissionName)) {
				next.delete(permissionName);
			} else {
				next.add(permissionName);
			}
			return next;
		});
		setHasChanges(true);
	};

	const toggleGroup = (group: PermissionGroup) => {
		const groupPermissionList = group.permissionList.map((p) => p.name);
		const allSelected = groupPermissionList.every((p) =>
			selectedPermissionList.has(p),
		);

		setSelectedPermissionList((prev) => {
			const next = new Set(prev);
			for (const p of groupPermissionList) {
				if (allSelected) {
					next.delete(p);
				} else {
					next.add(p);
				}
			}
			return next;
		});
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
				<div className="space-y-6">
					{permissionGroupList?.map((group) => {
						const groupPermissionList = group.permissionList.map((p) => p.name);
						const selectedCount = groupPermissionList.filter((p) =>
							selectedPermissionList.has(p),
						).length;
						const allSelected = selectedCount === groupPermissionList.length;
						const someSelected = selectedCount > 0 && !allSelected;

						return (
							<div key={group.resource} className="space-y-2">
								<button
									type="button"
									onClick={() => toggleGroup(group)}
									className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"
								>
									<div
										className={`h-4 w-4 rounded border flex items-center justify-center ${
											allSelected
												? "bg-blue-600 border-blue-600"
												: someSelected
													? "bg-blue-100 border-blue-600 dark:bg-blue-900"
													: "border-zinc-300 dark:border-zinc-600"
										}`}
									>
										{(allSelected || someSelected) && (
											<Check className="h-3 w-3 text-white" />
										)}
									</div>
									{group.label}
									<span className="text-zinc-400">
										({selectedCount}/{groupPermissionList.length})
									</span>
								</button>

								<div className="ml-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
									{group.permissionList.map((permission) => {
										const isSelected = selectedPermissionList.has(
											permission.name,
										);
										const action =
											permission.action.charAt(0).toUpperCase() +
											permission.action.slice(1);

										return (
											<button
												key={permission.id}
												type="button"
												onClick={() => togglePermission(permission.name)}
												className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
													isSelected
														? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
														: "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600"
												}`}
											>
												<div
													className={`h-4 w-4 rounded border flex items-center justify-center ${
														isSelected
															? "bg-blue-600 border-blue-600"
															: "border-zinc-300 dark:border-zinc-600"
													}`}
												>
													{isSelected && (
														<Check className="h-3 w-3 text-white" />
													)}
												</div>
												{action}
											</button>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</LoadingBoundary>
		</div>
	);
}
