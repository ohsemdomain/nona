import { useMemo } from "react";
import { clsx } from "clsx";
import { Checkbox } from "./Checkbox";
import type { PermissionGroup } from "@/shared/type";

interface PermissionMatrixProp {
	permissionGroupList: PermissionGroup[];
	selectedPermissionList: Set<string>;
	onChange: (permissionList: Set<string>) => void;
	disabled?: boolean;
}

const ACTION_ORDER = ["create", "read", "update", "delete"];
const ACTION_LABEL: Record<string, string> = {
	create: "Create",
	read: "Read",
	update: "Update",
	delete: "Delete",
};

export function PermissionMatrix({
	permissionGroupList,
	selectedPermissionList,
	onChange,
	disabled = false,
}: PermissionMatrixProp) {
	// Separate standard groups from special permissions (like system:admin)
	const { standardGroupList, specialPermissionList } = useMemo(() => {
		const standard: PermissionGroup[] = [];
		const special: { name: string; label: string }[] = [];

		for (const group of permissionGroupList) {
			// Check if this group has standard CRUD actions
			const hasStandardAction = group.permissionList.some((p) =>
				ACTION_ORDER.includes(p.action),
			);

			if (hasStandardAction) {
				standard.push(group);
			} else {
				// Special permissions (like system:admin)
				for (const p of group.permissionList) {
					special.push({
						name: p.name,
						label: `${group.label}: ${p.action.charAt(0).toUpperCase() + p.action.slice(1)}`,
					});
				}
			}
		}

		return { standardGroupList: standard, specialPermissionList: special };
	}, [permissionGroupList]);

	const togglePermission = (permissionName: string) => {
		const next = new Set(selectedPermissionList);
		if (next.has(permissionName)) {
			next.delete(permissionName);
		} else {
			next.add(permissionName);
		}
		onChange(next);
	};

	const toggleRow = (group: PermissionGroup) => {
		const groupPermissionList = group.permissionList.map((p) => p.name);
		const allSelected = groupPermissionList.every((p) =>
			selectedPermissionList.has(p),
		);

		const next = new Set(selectedPermissionList);
		for (const p of groupPermissionList) {
			if (allSelected) {
				next.delete(p);
			} else {
				next.add(p);
			}
		}

		onChange(next);
	};

	const getRowState = (group: PermissionGroup) => {
		const groupPermissionList = group.permissionList.map((p) => p.name);
		const selectedCount = groupPermissionList.filter((p) =>
			selectedPermissionList.has(p),
		).length;

		return {
			all: selectedCount === groupPermissionList.length,
			some: selectedCount > 0 && selectedCount < groupPermissionList.length,
		};
	};

	return (
		<div className="space-y-4">
			{/* Permission Matrix Table */}
			<div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-zinc-50 dark:bg-zinc-800/50">
							<th className="px-3 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
								Resource
							</th>
							{ACTION_ORDER.map((action) => (
								<th
									key={action}
									className="w-20 px-3 py-2 text-center font-medium text-zinc-600 dark:text-zinc-400"
								>
									{ACTION_LABEL[action]}
								</th>
							))}
						</tr>
					</thead>
					<tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
						{standardGroupList.map((group) => {
							const rowState = getRowState(group);
							const permissionByAction: Record<string, string | null> = {};

							for (const action of ACTION_ORDER) {
								const permission = group.permissionList.find(
									(p) => p.action === action,
								);
								permissionByAction[action] = permission?.name ?? null;
							}

							return (
								<tr
									key={group.resource}
									className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30"
								>
									<td className="px-3 py-2">
										<button
											type="button"
											onClick={() => toggleRow(group)}
											disabled={disabled}
											className={clsx(
												"inline-flex items-center gap-2 font-medium",
												"text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100",
												"disabled:cursor-not-allowed disabled:opacity-50",
											)}
										>
											<Checkbox
												checked={rowState.all}
												indeterminate={rowState.some}
												disabled={disabled}
												onChange={() => toggleRow(group)}
											/>
											{group.label}
										</button>
									</td>
									{ACTION_ORDER.map((action) => {
										const permissionName = permissionByAction[action];
										if (!permissionName) {
											return (
												<td
													key={action}
													className="px-3 py-2 text-center text-zinc-300 dark:text-zinc-600"
												>
													—
												</td>
											);
										}

										return (
											<td key={action} className="px-3 py-2 text-center">
												<Checkbox
													checked={selectedPermissionList.has(permissionName)}
													onChange={() => togglePermission(permissionName)}
													disabled={disabled}
												/>
											</td>
										);
									})}
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>

			{/* Special Permissions */}
			{specialPermissionList.length > 0 && (
				<div className="space-y-2">
					<p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
						Special Permission
					</p>
					<div className="flex flex-wrap gap-3">
						{specialPermissionList.map((perm) => (
							<Checkbox
								key={perm.name}
								checked={selectedPermissionList.has(perm.name)}
								onChange={() => togglePermission(perm.name)}
								disabled={disabled}
								label={perm.label}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
