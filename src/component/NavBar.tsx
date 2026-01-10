import { NavLink } from "react-router-dom";
import { Layers, Package, ShoppingCart } from "lucide-react";
import { clsx } from "clsx";

const navItemList = [
	{ to: "/category", label: "Category", icon: Layers },
	{ to: "/item", label: "Item", icon: Package },
	{ to: "/order", label: "Order", icon: ShoppingCart },
];

export function NavBar() {
	return (
		<nav className="flex h-14 shrink-0 items-center border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
			<div className="flex items-center gap-6">
				<span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
					Nona
				</span>
				<div className="flex items-center gap-1">
					{navItemList.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								clsx(
									"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
										: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
								)
							}
						>
							<Icon className="h-4 w-4" />
							{label}
						</NavLink>
					))}
				</div>
			</div>
		</nav>
	);
}
