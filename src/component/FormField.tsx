import type { ReactNode } from "react";
import { clsx } from "clsx";

interface FormFieldProp {
	label: string;
	htmlFor?: string;
	error?: string;
	required?: boolean;
	children: ReactNode;
	className?: string;
}

export function FormField({
	label,
	htmlFor,
	error,
	required,
	children,
	className,
}: FormFieldProp) {
	return (
		<div className={clsx("space-y-1", className)}>
			<label
				htmlFor={htmlFor}
				className="block text-xs font-medium text-geist-fg-secondary"
			>
				{label}
				{required && <span className="ml-1 text-geist-error">*</span>}
			</label>
			{children}
			{error && <p className="text-xs text-geist-error">{error}</p>}
		</div>
	);
}
