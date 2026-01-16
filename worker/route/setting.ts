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
import {
	validatePattern,
	getFormatPattern,
	saveFormatPattern,
	generatePreview,
} from "../lib/number-format";

const app = new Hono<{ Bindings: Env }>();

// GET /api/setting - List all settings
app.get("/", requirePermission(PERMISSION.SYSTEM_ADMIN), async (c) => {
	const db = createDb(c.env.DB);

	const data = await db.select().from(appSetting);

	return c.json(data);
});

// GET /api/setting/number-format/:entityType
app.get(
	"/number-format/:entityType",
	requirePermission(PERMISSION.SYSTEM_ADMIN),
	async (c) => {
		const db = createDb(c.env.DB);
		const entityType = c.req.param("entityType");

		const pattern = await getFormatPattern(db, entityType);
		return c.json({ pattern });
	},
);

// POST /api/setting/number-format/:entityType
app.post(
	"/number-format/:entityType",
	requirePermission(PERMISSION.SYSTEM_ADMIN),
	async (c) => {
		const db = createDb(c.env.DB);
		const entityType = c.req.param("entityType");
		const userId = getUserId(c);
		const { pattern } = await c.req.json<{ pattern: string }>();

		const validation = validatePattern(pattern);
		if (!validation.valid) {
			return c.json({ error: validation.error }, 400);
		}

		await saveFormatPattern(db, entityType, pattern, userId);
		return c.json({ success: true });
	},
);

// GET /api/setting/number-format/:entityType/preview
app.get(
	"/number-format/:entityType/preview",
	requirePermission(PERMISSION.SYSTEM_ADMIN),
	async (c) => {
		const pattern = c.req.query("pattern");

		if (!pattern) {
			return c.json({ error: "Pattern required" }, 400);
		}

		const validation = validatePattern(pattern);
		if (!validation.valid) {
			return c.json({ error: validation.error }, 400);
		}

		const preview = generatePreview(pattern);
		return c.json({ preview });
	},
);

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
