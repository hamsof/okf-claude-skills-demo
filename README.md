# okf-claude-skills-demo

A tiny sample project that demonstrates **OKF-formatted Claude skills** and a **static HTML site** generated from them.

The "product" here is a deliberately tiny POS (point-of-sale) with two reports — just enough real code to document. The interesting part is the [`.claude/skills/`](.claude/skills/) folder and the [`tools/build-html.mjs`](tools/build-html.mjs) renderer.

## What's inside

| Path | What |
|------|------|
| `src/pos.ts` | toy POS: catalog, `checkout()` |
| `src/reports.ts` | `salesByProduct()`, `salesByInvoice()` |
| `.claude/skills/` | OKF knowledge bundle — also loadable as Claude Code slash-command skills |
| `tools/build-html.mjs` | renders `.claude/skills/**.md` → a browsable static site in `docs/` |
| `.claude/hooks/rebuild-site.sh` | PostToolUse hook that rebuilds the site when a skill is edited |
| `.claude/settings.json` | wires the rebuild hook |

## Run

```bash
npm install
npm start            # run the sample POS
npm run build:site   # build the HTML site into docs/
```

## Skills as slash commands

The bundles live under `.claude/skills/`, so opening this repo in Claude Code exposes them
as skills (`/pos-flow`, `/reports`, `/skill-authoring`). The same markdown is both the
agent's knowledge and the source for the website.

## The skills site

The generated site lives in `docs/` and is published via GitHub Pages. It turns the markdown
knowledge bundle into a tag-filterable, cross-linked website — the same files Claude reads
as skills.

### Auto-rebuild on edit

`.claude/settings.json` registers a `PostToolUse` hook (`.claude/hooks/rebuild-site.sh`)
that re-runs the build whenever a file under `.claude/skills/` is written — so `docs/` never
drifts from the skills. Both the hook and its settings are committed, so anyone who clones
the repo gets the same behavior. Run it manually any time with `bash .claude/hooks/rebuild-site.sh --full`.

This repo accompanies the article **[Reducing LLM token consumption by organising skills with Google's OKF](https://medium.com/@hafizabdulman/reducing-llm-token-consumption-by-organising-skills-with-googles-okf-ee7089701d16)**.
