import { Pencil, Trash2 } from "lucide-react";
import {
	Button,
	DetailPanelHeader,
	PermissionGuard,
	TabGroup,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	HistoryLogPanel,
} from "@/src/component";
import { formatDateTime } from "@/src/lib/date";
import { PERMISSION } from "@/shared/constant/permission";
import { getRoleColorClasses } from "@/shared/constant/auth";
import type { User } from "@/shared/type";

interface UserDetailProp {
	user: User;
	onEdit: () => void;
	onDelete: () => void;
}

export function UserDetail({ user, onEdit, onDelete }: UserDetailProp) {
	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={user.name}
				action={
					<>
						<PermissionGuard permission={PERMISSION.USER_UPDATE}>
							<Button variant="secondary" size="sm" onClick={onEdit}>
								<Pencil className="h-4 w-4" />
								Edit
							</Button>
						</PermissionGuard>
						<PermissionGuard permission={PERMISSION.USER_DELETE}>
							<Button variant="danger" size="sm" onClick={onDelete}>
								<Trash2 className="h-4 w-4" />
								Delete
							</Button>
						</PermissionGuard>
					</>
				}
			/>

			<TabGroup defaultTab="detail">
				<TabList aria-label="User detail navigation">
					<Tab id="detail">Detail</Tab>
					<Tab id="history">History</Tab>
				</TabList>

				<TabPanels>
					<TabPanel id="detail">
						<div className="space-y-4">
							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Name
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">{user.name}</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Email
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{user.email}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Role
								</dt>
								<dd className="mt-1">
									<span
										className={`inline-flex rounded-full px-2.5 py-1 text-sm font-medium ${getRoleColorClasses(user.roleName)}`}
									>
										{user.roleName || "No role"}
									</span>
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Created
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{formatDateTime(user.createdAt)}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Last Updated
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{formatDateTime(user.updatedAt)}
								</dd>
							</div>
						</div>
					</TabPanel>

					<TabPanel id="history">
						<HistoryLogPanel
							resourceType="user"
							resourceId={user.publicId}
							resourceName={user.name}
						/>
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
