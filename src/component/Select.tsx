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
					"w-full rounded-lg border px-3 py-2 text-sm transition-colors",
					"bg-white text-zinc-900",
					"focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2",
					"disabled:cursor-not-allowed disabled:opacity-50",
					error ? "border-red-500 focus:ring-red-500" : "border-zinc-200",
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
