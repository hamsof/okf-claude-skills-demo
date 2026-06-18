---
type: reference
title: Authoring workflow
tags: [workflow, steps, create, new-skill, sub-skill, leaf]
timestamp: 2026-06-18T00:00:00Z
---

# Authoring workflow

Step-by-step flows. Schema is in [frontmatter-spec.md](frontmatter-spec.md); layout in
[structure.md](structure.md); links in [cross-linking.md](cross-linking.md). Every flow
ends at [checklist.md](checklist.md).

## A. New top-level skill

1. `mkdir skills/<slug>/`
2. Create `SKILL.md` with `index` frontmatter — `name`, keyword-rich `description`,
   `type: index`, `title`, `tags`, `timestamp`.
3. Write the index body: purpose + "when to apply" + an **Index** table.
4. Add the first leaf doc(s) — see flow C.
5. Cross-link to/from related existing skills (both-ways rule).
6. Run [checklist.md](checklist.md).

## B. New nested sub-skill

1. `mkdir <parent>/<child-slug>/` and add a `SKILL.md` (`type: index`).
2. Add the child to the **parent** index table with a relative link + tags.
3. Add leaf docs under the child (flow C).
4. Cross-link to siblings where dependencies exist.
5. Run [checklist.md](checklist.md).

## C. New leaf doc

1. Create `<concept>.md` with `reference` frontmatter — `type`, `title`, `tags`, optional
   `resource`, `timestamp`.
2. Write the content — one concept, self-documenting.
3. Add a row to that folder's `SKILL.md` index table.
4. If it depends on another folder, add `See also` links both ways.
5. Run [checklist.md](checklist.md).
