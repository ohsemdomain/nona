import { Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useUIStore } from "@/src/store/ui";
import {
	Button,
	LoadingBoundary,
	EmptyState,
	SearchInput,
	PermissionGuard,
	SkeletonTable,
} from "@/src/component";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { PERMISSION } from "@/shared/constant/permission";
import { getRoleColorClasses } from "@/shared/constant/auth";
import type { User } from "@/shared/type";
import { UserFormModal } from "./UserFormModal";
import { UserDeleteDialog } from "./UserDeleteDialog";

const MODAL_ID = {
	create: "user-create",
	edit: "user-edit",
	delete: "user-delete",
};

interface ListResponse {
	data: User[];
	total: number;
}

export function UserPage() {
	const queryClient = useQueryClient();
	const { openModal } = useUIStore();
	const [searchParam, setSearchParam] = useSearchParams();

	const search = searchParam.get("search") || "";

	const setSearch = (value: string) => {
		const newParam = new URLSearchParams(searchParam);
		if (value) {
			newParam.set("search", value);
		} else {
			newParam.delete("search");
		}
		setSearchParam(newParam, { replace: true });
	};

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: queryKey.user.list({ search }),
		queryFn: () =>
			api.get<ListResponse>(`/user${search ? `?search=${search}` : ""}`),
	});

	const list = data?.data ?? [];

	const handleCreate = () => {
		openModal(MODAL_ID.create);
	};

	const handleEdit = (user: User) => {
		openModal(MODAL_ID.edit, user);
	};

	const handleDelete = (user: User) => {
		openModal(MODAL_ID.delete, user);
	};

	return (
		<>
			<div className="flex h-full flex-col">
				<div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
					<div className="flex items-center justify-between gap-4">
						<h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
							User Management
						</h1>
						<PermissionGuard permission={PERMISSION.USER_CREATE}>
							<Button size="sm" onClick={handleCreate}>
								<Plus className="h-4 w-4" />
								New User
							</Button>
						</PermissionGuard>
					</div>
					<div className="mt-4 max-w-xs">
						<SearchInput
							value={search}
							onChange={setSearch}
							placeholder="Search by name or email..."
						/>
					</div>
				</div>

				<div className="flex-1 overflow-auto p-4">
					<LoadingBoundary
						isLoading={isLoading}
						isError={isError}
						onRetry={refetch}
						loadingFallback={<SkeletonTable rows={8} showHeader={false} />}
					>
						{list.length === 0 ? (
							<EmptyState
								title="No users found"
								message={
									search
										? "Try a different search term."
										: "Create your first user to get started."
								}
								action={
									!search && (
										<PermissionGuard permission={PERMISSION.USER_CREATE}>
											<Button size="sm" onClick={handleCreate}>
												<Plus className="h-4 w-4" />
												Create User
											</Button>
										</PermissionGuard>
									)
								}
							/>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b border-zinc-200 dark:border-zinc-700">
											<th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
												Name
											</th>
											<th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
												Email
											</th>
											<th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
												Role
											</th>
											<th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
												Actions
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
										{list.map((user) => (
											<tr
												key={user.publicId}
												className="hover:bg-zinc-50 dark:hover:bg-zinc-900"
											>
												<td className="px-4 py-3">
													<span className="font-medium text-zinc-900 dark:text-zinc-100">
														{user.name}
													</span>
												</td>
												<td className="px-4 py-3">
													<span className="text-zinc-600 dark:text-zinc-400">
														{user.email}
													</span>
												</td>
												<td className="px-4 py-3">
													<span
														className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getRoleColorClasses(user.roleName)}`}
													>
														{user.roleName || "No role"}
													</span>
												</td>
												<td className="px-4 py-3">
													<div className="flex gap-2">
														<PermissionGuard permission={PERMISSION.USER_UPDATE}>
															<Button
																variant="secondary"
																size="sm"
																onClick={() => handleEdit(user)}
															>
																Edit
															</Button>
														</PermissionGuard>
														<PermissionGuard permission={PERMISSION.USER_DELETE}>
															<Button
																variant="danger"
																size="sm"
																onClick={() => handleDelete(user)}
															>
																Delete
															</Button>
														</PermissionGuard>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</LoadingBoundary>
				</div>
			</div>

			<UserFormModal
				id={MODAL_ID.create}
				onSuccess={() =>
					queryClient.invalidateQueries({ queryKey: queryKey.user.all })
				}
			/>
			<UserFormModal
				id={MODAL_ID.edit}
				onSuccess={() =>
					queryClient.invalidateQueries({ queryKey: queryKey.user.all })
				}
			/>
			<UserDeleteDialog
				id={MODAL_ID.delete}
				onSuccess={() =>
					queryClient.invalidateQueries({ queryKey: queryKey.user.all })
				}
			/>
		</>
	);
}
