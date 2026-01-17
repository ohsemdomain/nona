# Remove publicId Refactoring Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify ID architecture by using integer `id` as source of truth for order, item, category entities. Remove all `publicId` columns and related code.

**Architecture:**
- Integer `id` becomes the sole identifier for CRUD operations
- `linkId` (9-char nanoid) remains for public share links only
- `orderNumber` remains for human-readable display
- User entity unchanged (better-auth requires text id)

**Tech Stack:** Drizzle ORM, Hono, React, TanStack Query, TypeScript

---

## Pre-Refactor: Understand Scope

**Entities affected:** `order`, `item`, `category`
**Entity unchanged:** `user` (keeps both `id` text and `publicId` for better-auth)

**Files to modify:**
- Database: schema, migrations (fresh generate)
- Backend: 4 route files, 1 lib file
- Frontend: 3 hooks, 6 pages, 6 feature components, 1 lib file
- Shared: 4 type files, 4 schema files, 1 query key file
- Scripts: 1 drop-tables.sql (add missing tables)

---

## Task 1: Clean Migration Files & Update Scripts

**Files:**
- Delete: `worker/db/migrations/*.sql`
- Delete: `worker/db/migrations/meta/*.json`
- Modify: `scripts/drop-tables.sql`

**Step 1: Update drop-tables.sql to include all tables**

```sql
-- Drop all tables in FK-safe order
-- Level 3: Tables with FKs to Level 2
DROP TABLE IF EXISTS order_line;
DROP TABLE IF EXISTS role_permission;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS account;

-- Level 2: Tables with FKs to Level 1
DROP TABLE IF EXISTS item;
DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS public_link;
DROP TABLE IF EXISTS app_setting;

-- Level 1: Base tables (no FKs or only referenced)
DROP TABLE IF EXISTS "order";
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS permission;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS audit_log;

-- Drizzle migration tracking table
DROP TABLE IF EXISTS __drizzle_migrations;
```

**Step 2: Delete all migration files manually or via script**

The `db-reset.ts` script already handles this - we'll use it after schema changes.

**Step 3: Commit**

```bash
git add scripts/drop-tables.sql
git commit -m "chore: update drop-tables.sql with all tables"
```

---

## Task 2: Update Database Schema (Remove publicId)

**Files:**
- Modify: `worker/db/schema.ts`

**Step 1: Remove publicId from category table**

Find and remove:
```typescript
publicId: text("public_id").notNull().unique(),
```

**Step 2: Remove publicId from item table**

Find and remove:
```typescript
publicId: text("public_id").notNull().unique(),
```

**Step 3: Remove publicId from order table**

Find and remove:
```typescript
publicId: text("public_id").notNull().unique(),
```

**Step 4: Update publicLink.resourceId comment**

Change comment from:
```typescript
resourceId: text("resource_id").notNull(), // publicId of the linked resource
```
To:
```typescript
resourceId: text("resource_id").notNull(), // String(id) of the linked resource
```

**Step 5: Commit**

```bash
git add worker/db/schema.ts
git commit -m "refactor(db): remove publicId from category, item, order tables"
```

---

## Task 3: Remove generatePublicId Function

**Files:**
- Modify: `worker/lib/id.ts`

**Step 1: Remove generatePublicId function and constant**

Remove:
```typescript
const PUBLIC_ID_LENGTH = 7;

export function generatePublicId(): string {
	return nanoid(PUBLIC_ID_LENGTH);
}
```

Keep only:
```typescript
import { nanoid } from "nanoid";

const LINK_ID_LENGTH = 9;

export function generateLinkId(): string {
	return nanoid(LINK_ID_LENGTH);
}
```

**Step 2: Commit**

```bash
git add worker/lib/id.ts
git commit -m "refactor(lib): remove generatePublicId, keep only generateLinkId"
```

---

## Task 4: Update Category Route

**Files:**
- Modify: `worker/route/category.ts`

**Step 1: Remove generatePublicId import**

Remove from imports:
```typescript
generatePublicId,
```

**Step 2: Update GET list - remove publicId from select**

Change select to not include publicId (it will be auto-excluded when column removed).

**Step 3: Update GET detail - use id instead of publicId**

```typescript
// Change: const publicId = c.req.param("id");
const id = Number(c.req.param("id"));

// Change all: eq(category.publicId, publicId)
// To: eq(category.id, id)
```

**Step 4: Update POST create - remove publicId generation**

Remove:
```typescript
publicId: generatePublicId(),
```

