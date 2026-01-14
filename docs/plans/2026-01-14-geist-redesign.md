# Geist/Vercel Style Redesign

## Overview

Refactor the Nona webapp to clone Vercel's Geist design system: small fonts, clean aesthetics, generous whitespace.

## Design Decisions

| Decision | Choice |
|----------|--------|
| Color palette | Custom Geist grays (#fafafa, #ededed, #999, #666, #171717) |
| Typography | Keep Inter font, adjust sizes to Geist scale (11-16px) |
| Component density | Geist-authentic (32px buttons, 36px inputs) |
| Whitespace | Generous padding (24-32px section gaps) |

## Tailwind Config

### Colors

```ts
colors: {
  geist: {
    bg: '#ffffff',
    'bg-secondary': '#fafafa',
    border: '#eaeaea',
    'border-dark': '#333',
    fg: '#171717',
    'fg-secondary': '#666666',
    'fg-muted': '#999999',
    success: '#0070f3',
    error: '#e00',
    warning: '#f5a623',
  }
}
```

### Font Sizes

```ts
fontSize: {
  '2xs': ['11px', { lineHeight: '16px' }],
  xs: ['12px', { lineHeight: '16px' }],
  sm: ['13px', { lineHeight: '20px' }],
  base: ['14px', { lineHeight: '20px' }],
  lg: ['16px', { lineHeight: '24px' }],
  xl: ['20px', { lineHeight: '28px' }],
}
```

## Component Specifications

### Button

| Size | Height | Padding | Font |
|------|--------|---------|------|
| sm | 32px (h-8) | px-3 | text-sm (13px) |
| md | 36px (h-9) | px-4 | text-sm (13px) |
| lg | 40px (h-10) | px-4 | text-base (14px) |

Variants:
- Primary: `bg-geist-fg text-white hover:bg-geist-fg/90`
- Secondary: `bg-geist-bg-secondary text-geist-fg hover:bg-geist-border`
- Danger: `bg-geist-error text-white hover:bg-geist-error/90`
- Ghost: `bg-transparent text-geist-fg hover:bg-geist-bg-secondary`

### Input / Select

- Height: 36px (`h-9`)
- Padding: `px-3`
- Border: `border-geist-border`
- Focus: `focus:border-geist-fg focus:outline-none` (no ring)
- Font: `text-sm` (13px)
- Placeholder: `text-geist-fg-muted`

### DataTable

Header:
- Padding: `py-2 px-4`
- Font: `text-xs uppercase tracking-wide`
- Color: `text-geist-fg-muted`

Cells:
- Padding: `py-2.5 px-4`
- Font: `text-sm`
- Color: `text-geist-fg`

Rows:
- Border: `border-b border-geist-border`
- Hover: `hover:bg-geist-bg-secondary`

### NavBar

- Height: 56px (`h-14`)
- Logo: `text-base font-semibold`
- Nav links: `text-sm font-medium`
- Border: `border-b border-geist-border`

### Modal

- Border radius: `rounded-lg` (6px)
- Border: `border border-geist-border`
- Shadow: `shadow-lg`
- Header padding: `px-5 py-4`
- Body padding: `p-5`

## Spacing Guidelines

### Page Layout

- Side padding: `px-6 lg:px-8`
- Section gaps: `space-y-6` (24px)
- Card padding: `p-6` (24px)

### MasterList / DetailPanel

- MasterList header: `p-5`
- List items: `px-5 py-3`
- DetailPanel content: `p-6`

### Forms

- Field spacing: `space-y-5` (20px)
- Label-to-input gap: `space-y-1` (4px)
- Labels: `text-xs font-medium text-geist-fg-secondary`

## Visual Style

### Borders

- Color: `border-geist-border` (#eaeaea)
- Width: 1px throughout
- No double borders or heavy dividers

### Focus States

- Inputs: Border darkens to `border-geist-fg`, no ring
- Buttons: `focus-visible:ring-2 ring-geist-fg ring-offset-2`

### Hover States

- Subtle background shifts only
- Table rows: `hover:bg-geist-bg-secondary`
- Buttons: Opacity or slight background change

### Shadows

- Most elements: No shadow
- Modals: `shadow-lg`
- Dropdowns: `shadow-md`

## Files to Modify

### Config

- `tailwind.config.ts`

### Core Components

- `Button.tsx`
- `Input.tsx`
- `Select.tsx`
- `SearchInput.tsx`
- `DataTable.tsx`
- `Modal.tsx`
- `NavBar.tsx`
- `MasterList.tsx`
- `DetailPanel.tsx`

### Secondary Components

- `Tab.tsx`
- `Pagination.tsx`
- `FormField.tsx`
- `Checkbox.tsx`
- `MobileMenu.tsx`
- `ConfirmDialog.tsx`

### Pages

All pages need `zinc-*` → `geist-*` color replacement:
- `LoginPage.tsx`
- `UserPage.tsx`
- `CategoryPage.tsx`
- `ItemPage.tsx`
- `OrderPage.tsx`
- `OrderFormPage.tsx`
- `RolePage.tsx`
- `SystemLogPage.tsx`
- `SettingNav.tsx`

### Features

- `UserDetail.tsx`, `UserFormModal.tsx`
- `CategoryDetail.tsx`, `CategoryFormModal.tsx`
- `ItemDetail.tsx`, `ItemFormModal.tsx`
- `OrderDetail.tsx`
- `RoleDetail.tsx`, `RoleFormModal.tsx`

## Migration Strategy

1. Update `tailwind.config.ts` with Geist colors and font sizes
2. Update core components (Button, Input, etc.)
3. Search/replace `zinc-*` with `geist-*` equivalents across all files
4. Fine-tune spacing in layout components
5. Test all pages for visual consistency
