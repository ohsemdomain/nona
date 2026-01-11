/**
 * Authentication provider identifiers
 */
export const AUTH_PROVIDER = {
	CREDENTIAL: "credential",
	// Add future OAuth providers here
	// GOOGLE: "google",
	// GITHUB: "github",
} as const;

export type AuthProviderValue = (typeof AUTH_PROVIDER)[keyof typeof AUTH_PROVIDER];

/**
 * Role display colors for UI (Tailwind classes)
 */
export const ROLE_COLORS = {
	admin: {
		light: "bg-red-100 text-red-700",
		dark: "dark:bg-red-900/30 dark:text-red-400",
	},
	user: {
		light: "bg-blue-100 text-blue-700",
		dark: "dark:bg-blue-900/30 dark:text-blue-400",
	},
	viewer: {
		light: "bg-green-100 text-green-700",
		dark: "dark:bg-green-900/30 dark:text-green-400",
	},
	default: {
		light: "bg-zinc-100 text-zinc-700",
		dark: "dark:bg-zinc-800 dark:text-zinc-400",
	},
} as const;

/**
 * Get role color classes for a given role name
 */
export function getRoleColorClasses(roleName: string | null): string {
	const colors = ROLE_COLORS[roleName as keyof typeof ROLE_COLORS] ?? ROLE_COLORS.default;
	return `${colors.light} ${colors.dark}`;
}
