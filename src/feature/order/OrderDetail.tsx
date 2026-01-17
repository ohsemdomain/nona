import { Pencil, Trash2, MoreHorizontal, Copy, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
	Button,
	DetailPanelHeader,
	SkeletonOrderDetail,
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
import { formatDateTime, formatDate } from "@/src/lib/date";
import { formatMoney } from "@/src/lib/format";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import type { Order } from "@/shared/type";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/shared/type";

interface OrderDetailProp {
	order: Order;
	onEdit: () => void;
	onDelete: () => void;
}

export function OrderDetail({ order, onEdit, onDelete }: OrderDetailProp) {
	// Only fetch full details if lineList is not already present (list endpoint doesn't include lines)
	const needsFetch = !order.lineList;
	const { data: fullOrder, isLoading } = useQuery({
		queryKey: queryKey.order.detail(order.id),
		queryFn: () => api.get<Order>(`/order/${order.id}`),
		enabled: needsFetch,
	});

	if (needsFetch && isLoading) {
		return <SkeletonOrderDetail lineCount={3} />;
	}

	const orderData = fullOrder ?? order;
	const lineList = orderData.lineList ?? [];
	const shareLink = orderData.shareLink;

	const getShareUrl = () => {
		if (!shareLink) return null;
		return `${window.location.origin}/share/${shareLink.linkId}`;
	};

	const handleCopyLink = () => {
		const url = getShareUrl();
		if (!url) {
			toast.error("No share link available");
			return;
		}

		// Delay to allow dropdown to close and focus to return to document
		setTimeout(async () => {
			// Try modern clipboard API first (only works in secure contexts)
			if (navigator.clipboard?.writeText) {
				try {
					await navigator.clipboard.writeText(url);
					toast.success("Link copied to clipboard");
					return;
				} catch {
					// Fall through to fallback
				}
			}

			// Fallback using textarea and execCommand
			const textArea = document.createElement("textarea");
			textArea.value = url;
			textArea.style.position = "absolute";
			textArea.style.left = "-9999px";
			textArea.style.top = `${window.scrollY}px`;
			textArea.style.fontSize = "16px";
			
			document.body.appendChild(textArea);
			textArea.focus();
			textArea.select();
			textArea.setSelectionRange(0, url.length);

			let success = false;
			try {
				success = document.execCommand("copy");
			} catch {
				success = false;
			}

			document.body.removeChild(textArea);

			if (success) {
				toast.success("Link copied to clipboard");
			} else {
				toast.error("Failed to copy link");
			}
		}, 100);
	};

	const handleShowAsCustomer = () => {
		const url = getShareUrl();
		if (!url) {
			toast.error("No share link available");
			return;
		}
		window.open(url, "_blank");
	};

	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={orderData.orderNumber ? `Order ${orderData.orderNumber}` : `Order #${orderData.id}`}
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
							<DropdownItem onSelect={handleCopyLink} disabled={!shareLink}>
								<Copy className="h-4 w-4" />
								Copy Link
							</DropdownItem>
							<DropdownItem onSelect={handleShowAsCustomer} disabled={!shareLink}>
								<ExternalLink className="h-4 w-4" />
								Show as Customer
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
				<TabList aria-label="Order detail navigation">
					<Tab id="detail">Detail</Tab>
					<Tab id="history">History</Tab>
				</TabList>

				<TabPanels>
					<TabPanel id="detail">
						<div className="space-y-4">
							<div className="flex items-center gap-4">
								<div className="flex-1">
									<dt className="text-sm font-medium text-geist-fg-muted ">
										Status
									</dt>
									<dd className="mt-1">
										<span
											className={`inline-block rounded-full px-2.5 py-1 text-sm font-medium ${ORDER_STATUS_COLOR[orderData.status]}`}
										>
											{ORDER_STATUS_LABEL[orderData.status]}
										</span>
									</dd>
								</div>
								<div className="flex-1">
									<dt className="text-sm font-medium text-geist-fg-muted ">
										Total
									</dt>
									<dd className="mt-1 text-lg font-semibold text-geist-fg ">
										{formatMoney(orderData.total)}
									</dd>
								</div>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted ">
									Created
								</dt>
								<dd className="mt-1 text-geist-fg ">
									{formatDateTime(orderData.createdAt)}
									{orderData.createdByName && (
										<span className="text-geist-fg-muted ">
											{" "}by {orderData.createdByName}
										</span>
									)}
								</dd>
							</div>

							<div>
								<dt className="text-sm font-medium text-geist-fg-muted ">
									Last Updated
								</dt>
								<dd className="mt-1 text-geist-fg ">
									{formatDateTime(orderData.updatedAt)}
									{orderData.updatedByName && (
										<span className="text-geist-fg-muted ">
											{" "}by {orderData.updatedByName}
										</span>
									)}
								</dd>
							</div>

							{shareLink && (
								<div>
									<dt className="text-sm font-medium text-geist-fg-muted ">
										Share Link Expires
									</dt>
									<dd className="mt-1 text-geist-fg ">
										{formatDate(shareLink.expiresAt)}
										{shareLink.expiresAt < Date.now() && (
											<span className="ml-2 text-sm text-red-500">(Expired)</span>
										)}
									</dd>
								</div>
							)}

							<div className="border-t border-geist-border pt-4 ">
								<h3 className="mb-3 text-sm font-medium text-geist-fg ">
									Order Line ({lineList.length})
								</h3>
								{lineList.length === 0 ? (
									<p className="text-sm text-geist-fg-muted ">
										No item in this order.
									</p>
								) : (
									<div className="space-y-2">
										{lineList.map((line) => (
											<div
												key={line.id}
												className="flex items-center justify-between rounded border border-geist-border p-3 "
											>
												<div className="min-w-0 flex-1">
													<p className="font-medium text-geist-fg ">
														{line.item?.name ?? "Unknown Item"}
													</p>
													<p className="text-sm text-geist-fg-muted ">
														{formatMoney(line.unitPrice)} x {line.quantity}
													</p>
												</div>
												<span className="shrink-0 font-medium text-geist-fg ">
													{formatMoney(line.lineTotal)}
												</span>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</TabPanel>

					<TabPanel id="history">
						<HistoryLogPanel
							resourceType="order"
							resourceId={String(orderData.id)}
						/>
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
