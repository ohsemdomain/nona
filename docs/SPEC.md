# Foundation Kit Spec

## Goal

Build a reusable foundation with 3 test features that prove all patterns work together.

---

## Stack

- **Frontend:** React 19, Vite, TanStack Query, Zustand, Tailwind v4, react-router-dom v7
- **Backend:** Hono, Cloudflare Workers, D1, Drizzle ORM
- **Auth:** better-auth (minimal: login, register, session)
- **Validation:** Zod
- **Date:** date-fns
- **Icons:** Lucide React only
- **ID:** nanoid (7-char for publicId)
- **Toast:** react-hot-toast

---

## Development Setup

### Commands

| Command | Purpose |
|---------|---------|
| `bun install` | Install dependencies |
| `bun run dev` | Start dev server (Vite + Worker) |
| `bun run build` | Build for production |
| `bun run preview` | Preview production build |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:migrate` | Apply migrations (local) |
| `bun run db:migrate:prod` | Apply migrations (production) |

### Ports

- Dev server: `http://localhost:5650`
- Network: `http://<ip>:5650`

---

## Wrangler Configuration

Key settings in `wrangler.jsonc`:

| Setting | Value | Purpose |
|---------|-------|---------|
| `assets.not_found_handling` | `"single-page-application"` | SPA routing support |
| `assets.run_worker_first` | `true` | API routes before static assets |
| `compatibility_flags` | `["nodejs_compat"]` | Node.js API compatibility |

### Environment Variables

| Variable | Dev | Production |
|----------|-----|------------|
| `TRUSTED_ORIGIN` | `http://localhost:5650,http://<ip>:5650` | `https://<app>.workers.dev` |

---

## Folder Structure

```
/shared              ← Source of truth (frontend + backend import from here)
  /schema            ← Zod schemas (category.ts, item.ts, order.ts)
  /types             ← TypeScript types
  /constants         ← Enums, status configs, shared constants

/src                 ← Frontend only
  /components        ← UI components (Button, Input, Modal, etc.)
  /hooks             ← Hooks (useResource, useFilter, usePagination)
  /lib               ← Utilities (api, queryKey, date, format, toast, error, zIndex)
  /pages             ← Route pages
  /store             ← Zustand stores (useUIStore, useAuthStore)

/worker              ← Backend only
  /routes            ← API route handlers
  /db                ← Drizzle schema, migrations
  /lib               ← Backend utilities
  index.ts           ← Hono app entry
```

### Import Pattern

```typescript
// Zod schema defined once in /shared
// /shared/schema/item.ts
export const itemSchema = z.object({ ... })

// Frontend imports
import { itemSchema } from '@shared/schema/item'

// Backend imports
import { itemSchema } from '../../shared/schema/item'
```

---

## Auth (Minimal)

- better-auth setup with D1 adapter
- Routes: `/api/auth/*`
- First register = admin (default role)
- Session-based
- Protected routes use middleware
- Add roles/permissions later

---

## 3 Test Features

| Entity                | Complexity | Tests                                                             |
| --------------------- | ---------- | ----------------------------------------------------------------- |
| `Category`            | Simple     | Basic CRUD                                                        |
| `Item`                | Medium     | CRUD + belongs to Category + inline create Category               |
| `Order` + `OrderLine` | Complex    | Nested CRUD + inline create Item + status workflow + calculations |

### Relationships

```
Category (1) ← (N) Item (1) ← (N) OrderLine (N) → (1) Order
```

### Modal Stacking Test

```
Order form page (unsaved)
  → [+ Add Item] → Item modal (saves to DB)
    → [+ New Category] → Category modal (saves to DB)
    ← Category saved, back-populates to Item dropdown
  ← Item saved, back-populates to Order lines
→ Save Order
```

**Important:** When using `useInlineModal` in reusable components (like modals that can be opened from multiple places), the inline modal ID must be derived from the parent's ID. See **RULE.md > Inline Modal Pattern** for details.

---

## Layout Patterns

### Master-Detail Layout

All list views use Master-Detail pattern:

