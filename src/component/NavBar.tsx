import { NavLink, useNavigate } from "react-router-dom";
import { Layers, Package, ShoppingCart, LogOut, User, Users } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/src/lib/AuthProvider";
import { usePermission } from "@/src/hook/usePermission";
import { PERMISSION } from "@/shared/constant/permission";
import { Button } from "./Button";
import toast from "react-hot-toast";

const navItemList = [
	{ to: "/category", label: "Category", icon: Layers },
	{ to: "/item", label: "Item", icon: Package },
	{ to: "/order", label: "Order", icon: ShoppingCart },
];

export function NavBar() {
	const navigate = useNavigate();
	const { session, role, logout } = useAuth();
	const { hasPermission } = usePermission();

	const handleLogout = async () => {
		await logout();
		toast.success("Logged out successfully");
		navigate("/login");
	};

	return (
		<nav className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
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
					{hasPermission(PERMISSION.USER_READ) && (
						<NavLink
							to="/user"
							className={({ isActive }) =>
								clsx(
									"flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
										: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
								)
							}
						>
							<Users className="h-4 w-4" />
							User
						</NavLink>
					)}
				</div>
			</div>

			<div className="flex items-center gap-3">
				{session?.user && (
					<div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
						<User className="h-4 w-4" />
						<span>{session.user.name || session.user.email}</span>
						{role && (
							<span
								className={`rounded-full px-2 py-0.5 text-xs font-medium ${
									role === "admin"
										? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
										: role === "user"
											? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
											: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
								}`}
							>
								{role}
							</span>
						)}
					</div>
				)}
				<Button variant="secondary" size="sm" onClick={handleLogout}>
					<LogOut className="h-4 w-4" />
					Logout
				</Button>
			</div>
		</nav>
	);
}
