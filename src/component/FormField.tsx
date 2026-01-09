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
        <div className={clsx("space-y-1.5", className)}>
            <label
                htmlFor={htmlFor}
                className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>
            {children}
            {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
    );
}