Update audit log:
```typescript
resourceId: String(created.id),
```

**Step 5: Update PUT update - use id**

```typescript
const id = Number(c.req.param("id"));
// Change all where clauses to use eq(category.id, id)
// Change audit resourceId: String(id),
```

**Step 6: Update DELETE - use id**

```typescript
const id = Number(c.req.param("id"));
// Change all where clauses to use eq(category.id, id)
// Change audit resourceId: String(id),
```

**Step 7: Commit**

```bash
git add worker/route/category.ts
git commit -m "refactor(route): category uses integer id instead of publicId"
```

---

## Task 5: Update Item Route

**Files:**
- Modify: `worker/route/item.ts`

**Step 1: Remove generatePublicId import**

**Step 2: Update GET list - remove publicId from select, also from category join**

**Step 3: Update GET detail - use id**

```typescript
const id = Number(c.req.param("id"));
```

**Step 4: Update POST create - remove publicId**

**Step 5: Update PUT update - use id**

**Step 6: Update DELETE - use id**

**Step 7: Commit**

```bash
git add worker/route/item.ts
git commit -m "refactor(route): item uses integer id instead of publicId"
```

---

## Task 6: Update Order Route

**Files:**
- Modify: `worker/route/order.ts`

**Step 1: Remove generatePublicId import**

**Step 2: Update GET list - remove publicId from select and search**

Change search from:
```typescript
like(order.publicId, `%${search}%`),
```
To only search by orderNumber:
```typescript
like(order.orderNumber, `%${search}%`),
```

**Step 3: Update GET detail - use id**

```typescript
const id = Number(c.req.param("id"));
```

Also update share link query to match on String(id):
```typescript
eq(publicLink.resourceId, String(id)),
```

**Step 4: Update POST create - remove publicId, fix resourceId**

Remove:
```typescript
publicId: generatePublicId(),
```

Change share link creation:
```typescript
resourceId: String(created.id),
```

Change audit log:
```typescript
resourceId: String(created.id),
```

**Step 5: Update PUT update - use id**

**Step 6: Update DELETE - use id**

**Step 7: Commit**

```bash
git add worker/route/order.ts
git commit -m "refactor(route): order uses integer id instead of publicId"
```

---

## Task 7: Update Public Share Route

**Files:**
- Modify: `worker/route/public-share.ts`

**Step 1: Update order lookup join**

Change:
```typescript
.where(and(eq(order.publicId, link.resourceId), isNull(order.deletedAt)))
```
To:
```typescript
.where(and(eq(order.id, Number(link.resourceId)), isNull(order.deletedAt)))
```

**Step 2: Update display - use orderNumber instead of publicId**

Change title/meta:
```typescript
<title>Order ${orderData.orderNumber ? orderData.orderNumber : `#${orderData.id}`}</title>
```

**Step 3: Remove publicId from OrderData interface**

**Step 4: Commit**

```bash
git add worker/route/public-share.ts
git commit -m "refactor(route): public-share uses integer id"
```

---

## Task 8: Update Shared Types

**Files:**
- Modify: `shared/type/category.ts`
- Modify: `shared/type/item.ts`
- Modify: `shared/type/order.ts`

**Step 1: Remove publicId from Category**

```typescript
export interface Category {
	id: number;
	// Remove: publicId: string;
	name: string;
	...
}
```

**Step 2: Remove publicId from Item and ItemCategory**

```typescript
export interface ItemCategory {
	id: number;
	// Remove: publicId: string;
	name: string;
}

export interface Item {
	id: number;
	// Remove: publicId: string;
	...
}
```

**Step 3: Remove publicId from Order and OrderLineItem**

```typescript
export interface OrderLineItem {
	id: number;
	// Remove: publicId: string;
	name: string;
	price: number;
}

