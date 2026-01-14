import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";
import { MobileMenu } from "./MobileMenu";

export function Layout() {
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	return (
		<div className="flex h-screen flex-col bg-white">
			<NavBar onMenuOpen={() => setIsMobileMenuOpen(true)} />
			<main className="flex-1 overflow-hidden p-2 lg:p-4">
				<Outlet />
			</main>
			<MobileMenu
				isOpen={isMobileMenuOpen}
				onClose={() => setIsMobileMenuOpen(false)}
			/>
		</div>
	);
}
