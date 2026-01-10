import type { Context, Next } from "hono";
import { createAuth } from "./auth";

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
