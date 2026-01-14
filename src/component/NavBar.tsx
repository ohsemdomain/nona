import { NavLink, useNavigate } from "react-router-dom";
import { Layers, Package, ShoppingCart, LogOut, User, Settings, Menu, ChevronDown } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/src/lib/AuthProvider";
import { usePermission } from "@/src/hook/usePermission";
import { PERMISSION } from "@/shared/constant/permission";
import {
	Dropdown,
	DropdownTrigger,
	DropdownContent,
	DropdownItem,
	DropdownSeparator,
	DropdownLabel,
} from "./Dropdown";
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
		<nav className="flex h-14 shrink-0 items-center justify-between border-b border-geist-border bg-geist-bg px-4 lg:px-6">
			<div className="flex items-center gap-4 lg:gap-6">
				{/* Mobile hamburger */}
				<button
					type="button"
					onClick={onMenuOpen}
					className="rounded-sm p-2 text-geist-fg-secondary hover:bg-geist-bg-secondary hover:text-geist-fg lg:hidden"
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Open menu</span>
				</button>

				<span className="text-base font-semibold text-geist-fg">Nona</span>

				{/* Desktop nav */}
				<div className="hidden items-center gap-1 lg:flex">
					{navItemList.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								clsx(
									"flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
									isActive
										? "bg-geist-bg-secondary text-geist-fg"
										: "text-geist-fg-secondary hover:bg-geist-bg-secondary hover:text-geist-fg",
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
									"flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors",
									isActive
										? "bg-geist-bg-secondary text-geist-fg"
										: "text-geist-fg-secondary hover:bg-geist-bg-secondary hover:text-geist-fg",
								)
							}
						>
							<Settings className="h-4 w-4" />
							Setting
						</NavLink>
					)}
				</div>
			</div>

			{/* Desktop user dropdown - hidden on mobile */}
			<div className="hidden lg:block">
				{session?.user && (
					<Dropdown>
						<DropdownTrigger asChild>
							<button
								type="button"
								className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-geist-fg-secondary transition-colors hover:bg-geist-bg-secondary hover:text-geist-fg"
							>
								<User className="h-4 w-4" />
								<span>{session.user.name || session.user.email}</span>
								{role && (
									<span
										className={clsx(
											"rounded-full px-2 py-0.5 text-xs font-medium",
											role === "admin"
												? "bg-geist-error/10 text-geist-error"
												: role === "user"
													? "bg-geist-success/10 text-geist-success"
													: "bg-geist-bg-secondary text-geist-fg-secondary",
										)}
									>
										{role}
									</span>
								)}
								<ChevronDown className="h-3 w-3" />
							</button>
						</DropdownTrigger>
						<DropdownContent align="end">
							<DropdownLabel>{session.user.email}</DropdownLabel>
							<DropdownSeparator />
							<DropdownItem onSelect={handleLogout}>
								<LogOut className="h-4 w-4" />
								Logout
							</DropdownItem>
						</DropdownContent>
					</Dropdown>
				)}
			</div>
		</nav>
	);
}
