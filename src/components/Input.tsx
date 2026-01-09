import { forwardRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ error, className, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={clsx(
                    "w-full rounded border px-3 py-2 text-sm transition-colors",
                    "bg-white dark:bg-zinc-900",
                    "text-zinc-900 dark:text-zinc-100",
                    "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                    "focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2",
                    "disabled:cursor-not-allowed disabled:opacity-50",
                    error
                        ? "border-red-500 focus:ring-red-500"
                        : "border-zinc-300 dark:border-zinc-700",
                    className,
                )}
                {...props}
            />
        );
    },
);

Input.displayName = "Input";
