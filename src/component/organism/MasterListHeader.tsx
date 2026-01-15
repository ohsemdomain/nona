import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button, SearchInput, PermissionGuard } from "@/src/component";
import type { PermissionValue } from "@/shared/constant/permission";

interface MasterListHeaderProp {
	title: string;
	onCreate: () => void;
	search: string;
	onSearchChange: (value: string) => void;
	searchPlaceholder?: string;
	createLabel?: string;
	createPermission?: PermissionValue | PermissionValue[];
	filter?: ReactNode;
}

export function MasterListHeader({
	title,
	onCreate,
	search,
	onSearchChange,
	searchPlaceholder = "Search...",
	createLabel = "New",
	createPermission,
	filter,
}: MasterListHeaderProp) {
	const createButton = (
		<Button size="sm" onClick={onCreate}>
			<Plus className="h-4 w-4" />
			{createLabel}
		</Button>
	);

	return (
		<div className="space-y-3 border-b border-geist-border px-5 py-5">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold text-geist-fg">{title}</h1>
				{createPermission ? (
					<PermissionGuard permission={createPermission}>
						{createButton}
					</PermissionGuard>
				) : (
					createButton
				)}
			</div>
			<SearchInput
				value={search}
				onChange={onSearchChange}
				placeholder={searchPlaceholder}
			/>
			{filter}
		</div>
	);
}
