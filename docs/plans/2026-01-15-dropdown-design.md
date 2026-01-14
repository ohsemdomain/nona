# Dropdown Component Design

## Overview

A full-featured, composable dropdown menu component using Radix UI primitives styled with Geist design tokens. Supports action menus, select replacements, sub-menus, and checkable items.

## Components

| Component | Purpose |
|-----------|---------|
| `Dropdown` | Root wrapper with size context |
| `DropdownTrigger` | Wraps trigger element |
| `DropdownContent` | Floating menu panel |
| `DropdownItem` | Clickable item with optional icon/shortcut |
| `DropdownCheckboxItem` | Toggleable checkbox item |
| `DropdownRadioGroup` | Single-select group wrapper |
| `DropdownRadioItem` | Radio option within group |
| `DropdownSub` | Sub-menu wrapper |
| `DropdownSubTrigger` | Item that opens sub-menu |
| `DropdownSubContent` | Sub-menu panel |
| `DropdownSeparator` | Visual divider |
| `DropdownLabel` | Section label |
| `DropdownShortcut` | Keyboard hint display |

## Size Variants

Passed via `Dropdown` root, inherited by all children via Context:

- `sm` - h-8 items, text-xs
- `md` - h-9 items, text-sm (default)
- `lg` - h-10 items, text-base

## Visual Styling

### Menu Panel (DropdownContent)
- Background: `bg-geist-bg`
- Border: `border border-geist-border`
- Shadow: `shadow-lg`
- Border radius: `rounded`
- Padding: `p-1`
- Min-width: `min-w-[180px]`
- Animation: Fade + scale on open/close

### Menu Items (DropdownItem)
- Height: Based on size variant (h-8/h-9/h-10)
- Padding: `px-2`
- Text: `text-geist-fg`
- Hover/Focus: `bg-geist-bg-secondary`
- Icons: `h-4 w-4` with `gap-2`
- Disabled: `opacity-50 pointer-events-none`

### Item Variants
- `default` - Standard text color
- `danger` - `text-geist-error` for destructive actions

### Separator
- `h-px bg-geist-border my-1`

## API Examples

### Basic Action Menu
```tsx
<Dropdown>
  <DropdownTrigger asChild>
    <Button variant="secondary" size="sm">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownTrigger>
  <DropdownContent>
    <DropdownItem onSelect={() => handleEdit()}>
      <Pencil className="h-4 w-4" />
      Edit
      <DropdownShortcut>⌘E</DropdownShortcut>
    </DropdownItem>
    <DropdownItem onSelect={() => handleDuplicate()}>
      <Copy className="h-4 w-4" />
      Duplicate
    </DropdownItem>
    <DropdownSeparator />
    <DropdownItem variant="danger" onSelect={() => handleDelete()}>
      <Trash2 className="h-4 w-4" />
      Delete
      <DropdownShortcut>⌘⌫</DropdownShortcut>
    </DropdownItem>
  </DropdownContent>
</Dropdown>
```

### With Sub-menu
```tsx
<DropdownSub>
  <DropdownSubTrigger>
    <Share className="h-4 w-4" />
    Share
  </DropdownSubTrigger>
  <DropdownSubContent>
    <DropdownItem>Copy Link</DropdownItem>
    <DropdownItem>Email</DropdownItem>
  </DropdownSubContent>
</DropdownSub>
```

### Checkbox Items
```tsx
<DropdownCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
  Show Grid
</DropdownCheckboxItem>
```

### Radio Group
```tsx
<DropdownRadioGroup value={view} onValueChange={setView}>
  <DropdownRadioItem value="grid">Grid View</DropdownRadioItem>
  <DropdownRadioItem value="list">List View</DropdownRadioItem>
</DropdownRadioGroup>
```

### With Size Variant
```tsx
<Dropdown size="sm">
  <DropdownTrigger asChild>
    <Button size="sm">Options</Button>
  </DropdownTrigger>
  <DropdownContent>
    {/* Items inherit sm size */}
  </DropdownContent>
</Dropdown>
```

## Dependencies

```bash
bun add @radix-ui/react-dropdown-menu
```

## Implementation

### File Structure
```
src/component/Dropdown.tsx
```

### Context Pattern
```tsx
const DropdownContext = createContext<{ size: 'sm' | 'md' | 'lg' }>({ size: 'md' });
```

### Accessibility (via Radix)
- Arrow key navigation
- Enter/Space to select
- Escape to close
- Type-ahead search
- Proper ARIA roles
- Focus management

## Export Pattern

All components exported from `src/component/Dropdown.tsx` and re-exported via `src/component/index.ts` barrel file.
