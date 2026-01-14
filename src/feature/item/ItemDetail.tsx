import { Pencil, Trash2, MoreHorizontal } from "lucide-react";
import {
	Button,
	DetailPanelHeader,
	TabGroup,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	HistoryLogPanel,
	Dropdown,
	DropdownTrigger,
	DropdownContent,
	DropdownItem,
	DropdownSeparator,
} from "@/src/component";
import { formatDateTime } from "@/src/lib/date";
import { formatMoney } from "@/src/lib/format";
import type { Item } from "@/shared/type";

interface ItemDetailProp {
	item: Item;
	onEdit: () => void;
	onDelete: () => void;
}

export function ItemDetail({ item, onEdit, onDelete }: ItemDetailProp) {
	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={item.name}
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
				<TabList aria-label="Item detail navigation">
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
								<dd className="mt-1 text-geist-fg">{item.name}</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Category
								</dt>
								<dd className="mt-1 text-geist-fg">
									{item.category?.name ?? "No category"}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Price
								</dt>
								<dd className="mt-1 text-geist-fg">
									{formatMoney(item.price)}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Created
								</dt>
								<dd className="mt-1 text-geist-fg">
									{formatDateTime(item.createdAt)}
									{item.createdByName && (
										<span className="text-geist-fg-muted">
											{" "}by {item.createdByName}
										</span>
									)}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted">
									Last Updated
								</dt>
								<dd className="mt-1 text-geist-fg">
									{formatDateTime(item.updatedAt)}
									{item.updatedByName && (
										<span className="text-geist-fg-muted">
											{" "}by {item.updatedByName}
										</span>
									)}
								</dd>
							</div>
						</div>
					</TabPanel>

					<TabPanel id="history">
						<HistoryLogPanel
							resourceType="item"
							resourceId={item.publicId}
							resourceName={item.name}
						/>
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
