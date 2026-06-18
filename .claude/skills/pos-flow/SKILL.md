---
name: pos-flow
description: Architecture reference for the sample POS checkout flow (OKF bundle). Read before changing the catalog or checkout logic.
type: index
title: POS flow
tags: [pos, checkout, catalog, invoice, cart]
timestamp: 2026-06-18T00:00:00Z
---

# POS flow

How a sale becomes an invoice in this sample POS. All code in `src/pos.ts`.

## When to apply

Read before touching the product catalog, pricing, or the `checkout()` function — or
when a report's numbers look wrong and you need to know how invoices are shaped.

## Index

| Topic | Doc | Tags |
|-------|-----|------|
| Product catalog & lookup | [catalog.md](catalog.md) | catalog, product, sku |
| Checkout — cart → invoice | [checkout.md](checkout.md) | checkout, invoice, total |
