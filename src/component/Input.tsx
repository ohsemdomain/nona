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
					"w-full rounded-md border px-3 py-2 text-sm transition-colors",
					"bg-white text-zinc-900",
					"placeholder:text-zinc-400",
					"focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2",
					"disabled:cursor-not-allowed disabled:opacity-50",
					error ? "border-red-500 focus:ring-red-500" : "border-zinc-200",
					className,
				)}
				{...props}
			/>
		);
	},
);

Input.displayName = "Input";
