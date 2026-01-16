# Number Format Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a configurable number format system for orders with live preview in settings.

**Architecture:** Store format patterns and sequence counters in appSetting table. Generate formatted numbers atomically on order creation. Provide settings UI for format configuration.

**Tech Stack:** Drizzle ORM, Hono API, React, TanStack Query

---

## Task 1: Database Migration

**Files:**
- Modify: `worker/db/schema.ts`
- Create: `worker/db/migrations/0002_*.sql` (via drizzle-kit)

**Step 1: Add orderNumber column to schema**

In `worker/db/schema.ts`, find the `order` table and add:

```typescript
export const order = sqliteTable(
	"order",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		publicId: text("public_id").notNull().unique(),
		orderNumber: text("order_number").unique(), // ADD THIS LINE
		status: text("status").notNull().default("draft"),
		// ... rest unchanged
	},
	// ...
);
```

**Step 2: Generate migration**

Run: `bun run db:generate`
Expected: New migration file created in `worker/db/migrations/`

**Step 3: Run migration locally**

Run: `bun run db:migrate`
Expected: Migration applied successfully

**Step 4: Commit**

```bash
git add worker/db/schema.ts worker/db/migrations/
git commit -m "feat: add order_number column to order table"
```

---

## Task 2: Number Format Utilities

**Files:**
- Create: `worker/lib/number-format.ts`
- Create: `shared/type/number-format.ts`

**Step 1: Create shared types**

Create `shared/type/number-format.ts`:

```typescript
export const DATE_PLACEHOLDER = ["[YYYY]", "[YY]", "[MM]", "[DD]"] as const;
export const DIGIT_PLACEHOLDER = [
	"[2DIGIT]",
	"[3DIGIT]",
	"[4DIGIT]",
	"[5DIGIT]",
	"[6DIGIT]",
	"[7DIGIT]",
	"[8DIGIT]",
] as const;

export type DatePlaceholder = (typeof DATE_PLACEHOLDER)[number];
export type DigitPlaceholder = (typeof DIGIT_PLACEHOLDER)[number];

export const DEFAULT_FORMAT: Record<string, string> = {
	order: "[MM][4DIGIT][YY][DD]",
	invoice: "[MM][4DIGIT][YY][DD]",
	quote: "[MM][4DIGIT][YY][DD]",
};
```

**Step 2: Create number-format utility**

Create `worker/lib/number-format.ts`:

