import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import MarkdownIt from 'markdown-it';

// Renders the OKF skill bundle (.claude/skills/**.md) into a browsable static site (docs/).
// Source lives in .claude/skills so the bundles also work as Claude Code slash-command skills.
// GitHub Pages serves docs/ on the main branch.
const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, '.claude', 'skills');
const OUT = join(ROOT, 'docs');

const md = new MarkdownIt({ html: true, linkify: true });

const walk = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    if (name === '.git' || name === 'node_modules') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (name.endsWith('.md')) acc.push(p);
  }
  return acc;
};

const parseFrontmatter = (raw) => {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw };
  const end = raw.indexOf('\n---', 4);
  if (end === -1) return { data: {}, body: raw };
  const data = {};
  for (const line of raw.slice(4, end).split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (!m) continue;
    const [, k, v] = m;
    data[k] = v.startsWith('[') && v.endsWith(']')
      ? v.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean)
      : v.trim();
  }
  return { data, body: raw.slice(end + 4).replace(/^\s*\n/, '') };
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const rewriteLinks = (html) => html.replace(/href="([^"]+?)\.md(#[^"]*)?"/g, (_, p, frag) => `href="${p}.html${frag || ''}"`);

const CSS = `
:root{--bg:#0d1117;--fg:#c9d1d9;--mut:#8b949e;--acc:#58a6ff;--card:#161b22;--bd:#30363d;--idx:#d29922;--ref:#3fb950}
*{box-sizing:border-box}body{margin:0;font:15px/1.6 -apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--fg)}
a{color:var(--acc);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:860px;margin:0 auto;padding:24px}
.crumb{color:var(--mut);font-size:13px;margin-bottom:8px}
.badge{display:inline-block;font-size:11px;font-weight:600;padding:2px 8px;border-radius:10px;text-transform:uppercase;letter-spacing:.04em}
.badge.index{background:rgba(210,153,34,.15);color:var(--idx)}.badge.reference{background:rgba(63,185,80,.15);color:var(--ref)}
.chips{margin:10px 0 18px}.chip{display:inline-block;font-size:12px;background:var(--card);border:1px solid var(--bd);border-radius:12px;padding:2px 9px;margin:2px 4px 2px 0;color:var(--mut);cursor:pointer}
.chip:hover{color:var(--acc);border-color:var(--acc)}
hr{border:0;border-top:1px solid var(--bd);margin:20px 0}
table{border-collapse:collapse;width:100%;margin:14px 0}th,td{border:1px solid var(--bd);padding:6px 10px;text-align:left}th{background:var(--card)}
pre{background:var(--card);border:1px solid var(--bd);padding:12px;border-radius:6px;overflow:auto}code{background:var(--card);padding:1px 5px;border-radius:4px}pre code{background:none;padding:0}
h1,h2,h3{line-height:1.25}h1{font-size:26px}
.controls{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.controls input,.controls select{background:var(--card);border:1px solid var(--bd);color:var(--fg);padding:7px 10px;border-radius:6px}
.card{background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:14px;margin:10px 0}
.card h3{margin:0 0 4px}.card .meta{font-size:12px;color:var(--mut);margin-bottom:6px}
.tagcloud{margin:8px 0 4px}
`;

const page = (title, bodyHtml, rootRel) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head>
<body><div class="wrap"><div class="crumb"><a href="${rootRel}index.html">skills</a></div>
${bodyHtml}</div></body></html>`;

const docs = walk(SRC).map((file) => {
  const rel = relative(SRC, file);
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'));
  const depth = rel.split(sep).length - 1;
  return {
    outRel: rel.replace(/\.md$/, '.html'),
    rootRel: depth === 0 ? './' : '../'.repeat(depth),
    title: data.title || rel,
    type: data.type || 'reference',
    tags: data.tags || [],
    description: data.description || '',
    html: rewriteLinks(md.render(body)),
  };
}).sort((a, b) => a.outRel.localeCompare(b.outRel));

rmSync(OUT, { recursive: true, force: true });
for (const d of docs) {
  const chips = d.tags.map((t) => `<a class="chip" href="${d.rootRel}index.html?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('');
  const head = `<span class="badge ${d.type}">${esc(d.type)}</span>\n<h1>${esc(d.title)}</h1>\n<div class="chips">${chips}</div>`;
  const outPath = join(OUT, d.outRel);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, page(d.title, head + '<hr>' + d.html, d.rootRel));
}

const allTags = [...new Set(docs.flatMap((d) => d.tags))].sort();
const cards = docs.map((d) => `
<div class="card" data-type="${d.type}" data-tags="${esc(d.tags.join(' '))}" data-title="${esc(d.title.toLowerCase())}">
  <h3><a href="${d.outRel}">${esc(d.title)}</a></h3>
  <div class="meta"><span class="badge ${d.type}">${d.type}</span> &nbsp; ${esc(d.outRel)}</div>
  ${d.description ? `<div>${esc(d.description)}</div>` : ''}
  <div>${d.tags.map((t) => `<span class="chip">#${esc(t)}</span>`).join('')}</div>
</div>`).join('');
const cloud = allTags.map((t) => `<a class="chip" href="?tag=${encodeURIComponent(t)}">#${esc(t)}</a>`).join('');

writeFileSync(join(OUT, 'index.html'), `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>OKF skills site</title><style>${CSS}</style></head><body><div class="wrap">
<h1>Skills</h1>
<div class="meta">${docs.length} docs · ${allTags.length} tags · OKF bundle</div>
<div class="controls">
  <input id="q" placeholder="search title…">
  <select id="type"><option value="">all types</option><option value="index">index</option><option value="reference">reference</option></select>
  <button id="clear" class="chip">clear tag</button>
</div>
<div class="tagcloud">${cloud}</div>
<div id="list">${cards}</div>
</div><script>
const params=new URLSearchParams(location.search);let tag=params.get('tag')||'';
const q=document.getElementById('q'),tsel=document.getElementById('type');tsel.value=params.get('type')||'';
function apply(){const term=q.value.toLowerCase(),ty=tsel.value;
 document.querySelectorAll('.card').forEach(c=>{
  const okTag=!tag||c.dataset.tags.split(' ').includes(tag);
  const okTy=!ty||c.dataset.type===ty;
  const okQ=!term||c.dataset.title.includes(term);
  c.style.display=(okTag&&okTy&&okQ)?'':'none';});}
q.oninput=apply;tsel.onchange=apply;
document.getElementById('clear').onclick=()=>{tag='';history.replaceState({},'',location.pathname);apply();};
apply();
</script></body></html>`);

writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`Built ${docs.length} pages + index → ${OUT}`);
