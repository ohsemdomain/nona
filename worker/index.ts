import { Hono } from "hono";
import {
	authRoute,
	categoryRoute,
	itemRoute,
	meRoute,
	orderRoute,
	userRoute,
	sessionTokenRoute,
} from "./route";
import { requireAuth, authRateLimit, apiRateLimit } from "./lib";

const app = new Hono<{ Bindings: Env }>();

// Health check (public, no rate limit)
app.get("/api/health", (c) => {
	return c.json({ status: "ok" });
});

// Auth routes with selective rate limiting
// Session check - no rate limit (read-only, cookie-based)
// Login/signup - strict rate limit (brute force protection)
app.use("/api/auth/sign-in/*", authRateLimit);
app.use("/api/auth/sign-up/*", authRateLimit);
app.route("/api/auth", authRoute);

// Session token routes (requires auth, for fast session caching)
app.use("/api/session/*", requireAuth);
app.route("/api/session", sessionTokenRoute);

// Protected routes - rate limit + authentication
app.use("/api/category/*", apiRateLimit);
app.use("/api/category/*", requireAuth);

app.use("/api/item/*", apiRateLimit);
app.use("/api/item/*", requireAuth);

app.use("/api/order/*", apiRateLimit);
app.use("/api/order/*", requireAuth);

app.route("/api/category", categoryRoute);
app.route("/api/item", itemRoute);
app.route("/api/order", orderRoute);

// User routes (admin only - permission check in route handlers)
app.use("/api/user/*", apiRateLimit);
app.use("/api/user/*", requireAuth);
app.route("/api/user", userRoute);

// Current user route (self info with role/permissions)
app.use("/api/me", apiRateLimit);
app.use("/api/me", requireAuth);
app.route("/api/me", meRoute);

// API 404 handler - must be before static asset catch-all
app.all("/api/*", (c) => {
	return c.json({ error: "Not found" }, 404);
});

// Serve static assets
app.all("*", (c) => {
	return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
