import { forwardRef, useEffect, useRef, type InputHTMLAttributes } from "react";
import { clsx } from "clsx";
import { Check, Minus } from "lucide-react";

interface CheckboxProp
	extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
	checked?: boolean;
	indeterminate?: boolean;
	onChange?: (checked: boolean) => void;
	label?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProp>(
	(
		{ checked = false, indeterminate = false, onChange, label, disabled, className, ...props },
		forwardedRef,
	) => {
		const internalRef = useRef<HTMLInputElement>(null);
		const ref = (forwardedRef as React.RefObject<HTMLInputElement>) || internalRef;

		useEffect(() => {
			if (ref.current) {
				ref.current.indeterminate = indeterminate;
			}
		}, [indeterminate, ref]);

		const handleChange = () => {
			if (!disabled) {
				onChange?.(!checked);
			}
		};

		const checkbox = (
			<button
				type="button"
				role="checkbox"
				aria-checked={indeterminate ? "mixed" : checked}
				disabled={disabled}
				onClick={handleChange}
				className={clsx(
					"relative h-4 w-4 shrink-0 rounded border transition-colors",
					"focus:outline-none focus-visible:ring-2 focus-visible:ring-geist-fg focus-visible:ring-offset-1",
					"disabled:pointer-events-none disabled:opacity-50",
					checked || indeterminate
						? "border-geist-fg bg-geist-fg"
						: "border-geist-border bg-geist-bg",
					className,
				)}
			>
				{checked && !indeterminate && (
					<Check className="absolute inset-0 m-auto h-3 w-3 text-white" strokeWidth={3} />
				)}
				{indeterminate && (
					<Minus className="absolute inset-0 m-auto h-3 w-3 text-white" strokeWidth={3} />
				)}
				<input
					ref={ref}
					type="checkbox"
					checked={checked}
					disabled={disabled}
					onChange={handleChange}
					className="sr-only"
					{...props}
				/>
			</button>
		);

		if (label) {
			return (
				<label
					className={clsx(
						"inline-flex items-center gap-2 text-sm",
						disabled
							? "pointer-events-none text-geist-fg-muted"
							: "cursor-pointer text-geist-fg-secondary",
					)}
				>
					{checkbox}
					{label}
				</label>
			);
		}

		return checkbox;
	},
);

Checkbox.displayName = "Checkbox";
