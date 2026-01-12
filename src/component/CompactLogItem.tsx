import { clsx } from "clsx";
import { formatRelative } from "@/src/lib/date";
import { getFieldLabel, formatFieldValue, RESOURCE_LABEL } from "@/src/lib/auditFormat";
import type { AuditLogEntry, AuditResource, AuditAction } from "@/shared/type";

interface CompactLogItemProp {
	entry: AuditLogEntry;
	resourceType: AuditResource;
}

const ACTION_COLOR: Record<AuditAction, string> = {
	CREATE: "text-green-600 dark:text-green-400",
	UPDATE: "text-blue-600 dark:text-blue-400",
	DELETE: "text-red-600 dark:text-red-400",
	LOGIN: "text-emerald-600 dark:text-emerald-400",
	LOGOUT: "text-zinc-500 dark:text-zinc-400",
};

const ACTION_VERB: Record<AuditAction, string> = {
	CREATE: "Created",
	UPDATE: "Updated",
	DELETE: "Deleted",
	LOGIN: "Logged in",
	LOGOUT: "Logged out",
};

/**
 * Single-line log entry for terminal-style system log.
 * Format: "Created item 'ko' by Admin about 2 hours ago"
 */
export function CompactLogItem({ entry, resourceType }: CompactLogItemProp) {
	const verb = ACTION_VERB[entry.action];
	const color = ACTION_COLOR[entry.action];
	const resourceLabel = RESOURCE_LABEL[resourceType].toLowerCase();
	const displayName =
		(entry.metadata.name as string) ??
		(entry.metadata.email as string) ??
		null;

	// Build changes for UPDATE
	let changesText = "";
	if (entry.action === "UPDATE" && entry.changes.length > 0) {
		changesText = entry.changes
			.map((c) => {
				const label = getFieldLabel(resourceType, c.field);
				const fromVal = formatFieldValue(resourceType, c.field, c.from);
				const toVal = formatFieldValue(resourceType, c.field, c.to);
				return `${label}: ${fromVal}→${toVal}`;
			})
			.join(", ");
	}

	const isAuthAction = entry.action === "LOGIN" || entry.action === "LOGOUT";

	return (
		<div className="px-3 py-0.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800/50">
			<span className={clsx("font-medium", color)}>{verb}</span>
			{!isAuthAction && ` ${resourceLabel}`}
			{displayName && ` '${displayName}'`}
			{" "}by {entry.actor.name}
			<span className="text-zinc-400 dark:text-zinc-500">
				{" "}{formatRelative(entry.createdAt)}
			</span>
			{changesText && (
				<span className="text-zinc-400 dark:text-zinc-500">
					{" "}— {changesText}
				</span>
			)}
		</div>
	);
}
