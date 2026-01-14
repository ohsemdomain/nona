import { NavLink, useNavigate } from "react-router-dom";
import { Layers, Package, ShoppingCart, LogOut, User, Settings, Menu } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/src/lib/AuthProvider";
import { usePermission } from "@/src/hook/usePermission";
import { PERMISSION } from "@/shared/constant/permission";
import { Button } from "./Button";
import toast from "react-hot-toast";

interface NavBarProp {
	onMenuOpen?: () => void;
}

const navItemList = [
	{ to: "/category", label: "Category", icon: Layers },
	{ to: "/item", label: "Item", icon: Package },
	{ to: "/order", label: "Order", icon: ShoppingCart },
];

export function NavBar({ onMenuOpen }: NavBarProp) {
	const navigate = useNavigate();
	const { session, role, logout } = useAuth();
	const { hasPermission } = usePermission();

	const handleLogout = async () => {
		await logout();
		toast.success("Logged out successfully");
		navigate("/login");
	};

	return (
		<nav className="flex h-16 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 lg:px-6">
			<div className="flex items-center gap-4 lg:gap-6">
				{/* Mobile hamburger */}
				<button
					type="button"
					onClick={onMenuOpen}
					className="rounded-sm p-2 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden"
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Open menu</span>
				</button>

				<span className="text-lg font-bold text-zinc-900">Nona</span>

				{/* Desktop nav */}
				<div className="hidden items-center gap-2 lg:flex">
					{navItemList.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								clsx(
									"flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-zinc-100 text-zinc-900"
										: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
								)
							}
						>
							<Icon className="h-4 w-4" />
							{label}
						</NavLink>
					))}
					{hasPermission(PERMISSION.USER_READ) && (
						<NavLink
							to="/setting"
							className={({ isActive }) =>
								clsx(
									"flex items-center gap-2 rounded-sm px-3 py-2 text-sm font-medium transition-colors",
									isActive
										? "bg-zinc-100 text-zinc-900"
										: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
								)
							}
						>
							<Settings className="h-4 w-4" />
							Setting
						</NavLink>
					)}
				</div>
			</div>

			{/* Desktop user info - hidden on mobile */}
			<div className="hidden items-center gap-3 lg:flex">
				{session?.user && (
					<div className="flex items-center gap-2 text-sm text-zinc-600">
						<User className="h-4 w-4" />
						<span>{session.user.name || session.user.email}</span>
						{role && (
							<span
								className={`rounded-full px-2 py-0.5 text-xs font-medium ${
									role === "admin"
										? "bg-red-100 text-red-700"
										: role === "user"
											? "bg-blue-100 text-blue-700"
											: "bg-zinc-100 text-zinc-700"
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
