import { useState, useEffect } from "react";

/**
 * Detects if viewport is mobile (< 1024px).
 * Matches Tailwind's `lg:` breakpoint which activates at ≥1024px.
 */
export function useIsMobile() {
	const [isMobile, setIsMobile] = useState(() =>
		window.matchMedia("(max-width: 1023px)").matches,
	);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 1023px)");
		const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
		mediaQuery.addEventListener("change", handler);
		return () => mediaQuery.removeEventListener("change", handler);
	}, []);

	return isMobile;
}
