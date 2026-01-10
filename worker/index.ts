import { Hono } from "hono";
import { authRoute, categoryRoute, itemRoute, orderRoute } from "./route";
import { requireAuth } from "./lib";

const app = new Hono<{ Bindings: Env }>();

// Health check (public)
app.get("/api/health", (c) => {
	return c.json({ status: "ok" });
});

// Auth route (public)
app.route("/api/auth", authRoute);

// Protected routes - authentication required
app.use("/api/category/*", requireAuth);
app.use("/api/item/*", requireAuth);
app.use("/api/order/*", requireAuth);

app.route("/api/category", categoryRoute);
app.route("/api/item", itemRoute);
app.route("/api/order", orderRoute);

// API 404 handler - must be before static asset catch-all
app.all("/api/*", (c) => {
	return c.json({ error: "Not found" }, 404);
});

// Serve static assets
app.all("*", (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
