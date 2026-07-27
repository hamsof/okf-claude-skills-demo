# okf-skills-wiki

Turn a folder of **OKF-formatted Claude skills** into a browsable, cross-linked **wiki** —
tag search, mermaid diagrams, and an interactive **knowledge graph** built automatically
from the links between docs.

The "product" bundled here is a deliberately tiny POS (point-of-sale) with two reports —
just enough real code to document. The interesting part is the
[`.claude/skills/`](.claude/skills/) knowledge bundle and the
[`tools/build-html.mjs`](tools/build-html.mjs) renderer that turns it into a site.

## What's inside

| Path | What |
|------|------|
| `.claude/skills/` | OKF knowledge bundle — also loadable as Claude Code slash-command skills |
| `.claude/skills/skill-authoring/` | the reusable **how to author OKF skills** guide (open-sourced) |
| `tools/build-html.mjs` | renders `.claude/skills/**.md` → a browsable static site in `docs/` |
| `.claude/hooks/rebuild-site.sh` | PostToolUse hook that rebuilds the site when a skill is edited |
| `.claude/settings.json` | wires the rebuild hook |
| `src/pos.ts`, `src/reports.ts` | the toy POS + reports the sample skills document |

## Run

```bash
npm install
npm start            # run the sample POS
npm run build:site   # build the HTML wiki into docs/
```

Open `docs/index.html` in a browser.

## Use it on your own skills

The renderer is self-contained — point it at any OKF skill folder:

1. Copy `tools/build-html.mjs` into your repo (only dep is `markdown-it`).
2. Put your OKF bundle under `.claude/skills/` (or edit `SRC` at the top of the script).
3. `node tools/build-html.mjs` → a static wiki in `docs/`, publishable via GitHub Pages.

Every `.md` needs OKF frontmatter (`type`, `title`, `tags`); see
[`.claude/skills/skill-authoring/`](.claude/skills/skill-authoring/) for the full convention.

## Features

- **Tag + type filtering** — search titles, filter by `#tag` or `index`/`reference`.
- **Mermaid diagrams** — ` ```mermaid ` fences render natively (same as GitHub).
- **Knowledge graph** — a D3 force-directed graph on the index, built from the `.md` links
  between docs. Drag to explore, scroll to zoom, hover to focus a node's neighbours, click a
  node to open it. Node colour = `index` (gold) / `reference` (green); size = link count.
- **Auto-rebuild on edit** — `.claude/settings.json` registers a `PostToolUse` hook
  (`.claude/hooks/rebuild-site.sh`) that re-runs the build whenever a file under
  `.claude/skills/` is written, so `docs/` never drifts. Run manually with
  `bash .claude/hooks/rebuild-site.sh --full`.

## Skills as slash commands

The bundles live under `.claude/skills/`, so opening this repo in Claude Code exposes them
as skills (`/pos-flow`, `/reports`, `/skill-authoring`). The same markdown is both the
agent's knowledge and the source for the wiki.

---

This repo accompanies the article **[Reducing LLM token consumption by organising skills with Google's OKF](https://medium.com/@hafizabdulman/reducing-llm-token-consumption-by-organising-skills-with-googles-okf-ee7089701d16)**.
