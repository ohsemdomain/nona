import { createAuthClient } from "better-auth/react";
import { queryClient } from "./queryClient";

export const authClient = createAuthClient({
	baseURL: window.location.origin,
});

export const { signIn, signUp, useSession, getSession } = authClient;

const { signOut: authSignOut } = authClient;

/**
 * Logout and clear all cached data
 */
export async function logout() {
	queryClient.clear();
	await authSignOut();
}

/**
 * Handle 401 errors - force logout and redirect
 */
export async function handleUnauthorized() {
	queryClient.clear();
	await authSignOut();
	window.location.href = "/login";
}
