import { Hono } from "hono";
import { authRoute, categoryRoute, itemRoute, orderRoute } from "./route";

const app = new Hono<{ Bindings: Env }>();

// Health check
app.get("/api/health", (c) => {
    return c.json({ status: "ok" });
});

// Auth route
app.route("/api/auth", authRoute);

// API routes
app.route("/api/category", categoryRoute);
app.route("/api/item", itemRoute);
app.route("/api/order", orderRoute);

// Serve static assets
app.all("*", (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