```typescript
import { eq, sql } from "drizzle-orm";
import type { DB } from "../db";
import { appSetting } from "../db/schema";
import { DATE_PLACEHOLDER, DIGIT_PLACEHOLDER, DEFAULT_FORMAT } from "@/shared/type/number-format";

// Validate pattern has exactly one digit placeholder
export function validatePattern(pattern: string): { valid: boolean; error?: string } {
	const digitMatches = pattern.match(/\[\dDIGIT\]/g) || [];

	if (digitMatches.length === 0) {
		return { valid: false, error: "Format must contain one sequence placeholder like [4DIGIT]" };
	}
	if (digitMatches.length > 1) {
		return { valid: false, error: "Format can only contain one sequence placeholder" };
	}

	// Check for invalid placeholders
	const allPlaceholders = pattern.match(/\[[^\]]+\]/g) || [];
	const validPlaceholders = [...DATE_PLACEHOLDER, ...DIGIT_PLACEHOLDER];

	for (const placeholder of allPlaceholders) {
		if (!validPlaceholders.includes(placeholder as any)) {
			return { valid: false, error: `Unknown placeholder ${placeholder}` };
		}
	}

	return { valid: true };
}

// Extract period key from pattern based on date placeholders used
function getPeriodKey(pattern: string, date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	let periodKey = "";

	if (pattern.includes("[YYYY]")) {
		periodKey += year;
	} else if (pattern.includes("[YY]")) {
		periodKey += String(year).slice(-2);
	}

	if (pattern.includes("[MM]")) {
		periodKey += month;
	}

	if (pattern.includes("[DD]")) {
		periodKey += day;
	}

	return periodKey || String(year); // Default to year if no date placeholders
}

// Replace date placeholders with actual values
function replaceDatePlaceholder(pattern: string, date: Date): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");

	return pattern
		.replace(/\[YYYY\]/g, String(year))
		.replace(/\[YY\]/g, String(year).slice(-2))
		.replace(/\[MM\]/g, month)
		.replace(/\[DD\]/g, day);
}

// Get next sequence number atomically
async function getNextSequence(db: DB, sequenceKey: string): Promise<number> {
	const now = Date.now();

	// Try to increment existing sequence
	const updated = await db
		.update(appSetting)
		.set({
			value: sql`CAST(value AS INTEGER) + 1`,
			updatedAt: now,
		})
		.where(eq(appSetting.key, sequenceKey))
		.returning({ value: appSetting.value });

	if (updated.length > 0) {
		return parseInt(updated[0].value);
	}

	// First of this period, insert new row
	await db.insert(appSetting).values({
		key: sequenceKey,
		value: "1",
		updatedAt: now,
	});
	return 1;
}

// Generate preview without incrementing sequence
export function generatePreview(pattern: string, sequenceNumber: number = 42): string {
	const date = new Date();
	let result = replaceDatePlaceholder(pattern, date);

	// Replace digit placeholder
	const digitMatch = pattern.match(/\[(\d)DIGIT\]/);
	if (digitMatch) {
		const minDigits = parseInt(digitMatch[1]);
		const paddedSequence = String(sequenceNumber).padStart(minDigits, "0");
		result = result.replace(/\[\dDIGIT\]/, paddedSequence);
	}

	return result;
}

// Get format pattern for entity type
export async function getFormatPattern(db: DB, entityType: string): Promise<string> {
	const key = `number_format:${entityType}`;

	const setting = await db
		.select({ value: appSetting.value })
		.from(appSetting)
		.where(eq(appSetting.key, key))
		.limit(1);

	if (setting.length > 0) {
		return setting[0].value;
	}

	// Return and save default
	const defaultPattern = DEFAULT_FORMAT[entityType] || "[4DIGIT]";
	await db.insert(appSetting).values({
		key,
		value: defaultPattern,
		updatedAt: Date.now(),
	});

	return defaultPattern;
}

// Save format pattern for entity type
export async function saveFormatPattern(
	db: DB,
	entityType: string,
	pattern: string,
	userId?: string
): Promise<void> {
	const key = `number_format:${entityType}`;
	const now = Date.now();

	const existing = await db
		.select({ id: appSetting.id })
		.from(appSetting)
		.where(eq(appSetting.key, key))
		.limit(1);

	if (existing.length > 0) {
		await db
			.update(appSetting)
			.set({ value: pattern, updatedAt: now, updatedBy: userId })
			.where(eq(appSetting.key, key));
	} else {
		await db.insert(appSetting).values({
			key,
			value: pattern,
			updatedAt: now,
			updatedBy: userId,
		});
	}
}

// Main function: generate formatted number for entity
export async function generateFormattedNumber(db: DB, entityType: string): Promise<string> {
	const pattern = await getFormatPattern(db, entityType);
	const date = new Date();
	const periodKey = getPeriodKey(pattern, date);
	const sequenceKey = `number_sequence:${entityType}:${periodKey}`;

	const sequence = await getNextSequence(db, sequenceKey);

	let result = replaceDatePlaceholder(pattern, date);

	// Replace digit placeholder with padded sequence
	const digitMatch = pattern.match(/\[(\d)DIGIT\]/);
	if (digitMatch) {
		const minDigits = parseInt(digitMatch[1]);
		const paddedSequence = String(sequence).padStart(minDigits, "0");
		result = result.replace(/\[\dDIGIT\]/, paddedSequence);
	}

	return result;
}
```

**Step 3: Verify build passes**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add shared/type/number-format.ts worker/lib/number-format.ts
git commit -m "feat: add number format utilities"
```

---

## Task 3: Settings API Endpoints

**Files:**
- Modify: `worker/route/setting.ts`

**Step 1: Add number format endpoints**

Add to `worker/route/setting.ts`:

```typescript
import {
	validatePattern,
	getFormatPattern,
	saveFormatPattern,
	generatePreview,
} from "../lib/number-format";

// GET /api/setting/number-format/:entityType
setting.get("/number-format/:entityType", async (c) => {
	const db = c.get("db");
	const entityType = c.req.param("entityType");

	const pattern = await getFormatPattern(db, entityType);
	return c.json({ pattern });
});

