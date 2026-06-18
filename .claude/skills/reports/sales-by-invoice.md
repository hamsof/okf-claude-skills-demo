---
type: reference
title: Sale by Invoice
tags: [reports, sales-by-invoice, invoice, total]
resource: src/reports.ts
timestamp: 2026-06-18T00:00:00Z
---

# Sale by Invoice

`salesByInvoice(invoices)` is a near-passthrough — one row per invoice:

| Field | Meaning |
|-------|---------|
| `number` | invoice number (`INV-…`) |
| `items` | total units on the invoice |
| `total` | invoice total |

No cross-invoice aggregation; it just reshapes each `Invoice` for display.

## See also
- [../pos-flow/checkout.md](../pos-flow/checkout.md) — the `Invoice` source
- [sales-by-product.md](sales-by-product.md) — aggregated view of the same invoices
