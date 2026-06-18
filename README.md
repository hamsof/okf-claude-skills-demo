# okf-claude-skills-demo

A tiny sample project that demonstrates **OKF-formatted Claude skills** and a **static HTML site** generated from them.

The "product" here is a deliberately tiny POS (point-of-sale) with two reports — just enough real code to document. The interesting part is the [`skills/`](skills/) folder and the [`tools/build-html.mjs`](tools/build-html.mjs) renderer.

## What's inside

| Path | What |
|------|------|
| `src/pos.ts` | toy POS: catalog, `checkout()` |
| `src/reports.ts` | `salesByProduct()`, `salesByInvoice()` |
| `skills/` | OKF knowledge bundle (index + reference docs, tagged + cross-linked) |
| `tools/build-html.mjs` | renders `skills/**.md` → a browsable static site in `docs/` |

## Run

```bash
npm install
npm start            # run the sample POS
npm run build:site   # build the HTML site into docs/
```

## The skills site

The generated site lives in `docs/` and is published via GitHub Pages. It turns the markdown knowledge bundle into a tag-filterable, cross-linked website — the same files Claude reads as skills.

This repo accompanies an article on cutting Claude token usage by extending Google's Open Knowledge Format. See [`ARTICLE.md`](ARTICLE.md).
