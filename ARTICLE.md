# Cut Your Claude Code Bill: Organize Skills with Google's OKF

*Turn scattered architecture notes into OKF skills Claude loads on demand — and get a browsable docs site for free.*

---

Every time you open a fresh Claude session on a real codebase, the same thing happens: you re-explain your project. Claude greps around, opens a dozen files to rebuild context it had yesterday, and you pay for every one of those tokens. On a large repo that warm-up tax is real — and it repeats all day.

I wanted Claude to *already know* how our systems work, and to read **only** the one note relevant to the task. The pattern that got me there was Google's **Open Knowledge Format (OKF)**.

> 📸 **Screenshot placeholder #1** — the generated skills site landing page (tag cloud + cards). _Replace with your capture of the Pages site below._

## What OKF actually is

When I first heard "knowledge format" I braced for a heavy schema. It's the opposite. [Google's OKF](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) is just:

- **a directory of markdown files**
- each with a little **YAML frontmatter** (one required field: `type`)
- **cross-linked** to each other with normal markdown links

That's it. No platform, no database — "just files." Which means it renders on GitHub as-is, an LLM can read it directly, and you can host it anywhere.

The realization that made this click: **a folder of markdown notes already *is* an OKF bundle.** Adopting OKF wasn't a rewrite — it was adding two frontmatter fields and a few links.

## The idea: skills as OKF bundles

Claude (and Claude Code) can load **skills** — folders of markdown the model reads on demand. The trick is structuring each skill as an OKF bundle so the model loads *little*:

- an **index** file describes the skill and routes to children
- **reference** files each hold one concept
- **tags** tell the model which child matches the task
- **cross-links** let it walk to related knowledge in other folders

Instead of "grep the repo and read 12 files," the flow becomes "read one tiny index, follow one tag, read one reference." That's the token saving — you pay for a small index plus a single doc, not a repo-wide search every session.

## Anatomy: indexes, references, tags

Two file roles. That's all you need.

**An index** (`SKILL.md`) — the front door. It says what the skill is and lists its children with tags:

```yaml
---
name: pos-flow
description: Architecture reference for the POS checkout flow.
type: index
title: POS flow
tags: [pos, checkout, catalog, invoice, cart]
timestamp: 2026-06-18T00:00:00Z
---
```

```markdown
| Topic | Doc | Tags |
|-------|-----|------|
| Product catalog & lookup | catalog.md | catalog, product, sku |
| Checkout — cart → invoice | checkout.md | checkout, invoice, total |
```

**A reference** — one concept, tagged, optionally pointing at the real source file:

```yaml
---
type: reference
title: POS — checkout (cart → invoice)
tags: [pos, checkout, invoice, total]
resource: src/pos.ts
timestamp: 2026-06-18T00:00:00Z
---
```

The `tags` are the search surface. When you ask Claude about "the checkout total," it matches that against tags and opens exactly one file.

## Cross-links: the part that fixes deep nesting

My real problem wasn't format — it was **discovery**. When I'm deep in one skill and need a fact that lives in another folder, autocomplete doesn't help me find it.

OKF's cross-links solve this at the content layer. The reports depend on the checkout invoice shape, so I link them **both ways**:

```markdown
<!-- in reports/sales-by-product.md -->
## See also
- [../pos-flow/checkout.md](../pos-flow/checkout.md) — where the Invoice shape is built
```

Now Claude doesn't need me to name a nested skill. It reads an index, matches a tag, and *walks the links* across folders. The graph is the search index; the model is the search engine.

> 📸 **Screenshot placeholder #2** — a reference page showing the tag chips and a "See also" cross-link. _Replace with your capture._

## How I designed a "skill-authoring" skill

Conventions rot unless they live somewhere. So the most useful skill I wrote is the one that documents **how to write skills** — and it follows its own rules (it's an OKF bundle about OKF bundles).

It's small and opinionated:

- `frontmatter-spec.md` — the exact fields, and that there are only **two** types: `index` and `reference`
- `structure.md` — one concept per file, one index per folder, kebab-case names
- `cross-linking.md` — the both-ways rule
- `authoring-workflow.md` — step-by-step for a new skill / nested skill / new leaf
- `checklist.md` — a pre-commit gate (every file has frontmatter, tags, resolving links)

The payoff: next time I add knowledge, I (or Claude) read one skill and produce something consistent — no bikeshedding the format.

## Free bonus: a browsable HTML site

Because OKF is "just files with frontmatter," rendering it to a website is a tiny script — no static-site framework. Mine is ~120 lines of Node with a single dependency (`markdown-it`). It:

1. walks `skills/**.md`
2. parses the frontmatter (type, title, tags)
3. renders the markdown body to HTML
4. **rewrites `.md` links to `.html`** so the cross-link graph stays clickable
5. emits a landing page that's **filterable by tag and type**

```bash
node tools/build-html.mjs   # .claude/skills/ → docs/
```

The same files Claude reads as skills become a docs site my teammates can browse. One source of truth, two consumers.

### Make them real slash commands

I keep the bundles in `.claude/skills/`, not a plain `skills/` folder. That one detail means Claude Code loads them as **invocable skills** — `/pos-flow`, `/reports`, `/skill-authoring` — in any session opened on the repo. The markdown *is* the skill; no extra registration.

### Never let the site drift

The risk with two consumers is that the HTML falls behind the markdown. I close that gap with a committed `PostToolUse` hook — the same trick I use elsewhere. `.claude/settings.json` runs a small script whenever a skill file is edited:

```bash
# .claude/hooks/rebuild-site.sh (abridged)
fp="$(… read file_path from the hook's stdin JSON …)"
case "$fp" in "$SRC"/*) ;; *) exit 0 ;; esac   # only on skill edits
node "$ROOT/tools/build-html.mjs"
```

Because both the hook and `.claude/settings.json` are checked into the repo, anyone who clones it gets auto-rebuilds for free.

**You never touch `docs/` by hand.** It's generated output, not a source of truth. You edit a skill under `.claude/skills/`, and the hook regenerates the matching HTML in `docs/` automatically — the website always reflects the latest skills without a manual build step.

> 📸 **Screenshot placeholder #3** — the landing page with a tag filter applied (e.g. clicking `#checkout`). _Replace with your capture._

## See it live

Everything in this article is a real, public sample repo:

- **Repo:** https://github.com/hamsof/okf-claude-skills-demo
- **Rendered skills site:** https://hamsof.github.io/okf-claude-skills-demo/

It's a deliberately tiny POS (a catalog, a `checkout()`, two reports) — just enough real code to document. The interesting parts are `.claude/skills/`, `tools/build-html.mjs`, and the auto-rebuild hook in `.claude/hooks/`.

## Takeaways

- **OKF is markdown + frontmatter + links.** You probably already have 80% of it.
- **Structure for *small reads*:** index → tag → one reference beats grepping the repo every session. That's where the tokens go.
- **Cross-link both ways** so the model finds nested knowledge without you naming it.
- **Write the meta-skill** that defines your format, then let it keep you consistent.
- **You get a docs site for free** because the knowledge was plain files all along.

If your team keeps re-explaining the same systems to Claude, try turning those explanations into an OKF bundle. The format is almost nothing — and that's the point.
