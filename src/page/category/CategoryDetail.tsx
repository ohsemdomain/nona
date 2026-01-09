import { Pencil, Trash2 } from "lucide-react";
import { Button, DetailPanelHeader } from "@/src/component";
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
                <div>
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Name
                    </dt>
                    <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                        {category.name}
                    </dd>
                </div>

                <div>
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Created
                    </dt>
                    <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                        {formatDateTime(category.createdAt)}
                    </dd>
                </div>

                <div>
                    <dt className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        Last Updated
                    </dt>
                    <dd className="mt-1 text-zinc-900 dark:text-zinc-100">
                        {formatDateTime(category.updatedAt)}
                    </dd>
                </div>
            </div>
        </div>
    );
}
