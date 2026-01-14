import { Pencil, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
	Button,
	DetailPanelHeader,
	SkeletonOrderDetail,
	TabGroup,
	TabList,
	Tab,
	TabPanels,
	TabPanel,
	HistoryLogPanel,
} from "@/src/component";
import { formatDateTime } from "@/src/lib/date";
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
		queryKey: queryKey.order.detail(order.publicId),
		queryFn: () => api.get<Order>(`/order/${order.publicId}`),
		enabled: needsFetch,
	});

	if (needsFetch && isLoading) {
		return <SkeletonOrderDetail lineCount={3} />;
	}

	const orderData = fullOrder ?? order;
	const lineList = orderData.lineList ?? [];

	return (
		<div className="space-y-6">
			<DetailPanelHeader
				title={`Order #${orderData.publicId}`}
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
							resourceId={orderData.publicId}
						/>
					</TabPanel>
				</TabPanels>
			</TabGroup>
		</div>
	);
}
