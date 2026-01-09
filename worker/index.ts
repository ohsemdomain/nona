import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/health", (c) => {
    return c.json({ status: "ok" });
});

app.all("*", (c) => {
    return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
