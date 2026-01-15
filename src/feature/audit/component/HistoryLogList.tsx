import type { AuditLogEntry, AuditResource } from "@/shared/type";
import { HistoryLogItem } from "./HistoryLogItem";

interface HistoryLogListProp {
	entries: AuditLogEntry[];
	resourceType: AuditResource;
	resourceName?: string;
	className?: string;
}

/**
 * Renders a list of audit log entries.
 */
export function HistoryLogList({
	entries,
	resourceType,
	resourceName,
	className,
}: HistoryLogListProp) {
	return (
		<div className={className}>
			<ul className="space-y-3" role="list" aria-label="Activity history">
				{entries.map((entry) => (
					<HistoryLogItem
						key={entry.id}
						entry={entry}
						resourceType={resourceType}
						resourceName={resourceName}
					/>
				))}
			</ul>
		</div>
	);
}
