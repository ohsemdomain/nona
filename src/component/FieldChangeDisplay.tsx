import { ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import type { AuditFieldChange, AuditResource } from "@/shared/type";
import { formatFieldValue, getFieldLabel } from "@/src/lib/auditFormat";

interface FieldChangeDisplayProp {
	change: AuditFieldChange;
	resourceType: AuditResource;
	className?: string;
}

/**
 * Displays a single field change with formatted values.
 */
export function FieldChangeDisplay({
	change,
	resourceType,
	className,
}: FieldChangeDisplayProp) {
	const fieldLabel = getFieldLabel(resourceType, change.field);
	const fromValue = formatFieldValue(resourceType, change.field, change.from);
	const toValue = formatFieldValue(resourceType, change.field, change.to);

	return (
		<div
			className={clsx(
				"flex flex-wrap items-center gap-1 text-xs text-zinc-600 ",
				className,
			)}
		>
			<span className="font-medium">{fieldLabel}:</span>
			<span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700  ">
				{fromValue}
			</span>
			<ArrowRight className="h-3 w-3 text-zinc-400" />
			<span className="rounded bg-green-50 px-1.5 py-0.5 text-green-700  ">
				{toValue}
			</span>
		</div>
	);
}