export interface Order {
	id: number;
	// Remove: publicId: string;
	orderNumber: string | null;
	...
}
```

**Step 4: Commit**

```bash
git add shared/type/
git commit -m "refactor(types): remove publicId from category, item, order types"
```

---

## Task 9: Update Shared Schemas (Zod)

**Files:**
- Modify: `shared/schema/category.ts`
- Modify: `shared/schema/item.ts`
- Modify: `shared/schema/order.ts`

**Step 1: Remove publicId from each schema**

Remove line:
```typescript
publicId: z.string(),
```

**Step 2: Commit**

```bash
git add shared/schema/
git commit -m "refactor(schema): remove publicId from zod schemas"
```

---

## Task 10: Update Query Keys

**Files:**
- Modify: `src/lib/queryKey.ts`

**Step 1: Change detail function signatures from string to number**

```typescript
category: {
	...
	detail: (id: number) => ["category", "detail", id] as const,
},
item: {
	...
	detail: (id: number) => ["item", "detail", id] as const,
},
order: {
	...
	detail: (id: number) => ["order", "detail", id] as const,
},
```

Note: `user.detail` stays as `(id: string)` since user keeps publicId.

**Step 2: Commit**

```bash
git add src/lib/queryKey.ts
git commit -m "refactor(queryKey): change detail to accept number for category, item, order"
```

---

## Task 11: Update useMasterDetail Hook

**Files:**
- Modify: `src/hook/useMasterDetail.ts`

**Step 1: Change HasPublicId to HasId**

```typescript
interface HasId {
	id: number;
}

