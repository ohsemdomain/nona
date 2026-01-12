import { Outlet } from "react-router-dom";
import { SettingNav } from "./SettingNav";

export function SettingPage() {
	return (
		<div className="flex h-full">
			<SettingNav />
			<div className="flex-1 overflow-hidden">
				<Outlet />
			</div>
		</div>
	);
}