```
┌─────────────────────┬───────────────────────────────┐
│  MASTER (List)      │  DETAIL (Selected)            │
├─────────────────────┼───────────────────────────────┤
│  ▶ Selected item    │  Full details shown here      │
│    Other item       │  [Edit] [Delete] buttons      │
│    Other item       │                               │
│                     │                               │
│  [+ New]            │                               │
└─────────────────────┴───────────────────────────────┘
```

Behaviors:

- Auto-select first item on page load
- URL sync: `?selected=abc123`
- After create: auto-select new item
- After delete: select next/previous item
- Empty list: show EmptyState in detail panel

### Feature Layout Matrix

| Feature  | List          | Detail Panel            | Create | Edit  | Delete  |
| -------- | ------------- | ----------------------- | ------ | ----- | ------- |
| Category | Master-Detail | Right panel             | Modal  | Modal | Confirm |
| Item     | Master-Detail | Right panel             | Modal  | Modal | Confirm |
| Order    | Master-Detail | Right panel (read-only) | Page   | Page  | Confirm |

### URL Structure

| Route                       | Layout                            |
| --------------------------- | --------------------------------- |
| `/category`                 | Master-Detail (auto-select first) |
| `/category?selected=abc123` | Master-Detail (specific selected) |
| `/item`                     | Master-Detail (auto-select first) |
| `/item?selected=abc123`     | Master-Detail (specific selected) |
| `/order`                    | Master-Detail (auto-select first) |
| `/order?selected=abc123`    | Master-Detail (specific selected) |
| `/order/new`                | Full page form                    |
| `/order/:id/edit`           | Full page form                    |

### Centralized Hook

Create `useMasterDetail(entity)` hook:

```typescript
const {
    list, // Query result
    selectedId, // Current selected
    selectedItem, // Current selected data
    setSelectedId, // Manual select
    selectFirst, // Select first item
    selectAfterCreate, // Auto-select after create
    selectAfterDelete, // Select next after delete
} = useMasterDetail<Item>("item");
```

---

## Generic CRUD Factory

Create `useResource<T>(entity)` hook that provides:

- `list` — paginated, searchable, filterable
- `detail` — single record by ID
- `create` — mutation + invalidation
- `update` — mutation + invalidation
- `remove` — soft delete + invalidation

All features use same factory. No duplicate CRUD code.

---

## Centralized Libs

| File                            | Purpose                                       |
| ------------------------------- | --------------------------------------------- |
| `/src/lib/api.ts`               | Fetch wrapper, error handling                 |
| `/src/lib/queryKey.ts`          | Query key factory: `queryKey.{entity}.list()` |
| `/src/lib/invalidation.ts`      | `invalidateRelated(entity)`                   |
| `/src/lib/date.ts`              | `getLocalDate()`, `toUTC()`, `formatDate()`   |
| `/src/lib/format.ts`            | `formatMoney()`                               |
| `/src/lib/toast.ts`             | `TOAST.created()`, `TOAST.deleted()`, etc.    |
| `/src/lib/error.ts`             | `handleApiError()`                            |
| `/src/lib/zIndex.ts`            | `Z_INDEX.modal`, `Z_INDEX.modalOverlay`, etc. |
| `/src/lib/config.ts`            | `CONFIG.apiUrl`, etc.                         |
| `/src/hooks/useResource.ts`     | Generic CRUD factory hook                     |
| `/src/hooks/useMasterDetail.ts` | Master-Detail state management                |
| `/src/hooks/useFilter.ts`       | Search/filter with URL sync                   |
| `/src/hooks/usePagination.ts`   | Pagination state                              |

---

## Hooks Reference

| Hook | Purpose |
|------|---------|
| `useResource` | Generic CRUD factory (list, create, update, remove) |
| `useMasterDetail` | Master-Detail state management with URL sync |
| `useFormModal` | Modal form with validation and dirty tracking |
| `useFormDirty` | Unsaved changes detection and confirmation |
| `useInlineModal` | Inline create/edit flow in nested modals |
| `useFilter` | Search/filter with URL sync |
| `usePagination` | Pagination state |

See **RULE.md** for detailed usage patterns of `useFormModal`, `useFormDirty`, and `useInlineModal`.

