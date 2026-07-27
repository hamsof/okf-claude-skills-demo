---
type: reference
title: POS — product catalog
tags: [pos, catalog, product, sku, pricing]
resource: src/pos.ts
timestamp: 2026-06-18T00:00:00Z
---

# Product catalog

The catalog is a hard-coded array of `Product` in `src/pos.ts` (a real system would load
this from a database).

```ts
interface Product { sku: string; name: string; price: number; }
```

`findProduct(sku)` looks a product up by SKU and **throws** on an unknown SKU — checkout
relies on that to reject bad cart lines early.

```mermaid
flowchart TD
    A["findProduct(sku)"] --> B{"sku in catalog?"}
    B -->|yes| C["return Product"]
    B -->|no| D["throw — checkout rejects the cart line"]
```

## See also
- [checkout.md](checkout.md) — consumes `findProduct` to build invoice lines
