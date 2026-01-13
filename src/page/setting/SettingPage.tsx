import { Outlet } from "react-router-dom";
import { SettingNav } from "./SettingNav";

export function SettingPage() {
	return (
		<div className="flex h-full gap-4">
			<SettingNav />
			<div className="flex-1 overflow-hidden">
				<Outlet />
			</div>
		</div>
	);
}
