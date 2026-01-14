import type { Context, MiddlewareHandler } from "hono";
import { createAuth } from "./auth";
import { getUserPermission } from "./rbac";

export const requireAuth: MiddlewareHandler<{ Bindings: Env }> = async (
	c,
	next,
) => {
	const auth = createAuth(c.env);
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	// Store user in context for later use
	(c as unknown as { userId: string }).userId = session.user.id;

	return next();
};

type SessionResult = Awaited<ReturnType<ReturnType<typeof createAuth>["api"]["getSession"]>>;

export async function getSessionFromContext(c: Context<{ Bindings: Env }>) {
	// Check if session is already cached in context (set by requirePermission middleware)
	const ctx = c as unknown as { _session?: SessionResult };
	if (ctx._session !== undefined) {
		return ctx._session;
	}

	// Fallback: fetch session from auth API
	const auth = createAuth(c.env);
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	// Cache it for future calls in this request
	ctx._session = session;

	return session;
}

/**
 * Get the current user ID from context (set by requirePermission middleware)
 */
// biome-ignore lint/suspicious/noExplicitAny: Context type varies by route
export function getUserId(c: Context<any, any, any>): string {
	return (c as unknown as { userId: string }).userId;
}

/**
 * Middleware factory that checks if user has required permission(s)
 * User must have at least ONE of the specified permissions
 * Also stores userId in context for use in route handlers
 */
export function requirePermission(
	...permissions: string[]
): MiddlewareHandler<{ Bindings: Env }> {
	return async (c, next) => {
		const session = await getSessionFromContext(c);

		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		// Store user ID in context for later use (session already cached by getSessionFromContext)
		(c as unknown as { userId: string }).userId = session.user.id;

		const userPermissions = await getUserPermission(
			c.env.DB,
			session.user.id,
		);

		const hasPermission =
			userPermissions.includes("system:admin") ||
			permissions.some((p) => userPermissions.includes(p));

		if (!hasPermission) {
			return c.json({ error: "Forbidden" }, 403);
		}

		return next();
	};
}
