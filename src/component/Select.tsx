import { forwardRef, type SelectHTMLAttributes } from "react";
import { clsx } from "clsx";

interface SelectProp extends SelectHTMLAttributes<HTMLSelectElement> {
	error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProp>(
	({ error, className, children, ...props }, ref) => {
		return (
			<select
				ref={ref}
				className={clsx(
					"h-9 w-full rounded border px-3 text-sm transition-colors",
					"bg-geist-bg text-geist-fg",
					"focus:border-geist-fg focus:outline-none",
					"disabled:pointer-events-none disabled:opacity-50",
					error ? "border-geist-error" : "border-geist-border",
					className,
				)}
				{...props}
			>
				{children}
			</select>
		);
	},
);

Select.displayName = "Select";
