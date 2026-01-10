import { Hono } from "hono";
import { createAuth } from "../lib/auth";

const app = new Hono<{ Bindings: Env }>();

app.all("/*", async (c) => {
	const auth = createAuth(c.env);
	return auth.handler(c.req.raw);
});

export { app as authRoute };
