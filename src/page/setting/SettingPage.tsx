import { Outlet } from "react-router-dom";
import { SettingNav } from "./SettingNav";

export function SettingPage() {
	return (
		<div className="mx-auto flex h-full flex-col lg:flex-row lg:gap-4 lg:max-w-6xl">
			<SettingNav />
			<div className="flex-1 overflow-hidden">
				<Outlet />
			</div>
		</div>
	);
}
