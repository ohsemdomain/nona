import { Hono } from "hono";
import { createDb, permission } from "../db";
import { PERMISSION } from "../../shared/constant/permission";
import { requirePermission } from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/permission - List all permissions grouped by resource
app.get("/", requirePermission(PERMISSION.ROLE_READ), async (c) => {
	const db = createDb(c.env.DB);

	const permissionList = await db
		.select({
			id: permission.id,
			name: permission.name,
			resource: permission.resource,
			action: permission.action,
			description: permission.description,
		})
		.from(permission)
		.orderBy(permission.resource, permission.action);

	// Group by resource
	const grouped = permissionList.reduce(
		(acc, p) => {
			if (!acc[p.resource]) {
				acc[p.resource] = {
					resource: p.resource,
					label: p.resource.charAt(0).toUpperCase() + p.resource.slice(1),
					permissionList: [],
				};
			}
			acc[p.resource].permissionList.push(p);
			return acc;
		},
		{} as Record<string, { resource: string; label: string; permissionList: typeof permissionList }>,
	);

	return c.json(Object.values(grouped));
});

export { app as permissionRoute };
