---
type: reference
title: POS — checkout (cart → invoice)
tags: [pos, checkout, invoice, total, cart]
resource: src/pos.ts
timestamp: 2026-06-18T00:00:00Z
---

# Checkout

`checkout(items, n)` turns a list of `{ sku, qty }` into an `Invoice`:

1. each item is resolved to a `Product` via `findProduct` (see [catalog.md](catalog.md))
2. line value = `price * qty`
3. invoice `total` = sum of line values
4. invoice number = `INV-<n>`

```ts
interface Invoice { number: string; items: { product: Product; qty: number }[]; total: number; }
```

The `Invoice` shape is the **contract** every report reads — change it and you change the
reports.

## See also
- [catalog.md](catalog.md) — product lookup
- [../reports/sales-by-product.md](../reports/sales-by-product.md) — aggregates these invoices
- [../reports/sales-by-invoice.md](../reports/sales-by-invoice.md) — one row per invoice
