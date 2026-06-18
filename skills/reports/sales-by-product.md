---
type: reference
title: Sale by Product
tags: [reports, sales-by-product, revenue, aggregation, sku]
resource: src/reports.ts
timestamp: 2026-06-18T00:00:00Z
---

# Sale by Product

`salesByProduct(invoices)` rolls every invoice line up by SKU into one row per product:

| Field | Meaning |
|-------|---------|
| `name` | product name |
| `qty` | total units sold across all invoices |
| `revenue` | `price * qty` summed |

Rows are returned sorted by `revenue` descending. The aggregation walks
`invoice.items` — so it depends entirely on the invoice shape from checkout.

## See also
- [../pos-flow/checkout.md](../pos-flow/checkout.md) — where `Invoice` (and its `items`) is built
- [sales-by-invoice.md](sales-by-invoice.md) — the other report over the same data
