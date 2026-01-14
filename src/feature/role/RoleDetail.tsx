import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
	Button,
	DetailPanelHeader,
	TabGroup,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	Dropdown,
	DropdownTrigger,
	DropdownContent,
	DropdownItem,
	DropdownSeparator,
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
					<Dropdown>
						<DropdownTrigger asChild>
							<Button variant="secondary" size="sm">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownTrigger>
						<DropdownContent align="end">
							<DropdownItem onSelect={onEdit}>
								<Pencil className="h-4 w-4" />
								Edit
							</DropdownItem>
							<DropdownSeparator />
							<DropdownItem variant="danger" onSelect={onDelete}>
								<Trash2 className="h-4 w-4" />
								Delete
							</DropdownItem>
						</DropdownContent>
					</Dropdown>
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
								<dt className="text-sm font-medium text-geist-fg-muted ">
									Name
								</dt>
								<dd className="mt-1 text-geist-fg ">
									{role.name}
								</dd>
							</div>

							{role.description && (
								<div>
									<dt className="text-sm font-medium text-geist-fg-muted ">
										Description
									</dt>
									<dd className="mt-1 text-geist-fg ">
										{role.description}
									</dd>
								</div>
							)}

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted ">
									User Count
								</dt>
								<dd className="mt-1 text-geist-fg ">
									{role.userCount ?? 0}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted ">
									Created
								</dt>
								<dd className="mt-1 text-geist-fg ">
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
