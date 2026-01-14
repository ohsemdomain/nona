import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface InputProp extends InputHTMLAttributes<HTMLInputElement> {
	error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProp>(
	({ error, className, ...props }, ref) => {
		return (
			<input
				ref={ref}
				className={clsx(
					"h-9 w-full rounded border px-3 text-sm transition-colors",
					"bg-geist-bg text-geist-fg",
					"placeholder:text-geist-fg-muted",
					"focus:border-geist-fg focus:outline-none",
					"disabled:pointer-events-none disabled:opacity-50",
					error ? "border-geist-error" : "border-geist-border",
					className,
				)}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";
