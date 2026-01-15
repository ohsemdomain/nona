# Component Structure

This directory follows the **Atomic Design** methodology to organize UI components by abstraction level.

## Directory Structure

```
src/component/
├── atom/           # Indivisible UI primitives
├── molecule/       # Composed atoms with single purpose
├── organism/       # Complex, stateful components
├── template/       # Page-level layout patterns
├── boundary/       # Wrapper/guard components
├── skeleton/       # Loading placeholder components
└── index.ts        # Barrel export (re-exports all)
```

## Categories

### Atom

Indivisible UI elements with no component dependencies. Pure presentation.

| Component | Description |
|-----------|-------------|
| `Button` | Clickable button with variants |
| `Input` | Text input field |
| `Checkbox` | Checkbox with indeterminate state |
| `LoadingState` | Spinner/loading indicator |

### Molecule

Composed of atoms, serving a single purpose.

| Component | Description |
|-----------|-------------|
| `SearchInput` | Input with search icon and clear button |
| `FormField` | Label + input slot + error message |
| `Pagination` | Page navigation controls |
| `EmptyState` | Empty content placeholder |
| `ErrorState` | Error display with retry action |
| `LoadingBoundary` | Conditional loading/error/content wrapper |

### Organism

Complex components, often stateful, composed of multiple molecules.

| Component | Description |
|-----------|-------------|
| `NavBar` | Main navigation bar |
| `MobileMenu` | Mobile navigation drawer |
| `DataTable` | Sortable data table |
| `Tab` | Tab group with panels |
| `Modal` | Dialog overlay |
| `Dropdown` | Dropdown menu (Radix-based) |
| `ConfirmDialog` | Confirmation modal |
| `MasterList` | Scrollable list container |
| `MasterListHeader` | List header with title, search, actions |
| `DetailPanel` | Detail view panel |

### Template

Page-level layout patterns that compose organisms.

| Component | Description |
|-----------|-------------|
| `Layout` | App shell with NavBar and content area |
| `MasterDetail` | Two-panel responsive layout |

### Boundary

Wrapper components for routing, permissions, and error handling.

| Component | Description |
|-----------|-------------|
| `ProtectedRoute` | Auth-required route guard |
| `PermissionGuard` | Permission-based render guard |
| `RootErrorBoundary` | App-level error boundary |
| `RouteErrorBoundary` | Route-level error boundary |

### Skeleton

Loading placeholder components that mirror real component shapes.

| Component | Description |
|-----------|-------------|
| `SkeletonText` | Text placeholder |
| `SkeletonBox` | Box placeholder |
| `SkeletonCircle` | Circle placeholder |
| `SkeletonAvatar` | Avatar placeholder |
| `SkeletonListItem` | List item placeholder |
| `SkeletonList` | List placeholder |
| `SkeletonTableRow` | Table row placeholder |
| `SkeletonTable` | Table placeholder |
| `SkeletonDetailPanel` | Detail panel placeholder |
| `SkeletonOrderDetail` | Order detail placeholder |
| `SkeletonHistoryLog` | History log placeholder |

## Feature-Specific Components

Components tied to specific features live in their feature directories:

```
src/feature/
├── audit/component/     # HistoryLogPanel, HistoryLogList, etc.
└── role/component/      # PermissionMatrix
```

## Usage

Import from the main barrel:

```tsx
import { Button, Modal, Layout } from "@/src/component";
```

Or import from specific category for explicit dependency:

```tsx
import { Button } from "@/src/component/atom";
import { Modal } from "@/src/component/organism";
```

## Adding New Components

1. Determine the abstraction level (atom → molecule → organism → template)
2. Create the component in the appropriate directory
3. Export from the directory's `index.ts`
4. The main barrel auto-exports via `export * from "./category"`

**Decision Guide:**

| Question | If Yes |
|----------|--------|
| No component dependencies? | → `atom/` |
| Composed of atoms only? | → `molecule/` |
| Has state or complex logic? | → `organism/` |
| Defines page layout? | → `template/` |
| Guards/wraps other components? | → `boundary/` |
| Feature-specific, not reusable? | → `feature/*/component/` |