// POST /api/setting/number-format/:entityType
setting.post("/number-format/:entityType", async (c) => {
	const db = c.get("db");
	const entityType = c.req.param("entityType");
	const session = c.get("session");
	const { pattern } = await c.req.json<{ pattern: string }>();

	const validation = validatePattern(pattern);
	if (!validation.valid) {
		return c.json({ error: validation.error }, 400);
	}

	await saveFormatPattern(db, entityType, pattern, session?.user?.id);
	return c.json({ success: true });
});

// GET /api/setting/number-format/:entityType/preview
setting.get("/number-format/:entityType/preview", async (c) => {
	const entityType = c.req.param("entityType");
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
});
```

**Step 2: Verify build passes**

Run: `bun run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add worker/route/setting.ts
git commit -m "feat: add number format API endpoints"
```

---

## Task 4: Integrate with Order Creation

**Files:**
- Modify: `worker/route/order.ts`
- Modify: `shared/type/order.ts`

**Step 1: Update Order type**

In `shared/type/order.ts`, add `orderNumber` to the Order type:

```typescript
// Find the Order type and add orderNumber field
orderNumber: string | null;
```

**Step 2: Update order creation**

In `worker/route/order.ts`, import and use:

```typescript
import { generateFormattedNumber } from "../lib/number-format";

// In POST /api/order handler, before insert:
const orderNumber = await generateFormattedNumber(db, "order");

// Add to insert values:
orderNumber: orderNumber,
```

**Step 3: Update order select queries**

Find all order select queries and add `orderNumber`:

```typescript
orderNumber: order.orderNumber,
```

**Step 4: Verify build passes**

Run: `bun run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add worker/route/order.ts shared/type/order.ts
git commit -m "feat: integrate number format with order creation"
```

---

## Task 5: Frontend Settings Component

**Files:**
- Create: `src/page/setting/NumberFormatSetting.tsx`
- Modify: `src/page/setting/GeneralSettingPage.tsx`
- Modify: `src/lib/queryKey.ts`

**Step 1: Add query key**

In `src/lib/queryKey.ts`, add:

```typescript
numberFormat: {
	detail: (entityType: string) => ["setting", "number-format", entityType] as const,
},
```

**Step 2: Create NumberFormatSetting component**

Create `src/page/setting/NumberFormatSetting.tsx`:

```tsx
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input } from "@/src/component";
import { api } from "@/src/lib/api";
import { queryKey } from "@/src/lib/queryKey";
import toast from "react-hot-toast";
import { DATE_PLACEHOLDER, DIGIT_PLACEHOLDER } from "@/shared/type/number-format";

interface NumberFormatSettingProp {
	entityType: string;
	label: string;
}

