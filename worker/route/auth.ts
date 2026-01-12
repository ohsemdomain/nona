import { Hono } from "hono";
import { createAuth } from "../lib/auth";
import { createDb } from "../db";
import { logAudit, AUDIT_ACTION, AUDIT_RESOURCE } from "../lib/audit";

const app = new Hono<{ Bindings: Env }>();

// Block signup route - admin creates user via /api/user
app.post("/sign-up/*", (c) => {
	return c.json({ error: "Registration is disabled. Contact admin." }, 403);
});

// Pass all other auth routes to better-auth with audit logging
app.all("/*", async (c) => {
	const auth = createAuth(c.env);
	const path = c.req.path;
	const method = c.req.method;

	// Call better-auth handler
	const response = await auth.handler(c.req.raw);

	// Log successful login
	if (
		method === "POST" &&
		path.endsWith("/sign-in/email") &&
		response.status === 200
	) {
		try {
			const clonedResponse = response.clone();
			const body = (await clonedResponse.json()) as {
				user?: { id: string; email: string; name: string };
			};
			if (body?.user?.id) {
				const db = createDb(c.env.DB);
				await logAudit(db, {
					actorId: body.user.id,
					action: AUDIT_ACTION.LOGIN,
					resource: AUDIT_RESOURCE.AUTH,
					resourceId: body.user.id,
					metadata: {
						email: body.user.email,
						name: body.user.name,
					},
				});
			}
		} catch {
			// Ignore parsing errors - don't break auth flow
		}
	}

	// Log successful logout
	if (method === "POST" && path.endsWith("/sign-out") && response.status === 200) {
		try {
			// Get user from session before logout completes
			const session = await auth.api.getSession({ headers: c.req.raw.headers });
			if (session?.user?.id) {
				const db = createDb(c.env.DB);
				await logAudit(db, {
					actorId: session.user.id,
					action: AUDIT_ACTION.LOGOUT,
					resource: AUDIT_RESOURCE.AUTH,
					resourceId: session.user.id,
					metadata: {
						email: session.user.email,
						name: session.user.name,
					},
				});
			}
		} catch {
			// Ignore errors - don't break auth flow
		}
	}

	return response;
});

export { app as authRoute };
