# Number Format System Design

## Overview

A generic Number Format system that generates sequential, human-readable identifiers for any entity type. Each entity type (order, invoice, etc.) has its own configurable format pattern and sequence counter that resets monthly.

## Requirements

- Flexible format patterns with literal text and placeholders
- Date placeholders: `[YYYY]`, `[YY]`, `[MM]`, `[DD]`
- Sequence placeholders: `[2DIGIT]` through `[8DIGIT]`
- Exactly one sequence placeholder required per format
- Monthly counter reset based on date placeholders in pattern
- Overflow allowed (e.g., `[4DIGIT]` can produce `10000` after `9999`)
- Live preview in settings UI
- Generic design, implement Order first

## Data Model

### Storage: appSetting table

No new tables. Use existing `appSetting` for both format patterns and sequence counters.

**Key naming convention:**

| Purpose | Key Pattern | Example Value |
|---------|-------------|---------------|
| Format | `number_format:{entity}` | `[MM][4DIGIT][YY][DD]` |
| Sequence | `number_sequence:{entity}:{period}` | `42` |

**Examples:**

```
number_format:order           → [MM][4DIGIT][YY][DD]
number_format:invoice         → [MM][4DIGIT][YY][DD]
number_sequence:order:2501    → 87
number_sequence:order:2502    → 3
number_sequence:invoice:2501  → 156
```

### Schema Change: Order table

```sql
ALTER TABLE "order" ADD COLUMN order_number TEXT UNIQUE;
CREATE INDEX order_number_idx ON "order"(order_number);
```

- `publicId`: Random nanoid for URLs/security (unchanged)
- `orderNumber`: Human-readable formatted number for display

## Number Generation Logic

### Process

1. Get format pattern from `appSetting` key `number_format:{entity}`
2. Parse placeholders to find date parts and digit placeholder
3. Build period key from date placeholders (e.g., `[YY][MM]` → `2501`)
4. Atomic increment sequence for `number_sequence:{entity}:{period}`
5. Replace all placeholders with actual values
6. Return final string

### Atomic Increment (prevents race conditions)

```typescript
async function getNextSequence(db: DB, sequenceKey: string): Promise<number> {
  const updated = await db
    .update(appSetting)
    .set({
      value: sql`CAST(value AS INTEGER) + 1`,
      updatedAt: Date.now()
    })
    .where(eq(appSetting.key, sequenceKey))
    .returning({ value: appSetting.value });

  if (updated.length === 0) {
    // First of this period, insert new row
    await db.insert(appSetting).values({
      key: sequenceKey,
      value: "1",
      updatedAt: Date.now()
    });
    return 1;
  }
  return parseInt(updated[0].value);
}
```

### Placeholder Replacement

| Placeholder | Description | Example |
|-------------|-------------|---------|
| `[YYYY]` | 4-digit year | `2025` |
| `[YY]` | 2-digit year | `25` |
| `[MM]` | 2-digit month (zero-padded) | `01` |
| `[DD]` | 2-digit day (zero-padded) | `17` |
| `[2DIGIT]`-`[8DIGIT]` | Sequence (min padding, grows on overflow) | `0042`, `10000` |

### Example Generation

Format: `[MM][4DIGIT][YY][DD]`
Date: January 17, 2025
Sequence: 42
Result: `0100422517`

## API Endpoints

### Get Format

```
GET /api/setting/number-format/:entityType

Response:
{ "pattern": "[MM][4DIGIT][YY][DD]" }
```

### Save Format

```
POST /api/setting/number-format/:entityType
Body: { "pattern": "[MM][4DIGIT][YY][DD]" }

Response (success):
{ "success": true }

Response (validation error):
{ "error": "Format must contain one sequence placeholder" }
```

### Preview

```
GET /api/setting/number-format/:entityType/preview?pattern=[MM][4DIGIT][YY][DD]

Response:
{ "preview": "0100422517" }
```

## Validation Rules

1. **Required**: Must contain exactly one `[nDIGIT]` where n = 2-8
2. **Optional**: Date placeholders can repeat (e.g., `[DD][YYYY][DD]` is valid)
3. **Literal**: Any other text is kept as-is

**Error messages:**
- No digit placeholder: "Format must contain one sequence placeholder like [4DIGIT]"
- Multiple digit placeholders: "Format can only contain one sequence placeholder"
- Invalid placeholder: "Unknown placeholder [XYZ]"

## Settings UI

Location: Settings → Number Format

**Components:**
- Text input for format pattern
- Live preview below input
- Clickable placeholder chips for easy insertion
- Save button with validation

**Placeholder chips:**
```
[YYYY] [YY] [MM] [DD] [2DIGIT] [3DIGIT] [4DIGIT] [5DIGIT] [6DIGIT] [7DIGIT] [8DIGIT]
```

## Integration

### Order Creation

```typescript
// worker/route/order.ts - POST /api/order

const orderNumber = await generateOrderNumber(db, "order");

await db.insert(order).values({
  publicId: generatePublicId(),
  orderNumber: orderNumber,
  status: "draft",
  // ...
});
```

### Order Search

```typescript
// Extend existing search to include orderNumber
whereClause = and(whereClause, or(
  like(order.publicId, `%${search}%`),
  like(order.orderNumber, `%${search}%`)
));
```

### Order Response

```typescript
{
  publicId: "ByyGlENVS",
  orderNumber: "0100422517",
  status: "draft",
  // ...
}
```

## File Structure

```
worker/lib/
  number-format.ts         # generateOrderNumber(), parsePattern(), validatePattern()

src/page/setting/
  NumberFormatSetting.tsx  # Reusable settings component

worker/route/
  setting.ts               # number-format endpoints (add to existing)
```

## Default Formats

Seeded automatically on first access if not configured:

| Entity | Default Pattern |
|--------|-----------------|
| order | `[MM][4DIGIT][YY][DD]` |
| invoice | `[MM][4DIGIT][YY][DD]` |
| quote | `[MM][4DIGIT][YY][DD]` |

## Future Extensibility

Adding a new entity requires:

1. Add column: `ALTER TABLE "entity" ADD COLUMN entity_number TEXT UNIQUE;`
2. Add UI section: `<NumberFormatSetting entityType="entity" label="Entity Number Format" />`
3. Call on creation: `await generateOrderNumber(db, "entity")`

No new tables or schema changes needed.
