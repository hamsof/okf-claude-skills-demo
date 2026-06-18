---
type: reference
title: Skill structure & layout
tags: [structure, layout, nesting, index, folder, file]
timestamp: 2026-06-18T00:00:00Z
---

# Skill structure & layout

Rules for how a skill bundle is laid out on disk. Frontmatter is in
[frontmatter-spec.md](frontmatter-spec.md).

## Core rules

- **One concept per file.** If a leaf grows past a screen of distinct topics, split it and
  add the new files to the index table.
- **One index per folder.** A folder that is an invocable skill has a `SKILL.md`
  (`type: index`). Its body is a table of children with a **Tags** column.
- **Nesting is allowed.** Each nested skill folder gets its own `SKILL.md`.
- **Reference leaves are flat files**, not folders.

## Shape

```
skills/
├── pos-flow/
│   ├── SKILL.md        # type: index — router
│   ├── catalog.md      # type: reference
│   └── checkout.md     # type: reference
└── reports/
    ├── SKILL.md        # type: index
    ├── sales-by-product.md
    └── sales-by-invoice.md
```

## Index body convention

After the frontmatter, a `SKILL.md` has:

1. A one-line purpose + "when to apply".
2. An **Index** table: `| Topic | Doc | Tags |` — every child linked, with key tags so the
   model can route without opening each file.
3. Optional cross-skill pointers.

Keep the index lean — it is read on every invocation. Detail lives in the leaves.

## Naming

- folders and files: kebab-case
- file name describes the concept
- the skill slug (`name`) matches the folder name
