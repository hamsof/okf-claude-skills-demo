---
name: skill-authoring
description: How to author a new skill using OKF (Open Knowledge Format) plus an index-router convention. Read this BEFORE creating or restructuring any skill, sub-skill, or knowledge doc.
type: index
title: Skill Authoring (OKF)
tags: [skill, authoring, okf, frontmatter, index, cross-linking, convention, meta]
timestamp: 2026-06-18T00:00:00Z
---

# Skill Authoring (OKF)

Single source of truth for adding knowledge to a skills folder. Every skill is an
**OKF bundle**: a directory of markdown files, each with YAML frontmatter, cross-linked
into a knowledge graph. An `index` doc (the `SKILL.md`) routes to `reference` leaf docs.

## When to apply

Read this whenever you create a new skill, add a nested sub-skill or leaf `.md`,
restructure a doc, or review a skill change for format compliance.

## Mental model

```
SKILL.md (type: index)  ──links──►  leaf.md (type: reference)
   router + tags                       one concept, tagged
       │                                      │
       └────────── cross-links across folders (the graph) ──────────┘
```

Two file roles only — `index` and `reference`. Discovery works by the model reading an
index, matching the user's intent against child `tags`, and following markdown links —
including links into *other* skill folders. The graph carries nested knowledge so you
never have to name a deeply-nested skill by hand.

## Index

| Topic | Doc | Tags |
|-------|-----|------|
| The OKF frontmatter schema (fields, types, allowed values) | [frontmatter-spec.md](frontmatter-spec.md) | frontmatter, schema, type, tags |
| Folder & file layout, nesting | [structure.md](structure.md) | structure, layout, nesting, index |
| Linking within and across folders | [cross-linking.md](cross-linking.md) | links, graph, see-also, nested |
| Step-by-step authoring flows | [authoring-workflow.md](authoring-workflow.md) | workflow, steps, create |
| When & how to add mermaid diagrams | [diagrams.md](diagrams.md) | diagrams, mermaid, visual |
| Pre-commit checklist | [checklist.md](checklist.md) | checklist, gate, review |

## Non-negotiables

1. Every `.md` (index **and** leaf) carries YAML frontmatter — see [frontmatter-spec.md](frontmatter-spec.md).
2. Only two `type` values: `index`, `reference`.
3. If knowledge in folder A is needed while reading folder B, link both ways — see [cross-linking.md](cross-linking.md).
4. Any doc describing a flow, sequence, or lifecycle carries a mermaid diagram — see [diagrams.md](diagrams.md).
5. Run the [checklist.md](checklist.md) before committing.
