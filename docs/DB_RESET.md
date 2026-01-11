# Database Reset Guide

## Overview

The `db:reset` script automates full database reset for development and refactoring. It handles:
- Dropping all tables (respecting FK order)
- Cleaning migration files
- Regenerating migrations from schema
- Applying migrations
- Seeding data
- Building the project

---

## Quick Start

```bash
# Full reset (local + remote + build)
bun run db:reset

# Local only (development)
bun run db:reset --local-only

# Skip build step
bun run db:reset --skip-build

# Skip seeding (schema only)
bun run db:reset --skip-seed

# Combine flags
bun run db:reset --local-only --skip-build
```

---

## What It Does

```
┌─────────────────────────────────────────────────────────────┐
│ Phase 1: Drop Tables                                        │
├─────────────────────────────────────────────────────────────┤
│ Executes scripts/drop-tables.sql                            │
│ Drops tables in FK-safe order (children before parents)     │
│ Runs on both local and remote (unless --local-only)         │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 2: Clean Migration Files                              │
├─────────────────────────────────────────────────────────────┤
│ Deletes: worker/db/migrations/*.sql                         │
│ Deletes: worker/db/migrations/meta/*.json                   │
│ Creates: Empty _journal.json (required by drizzle-kit)      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 3: Generate & Apply Migrations                        │
├─────────────────────────────────────────────────────────────┤
│ Runs: bunx drizzle-kit generate                             │
│ Runs: wrangler d1 migrations apply DB --local               │
│ Runs: wrangler d1 migrations apply DB --remote              │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 4: Seed Data                                          │
├─────────────────────────────────────────────────────────────┤
│ Runs: seed-rbac.sql (roles, permissions, mappings)          │
│ Runs: seed-admin.ts (first admin user)                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: Build                                              │
├─────────────────────────────────────────────────────────────┤
│ Runs: bun run build                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Files Involved

### Scripts

| File | Purpose |
|------|---------|
| `scripts/db-reset.ts` | Main reset orchestrator |
| `scripts/drop-tables.sql` | FK-safe table drop order |
| `scripts/seed-rbac.sql` | Seed roles & permissions |
| `scripts/seed-admin.ts` | Create first admin user |

### Schema Files

| File | Tables |
|------|--------|
| `worker/db/schema.ts` | category, item, order, order_line, role, permission, role_permission |
| `worker/db/auth-schema.ts` | user, session, account, verification |
| `worker/db/audit-schema.ts` | audit_log |

### Migration Output

| File | Purpose |
|------|---------|
| `worker/db/migrations/*.sql` | Generated SQL migrations |
| `worker/db/migrations/meta/_journal.json` | Migration tracking |
| `worker/db/migrations/meta/*_snapshot.json` | Schema snapshots |

---

## Table Drop Order (FK-Safe)

Tables must be dropped in reverse dependency order:

```sql
-- Level 3: Tables with FKs to Level 2
DROP TABLE IF EXISTS order_line;      -- FK: order_id, item_id
DROP TABLE IF EXISTS role_permission; -- FK: role_id, permission_id
DROP TABLE IF EXISTS session;         -- FK: user_id
DROP TABLE IF EXISTS account;         -- FK: user_id

-- Level 2: Tables with FKs to Level 1
DROP TABLE IF EXISTS item;            -- FK: category_id
DROP TABLE IF EXISTS user;            -- FK: role_id

-- Level 1: Base tables
DROP TABLE IF EXISTS "order";
DROP TABLE IF EXISTS category;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS permission;
DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS audit_log;

-- Drizzle internal
DROP TABLE IF EXISTS __drizzle_migrations;
```

---

## Adding New Tables

When adding a new feature with database tables:

### 1. Create Schema

```typescript
// worker/db/schema.ts (or new file)
export const report = sqliteTable("report", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    publicId: text("public_id").notNull().unique(),
    name: text("name").notNull(),
    userId: text("user_id").references(() => user.id),  // FK
    createdAt: integer("created_at").notNull(),
    // ...
});
```

### 2. Update drizzle.config.ts (if new file)

```typescript
export default defineConfig({
    schema: [
        "./worker/db/schema.ts",
        "./worker/db/auth-schema.ts",
        "./worker/db/audit-schema.ts",
        "./worker/db/report-schema.ts",  // Add new schema file
    ],
    // ...
});
```

### 3. Update drop-tables.sql

Add new table in correct FK order:

```sql
-- If report has FK to user, drop it in Level 2
DROP TABLE IF EXISTS report;  -- FK: user_id

-- ... existing drops ...
```

### 4. Update seed files (if needed)

```sql
-- scripts/seed-rbac.sql
INSERT OR IGNORE INTO permission (name, description) VALUES
  ('report:create', 'Create reports'),
  ('report:read', 'View reports');
```

### 5. Run reset

```bash
bun run db:reset --local-only
```

---

## Default Admin Credentials

After reset, default admin:

| Field | Value |
|-------|-------|
| Email | `admin@test.com` |
| Password | `6C0GbAKB347uSzwx` |

Override with environment variables:

```bash
ADMIN_EMAIL="custom@email.com" ADMIN_PASSWORD="custom-pass" bun run db:reset
```

---

## Troubleshooting

### "no such table" error

Migration wasn't applied. Check:
```bash
ls worker/db/migrations/
# Should have *.sql files
```

If empty, run:
```bash
bunx drizzle-kit generate
bun run db:migrate
```

### "FOREIGN KEY constraint failed"

Table drop order is wrong. Update `scripts/drop-tables.sql` to drop dependent tables first.

### "ENOENT: _journal.json"

Drizzle-kit needs `_journal.json`. The script creates it automatically, but if running manually:
```bash
echo '{"version":"7","dialect":"sqlite","entries":[]}' > worker/db/migrations/meta/_journal.json
```

### Remote database out of sync

Run full reset:
```bash
bun run db:reset  # includes remote
```

Or just migrate remote:
```bash
bun run db:migrate:prod
wrangler d1 execute DB --remote --file=scripts/seed-rbac.sql
```

---

## Related Commands

```bash
# Generate migration (without reset)
bun run db:generate

# Apply migration (local only)
bun run db:migrate

# Apply migration (remote only)
bun run db:migrate:prod

# Seed RBAC only
bun run db:seed-rbac

# Seed admin only
ADMIN_EMAIL="x" ADMIN_PASSWORD="y" bun run db:seed-admin

# Open Drizzle Studio
bun run db:studio
```

---

## Checklist for New Features

- [ ] Create schema in `worker/db/*.ts`
- [ ] Update `drizzle.config.ts` if new schema file
- [ ] Update `scripts/drop-tables.sql` with FK-safe order
- [ ] Add permissions to `shared/constant/permission.ts`
- [ ] Update `scripts/seed-rbac.sql` with new permissions
- [ ] Run `bun run db:reset --local-only` to test
- [ ] Test on remote with `bun run db:reset`
