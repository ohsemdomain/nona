import { Search, X } from "lucide-react";
import { clsx } from "clsx";

interface SearchInputProp {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
}

export function SearchInput({
	value,
	onChange,
	placeholder = "Search...",
	className,
}: SearchInputProp) {
	return (
		<div className={clsx("relative", className)}>
			<Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-geist-fg-muted" />
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={clsx(
					"h-9 w-full rounded border pl-9 pr-9 text-sm transition-colors",
					"bg-geist-bg text-geist-fg",
					"placeholder:text-geist-fg-muted",
					"border-geist-border",
					"focus:border-geist-fg focus:outline-none",
				)}
			/>
			{value && (
				<button
					type="button"
					onClick={() => onChange("")}
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-geist-fg-muted hover:text-geist-fg"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Clear search</span>
				</button>
			)}
		</div>
	);
}
