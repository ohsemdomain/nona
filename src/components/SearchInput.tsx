import { Search, X } from "lucide-react";
import { clsx } from "clsx";

interface SearchInputProps {
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
}: SearchInputProps) {
    return (
        <div className={clsx("relative", className)}>
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={clsx(
                    "w-full rounded border py-2 pl-9 pr-9 text-sm transition-colors",
                    "bg-white dark:bg-zinc-900",
                    "text-zinc-900 dark:text-zinc-100",
                    "placeholder:text-zinc-400 dark:placeholder:text-zinc-500",
                    "border-zinc-300 dark:border-zinc-700",
                    "focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2",
                )}
            />
            {value && (
                <button
                    type="button"
                    onClick={() => onChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear search</span>
                </button>
            )}
        </div>
    );
}
