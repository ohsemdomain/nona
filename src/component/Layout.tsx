import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";

export function Layout() {
	return (
		<div className="flex h-screen flex-col bg-white">
			<NavBar />
			<main className="flex-1 overflow-hidden p-4">
				<Outlet />
			</main>
		</div>
	);
}
