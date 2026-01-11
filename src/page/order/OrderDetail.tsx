import { Pencil, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button, DetailPanelHeader, SkeletonOrderDetail } from "@/src/component";
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
	const { data: fullOrder, isLoading } = useQuery({
		queryKey: queryKey.order.detail(order.publicId),
		queryFn: () => api.get<Order>(`/order/${order.publicId}`),
	});

	if (isLoading) {
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

			<div className="space-y-4">
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
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
						<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
							Total
						</dt>
						<dd className="mt-1 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
							{formatMoney(orderData.total)}
						</dd>
					</div>
				</div>

				<div>
					<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
						Created
					</dt>
					<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
						{formatDateTime(orderData.createdAt)}
					</dd>
				</div>

				<div>
					<dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
						Last Updated
					</dt>
					<dd className="mt-1 text-zinc-900 dark:text-zinc-100">
						{formatDateTime(orderData.updatedAt)}
					</dd>
				</div>
			</div>

			<div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
				<h3 className="mb-3 text-sm font-medium text-zinc-900 dark:text-zinc-100">
					Order Line ({lineList.length})
				</h3>
				{lineList.length === 0 ? (
					<p className="text-sm text-zinc-500 dark:text-zinc-400">
						No item in this order.
					</p>
				) : (
					<div className="space-y-2">
						{lineList.map((line) => (
							<div
								key={line.id}
								className="flex items-center justify-between rounded border border-zinc-200 p-3 dark:border-zinc-700"
							>
								<div className="min-w-0 flex-1">
									<p className="font-medium text-zinc-900 dark:text-zinc-100">
										{line.item?.name ?? "Unknown Item"}
									</p>
									<p className="text-sm text-zinc-500 dark:text-zinc-400">
										{formatMoney(line.unitPrice)} x {line.quantity}
									</p>
								</div>
								<span className="shrink-0 font-medium text-zinc-900 dark:text-zinc-100">
									{formatMoney(line.lineTotal)}
								</span>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}
