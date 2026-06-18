---
type: reference
title: Cross-linking & the knowledge graph
tags: [links, graph, see-also, nested, cross-folder, discovery]
timestamp: 2026-06-18T00:00:00Z
---

# Cross-linking & the knowledge graph

This is the part that solves nested-skill discovery. OKF docs link to each other via
markdown links, forming a graph. The model follows links — including links into *other*
skill folders — so deeply-nested knowledge reaches it without you naming the nested skill.

## Link styles

| Scope | Form | Example |
|-------|------|---------|
| Within a folder | relative file | `[checkout.md](checkout.md)` |
| Into a child folder | relative path down | `[setup](server/setup.md)` |
| Into a sibling skill | relative path up+over | `[Sale by Product](../reports/sales-by-product.md)` |

Always use **relative paths** so links survive being moved, mirrored, or rendered to HTML.

## The both-ways rule

> If knowledge in folder A is needed while reading folder B, link both ways.

Example: the reports depend on the checkout invoice shape. So
`reports/sales-by-product.md` links to `../pos-flow/checkout.md`, and
`pos-flow/checkout.md` links back to the reports. Arriving from either side, the model can
pull the other.

## `See also` block

End a leaf with an explicit block when it has cross-domain dependencies:

```markdown
## See also
- [../pos-flow/checkout.md](../pos-flow/checkout.md) — where the Invoice shape is built
```

## What this does NOT change

It does not change an agent host's autocomplete. Discovery moves into the model: it reads
an index, matches `tags`, and walks links across folders. The graph is the search index;
the model is the search engine. A static site builder can walk the same links to produce a
browsable HTML version of the graph.
