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
import type { Category } from "@/shared/type";

interface CategoryDetailProp {
	category: Category;
	onEdit: () => void;
	onDelete: () => void;
}

export function CategoryDetail({
	category,
	onEdit,
	onDelete,
}: CategoryDetailProp) {
	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={category.name}
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

			<TabGroup defaultTab="detail">
				<TabList aria-label="Category detail navigation">
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
								<dd className="mt-1 text-geist-fg">
									{category.name}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Created
								</dt>
								<dd className="mt-1 text-geist-fg">
									{formatDateTime(category.createdAt)}
									{category.createdByName && (
										<span className="text-geist-fg-muted">
											{" "}by {category.createdByName}
										</span>
									)}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Last Updated
								</dt>
								<dd className="mt-1 text-geist-fg">
									{formatDateTime(category.updatedAt)}
									{category.updatedByName && (
										<span className="text-geist-fg-muted">
											{" "}by {category.updatedByName}
										</span>
									)}
								</dd>
							</div>
						</div>
					</TabPanel>

					<TabPanel id="history">
						<HistoryLogPanel
							resourceType="category"
							resourceId={String(category.id)}
							resourceName={category.name}
						/>
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
