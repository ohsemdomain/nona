import { Pencil, Trash2 } from "lucide-react";
import {
	Button,
	DetailPanelHeader,
	TabGroup,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
} from "@/src/component";
import { formatDateTime } from "@/src/lib/date";
import { RolePermissionEditor } from "./RolePermissionEditor";
import type { RoleWithPermission } from "@/shared/type";

interface RoleDetailProp {
	role: RoleWithPermission;
	onEdit: () => void;
	onDelete: () => void;
	onPermissionChange: () => void;
}

export function RoleDetail({
	role,
	onEdit,
	onDelete,
	onPermissionChange,
}: RoleDetailProp) {
	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={role.name}
				action={
					<>
						<Button variant="secondary" size="sm" onClick={onEdit}>
							<Pencil className="h-4 w-4" />
							Edit
						</Button>
						<Button variant="danger" size="sm" onClick={onDelete}>
							<Trash2 className="h-4 w-4" />
							Delete
						</Button>
					</>
				}
			/>

			<TabGroup defaultTab="permission">
				<TabList aria-label="Role detail navigation">
					<Tab id="permission">Permission</Tab>
					<Tab id="detail">Detail</Tab>
				</TabList>

				<TabPanels>
					<TabPanel id="permission">
						<RolePermissionEditor
							roleId={role.id}
							currentPermissionList={role.permissionList}
							onSave={onPermissionChange}
						/>
					</TabPanel>

					<TabPanel id="detail">
						<div className="space-y-4">
							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Name
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{role.name}
								</dd>
							</div>

							{role.description && (
								<div>
									<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
										Description
									</dt>
									<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
										{role.description}
									</dd>
								</div>
							)}

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									User Count
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{role.userCount ?? 0}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
									Created
								</dt>
								<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
									{formatDateTime(role.createdAt)}
								</dd>
							</div>
						</div>
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
