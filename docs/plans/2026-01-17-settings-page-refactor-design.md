# Settings Page Refactor Design

> **For Claude:** Use this design to implement the settings page refactor.

**Goal:** Refactor General and Log pages to use master-detail layout pattern, matching User and Role pages for visual consistency.

**Architecture:** Both pages adopt the existing `MasterDetail` component pattern with 240px sidebar.

---

## Overall Structure

```
┌─────────────────────────────────────────────────────────┐
│ [Setting Nav tabs/sidebar - existing]                   │
├───────────────┬─────────────────────────────────────────┤
│               │                                         │
│   Sidebar     │           Detail Panel                  │
│   (240px)     │           (flex-1)                      │
│               │                                         │
└───────────────┴─────────────────────────────────────────┘
```

**Mobile:** Hide sidebar, show detail panel only. Filters (Log page) move to collapsible header.

---

## General Page

**Sidebar Categories:**
- Public Link (icon: Link)
- Number Format (icon: Hash)

**URL State:** `/setting/general?tab=public-link` or `?tab=number-format`

**Detail Panels:**

1. **Public Link Panel**
   - Title: "Public Link"
   - Field: Link expiry days (number input)
   - Save button (disabled until dirty)

2. **Number Format Panel**
   - Title: "Number Format"
   - Field: Order number format pattern
   - Live preview
   - Placeholder reference
   - Save button

**Files:**
- `GeneralSettingPage.tsx` — restructure to master-detail
- `PublicLinkSetting.tsx` — new component for expiry setting
- `NumberFormatSetting.tsx` — already exists, minor tweaks

---

## Log Page

**Filter Sidebar:**
- Resource dropdown (All, User, Category, Item, Order, Auth)
- Action dropdown (All, Create, Update, Delete, Login, Logout)
- Actor search input
- Clear All button (visible when filters active)

**Log List Panel:**
- Header: "System Log" + entry count
- Compact log entries (existing `CompactLogItem`)
- Pagination at bottom

**URL State:** `/setting/log?resource=order&action=create&search=admin`

**Mobile:** Filters in collapsible accordion at top.

**Files:**
- `SystemLogPage.tsx` — restructure to master-detail with filter sidebar

---

## Implementation Notes

1. Reuse existing components: `MasterDetail`, `MasterList`, `MasterListItem`, `DetailPanel`
2. Sidebar width: 240px (matches User/Role pattern)
3. Filters apply immediately (no Apply button)
4. URL syncs state for bookmarkability
