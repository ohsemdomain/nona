import type { Context, Next } from "hono";
import { createAuth } from "./auth";
import { getUserPermission } from "./rbac";

export async function requireAuth(c: Context<{ Bindings: Env }>, next: Next) {
	const auth = createAuth(c.env);
	const session = await auth.api.getSession({
		headers: c.req.raw.headers,
	});

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	return next();
}

export async function getSessionFromContext(c: Context<{ Bindings: Env }>) {
	const auth = createAuth(c.env);
	return auth.api.getSession({
		headers: c.req.raw.headers,
	});
}

/**
 * Middleware factory that checks if user has required permission(s)
 * User must have at least ONE of the specified permissions
 */
export function requirePermission(...permissions: string[]) {
	return async (c: Context<{ Bindings: Env }>, next: Next) => {
		const session = await getSessionFromContext(c);

		if (!session) {
			return c.json({ error: "Unauthorized" }, 401);
		}

		const userPermissions = await getUserPermission(
			c.env.DB,
			session.user.id,
		);

		const hasPermission = permissions.some((p) =>
			userPermissions.includes(p),
		);

		if (!hasPermission) {
			return c.json({ error: "Forbidden" }, 403);
		}

		return next();
	};
}
