import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Pencil } from "lucide-react";
import { Button, Select, FormField, LoadingState } from "@/src/component";
import { useResource } from "@/src/hook/useResource";
import { useInlineModal } from "@/src/hook/useInlineModal";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import { formatMoney } from "@/src/lib/format";
import type { Order, Item, OrderStatus, CreateOrderInput, UpdateOrderInput } from "@/shared/type";
import { ORDER_STATUS_LABEL } from "@/shared/type";
import { ItemFormModal } from "@/src/page/item/ItemFormModal";

interface FormLine {
    key: string;
    itemId: string;
    quantity: number;
}

const INLINE_ITEM_MODAL_ID = "order-inline-item";

export function OrderFormPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const isEdit = !!id;

    const { create, update } = useResource<Order, CreateOrderInput, UpdateOrderInput>("order", "Order");
    const itemResource = useResource<Item>("item", "Item");
    const { data: itemList = [] } = itemResource.list();

    const { data: existingOrder, isLoading: isLoadingOrder } = useQuery({
        queryKey: queryKey.order.detail(id ?? ""),
        queryFn: () => api.get<Order>(`/order/${id}`),
        enabled: isEdit,
    });

    const [lineList, setLineList] = useState<FormLine[]>([]);
    const [status, setStatus] = useState<OrderStatus>("draft");
    const [error, setError] = useState<Record<string, string>>({});

    // Inline modal hook - callback passed upfront, handleSuccess is stable
    const itemModal = useInlineModal<Item>(INLINE_ITEM_MODAL_ID, (key, item) => {
        setLineList((prev) =>
            prev.map((line) =>
                line.key === key ? { ...line, itemId: String(item.id) } : line,
            ),
        );
    });

    useEffect(() => {
        if (existingOrder) {
            setStatus(existingOrder.status);
            setLineList(
                (existingOrder.lineList ?? []).map((line) => ({
                    key: `existing-${line.id}`,
                    itemId: String(line.itemId),
                    quantity: line.quantity,
                })),
            );
        }
    }, [existingOrder]);

    const handleAddLine = () => {
        setLineList((prev) => [
            ...prev,
            { key: `new-${Date.now()}`, itemId: "", quantity: 1 },
        ]);
    };

    const handleRemoveLine = (key: string) => {
        setLineList((prev) => prev.filter((line) => line.key !== key));
    };

    const handleLineChange = (
        key: string,
        field: "itemId" | "quantity",
        value: string | number,
    ) => {
        setLineList((prev) =>
            prev.map((line) =>
                line.key === key ? { ...line, [field]: value } : line,
            ),
        );
    };

    const calculateTotal = () => {
        return lineList.reduce((sum, line) => {
            const item = itemList.find((i) => String(i.id) === line.itemId);
            if (!item) return sum;
            return sum + item.price * line.quantity;
        }, 0);
    };

    const validate = (): boolean => {
        const newError: Record<string, string> = {};

        if (lineList.length === 0) {
            newError.lineList = "At least one item is required";
        }

        for (const line of lineList) {
            if (!line.itemId) {
                newError[`line-${line.key}-item`] = "Item is required";
            }
            if (line.quantity < 1) {
                newError[`line-${line.key}-quantity`] = "Quantity must be at least 1";
            }
        }

        setError(newError);
        return Object.keys(newError).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        const lineData = lineList.map((line) => ({
            itemId: parseInt(line.itemId),
            quantity: line.quantity,
        }));

        try {
            if (isEdit && id) {
                await update.mutateAsync({
                    id,
                    data: { status, lineList: lineData },
                });
            } else {
                await create.mutateAsync({ lineList: lineData });
            }
            navigate("/order");
        } catch {
            // Error handled by useResource
        }
    };

    const isPending = create.isPending || update.isPending;

    if (isEdit && isLoadingOrder) {
        return (
            <div className="flex h-full items-center justify-center">
                <LoadingState message="Loading order..." />
            </div>
        );
    }

    return (
        <>
            <div className="h-full overflow-y-auto">
            <div className="mx-auto max-w-3xl px-4 py-8">
                <div className="mb-6">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate("/order")}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Order
                    </Button>
                </div>

                <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
                    <h1 className="mb-6 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                        {isEdit ? `Edit Order #${id}` : "Create Order"}
                    </h1>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {isEdit && (
                            <FormField label="Status" htmlFor="order-status">
                                <Select
                                    id="order-status"
                                    value={status}
                                    onChange={(e) =>
                                        setStatus(e.target.value as OrderStatus)
                                    }
                                    disabled={isPending}
                                >
                                    {Object.entries(ORDER_STATUS_LABEL).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </Select>
                            </FormField>
                        )}

                        <div>
                            <div className="mb-3 flex items-center justify-between">
                                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Order Line
                                    <span className="ml-1 text-red-500">*</span>
                                </label>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={handleAddLine}
                                    disabled={isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Item
                                </Button>
                            </div>

                            {error.lineList && (
                                <p className="mb-2 text-sm text-red-500">{error.lineList}</p>
                            )}

                            {lineList.length === 0 ? (
                                <div className="rounded border border-dashed border-zinc-300 p-8 text-center dark:border-zinc-600">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                                        No item added. Click "Add Item" to add an item to the order.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {lineList.map((line) => {
                                        const selectedItem = itemList.find(
                                            (i) => String(i.id) === line.itemId,
                                        );
                                        const lineTotal = selectedItem
                                            ? selectedItem.price * line.quantity
                                            : 0;

                                        return (
                                            <div
                                                key={line.key}
                                                className="flex items-start gap-3 rounded border border-zinc-200 p-3 dark:border-zinc-700"
                                            >
                                                <div className="min-w-0 flex-1 space-y-3">
                                                    <div className="flex gap-2">
                                                        <div className="flex-1">
                                                            <Select
                                                                value={line.itemId}
                                                                onChange={(e) =>
                                                                    handleLineChange(
                                                                        line.key,
                                                                        "itemId",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                error={!!error[`line-${line.key}-item`]}
                                                                disabled={isPending}
                                                            >
                                                                <option value="">Select item...</option>
                                                                {itemList.map((item) => (
                                                                    <option key={item.publicId} value={item.id}>
                                                                        {item.name} ({formatMoney(item.price)})
                                                                    </option>
                                                                ))}
                                                            </Select>
                                                        </div>
                                                        {/* Edit selected item */}
                                                        {selectedItem && (
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => itemModal.openEdit(line.key, selectedItem)}
                                                                disabled={isPending}
                                                            >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        {/* Create new item */}
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            size="sm"
                                                            onClick={() => itemModal.openCreate(line.key)}
                                                            disabled={isPending}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-24">
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={line.quantity}
                                                                onChange={(e) =>
                                                                    handleLineChange(
                                                                        line.key,
                                                                        "quantity",
                                                                        parseInt(e.target.value) || 1,
                                                                    )
                                                                }
                                                                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                                                                disabled={isPending}
                                                            />
                                                        </div>
                                                        <span className="text-sm text-zinc-500 dark:text-zinc-400">
                                                            x {selectedItem ? formatMoney(selectedItem.price) : "$0.00"}
                                                        </span>
                                                        <span className="ml-auto font-medium text-zinc-900 dark:text-zinc-100">
                                                            {formatMoney(lineTotal)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => handleRemoveLine(line.key)}
                                                    disabled={isPending}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                            <div className="flex items-center justify-between">
                                <span className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                                    Total
                                </span>
                                <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                                    {formatMoney(calculateTotal())}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => navigate("/order")}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isPending}>
                                {isEdit ? "Save Changes" : "Create Order"}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
            </div>

            <ItemFormModal
                id={INLINE_ITEM_MODAL_ID}
                onSuccess={itemModal.handleSuccess}
            />
        </>
    );
}
