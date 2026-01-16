import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createDb, appSetting } from "../db";
import { PERMISSION } from "../../shared/constant/permission";
import {
	requirePermission,
	getUserId,
} from "../lib";

const app = new Hono<{ Bindings: Env }>();

// GET /api/setting - List all settings
app.get("/", requirePermission(PERMISSION.SYSTEM_ADMIN), async (c) => {
	const db = createDb(c.env.DB);

	const data = await db.select().from(appSetting);

	return c.json(data);
});

// GET /api/setting/:key - Get specific setting
app.get("/:key", requirePermission(PERMISSION.SYSTEM_ADMIN), async (c) => {
	const db = createDb(c.env.DB);
	const key = c.req.param("key");

	const result = await db
		.select()
		.from(appSetting)
		.where(eq(appSetting.key, key))
		.limit(1);

	if (result.length === 0) {
		return c.json({ key, value: null });
	}

	return c.json(result[0]);
});

const updateSettingSchema = z.object({
	value: z.string(),
});

// PUT /api/setting/:key - Update or create setting
app.put(
	"/:key",
	requirePermission(PERMISSION.SYSTEM_ADMIN),
	zValidator("json", updateSettingSchema),
	async (c) => {
		const db = createDb(c.env.DB);
		const key = c.req.param("key");
		const input = c.req.valid("json");
		const userId = getUserId(c);

		const existing = await db
			.select()
			.from(appSetting)
			.where(eq(appSetting.key, key))
			.limit(1);

		if (existing.length === 0) {
			// Create new setting
			const result = await db
				.insert(appSetting)
				.values({
					key,
					value: input.value,
					updatedAt: Date.now(),
					updatedBy: userId,
				})
				.returning();

			return c.json(result[0], 201);
		}

		// Update existing
		const result = await db
			.update(appSetting)
			.set({
				value: input.value,
				updatedAt: Date.now(),
				updatedBy: userId,
			})
			.where(eq(appSetting.key, key))
			.returning();

		return c.json(result[0]);
	},
);

export { app as settingRoute };
