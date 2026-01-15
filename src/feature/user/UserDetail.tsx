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
import { HistoryLogPanel } from "@/src/feature/audit/component";
import { formatDateTime } from "@/src/lib/date";
import { usePermission } from "@/src/hook/usePermission";
import { PERMISSION } from "@/shared/constant/permission";
import { getRoleColorClasses } from "@/shared/constant/auth";
import type { User } from "@/shared/type";

interface UserDetailProp {
	user: User;
	onEdit: () => void;
	onDelete: () => void;
}

export function UserDetail({ user, onEdit, onDelete }: UserDetailProp) {
	const { hasPermission } = usePermission();
	const canEdit = hasPermission(PERMISSION.USER_UPDATE);
	const canDelete = hasPermission(PERMISSION.USER_DELETE);
	const showDropdown = canEdit || canDelete;

	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={user.name}
				action={
					showDropdown ? (
						<Dropdown>
							<DropdownTrigger asChild>
								<Button variant="secondary" size="sm">
									<MoreHorizontal className="h-4 w-4" />
								</Button>
							</DropdownTrigger>
							<DropdownContent align="end">
								{canEdit && (
									<DropdownItem onSelect={onEdit}>
										<Pencil className="h-4 w-4" />
										Edit
									</DropdownItem>
								)}
								{canEdit && canDelete && <DropdownSeparator />}
								{canDelete && (
									<DropdownItem variant="danger" onSelect={onDelete}>
										<Trash2 className="h-4 w-4" />
										Delete
									</DropdownItem>
								)}
							</DropdownContent>
						</Dropdown>
					) : null
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
								<dt className="text-sm font-medium text-geist-fg-muted">
									Name
								</dt>
								<dd className="mt-1 text-geist-fg">{user.name}</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Email
								</dt>
								<dd className="mt-1 text-geist-fg">
									{user.email}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
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
								<dt className="text-sm font-medium text-geist-fg-muted">
									Created
								</dt>
								<dd className="mt-1 text-geist-fg">
									{formatDateTime(user.createdAt)}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Last Updated
								</dt>
								<dd className="mt-1 text-geist-fg">
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
