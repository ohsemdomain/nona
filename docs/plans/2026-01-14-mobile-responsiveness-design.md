# Mobile Responsiveness Design

**Date:** 2026-01-14
**Status:** Approved
**Goal:** Full functionality on mobile devices

## Overview

Add responsive mobile support to Nona using a mobile-first approach with a single breakpoint at `lg` (1024px). Below this breakpoint, the app uses stacked navigation and hamburger menu. Above, it uses the current desktop layout.

## Breakpoint Strategy

| Screen | Width | Layout |
|--------|-------|--------|
| Mobile/Tablet | < 1024px | Stacked views, hamburger menu |
| Desktop | ≥ 1024px | Side-by-side master-detail, full nav |

**Tailwind approach:**
- Default styles = mobile
- `lg:` prefix = desktop overrides

## NavBar & Mobile Menu

### Desktop (≥1024px)
Keep current horizontal layout unchanged.

### Mobile (<1024px)

**Compact header:**
```
┌──────────────────────────────┐
│ ☰   Nona              [👤]  │
└──────────────────────────────┘
```

**Hamburger menu (slide-in drawer):**
```
┌──────────────────────────────┐
│ ✕                            │
├──────────────────────────────┤
│ 📦 Category                  │
│ 📋 Item                      │
│ 🛒 Order                     │
│ ⚙️ Setting                   │
├──────────────────────────────┤
│ 👤 John Doe                  │
│    admin                     │
├──────────────────────────────┤
│ 🚪 Logout                    │
└──────────────────────────────┘
```

**Implementation:**
- New `MobileMenu.tsx` component — slide-in drawer
- State managed in Zustand or Layout component
- Overlay backdrop when open
- Close on navigation or backdrop click
- `lg:hidden` for hamburger button
- `hidden lg:flex` for desktop nav items

## MasterDetail Mobile Pattern

### Desktop (≥1024px)
Current side-by-side layout unchanged.

### Mobile (<1024px)
Stacked views with navigation state.

**Behavior:**
1. No item selected → Show MasterList full screen
2. Item selected → Show DetailPanel full screen with back button
3. Back button → Clear selection, return to list

**Layout logic:**
```tsx
// MasterDetail.tsx
<div className="flex h-full flex-col lg:flex-row lg:gap-4 lg:max-w-6xl lg:mx-auto">
  {/* Mobile: show one or the other. Desktop: show both */}
  <div className={clsx(
    "lg:block",
    selectedId ? "hidden" : "block"
  )}>
    <MasterList />
  </div>
  <div className={clsx(
    "lg:block",
    selectedId ? "block" : "hidden"
  )}>
    <DetailPanel />
  </div>
</div>
```

**MasterList changes:**
- Mobile: `w-full`
- Desktop: `w-80`

```tsx
className="w-full lg:w-80"
```

**DetailPanel changes:**
- Add back button visible only on mobile
- Back button calls `setSelectedId(null)`

```tsx
// Inside DetailPanel header on mobile
<button className="lg:hidden" onClick={onBack}>
  ← Back
</button>
```

## Settings Page Mobile

Settings has 3 levels: SettingNav → MasterList → DetailPanel.

### Desktop (≥1024px)
Current layout — side nav + master-detail.

### Mobile (<1024px)
SettingNav becomes horizontal tabs.

```
┌──────────────────────────────┐
│ ← Setting                    │
├──────────────────────────────┤
│ [User] [Log] [Role]          │  ← horizontal tabs
├──────────────────────────────┤
│                              │
│   MasterList or Detail       │
│                              │
└──────────────────────────────┘
```

**Implementation:**
```tsx
// SettingPage.tsx
<div className="flex h-full flex-col lg:flex-row lg:gap-4 lg:max-w-6xl lg:mx-auto">
  {/* Desktop: side nav */}
  <SettingNav className="hidden lg:block" />

  {/* Mobile: top tabs */}
  <SettingNavTabs className="lg:hidden" />

  {/* Content */}
  <div className="flex-1 overflow-hidden">
    <Outlet />
  </div>
</div>
```

**New component:** `SettingNavTabs.tsx` — horizontal scrollable tabs for mobile.

## Modals

### Desktop (≥1024px)
Current centered modal with max-width.

### Mobile (<1024px)
Full screen modal.

```tsx
// Modal.tsx
<div className={clsx(
  "fixed inset-0 flex flex-col bg-white",
  "lg:relative lg:inset-auto lg:max-w-md lg:rounded-xl lg:border",
)}>
```

## Layout Padding

Reduce padding on mobile for more content space:

```tsx
// Layout.tsx
<main className="flex-1 overflow-hidden p-2 lg:p-4">
```

## Files to Modify

### Core Layout
1. `src/component/Layout.tsx` — Mobile menu state, padding
2. `src/component/NavBar.tsx` — Desktop nav, hamburger trigger

### New Components
3. `src/component/MobileMenu.tsx` — Slide-in drawer menu
4. `src/page/setting/SettingNavTabs.tsx` — Horizontal tabs for mobile

### Responsive Updates
5. `src/component/MasterDetail.tsx` — Stacked/side-by-side toggle
6. `src/component/MasterList.tsx` — Full width on mobile
7. `src/component/DetailPanel.tsx` — Back button on mobile
8. `src/component/Modal.tsx` — Full screen on mobile
9. `src/page/setting/SettingPage.tsx` — Tabs on mobile
10. `src/page/setting/SettingNav.tsx` — Hide on mobile

### Hook Updates
11. `src/hook/useMasterDetail.ts` — May need `onBack` callback

## Implementation Order

1. **Phase 1: Foundation**
   - Update Layout.tsx with mobile padding
   - Create MobileMenu.tsx component
   - Update NavBar.tsx with hamburger/desktop toggle

2. **Phase 2: MasterDetail**
   - Update MasterDetail.tsx for stacked layout
   - Update MasterList.tsx for responsive width
   - Update DetailPanel.tsx with back button
   - Update useMasterDetail hook if needed

3. **Phase 3: Settings**
   - Create SettingNavTabs.tsx
   - Update SettingPage.tsx for mobile layout
   - Update SettingNav.tsx to hide on mobile

4. **Phase 4: Polish**
   - Update Modal.tsx for full screen mobile
   - Test all flows on mobile
   - Fix any edge cases
