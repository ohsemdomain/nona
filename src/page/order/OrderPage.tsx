import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMasterDetail } from "@/src/hook/useMasterDetail";
import { useUIStore } from "@/src/store/ui";
import {
	MasterDetail,
	MasterList,
	MasterListItem,
	DetailPanel,
	SearchInput,
	Select,
	Button,
	LoadingBoundary,
	EmptyState,
	SkeletonList,
	SkeletonOrderDetail,
} from "@/src/component";
import { formatMoney } from "@/src/lib/format";
import { formatDate } from "@/src/lib/date";
import type { Order, OrderStatus } from "@/shared/type";
import { ORDER_STATUS_LABEL, ORDER_STATUS_COLOR } from "@/shared/type";
import { OrderDetail, OrderDeleteDialog } from "@/src/feature/order";

const MODAL_ID = {
	delete: "order-delete",
};

const STATUS_OPTION: { value: OrderStatus | ""; label: string }[] = [
	{ value: "", label: "All Status" },
	{ value: "draft", label: "Draft" },
	{ value: "pending", label: "Pending" },
	{ value: "confirmed", label: "Confirmed" },
	{ value: "completed", label: "Completed" },
	{ value: "cancelled", label: "Cancelled" },
];

export function OrderPage() {
	const navigate = useNavigate();
	const { openModal } = useUIStore();

	const {
		list,
		isLoading,
		isError,
		refetch,
		selectedId,
		selectedItem,
		setSelectedId,
		selectAfterDelete,
		search,
		setSearch,
		filterMap,
		setFilter,
	} = useMasterDetail<Order>("order");

	const handleCreate = () => {
		navigate("/order/new");
	};

	const handleEdit = () => {
		if (selectedItem) {
			navigate(`/order/${selectedItem.publicId}/edit`);
		}
	};

	const handleDelete = () => {
		if (selectedItem) {
			openModal(MODAL_ID.delete, selectedItem);
		}
	};

	return (
		<>
			<MasterDetail selectedId={selectedId}>
				<MasterList
					header={
						<div className="space-y-3">
							<div className="flex items-center justify-between">
								<h1 className="text-lg font-semibold text-zinc-900 ">
									Order
								</h1>
								<Button size="sm" onClick={handleCreate}>
									<Plus className="h-4 w-4" />
									New
								</Button>
							</div>
							<div className="flex items-center gap-2">
								<Select
									value={filterMap.status || ""}
									onChange={(e) => setFilter("status", e.target.value)}
									className="w-32"
									aria-label="Filter by status"
								>
									{STATUS_OPTION.map((opt) => (
										<option key={opt.value} value={opt.value}>
											{opt.label}
										</option>
									))}
								</Select>
								<SearchInput
									value={search}
									onChange={setSearch}
									placeholder="Search order..."
								/>
							</div>
						</div>
					}
				>
					<LoadingBoundary
						isLoading={isLoading}
						isError={isError}
						onRetry={refetch}
						loadingFallback={<SkeletonList count={8} variant="order" />}
					>
						{list.length === 0 ? (
							<EmptyState
								title="No order"
								message="Create your first order to get started."
								action={
									<Button size="sm" onClick={handleCreate}>
										<Plus className="h-4 w-4" />
										Create Order
									</Button>
								}
							/>
						) : (
							list.map((order) => (
								<MasterListItem
									key={order.publicId}
									isSelected={selectedId === order.publicId}
									onClick={() => setSelectedId(order.publicId)}
								>
									<div className="flex items-center justify-between gap-2">
										<div className="min-w-0 flex-1">
											<p className="font-medium text-zinc-900 ">
												#{order.publicId}
											</p>
											<p className="text-sm text-zinc-500 ">
												{formatDate(order.createdAt)}
											</p>
										</div>
										<div className="flex shrink-0 flex-col items-end gap-1">
											<span className="text-sm font-medium text-zinc-600 ">
												{formatMoney(order.total)}
											</span>
											<span
												className={`rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLOR[order.status]}`}
											>
												{ORDER_STATUS_LABEL[order.status]}
											</span>
										</div>
									</div>
								</MasterListItem>
							))
						)}
					</LoadingBoundary>
				</MasterList>

				<DetailPanel onBack={() => setSelectedId(null)} backLabel="Order">
					{selectedItem ? (
						<OrderDetail
							order={selectedItem}
							onEdit={handleEdit}
							onDelete={handleDelete}
						/>
					) : isLoading ? (
						<SkeletonOrderDetail lineCount={3} />
					) : (
						<EmptyState
							title="No order selected"
							message="Select an order from the list to view detail."
						/>
					)}
				</DetailPanel>
			</MasterDetail>

			<OrderDeleteDialog
				id={MODAL_ID.delete}
				onSuccess={selectAfterDelete}
			/>
		</>
	);
}
