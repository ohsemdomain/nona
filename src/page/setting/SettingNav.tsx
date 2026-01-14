import { NavLink } from "react-router-dom";
import { Users, FileText, Shield } from "lucide-react";

const navItemList = [
	{ to: "/setting/user", label: "User", icon: Users },
	{ to: "/setting/log", label: "Log", icon: FileText },
	{ to: "/setting/role", label: "Role", icon: Shield },
];

export function SettingNav() {
	return (
		<>
			{/* Mobile: horizontal scrollable tabs */}
			<nav className="shrink-0 border-b border-zinc-200 lg:hidden">
				<div className="flex overflow-x-auto">
					{navItemList.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							className={({ isActive }) =>
								`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
									isActive
										? "border-zinc-900 text-zinc-900"
										: "border-transparent text-zinc-600 hover:text-zinc-900"
								}`
							}
						>
							<Icon className="h-4 w-4" />
							{label}
						</NavLink>
					))}
				</div>
			</nav>

			{/* Desktop: vertical sidebar nav */}
			<nav className="hidden w-48 shrink-0 lg:block">
				<h2 className="px-3 pb-2 text-sm font-semibold uppercase tracking-wider text-zinc-500">
					Setting
				</h2>
				<ul className="space-y-1">
					{navItemList.map(({ to, label, icon: Icon }) => (
						<li key={to}>
							<NavLink
								to={to}
								className={({ isActive }) =>
									`flex items-center gap-3 rounded-sm px-3 py-2 text-sm font-medium transition-colors ${
										isActive
											? "bg-zinc-100 text-zinc-900"
											: "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
									}`
								}
							>
								<Icon className="h-4 w-4" />
								{label}
							</NavLink>
						</li>
					))}
				</ul>
			</nav>
		</>
	);
}