---

## Centralized UI Components

| Component         | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `<Button>`        | All buttons (variants: primary, secondary, danger) |
| `<Input>`         | All inputs                                         |
| `<FormField>`     | Label + Input + Error                              |
| `<Modal>`         | Stackable modals (uses zIndex)                     |
| `<ConfirmDialog>` | Delete confirmations                               |
| `<LoadingState>`  | Spinner + message                                  |
| `<EmptyState>`    | No data message                                    |
| `<DataTable>`     | Generic table with sort                            |
| `<Pagination>`    | Page controls                                      |
| `<SearchInput>`   | Debounced search                                   |
| `<MasterDetail>`  | Master-Detail layout wrapper                       |
| `<MasterList>`    | Left panel list                                    |
| `<DetailPanel>`   | Right panel detail                                 |

---

## Centralized State

`/src/store/ui.ts` — `useUIStore`

- Modal stack management (open, close, stack)
- Loading states
- Current modal data

---

## DB Schema (Drizzle)

```typescript
// Primary key: INTEGER autoincrement
// publicId: TEXT (7-char nanoid) for URLs
// Timestamps: INTEGER (unix ms)
// Money: INTEGER (cents) or REAL
// Soft delete: deletedAt INTEGER nullable

category: (id, publicId, name, createdAt, updatedAt, deletedAt);

item: (id,
    publicId,
    name,
    categoryId(FK),
    price,
    createdAt,
    updatedAt,
    deletedAt);

order: (id, publicId, status, total, createdAt, updatedAt, deletedAt);

orderLine: (id, orderId(FK), itemId(FK), quantity, unitPrice, lineTotal);
```

---

## API Endpoints Pattern

All entities follow same pattern:

```
GET    /api/{entity}          ← List (paginated, filterable)
GET    /api/{entity}/:id      ← Detail
POST   /api/{entity}          ← Create
PUT    /api/{entity}/:id      ← Update
DELETE /api/{entity}/:id      ← Soft delete
```

---

## Strict Rules

1. **Singular naming** — `getItemList()` not `getItems()`, `/api/item` not `/api/items`
2. **No `any`** — Full TypeScript strictness
3. **Named exports** — No default exports
4. **Numbers for money** — No currency symbols in data
5. **Integer primary keys** — `publicId` for URLs only
6. **date-fns for dates** — No raw `new Date()` for storage
7. **Centralized imports** — All from `/lib/*`, `/components/*`
8. **useResource factory** — No duplicate CRUD hooks
9. **Modal via useUIStore** — No `useState` per modal
10. **Lucide icons only** — No other icon libraries

---

## Build Order

### Phase 1: Foundation

1. Project setup (Vite, Tailwind, Biome config)
2. Folder structure
3. Centralized libs (all `/src/lib/*`)
4. Centralized UI components (all `/src/components/*`)
5. useUIStore (modal stacking)
6. useResource factory hook
7. Drizzle setup + base schema
8. Hono setup + base API pattern
9. better-auth setup (login, register, session)

### Phase 2: Features

1. Category (simple CRUD) — prove pattern works
2. Item (CRUD + Category relationship + inline create)
3. Order + OrderLine (complex nested + inline create Item + status)

### Phase 3: Polish

1. Cross-feature invalidation testing
2. Modal stacking testing (3 levels)
3. Date timezone consistency testing
4. Error handling testing

---

## Success Criteria

- [ ] All 3 features use `useResource` factory
- [ ] All 3 features use Master-Detail layout
- [ ] URL sync works (`?selected=abc123`)
- [ ] Auto-select first item on page load
- [ ] After create: new item auto-selected
- [ ] After delete: next item auto-selected
- [ ] Modal stacking works 3 levels deep
- [ ] Creating Item can inline create Category
- [ ] Creating Order can inline create Item (which can create Category)
- [ ] Order create/edit uses full page (not modal)
- [ ] All dates consistent (DB → API → UI)
- [ ] All money displays correctly (number → formatted)
- [ ] Cross-invalidation works (delete Category → Item list refreshes)
- [ ] Zero `any` types
- [ ] Zero duplicate CRUD code
