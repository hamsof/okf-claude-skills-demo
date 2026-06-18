---
type: reference
title: OKF frontmatter spec
tags: [frontmatter, schema, type, tags, resource, timestamp, yaml]
timestamp: 2026-06-18T00:00:00Z
---

# OKF frontmatter spec

Every markdown file in a skill bundle starts with a YAML frontmatter block. This is the
OKF schema, narrowed to what a skills folder needs.

## Two file roles

| Role | `type` | What it is |
|------|--------|------------|
| Router | `index` | The `SKILL.md` of a skill or sub-skill. Lists + routes to children. |
| Leaf | `reference` | One concept / topic. The actual knowledge. |

No other `type` values.

## Fields

| Field | Required on | Purpose |
|-------|-------------|---------|
| `name` | `index` only | skill slug (kebab). |
| `description` | `index` only | what the skill is for — the text an agent matches intent against. |
| `type` | **all** | `index` or `reference`. |
| `title` | **all** | human-readable title. |
| `tags` | **all** | kebab-case keyword list — the search surface for routing. |
| `resource` | optional | repo path(s) or URL the doc maps to. |
| `timestamp` | **all** | ISO-8601, last meaningful update. |

## Index frontmatter (SKILL.md)

```yaml
---
name: pos-flow
description: Architecture reference for the sample POS checkout flow (OKF bundle).
type: index
title: POS flow
tags: [pos, checkout, catalog, invoice, cart]
timestamp: 2026-06-18T00:00:00Z
---
```

## Reference frontmatter (leaf .md)

```yaml
---
type: reference
title: POS — checkout (cart → invoice)
tags: [pos, checkout, invoice, total, cart]
resource: src/pos.ts
timestamp: 2026-06-18T00:00:00Z
---
```

## Tag rules

- kebab-case, lowercase, no spaces
- include domain + subject + any cross-domain hook
- tags are how the model finds the right child — be generous but precise
- an index's `tags` should be the union of its children's themes

## Why frontmatter on leaves too

An agent host only reads `SKILL.md` to register a skill; it ignores extra fields and never
parses leaf frontmatter. Leaf frontmatter exists for the **model** (routing by `tags`),
for the [checklist.md](checklist.md), and for tools like the HTML site builder. It is cheap
and enables the graph search that solves nested-skill discovery — see
[cross-linking.md](cross-linking.md).
