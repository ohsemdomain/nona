import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";

export function Layout() {
	return (
		<div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
			<NavBar />
			<main className="flex-1 overflow-hidden">
				<Outlet />
			</main>
		</div>
	);
}
