# Settings Navigation Refactor Design

> **For Claude:** Use this design to implement the settings navigation refactor.

**Goal:** Extract Number Format from General page into its own top-level navigation item and reorder settings navigation.

**Architecture:** Both General and Number Format pages use master-detail pattern for future extensibility.

---

## Navigation Changes

**Current order:** General → User → Log → Role

**New order:** General → Number Format → User → Role → Log

**File:** `src/page/setting/SettingNav.tsx`
- Add nav item: `{ to: "/setting/number-format", label: "Number Format", icon: Hash }`
- Reorder array
- Import `Hash` from lucide-react

---

## New Number Format Page

**File:** `src/page/setting/NumberFormatPage.tsx`

**Structure:** Master-detail pattern (matches General page)

**Sidebar categories:**
- Order (default)
- *(Future: Invoice, Quote)*

**URL state:** `/setting/number-format?tab=order`

**Detail panel:** Renders `NumberFormatSetting` component

**Permission:** `PERMISSION.SYSTEM_ADMIN`

---

## General Page Changes

**File:** `src/page/setting/GeneralSettingPage.tsx`

- Remove "Number Format" from `CATEGORY_LIST`
- Remove `case "number-format"` from `renderDetailContent`
- Keep master-detail layout for future scaling

---

## Router & Exports

**File:** `src/router.tsx`
- Add route: `/setting/number-format` → `NumberFormatPage`

**File:** `src/page/setting/index.ts`
- Export `NumberFormatPage`

---

## Files Summary

| File | Action |
|------|--------|
| `SettingNav.tsx` | Add nav item, reorder |
| `NumberFormatPage.tsx` | Create new |
| `GeneralSettingPage.tsx` | Remove Number Format |
| `src/page/setting/index.ts` | Add export |
| `src/router.tsx` | Add route |