export function useMasterDetail<T extends HasId>(
```

**Step 2: Update all publicId references to id**

- `item.publicId` → `item.id`
- `list[0].publicId` → `list[0].id`
- URL param stays as string, convert: `String(item.id)`

**Step 3: Update setSelectedId to work with numbers**

Since URL params are strings, we need to convert:
- Store as string in URL: `newParam.set("selected", String(id))`
- Compare: `item.id === Number(urlSelectedId)`

**Step 4: Commit**

```bash
git add src/hook/useMasterDetail.ts
git commit -m "refactor(hook): useMasterDetail uses id instead of publicId"
```

---

## Task 12: Update useFormModal Hook

**Files:**
- Modify: `src/hook/useFormModal.ts`

**Step 1: Change generic constraint**

```typescript
export function useFormModal<
	TEntity extends { id: number },
	...
```

**Step 2: Update entity.publicId to entity.id**

```typescript
result = await update.mutateAsync({
	id: entity.id,  // Changed from entity.publicId
	data: toUpdateInput(form, entity),
});
```

**Step 3: Commit**

```bash
git add src/hook/useFormModal.ts
git commit -m "refactor(hook): useFormModal uses id instead of publicId"
```

---

## Task 13: Update useResource Hook

**Files:**
- Modify: `src/hook/useResource.ts`

**Step 1: Change detail function parameter type**

```typescript
const detail = (id: number) => {
	...
	queryFn: () => api.get<T>(`/${entity}/${id}`),
```

**Step 2: Update optimistic update matching**

```typescript
data: old.data.map((item) =>
	(item as { id?: number }).id ===
	(updatedEntity as { id?: number }).id
		? updatedEntity
		: item,
),
```

**Step 3: Change update/remove to use number**

```typescript
update: {
	mutate: (arg: { id: number; data: UpdateInput }) => void;
	mutateAsync: (arg: { id: number; data: UpdateInput }) => Promise<T>;
	...
},
remove: {
	mutate: (id: number) => void;
	mutateAsync: (id: number) => Promise<void>;
	...
},
```

**Step 4: Commit**

```bash
git add src/hook/useResource.ts
git commit -m "refactor(hook): useResource uses number id"
```

---

## Task 14: Update Category Frontend

**Files:**
- Modify: `src/page/category/CategoryPage.tsx`
- Modify: `src/feature/category/CategoryDetail.tsx`
- Modify: `src/feature/category/CategoryDeleteDialog.tsx`

**Step 1: CategoryPage.tsx - change publicId to id**

```typescript
key={category.id}
isSelected={selectedId === String(category.id)}
onClick={() => setSelectedId(String(category.id))}
...
onSuccess={(category) => selectAfterCreate(String(category.id))}
```

**Step 2: CategoryDetail.tsx - change resourceId prop**

```typescript
resourceId={String(category.id)}
```

**Step 3: CategoryDeleteDialog.tsx - change delete call**

```typescript
await remove.mutateAsync(category.id);
```

**Step 4: Commit**

```bash
git add src/page/category/ src/feature/category/
git commit -m "refactor(category): frontend uses id instead of publicId"
```

---

## Task 15: Update Item Frontend

**Files:**
- Modify: `src/page/item/ItemPage.tsx`
- Modify: `src/feature/item/ItemDetail.tsx`
- Modify: `src/feature/item/ItemDeleteDialog.tsx`
- Modify: `src/feature/item/ItemFormModal.tsx`

**Step 1: ItemPage.tsx - change publicId to id**

Similar changes as CategoryPage.

**Step 2: ItemDetail.tsx - change resourceId prop**

**Step 3: ItemDeleteDialog.tsx - change delete call**

**Step 4: ItemFormModal.tsx - change dropdown key**

```typescript
key={cat.id}  // was cat.publicId
```

**Step 5: Commit**

```bash
git add src/page/item/ src/feature/item/
git commit -m "refactor(item): frontend uses id instead of publicId"
```

---

## Task 16: Update Order Frontend

**Files:**
- Modify: `src/page/order/OrderPage.tsx`
- Modify: `src/page/order/OrderFormPage.tsx`
- Modify: `src/feature/order/OrderDetail.tsx`
- Modify: `src/feature/order/OrderDeleteDialog.tsx`

**Step 1: OrderPage.tsx - change publicId to id**

```typescript
key={order.id}
isSelected={selectedId === String(order.id)}
onClick={() => setSelectedId(String(order.id))}
navigate(`/order/${selectedItem.id}/edit`);
// Display: use orderNumber or id
{order.orderNumber || `#${order.id}`}
```

**Step 2: OrderFormPage.tsx - change dropdown key**

```typescript
key={item.id}  // was item.publicId
```

**Step 3: OrderDetail.tsx - change queryKey, queryFn, resourceId**

```typescript
queryKey: queryKey.order.detail(order.id),
queryFn: () => api.get<Order>(`/order/${order.id}`),
...
resourceId={String(orderData.id)}
// Title already uses orderNumber with fallback
```

**Step 4: OrderDeleteDialog.tsx - change delete call and message**

```typescript
await remove.mutateAsync(order.id);
...
message={`Are you sure you want to delete order ${order?.orderNumber || `#${order?.id}`}? This action cannot be undone.`}
```

**Step 5: Commit**

```bash
git add src/page/order/ src/feature/order/
git commit -m "refactor(order): frontend uses id instead of publicId"
```

---

## Task 17: Update Config

**Files:**
- Modify: `src/lib/config.ts`

**Step 1: Remove publicIdLength**

```typescript
// Remove: publicIdLength: 7,
```

**Step 2: Commit**

```bash
git add src/lib/config.ts
git commit -m "refactor(config): remove publicIdLength"
```

---

## Task 18: Reset Database & Generate Fresh Migration

**Step 1: Run db:reset script**

```bash
bun run db:reset --local-only --skip-seed
```

This will:
- Drop all tables
- Clean migration files
- Generate fresh single migration
- Apply migration locally

**Step 2: Verify migration file**

Check `worker/db/migrations/0000_*.sql` - should have no publicId columns for category, item, order.

**Step 3: Commit migration**

```bash
git add worker/db/migrations/
git commit -m "chore(db): fresh migration without publicId columns"
```

---

## Task 19: Build & Test

**Step 1: Build**

```bash
bun run build
```

**Step 2: Start dev server**

```bash
bun run dev
```

**Step 3: Manual test checklist**

- [ ] Create category - should work with id
- [ ] Edit category - should work
- [ ] Delete category - should work
- [ ] Create item - should work
- [ ] Edit item - should work
- [ ] Delete item - should work
- [ ] Create order - should generate orderNumber
- [ ] Edit order - should work
- [ ] Delete order - should work
- [ ] Share link - should work (uses linkId)
- [ ] Audit history - should display correctly

**Step 4: Commit any fixes**

---

## Task 20: Deploy to Production

**Step 1: Reset production database**

```bash
wrangler d1 execute DB --remote --file=scripts/db-reset-prod.sql
```

**Step 2: Apply migration to production**

```bash
bun run db:migrate:prod
```

**Step 3: Seed production data**

```bash
wrangler d1 execute DB --remote --file=scripts/seed-rbac.sql
bun run scripts/seed-admin-prod.ts
```

**Step 4: Deploy**

```bash
bun run deploy
```

**Step 5: Verify production**

Test the same checklist on production.

---

## Summary of Changes

| Area | Files Changed | Key Change |
|------|---------------|------------|
| Database | 1 schema file | Remove 3 publicId columns |
| Backend | 4 route files, 1 lib | Use integer id in routes |
| Frontend Hooks | 3 files | Generic constraints, id matching |
| Frontend Components | 9 files | Use id for selection, keys, API calls |
| Shared Types | 4 files | Remove publicId property |
| Shared Schemas | 3 files | Remove publicId validation |
| Config | 2 files | Remove publicIdLength, update queryKey |
| Scripts | 1 file | Update drop-tables.sql |
| Migrations | All replaced | Fresh single migration |

**Total: ~25 files modified**