export function NumberFormatSetting({ entityType, label }: NumberFormatSettingProp) {
	const queryClient = useQueryClient();
	const [pattern, setPattern] = useState("");
	const [preview, setPreview] = useState("");
	const [previewError, setPreviewError] = useState("");

	// Fetch current pattern
	const { data, isLoading } = useQuery({
		queryKey: queryKey.numberFormat.detail(entityType),
		queryFn: () => api.get<{ pattern: string }>(`/setting/number-format/${entityType}`),
	});

	// Update local state when data loads
	useEffect(() => {
		if (data?.pattern) {
			setPattern(data.pattern);
		}
	}, [data?.pattern]);

	// Fetch preview when pattern changes
	useEffect(() => {
		if (!pattern) {
			setPreview("");
			setPreviewError("");
			return;
		}

		const timeout = setTimeout(async () => {
			try {
				const result = await api.get<{ preview?: string; error?: string }>(
					`/setting/number-format/${entityType}/preview?pattern=${encodeURIComponent(pattern)}`
				);
				if (result.error) {
					setPreviewError(result.error);
					setPreview("");
				} else {
					setPreview(result.preview || "");
					setPreviewError("");
				}
			} catch {
				setPreviewError("Failed to generate preview");
				setPreview("");
			}
		}, 300);

		return () => clearTimeout(timeout);
	}, [pattern, entityType]);

	// Save mutation
	const saveMutation = useMutation({
		mutationFn: (newPattern: string) =>
			api.post(`/setting/number-format/${entityType}`, { pattern: newPattern }),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: queryKey.numberFormat.detail(entityType) });
			toast.success("Format saved");
		},
		onError: (error: any) => {
			toast.error(error?.message || "Failed to save");
		},
	});

	const insertPlaceholder = (placeholder: string) => {
		setPattern((prev) => prev + placeholder);
	};

	if (isLoading) {
		return <div className="animate-pulse h-32 bg-geist-bg-muted rounded" />;
	}

	return (
		<div className="space-y-4">
			<div>
				<label className="block text-sm font-medium text-geist-fg mb-1">{label}</label>
				<Input
					value={pattern}
					onChange={(e) => setPattern(e.target.value)}
					placeholder="e.g., ORD[YY][MM][4DIGIT]"
				/>
			</div>

			{preview && (
				<div className="text-sm">
					<span className="text-geist-fg-muted">Preview: </span>
					<span className="font-mono text-geist-fg">{preview}</span>
				</div>
			)}

			{previewError && (
				<div className="text-sm text-red-500">{previewError}</div>
			)}

			<div className="space-y-2">
				<div className="text-xs text-geist-fg-muted">Date placeholders:</div>
				<div className="flex flex-wrap gap-1">
					{DATE_PLACEHOLDER.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => insertPlaceholder(p)}
							className="px-2 py-1 text-xs font-mono bg-geist-bg-muted hover:bg-geist-bg-hover rounded border border-geist-border"
						>
							{p}
						</button>
					))}
				</div>

				<div className="text-xs text-geist-fg-muted">Sequence placeholders:</div>
				<div className="flex flex-wrap gap-1">
					{DIGIT_PLACEHOLDER.map((p) => (
						<button
							key={p}
							type="button"
							onClick={() => insertPlaceholder(p)}
							className="px-2 py-1 text-xs font-mono bg-geist-bg-muted hover:bg-geist-bg-hover rounded border border-geist-border"
						>
							{p}
						</button>
					))}
				</div>
			</div>

			<Button
				onClick={() => saveMutation.mutate(pattern)}
				disabled={saveMutation.isPending || !!previewError || !pattern}
			>
				{saveMutation.isPending ? "Saving..." : "Save"}
			</Button>
		</div>
	);
}
```

**Step 3: Add to GeneralSettingPage**

In `src/page/setting/GeneralSettingPage.tsx`, add:

```tsx
import { NumberFormatSetting } from "./NumberFormatSetting";

// In the component JSX, add a section:
<div className="border-t border-geist-border pt-6">
	<h2 className="text-lg font-semibold text-geist-fg mb-4">Number Format</h2>
	<NumberFormatSetting entityType="order" label="Order Number Format" />
</div>
```

**Step 4: Verify build passes**

Run: `bun run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/page/setting/NumberFormatSetting.tsx src/page/setting/GeneralSettingPage.tsx src/lib/queryKey.ts
git commit -m "feat: add number format settings UI"
```

---

## Task 6: Display Order Number in UI

**Files:**
- Modify: `src/feature/order/OrderDetail.tsx`
- Modify: `src/feature/order/OrderList.tsx` (if exists)

**Step 1: Update OrderDetail to show orderNumber**

In `src/feature/order/OrderDetail.tsx`, update the title:

```tsx
// Change from:
title={`Order #${orderData.publicId}`}

// To:
title={`Order #${orderData.orderNumber || orderData.publicId}`}
```

**Step 2: Update order list if applicable**

Search for other places displaying order ID and update similarly.

**Step 3: Verify build passes**

Run: `bun run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/feature/order/
git commit -m "feat: display order number in UI"
```

---

## Task 7: Run Migration on Production

**Step 1: Deploy**

Run: `bun run deploy`
Expected: Deployment succeeds

**Step 2: Run production migration**

Run: `bun run db:migrate:prod`
Expected: Migration applied successfully

**Step 3: Final commit and push**

```bash
git push
```

---

## Summary

After completing all tasks:
- Orders get auto-generated numbers like `0100012517`
- Settings page allows configuring the format
- Live preview shows what numbers will look like
- System is extensible for invoice, quote, etc.
