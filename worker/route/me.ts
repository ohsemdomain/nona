import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { createDb, user, role } from "../db";
import { getSessionFromContext, getUserPermission } from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/me - Get current user with role and permissions
app.get("/", async (c) => {
	const session = await getSessionFromContext(c);

	if (!session) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const db = createDb(c.env.DB);

	// Get user with role
	const userResult = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email,
			emailVerified: user.emailVerified,
			image: user.image,
			roleId: user.roleId,
			roleName: role.name,
			createdAt: user.createdAt,
			updatedAt: user.updatedAt,
		})
		.from(user)
		.leftJoin(role, eq(user.roleId, role.id))
		.where(eq(user.id, session.user.id))
		.limit(1);

	if (userResult.length === 0) {
		return c.json({ error: "User not found" }, 404);
	}

	// Get permissions
	const permissions = await getUserPermission(c.env.DB, session.user.id);

	const u = userResult[0];
	return c.json({
		id: u.id,
		name: u.name,
		email: u.email,
		emailVerified: u.emailVerified,
		image: u.image,
		role: u.roleName,
		permissions,
		createdAt: u.createdAt instanceof Date ? u.createdAt.getTime() : u.createdAt,
		updatedAt: u.updatedAt instanceof Date ? u.updatedAt.getTime() : u.updatedAt,
	});
});

export { app as meRoute };
