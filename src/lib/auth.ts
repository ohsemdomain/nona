import { createAuthClient } from "better-auth/react";
import { queryClient } from "./queryClient";

export const authClient = createAuthClient({
	baseURL: window.location.origin,
});

export const { signIn, signUp, getSession } = authClient;

/**
 * Handle 401 errors from API - force logout and redirect
 * Used by api.ts for handling expired sessions
 */
export async function handleUnauthorized() {
	queryClient.clear();
	await authClient.signOut();
	window.location.href = "/login";
}
