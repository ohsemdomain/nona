# Code Quality Rules

## Core Principles

1. **Centralize, don't scatter** — Common patterns belong in shared utilities
2. **Consistency over cleverness** — Use established patterns, not ad-hoc solutions
3. **Type safety** — No `any`, no `@ts-ignore`
4. **Named exports** — Avoid default exports for better refactoring

---

## UI Patterns

| Instead of...              | Use...                          |
| -------------------------- | ------------------------------- |
| Raw styling in pages       | Shared UI components            |
| Inline validation          | Form hook + schema validation   |
| Hardcoded messages         | Centralized message constants   |
| Permission checks in pages | Route-level guards              |
| Custom loading/empty UI    | Standardized state components   |
| `window.confirm()`         | Custom confirm dialog component |
| Multiple icon libraries    | Single icon library             |
| Arbitrary z-index values   | Z-index constants               |
| `useState` per modal       | Centralized UI state store      |
| Local pagination state     | Pagination hook                 |
| Local search/filter state  | Filter hook (URL-synced)        |

---

## Inline Modal Pattern

When a component can be instantiated multiple times and uses `useInlineModal` to spawn child modals, **modal IDs must be derived from the parent's unique ID** to prevent cross-instance interference.

### The Problem

```typescript
// BAD: Static modal ID causes bug with multiple instances
const INLINE_MODAL_ID = "item-inline-category"; // All instances share same ID!

export function ItemFormModal({ id }: { id: string }) {
  const categoryModal = useInlineModal<Category>(INLINE_MODAL_ID, callback);
  // Bug: pendingKeyRef in Instance 1 becomes orphaned when
  // handleSuccess is called on Instance 3
}
```

### The Solution

```typescript
// GOOD: Dynamic modal ID prevents cross-instance interference
export function ItemFormModal({ id }: { id: string }) {
  const inlineCategoryModalId = `${id}-inline-category`; // Unique per parent
  const categoryModal = useInlineModal<Category>(inlineCategoryModalId, callback);
  // Each instance gets its own modal ID, callback chain works correctly
}
```

### When This Applies

| Scenario | Modal ID Pattern | Example |
|----------|-----------------|---------|
| Page component (single instance) | Static ID is OK | `OrderFormPage` uses `"order-inline-item"` |
| Reusable modal (multiple instances) | **Must use dynamic ID** | `ItemFormModal` uses `` `${id}-inline-category` `` |
| Nested inline modals | Parent ID must propagate | `"order-inline-item-inline-category"` |

### Key Rule

> When using `useInlineModal` inside a component that receives an `id` prop, always derive the inline modal ID from that parent ID.

---

## Data & API Patterns

| Instead of...               | Use...                          |
| --------------------------- | ------------------------------- |
| Raw `fetch()` calls         | Centralized API client          |
| Manual cache keys           | Query key factory               |
| Manual cache invalidation   | Related-entity invalidation     |
| Inline status colors/config | Centralized status config       |
| Role string comparisons     | Permission utility functions    |
| Inline formatting           | `formatMoney()`, `formatDate()` |
| Raw `new Date()`            | Date utility helpers            |
| Inline error handling       | Centralized error handler       |
| Hardcoded URLs/env values   | Config constants                |

---

## Data Conventions

| Rule               | Details                                         |
| ------------------ | ----------------------------------------------- |
| Currency           | Store numbers only; symbols are UI-only         |
| Primary keys       | Use integers, not UUIDs                         |
| Public identifiers | Short random strings for URLs (e.g., 7 chars)   |
| Dates/timezones    | Always use date helpers, never raw `new Date()` |

---

## Naming Conventions

Use **singular** form + descriptive suffix. `{Entity}` = any domain object (user, post, order, item, comment, etc.)

| Element          | Pattern                     | Example                       |
| ---------------- | --------------------------- | ----------------------------- |
| UI labels        | Singular noun               | "Order" not "Orders"          |
| List functions   | `get{Entity}List()`         | `getOrderList()`              |
| Single functions | `get{Entity}ById()`         | `getOrderById()`              |
| List variables   | `{entity}List`              | `orderList`                   |
| Single variables | `{entity}`                  | `order`                       |
| API endpoints    | `/api/{entity}`             | `/api/order`                  |
| Query keys       | `['{entity}', 'list']`      | `['order', 'list']`           |
| Types            | `{Entity}`                  | `Order`                       |
| Files/folders    | `{entity}.ts`, `/{entity}/` | `order.ts`, `/feature/order/` |
