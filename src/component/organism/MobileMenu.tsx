import { NavLink, useNavigate } from "react-router-dom";
import { X, Layers, Package, ShoppingCart, Settings, User, LogOut } from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "@/src/lib/AuthProvider";
import { usePermission } from "@/src/hook/usePermission";
import { PERMISSION } from "@/shared/constant/permission";
import { Button } from "../atom/Button";
import toast from "react-hot-toast";

const navItemList = [
	{ to: "/category", label: "Category", icon: Layers },
	{ to: "/item", label: "Item", icon: Package },
	{ to: "/order", label: "Order", icon: ShoppingCart },
];

interface MobileMenuProp {
	isOpen: boolean;
	onClose: () => void;
}

export function MobileMenu({ isOpen, onClose }: MobileMenuProp) {
	const navigate = useNavigate();
	const { session, role, logout } = useAuth();
	const { hasPermission } = usePermission();

	const handleLogout = async () => {
		await logout();
		toast.success("Logged out successfully");
		onClose();
		navigate("/login");
	};

	const handleNavClick = () => {
		onClose();
	};

	if (!isOpen) return null;

	return (
		<>
			{/* Backdrop */}
			<div
				className="fixed inset-0 z-40 bg-black/50"
				onClick={onClose}
				aria-hidden="true"
			/>

			{/* Drawer */}
			<div className="fixed inset-y-0 left-0 z-50 w-72 bg-geist-bg shadow-xl">
				{/* Header */}
				<div className="flex h-14 items-center justify-between border-b border-geist-border px-4">
					<span className="text-base font-semibold text-geist-fg">Nona</span>
					<button
						type="button"
						onClick={onClose}
						className="rounded-sm p-2 text-geist-fg-muted hover:bg-geist-bg-secondary hover:text-geist-fg"
					>
						<X className="h-5 w-5" />
						<span className="sr-only">Close menu</span>
					</button>
				</div>

				{/* Navigation */}
				<nav className="flex flex-col p-4">
					<div className="space-y-1">
						{navItemList.map(({ to, label, icon: Icon }) => (
							<NavLink
								key={to}
								to={to}
								onClick={handleNavClick}
								className={({ isActive }) =>
									clsx(
										"flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
										isActive
											? "bg-geist-bg-secondary text-geist-fg"
											: "text-geist-fg-secondary hover:bg-geist-bg-secondary hover:text-geist-fg",
									)
								}
							>
								<Icon className="h-5 w-5" />
								{label}
							</NavLink>
						))}
						{hasPermission(PERMISSION.USER_READ) && (
							<NavLink
								to="/setting"
								onClick={handleNavClick}
								className={({ isActive }) =>
									clsx(
										"flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
										isActive
											? "bg-geist-bg-secondary text-geist-fg"
											: "text-geist-fg-secondary hover:bg-geist-bg-secondary hover:text-geist-fg",
									)
								}
							>
								<Settings className="h-5 w-5" />
								Setting
							</NavLink>
						)}
					</div>

					{/* User info */}
					{session?.user && (
						<div className="mt-6 border-t border-geist-border pt-4">
							<div className="flex items-center gap-3 px-3 py-2">
								<div className="flex h-9 w-9 items-center justify-center rounded-full bg-geist-bg-secondary">
									<User className="h-5 w-5 text-geist-fg-secondary" />
								</div>
								<div className="flex-1">
									<p className="text-sm font-medium text-geist-fg">
										{session.user.name || session.user.email}
									</p>
									{role && (
										<span
											className={clsx(
												"text-xs font-medium",
												role === "admin"
													? "text-geist-error"
													: role === "user"
														? "text-geist-success"
														: "text-geist-fg-muted",
											)}
										>
											{role}
										</span>
									)}
								</div>
							</div>
						</div>
					)}

					{/* Logout */}
					<div className="mt-4 px-3">
						<Button
							variant="secondary"
							size="md"
							onClick={handleLogout}
							className="w-full justify-center"
						>
							<LogOut className="h-4 w-4" />
							Logout
						</Button>
					</div>
				</nav>
			</div>
		</>
	);
}
