import { Hono } from "hono";
import { createAuth } from "../lib/auth";

const app = new Hono<{ Bindings: Env }>();

// Block signup route - admin creates users via /api/user
app.post("/sign-up/*", (c) => {
	return c.json({ error: "Registration is disabled. Contact admin." }, 403);
});

// Pass all other auth routes to better-auth
app.all("/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

export { app as authRoute };
