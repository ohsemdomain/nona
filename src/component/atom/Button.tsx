import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { clsx } from "clsx";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProp extends ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	isLoading?: boolean;
}

const variantStyleMap: Record<ButtonVariant, string> = {
	primary:
		"bg-geist-fg text-white hover:bg-geist-fg/90 border-transparent",
	secondary:
		"bg-geist-bg text-geist-fg hover:bg-geist-bg-secondary border-geist-border",
	danger:
		"bg-geist-error text-white hover:bg-geist-error/90 border-transparent",
	ghost:
		"bg-transparent text-geist-fg hover:bg-geist-bg-secondary border-transparent",
};

const sizeStyleMap: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm",
	md: "h-9 px-4 text-sm",
	lg: "h-10 px-4 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProp>(
	(
		{
			variant = "primary",
			size = "md",
			isLoading = false,
			disabled,
			className,
			children,
			...props
		},
		ref,
	) => {
		return (
			<button
				ref={ref}
				disabled={disabled || isLoading}
				className={clsx(
					"inline-flex items-center justify-center gap-2 rounded-sm border font-medium transition-colors",
					"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-geist-fg focus-visible:ring-offset-2",
					"disabled:pointer-events-none disabled:opacity-50",
					variantStyleMap[variant],
					sizeStyleMap[size],
					className,
				)}
				{...props}
			>
				{isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
				{children}
			</button>
		);
	},
);

Button.displayName = "Button";
