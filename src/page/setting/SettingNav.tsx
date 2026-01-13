import { NavLink } from "react-router-dom";
import { Users, FileText, Shield } from "lucide-react";

const navItemList = [
	{ to: "/setting/user", label: "User", icon: Users },
	{ to: "/setting/log", label: "Log", icon: FileText },
	{ to: "/setting/role", label: "Role", icon: Shield },
];

export function SettingNav() {
	return (
		<nav className="w-56 shrink-0 rounded-xl border border-zinc-200 bg-white">
			<div className="p-4">
				<h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
					Setting
				</h2>
			</div>
			<ul className="space-y-1 px-2 pb-2">
				{navItemList.map(({ to, label, icon: Icon }) => (
					<li key={to}>
						<NavLink
							to={to}
							className={({ isActive }) =>
								`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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
	);
}
