import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, dirname, relative, sep } from 'node:path';
import MarkdownIt from 'markdown-it';

// Renders the OKF skill bundle (.claude/skills/**.md) into a browsable static site (docs/).
// Source lives in .claude/skills so the bundles also work as Claude Code slash-command skills.
// GitHub Pages serves docs/ on the main branch.
// Features: OKF frontmatter, tag filtering, ```mermaid``` diagrams, and a D3 knowledge graph
// on the index built from the .md links between docs.
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

// render ```mermaid fences as <pre class="mermaid"> so the site draws the diagram
const defaultFence = md.renderer.rules.fence.bind(md.renderer.rules);
md.renderer.rules.fence = (tokens, idx, options, env, self) => {
  if (tokens[idx].info.trim() === 'mermaid') {
    return `<pre class="mermaid">${esc(tokens[idx].content)}</pre>`;
  }
  return defaultFence(tokens, idx, options, env, self);
};

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
pre.mermaid{background:#fff;text-align:center;line-height:normal}
h1,h2,h3{line-height:1.25}h1{font-size:26px}
.controls{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.controls input,.controls select{background:var(--card);border:1px solid var(--bd);color:var(--fg);padding:7px 10px;border-radius:6px}
.card{background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:14px;margin:10px 0}
.card h3{margin:0 0 4px}.card .meta{font-size:12px;color:var(--mut);margin-bottom:6px}
.tagcloud{margin:8px 0 4px}
.graphwrap{margin:18px 0}.graphwrap .meta{font-size:12px;color:var(--mut)}
.graphwrap .bar{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:6px}
#graph-expand{cursor:pointer;white-space:nowrap}
#graph{position:relative;width:100%;height:480px;border:1px solid var(--bd);border-radius:12px;overflow:hidden;
  background:radial-gradient(120% 120% at 50% 35%,#131c2b 0%,#0d1117 70%)}
#graph.full{position:fixed;inset:0;width:100vw;height:100vh;border-radius:0;z-index:1000}
#graph svg{width:100%;height:100%;cursor:grab;display:block}
#graph svg:active{cursor:grabbing}
#graph .hint{position:absolute;top:10px;right:12px;font-size:11px;color:var(--mut);pointer-events:none;opacity:.7}
.gnode circle{stroke:#0d1117;stroke-width:1.5px;cursor:pointer;transition:opacity .2s}
.gnode circle:hover{stroke:#fff}
.gnode text{fill:var(--mut);font-size:10px;pointer-events:none;opacity:0;transition:opacity .2s,fill .2s}
.gnode.show text{opacity:1}
#graph.full .gnode text{opacity:.85}
.glink{stroke:#30363d;stroke-opacity:.55;transition:stroke .2s,stroke-opacity .2s}
.dim{opacity:.08}
`;

const MERMAID = `<script type="module">import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';mermaid.initialize({startOnLoad:true,theme:'default'});</script>`;

const page = (title, bodyHtml, rootRel) => `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><style>${CSS}</style></head>
<body><div class="wrap"><div class="crumb"><a href="${rootRel}index.html">skills</a></div>
${bodyHtml}</div>${MERMAID}</body></html>`;

const docs = walk(SRC).map((file) => {
  const rel = relative(SRC, file);
  const { data, body } = parseFrontmatter(readFileSync(file, 'utf8'));
  const depth = rel.split(sep).length - 1;
  const linkTargets = [...body.matchAll(/\]\(([^)\s]+?\.md)(?:#[^)]*)?\)/g)].map((m) => m[1]);
  return {
    outRel: rel.replace(/\.md$/, '.html'),
    dir: dirname(rel),
    rootRel: depth === 0 ? './' : '../'.repeat(depth),
    title: data.title || rel,
    type: data.type || 'reference',
    tags: data.tags || [],
    description: data.description || '',
    linkTargets,
    html: rewriteLinks(md.render(body)),
  };
}).sort((a, b) => a.outRel.localeCompare(b.outRel));

// build the connection graph from inter-doc .md links
const keySet = new Set(docs.map((d) => d.outRel));
const edgeSet = new Set();
const edges = [];
for (const d of docs) {
  for (const t of d.linkTargets) {
    const target = join(d.dir, t).replace(/\.md$/, '.html');
    if (target === d.outRel || !keySet.has(target)) continue;
    const key = `${d.outRel}||${target}`;
    if (edgeSet.has(key)) continue;
    edgeSet.add(key);
    edges.push({ source: d.outRel, target });
  }
}
const degree = Object.fromEntries(docs.map((d) => [d.outRel, 0]));
for (const e of edges) { degree[e.source]++; degree[e.target]++; }
const graphData = {
  nodes: docs.map((d) => ({ id: d.outRel, title: d.title, type: d.type, deg: degree[d.outRel] })),
  links: edges,
};

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
<title>OKF skills wiki</title><style>${CSS}</style></head><body><div class="wrap">
<h1>Skills</h1>
<div class="meta">${docs.length} docs · ${allTags.length} tags · OKF bundle</div>
<div class="controls">
  <input id="q" placeholder="search title…">
  <select id="type"><option value="">all types</option><option value="index">index</option><option value="reference">reference</option></select>
  <button id="clear" class="chip">clear tag</button>
</div>
<div class="graphwrap">
  <div class="bar">
    <div class="meta">knowledge graph · ${edges.length} links · drag to explore, scroll to zoom, click a node to open</div>
    <button id="graph-expand" class="chip">⤢ expand</button>
  </div>
  <div id="graph"><div class="hint">hover to focus · click to open</div></div>
</div>
<div class="tagcloud">${cloud}</div>
<div id="list">${cards}</div>
</div>
<script type="module">
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
const data=${JSON.stringify(graphData)};
const el=document.getElementById('graph');
const color={index:'#d29922',reference:'#3fb950'};
const short=(s)=>s.length>34?s.slice(0,33)+'…':s;
const svg=d3.select('#graph').append('svg');
const root=svg.append('g');
svg.call(d3.zoom().scaleExtent([0.2,4]).on('zoom',(e)=>root.attr('transform',e.transform)));
const neighbors=new Map(data.nodes.map(n=>[n.id,new Set([n.id])]));
data.links.forEach(l=>{neighbors.get(l.source).add(l.target);neighbors.get(l.target).add(l.source);});
const sim=d3.forceSimulation(data.nodes)
  .force('link',d3.forceLink(data.links).id(d=>d.id).distance(90).strength(.3))
  .force('charge',d3.forceManyBody().strength(-320))
  .force('center',d3.forceCenter(0,0))
  .force('collide',d3.forceCollide(d=>16+d.deg*1.6));
const link=root.append('g').selectAll('line').data(data.links).join('line').attr('class','glink');
const node=root.append('g').selectAll('g').data(data.nodes).join('g').attr('class','gnode')
  .call(d3.drag()
    .on('start',(e,d)=>{if(!e.active)sim.alphaTarget(.3).restart();d.fx=d.x;d.fy=d.y;})
    .on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y;})
    .on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));
node.append('circle').attr('r',d=>5+d.deg*1.6).attr('fill',d=>color[d.type]||'#58a6ff')
  .on('click',(e,d)=>{location.href=d.id;});
node.append('text').attr('x',d=>7+d.deg*1.6).attr('y',3).text(d=>short(d.title));
node.append('title').text(d=>d.title);
node.on('mouseenter',(e,d)=>{
  const nb=neighbors.get(d.id);
  node.classed('dim',n=>!nb.has(n.id)).classed('show',n=>nb.has(n.id));
  link.classed('dim',l=>l.source.id!==d.id&&l.target.id!==d.id)
      .attr('stroke',l=>(l.source.id===d.id||l.target.id===d.id)?'#58a6ff':null);
}).on('mouseleave',()=>{node.classed('dim',false).classed('show',false);link.classed('dim',false).attr('stroke',null);});
sim.on('tick',()=>{
  link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
  node.attr('transform',d=>\`translate(\${d.x},\${d.y})\`);
});
// keep the viewBox centred on the layout origin at the container's current size
function fit(){const W=el.clientWidth,H=el.clientHeight;svg.attr('viewBox',[-W/2,-H/2,W,H]);sim.alpha(.5).restart();}
fit();
window.addEventListener('resize',fit);
const btn=document.getElementById('graph-expand');
function toggle(){const full=el.classList.toggle('full');btn.textContent=full?'⤡ close':'⤢ expand';requestAnimationFrame(fit);}
btn.addEventListener('click',toggle);
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&el.classList.contains('full'))toggle();});
</script>
<script>
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
console.log(`Built ${docs.length} pages + index (${edges.length} graph links) → ${OUT}`);
