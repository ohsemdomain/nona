import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, user, role } from "../db";
import {
	getSessionFromContext,
	getUserPermission,
	createSessionToken,
	verifySessionToken,
	shouldRefreshToken,
	type SignedSessionToken,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

/**
 * GET /api/session/token
 *
 * Returns a signed session token containing user data and permissions.
 * This token can be cached client-side for instant auth checks.
 */
app.get("/token", async (c) => {
	const session = await getSessionFromContext(c);

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = createDb(c.env.DB);

	// Get user with role
	const userResult = await db
		.select({
			id: user.id,
			publicId: user.publicId,
			name: user.name,
			email: user.email,
			roleId: user.roleId,
			roleName: role.name,
		})
		.from(user)
		.leftJoin(role, eq(user.roleId, role.id))
		.where(eq(user.id, session.user.id))
		.limit(1);

	if (userResult.length === 0) {
		return c.json({ error: "User not found" }, 404);
	}

	const u = userResult[0];

	// Get permissions
	const permissions = await getUserPermission(c.env.DB, session.user.id);

	// Create signed token
	const token = await createSessionToken(c.env, {
		id: u.id,
		publicId: u.publicId,
		email: u.email,
		name: u.name,
		role: u.roleName,
		permissions,
	});

	return c.json(token);
});

/**
 * POST /api/session/validate
 *
 * Validates a session token signature and checks if session is still active.
 * Used for background validation without blocking UI.
 */
app.post("/validate", async (c) => {
	// First check if the httpOnly session cookie is still valid
	const session = await getSessionFromContext(c);

	if (!session) {
		return c.json({ valid: false, reason: "session_expired" });
	}

	// Optionally validate the token signature if provided
	try {
		const body = await c.req.json<{ token?: SignedSessionToken }>();

		if (body.token) {
			const isValid = await verifySessionToken(c.env, body.token);
			if (!isValid) {
				return c.json({ valid: false, reason: "token_invalid" });
			}

			// Check if token needs refresh
			const needsRefresh = shouldRefreshToken(body.token);
			return c.json({ valid: true, needsRefresh });
		}
	} catch {
		// No token provided, just validate session
	}

	return c.json({ valid: true, needsRefresh: false });
});

export { app as sessionTokenRoute };
