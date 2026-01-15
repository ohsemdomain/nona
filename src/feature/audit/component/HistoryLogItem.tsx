import { Plus, Pencil, Trash2, LogIn, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { formatRelative } from "@/src/lib/date";
import { FieldChangeDisplay } from "./FieldChangeDisplay";
import { RESOURCE_LABEL } from "@/src/lib/auditFormat";
import type { AuditLogEntry, AuditResource, AuditAction } from "@/shared/type";

interface HistoryLogItemProp {
	entry: AuditLogEntry;
	resourceType: AuditResource;
	resourceName?: string;
	className?: string;
}

/**
 * Action configuration for visual styling
 */
const ACTION_CONFIG: Record<
	AuditAction,
	{
		icon: typeof Plus;
		label: string;
		bgColor: string;
		iconColor: string;
	}
> = {
	CREATE: {
		icon: Plus,
		label: "created",
		bgColor: "bg-green-100 ",
		iconColor: "text-green-600 ",
	},
	UPDATE: {
		icon: Pencil,
		label: "updated",
		bgColor: "bg-blue-100 ",
		iconColor: "text-blue-600 ",
	},
	DELETE: {
		icon: Trash2,
		label: "deleted",
		bgColor: "bg-red-100 ",
		iconColor: "text-red-600 ",
	},
	LOGIN: {
		icon: LogIn,
		label: "logged in",
		bgColor: "bg-emerald-100 ",
		iconColor: "text-emerald-600 ",
	},
	LOGOUT: {
		icon: LogOut,
		label: "logged out",
		bgColor: "bg-geist-bg-secondary",
		iconColor: "text-geist-fg-secondary",
	},
};

/**
 * Renders a single audit log entry with action icon, description, and field changes.
 */
export function HistoryLogItem({
	entry,
	resourceType,
	resourceName,
	className,
}: HistoryLogItemProp) {
	const config = ACTION_CONFIG[entry.action];
	const Icon = config.icon;
	const resourceLabel = RESOURCE_LABEL[resourceType];

	// Determine display name from metadata or prop
	const displayName =
		resourceName ??
		(entry.metadata.name as string) ??
		(entry.metadata.email as string) ??
		null;

	return (
		<li
			className={clsx(
				"flex gap-3 rounded-lg border border-geist-border bg-geist-bg p-4",
				className,
			)}
		>
			{/* Action icon */}
			<div
				className={clsx(
					"flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
					config.bgColor,
				)}
			>
				<Icon className={clsx("h-4 w-4", config.iconColor)} />
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
				{/* Main action description */}
				<p className="text-sm text-geist-fg">
					<span className="font-medium">{resourceLabel}</span>
					{displayName && (
						<>
							{" "}
							<span className="text-geist-fg-secondary">
								'{displayName}'
							</span>
						</>
					)}{" "}
					{config.label}.
				</p>

				{/* Field changes for UPDATE actions */}
				{entry.action === "UPDATE" && entry.changes.length > 0 && (
					<div className="mt-2 space-y-1">
						{entry.changes.map((change) => (
							<FieldChangeDisplay
								key={change.field}
								change={change}
								resourceType={resourceType}
							/>
						))}
					</div>
				)}

				{/* Metadata footer: actor and timestamp */}
				<p className="mt-2 text-xs text-geist-fg-muted">
					by {entry.actor.name} &middot; {formatRelative(entry.createdAt)}
				</p>
			</div>
		</li>
	);
}
