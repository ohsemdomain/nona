# Layout Restyling Design

**Date:** 2026-01-13
**Status:** Approved
**Style:** Vercel/Claude.ai-inspired clean modern bento layout

## Overview

Restyle the entire app layout from parent to child components with a clean, modern, whitespace-focused design. Each major UI section becomes an independent "card" floating in whitespace with its own internal scrolling. No browser-level scrolling.

## Design Principles

- **Pure white everywhere** — No gray backgrounds, cards defined by borders only
- **Subtle borders** — `border-zinc-200`, no shadows
- **Generous whitespace** — 16px gaps between elements
- **Medium rounded corners** — `rounded-xl` for cards, `rounded-lg` for inputs/buttons
- **Independent scrolling** — Each panel scrolls independently, full viewport height
- **Light mode only** — Remove all dark mode variants

## Visual Structure

```
┌────────────────────────────────────────────────────────┐
│  NavBar (full width, border-b)                         │
├────────────────────────────────────────────────────────┤
│  p-4 padding                                           │
│  ┌─────────────┐ gap-4 ┌────────────────────────────┐  │
│  │ Master List │       │                            │  │
│  │ (card)      │       │      Detail Panel          │  │
│  │ border      │       │      (card)                │  │
│  │ rounded-xl  │       │      border                │  │
│  │  ↕ scroll   │       │      rounded-xl            │  │
│  │             │       │       ↕ scroll             │  │
│  └─────────────┘       └────────────────────────────┘  │
│  p-4 padding                                           │
└────────────────────────────────────────────────────────┘
```

### Settings Page Structure

```
┌────────────────────────────────────────────────────────┐
│  NavBar                                                │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────┐  ┌─────────────┐ ┌───────────────────┐  │
│  │ Setting  │  │ Master List │ │ Detail Panel      │  │
│  │ Nav      │  │ (card)      │ │ (card)            │  │
│  │ (card)   │  │             │ │                   │  │
│  └──────────┘  └─────────────┘ └───────────────────┘  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

## Specification

### Tailwind Config

Update `tailwind.config.ts` border radius defaults:

```ts
borderRadius: {
  none: "0px",
  sm: "4px",
  DEFAULT: "8px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
}
```

### Layout Component

**File:** `src/component/Layout.tsx`

- Background: `bg-white`
- Full height: `h-screen overflow-hidden`
- Main area: `flex-1 overflow-hidden p-4`

### NavBar Component

**File:** `src/component/NavBar.tsx`

- Height: `h-16` (64px, slightly more spacious)
- Padding: `px-6`
- Border: `border-b border-zinc-200`
- Background: `bg-white`
- Remove all `dark:` variants

### MasterDetail Component

**File:** `src/component/MasterDetail.tsx`

- Change from grid to flex: `flex gap-4 h-full`
- Remove `divide-x` divider
- Children are independent cards

### MasterList Component

**File:** `src/component/MasterList.tsx`

- Card styling: `border border-zinc-200 rounded-xl`
- Background: `bg-white`
- Width: `w-80` (320px) fixed
- Internal scroll: `overflow-y-auto` on list area
- Remove header/footer internal borders
- Remove all `dark:` variants

**MasterListItem:**
- Keep subtle separator: `border-b border-zinc-100`
- Selected state: `bg-zinc-100`
- Hover state: `hover:bg-zinc-50`
- Remove all `dark:` variants

### DetailPanel Component

**File:** `src/component/DetailPanel.tsx`

- Card styling: `border border-zinc-200 rounded-xl`
- Background: `bg-white`
- Flex grow: `flex-1`
- Internal scroll: `overflow-y-auto` on content area
- Remove header/footer internal borders
- Remove all `dark:` variants

### Modal Component

**File:** `src/component/Modal.tsx`

- Border radius: `rounded-xl`
- Border: `border border-zinc-200`
- Remove: `shadow-xl`
- Keep internal header border
- Remove all `dark:` variants

### Button Component

**File:** `src/component/Button.tsx`

- Border radius: `rounded-lg`
- Remove all `dark:` variants

### Input Component

**File:** `src/component/Input.tsx`

- Border radius: `rounded-lg`
- Border color: `border-zinc-200`
- Remove all `dark:` variants

### Select Component

**File:** `src/component/Select.tsx`

- Border radius: `rounded-lg`
- Border color: `border-zinc-200`
- Remove all `dark:` variants

### SearchInput Component

**File:** `src/component/SearchInput.tsx`

- Border radius: `rounded-lg`
- Border color: `border-zinc-200`
- Remove all `dark:` variants

### SettingPage Component

**File:** `src/page/setting/SettingPage.tsx`

- Layout: `flex gap-4 h-full p-4`
- SettingNav and content area as siblings with gap

### SettingNav Component

**File:** `src/page/setting/SettingNav.tsx`

- Card styling: `border border-zinc-200 rounded-xl`
- Background: `bg-white`
- Width: `w-56` (keep current)
- Remove: `border-r`
- Remove all `dark:` variants

## Files to Modify

### Core Layout
1. `tailwind.config.ts` — Border radius defaults
2. `src/index.css` — Remove dark mode references if any
3. `src/component/Layout.tsx` — White bg, padding
4. `src/component/NavBar.tsx` — Spacious, no dark mode

### Card Components
5. `src/component/MasterDetail.tsx` — Flex + gap
6. `src/component/MasterList.tsx` — Card styling
7. `src/component/DetailPanel.tsx` — Card styling

### Form Components
8. `src/component/Button.tsx` — Rounded-lg, no dark mode
9. `src/component/Input.tsx` — Rounded-lg, lighter border
10. `src/component/Select.tsx` — Match Input
11. `src/component/SearchInput.tsx` — Match Input
12. `src/component/Modal.tsx` — Rounded-xl, border, no shadow

### Settings
13. `src/page/setting/SettingPage.tsx` — Gap layout
14. `src/page/setting/SettingNav.tsx` — Card styling

### Other Components (remove dark mode)
15. `src/component/Tab.tsx`
16. `src/component/DataTable.tsx`
17. `src/component/Pagination.tsx`
18. `src/component/EmptyState.tsx`
19. `src/component/ErrorState.tsx`
20. `src/component/LoadingState.tsx`
21. `src/component/ConfirmDialog.tsx`
22. `src/component/HistoryLogPanel.tsx`
23. `src/component/HistoryLogItem.tsx`
24. `src/component/HistoryLogList.tsx`
25. `src/component/CompactLogItem.tsx`
26. `src/component/FieldChangeDisplay.tsx`
27. `src/component/PermissionMatrix.tsx`
28. `src/component/Checkbox.tsx`
29. `src/component/FormField.tsx`
30. `src/component/skeleton/*.tsx`
31. `src/App.tsx` — Toaster styling

### Pages (remove dark mode)
32. All page components in `src/page/`
33. All feature components in `src/feature/`

## Implementation Order

1. **Phase 1: Foundation**
   - Update `tailwind.config.ts`
   - Update `Layout.tsx` and `NavBar.tsx`

2. **Phase 2: Card Components**
   - Update `MasterDetail.tsx`
   - Update `MasterList.tsx`
   - Update `DetailPanel.tsx`

3. **Phase 3: Form Components**
   - Update `Button.tsx`
   - Update `Input.tsx`
   - Update `Select.tsx`
   - Update `SearchInput.tsx`
   - Update `Modal.tsx`

4. **Phase 4: Settings**
   - Update `SettingPage.tsx`
   - Update `SettingNav.tsx`

5. **Phase 5: Cleanup**
   - Remove dark mode from all remaining components
   - Remove dark mode from all pages
   - Remove dark mode from all features
