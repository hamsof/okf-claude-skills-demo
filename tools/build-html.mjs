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
.wrap{max-width:900px;margin:0 auto;padding:24px}
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
.controls input{flex:1;min-width:200px}
.card{background:var(--card);border:1px solid var(--bd);border-radius:8px;padding:14px;margin:10px 0}
.card h3{margin:0 0 4px}.card .meta{font-size:12px;color:var(--mut);margin-bottom:6px}
.tagcloud{margin:8px 0 4px}
.graphwrap{margin:18px 0}
.graphwrap .meta{font-size:12px;color:var(--mut)}
#graph{position:relative;width:100%;height:min(62vh,560px);border:1px solid var(--bd);border-radius:14px;overflow:hidden;
  background:radial-gradient(120% 120% at 50% 30%,#151f31 0%,#0d1117 72%)}
#graph.full{position:fixed;inset:0;width:100vw;height:100vh;border-radius:0;z-index:1000}
#graph svg{width:100%;height:100%;cursor:grab;display:block;touch-action:none}
#graph svg:active{cursor:grabbing}
.gtools{position:absolute;top:10px;right:10px;display:flex;gap:6px;z-index:2}
.gtools button{width:30px;height:30px;padding:0;display:grid;place-items:center;font-size:14px;line-height:1;
  background:rgba(22,27,34,.85);border:1px solid var(--bd);color:var(--mut);border-radius:8px;cursor:pointer;backdrop-filter:blur(6px)}
.gtools button:hover{color:var(--acc);border-color:var(--acc)}
.gtools button.wide{width:auto;padding:0 10px;font-size:12px}
.glegend{position:absolute;left:0;right:0;bottom:0;display:flex;flex-wrap:wrap;gap:4px;justify-content:center;z-index:2;
  padding:8px 10px;background:linear-gradient(to top,rgba(13,17,23,.92) 60%,transparent)}
.glegend span{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:var(--mut);cursor:pointer;
  background:rgba(22,27,34,.8);border:1px solid var(--bd);border-radius:11px;padding:2px 8px;backdrop-filter:blur(6px);transition:color .15s,border-color .15s,opacity .15s}
.glegend span:hover{color:var(--fg);border-color:var(--acc)}
.glegend span.off{opacity:.35}
.glegend i{width:8px;height:8px;border-radius:50%;display:block}
#graph .hint{position:absolute;left:12px;top:10px;font-size:11px;color:var(--mut);pointer-events:none;opacity:.55;z-index:2}
.gcard{position:absolute;right:10px;bottom:10px;width:270px;max-width:60%;z-index:2;
  background:rgba(22,27,34,.94);border:1px solid var(--bd);border-radius:10px;padding:11px 13px;backdrop-filter:blur(8px);
  opacity:0;transform:translateY(6px);transition:opacity .18s,transform .18s;pointer-events:none}
.gcard.on{opacity:1;transform:none}
.gcard h4{margin:0 0 3px;font-size:13px;line-height:1.35;color:var(--fg)}
.gcard p{margin:4px 0 0;font-size:11.5px;color:var(--mut);line-height:1.45;
  display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.gcard .sub{font-size:11px;color:var(--mut)}
.gnode{cursor:pointer}
.gnode circle{stroke:#0d1117;stroke-width:1.5px;transition:stroke .2s,opacity .25s}
.gnode:hover circle{stroke:#fff}
.gnode text{fill:var(--mut);font-size:10px;pointer-events:none;paint-order:stroke;stroke:#0d1117;stroke-width:3px;stroke-linejoin:round;
  opacity:0;transition:opacity .2s,fill .2s}
.gnode.hub text{opacity:.6}
g.zoomed .gnode text{opacity:.85}
.gnode.show text{opacity:1;fill:#e6edf3}
.glink{stroke:#30363d;stroke-opacity:.5;transition:stroke .2s,stroke-opacity .2s,opacity .25s}
.dim{opacity:.06}
.fade{opacity:.12}
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
const groupOf = (outRel) => (outRel.includes(sep) ? outRel.split(sep)[0] : 'root');
const groups = [...new Set(docs.map((d) => groupOf(d.outRel)))].sort();
const graphData = {
  nodes: docs.map((d) => ({
    id: d.outRel,
    title: d.title,
    type: d.type,
    group: groupOf(d.outRel),
    desc: d.description,
    deg: degree[d.outRel],
  })),
  links: edges,
  groups,
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
  <div id="graph">
    <div class="hint">hover to focus · click to open · drag to pan · scroll to zoom</div>
    <div class="gtools">
      <button id="g-in" title="zoom in">+</button>
      <button id="g-out" title="zoom out">−</button>
      <button id="g-fit" title="fit to view">◎</button>
      <button id="g-full" class="wide" title="fullscreen">⤢ expand</button>
    </div>
    <div class="glegend" id="g-legend"></div>
    <div class="gcard" id="g-card"></div>
  </div>
  <div class="meta" style="margin-top:6px">knowledge graph · ${docs.length} docs · ${edges.length} links</div>
</div>
<div class="tagcloud">${cloud}</div>
<div id="list">${cards}</div>
</div>
<script type="module">
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
const data=${JSON.stringify(graphData)};
const el=document.getElementById('graph');
const PALETTE=['#58a6ff','#3fb950','#d29922','#a371f7','#ec6cb9','#56d4dd','#db6d28','#e5534b','#8ddb8c','#7d8590'];
const groupColor=new Map(data.groups.map((g,i)=>[g,PALETTE[i%PALETTE.length]]));
const colorOf=(d)=>groupColor.get(d.group)||'#58a6ff';
const radius=(d)=>5+Math.sqrt(d.deg)*3.2;
const short=(s)=>s.length>30?s.slice(0,29)+'…':s;

const svg=d3.select('#graph').append('svg');
const root=svg.append('g');
let userMoved=false;
const zoom=d3.zoom().scaleExtent([0.15,4]).on('zoom',(e)=>{
  if(e.sourceEvent)userMoved=true;
  root.attr('transform',e.transform).classed('zoomed',e.transform.k>=1.05);
});
svg.call(zoom).on('dblclick.zoom',null);

const neighbors=new Map(data.nodes.map(n=>[n.id,new Set([n.id])]));
data.links.forEach(l=>{neighbors.get(l.source).add(l.target);neighbors.get(l.target).add(l.source);});

const sim=d3.forceSimulation(data.nodes)
  .force('link',d3.forceLink(data.links).id(d=>d.id).distance(l=>70+(l.source.deg+l.target.deg)*2).strength(.35))
  .force('charge',d3.forceManyBody().strength(-260).distanceMax(520))
  .force('x',d3.forceX(0).strength(.06))
  .force('y',d3.forceY(0).strength(.09))
  .force('collide',d3.forceCollide(d=>radius(d)+12));

const link=root.append('g').selectAll('line').data(data.links).join('line').attr('class','glink');
const node=root.append('g').selectAll('g').data(data.nodes).join('g')
  .attr('class',d=>'gnode'+(d.deg>=4?' hub':''))
  .call(d3.drag()
    .on('start',(e,d)=>{userMoved=true;if(!e.active)sim.alphaTarget(.25).restart();d.fx=d.x;d.fy=d.y;})
    .on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y;})
    .on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}));
node.append('circle').attr('r',radius).attr('fill',colorOf);
node.append('text').attr('x',d=>radius(d)+6).attr('y',3.5).text(d=>short(d.title));
node.on('click',(e,d)=>{location.href=d.id;});

const card=document.getElementById('g-card');
node.on('mouseenter',(e,d)=>{
  const nb=neighbors.get(d.id);
  node.classed('dim',n=>!nb.has(n.id)).classed('show',n=>nb.has(n.id));
  link.classed('dim',l=>l.source.id!==d.id&&l.target.id!==d.id)
      .attr('stroke',l=>(l.source.id===d.id||l.target.id===d.id)?colorOf(d):null)
      .attr('stroke-opacity',l=>(l.source.id===d.id||l.target.id===d.id)?.9:null);
  card.innerHTML='<h4>'+d.title+'</h4><div class="sub">'+d.type+' · '+d.group+' · '+d.deg+' links</div>'+(d.desc?'<p>'+d.desc+'</p>':'');
  card.classList.add('on');
}).on('mouseleave',()=>{
  node.classed('dim',false).classed('show',false);
  link.classed('dim',false).attr('stroke',null).attr('stroke-opacity',null);
  card.classList.remove('on');
});

// the camera tracks the layout while it settles, so the graph is never off-screen mid-animation
let ticks=0;
sim.on('tick',()=>{
  link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);
  node.attr('transform',d=>'translate('+d.x+','+d.y+')');
  if(!userMoved&&++ticks%8===0)fit(0);
});

const hidden=new Set();
const shown=()=>data.nodes.filter(n=>!hidden.has(n.group));
function resize(){const W=el.clientWidth||1,H=el.clientHeight||1;svg.attr('viewBox',[0,0,W,H]);return[W,H];}
function fit(duration){
  const [W,H]=resize();const ns=shown();
  if(!ns.length||!ns[0].x)return;
  const labelW=(n)=>short(n.title).length*5.4+6;
  const x0=Math.min(...ns.map(n=>n.x-radius(n))),x1=Math.max(...ns.map(n=>n.x+radius(n)+labelW(n)));
  const y0=Math.min(...ns.map(n=>n.y-radius(n))),y1=Math.max(...ns.map(n=>n.y+radius(n)));
  const padX=34,padTop=46,padBottom=(document.getElementById('g-legend').offsetHeight||0)+18;
  const availW=Math.max(W-padX*2,50),availH=Math.max(H-padTop-padBottom,50);
  const k=Math.max(0.15,Math.min(availW/Math.max(x1-x0,1),availH/Math.max(y1-y0,1),2.2));
  const cy=padTop+availH/2;
  const t=d3.zoomIdentity.translate(W/2-k*(x0+x1)/2,cy-k*(y0+y1)/2).scale(k);
  svg.transition().duration(duration===undefined?600:duration).call(zoom.transform,t);
}
resize();
sim.on('end',()=>{if(!userMoved)fit(400);});
window.addEventListener('resize',()=>fit(250));

document.getElementById('g-in').onclick=()=>svg.transition().duration(220).call(zoom.scaleBy,1.45);
document.getElementById('g-out').onclick=()=>svg.transition().duration(220).call(zoom.scaleBy,1/1.45);
document.getElementById('g-fit').onclick=()=>{userMoved=false;fit(500);};
const full=document.getElementById('g-full');
function toggleFull(){
  const on=el.classList.toggle('full');
  full.innerHTML=on?'⤡ close':'⤢ expand';
  document.body.style.overflow=on?'hidden':'';
  requestAnimationFrame(()=>fit(400));
}
full.onclick=toggleFull;
document.addEventListener('keydown',(e)=>{if(e.key==='Escape'&&el.classList.contains('full'))toggleFull();});

const legend=document.getElementById('g-legend');
legend.innerHTML=data.groups.map(g=>'<span data-g="'+g+'"><i style="background:'+groupColor.get(g)+'"></i>'+g+'</span>').join('');
legend.querySelectorAll('span').forEach(s=>{
  s.onclick=()=>{
    const g=s.dataset.g;
    hidden.has(g)?hidden.delete(g):hidden.add(g);
    s.classList.toggle('off',hidden.has(g));
    node.style('display',n=>hidden.has(n.group)?'none':null);
    link.style('display',l=>(hidden.has(l.source.group)||hidden.has(l.target.group))?'none':null);
    fit(450);
  };
});

const search=document.getElementById('q');
search.addEventListener('input',()=>{
  const t=search.value.trim().toLowerCase();
  if(!t){node.classed('fade',false).classed('show',false);link.classed('fade',false);return;}
  const hit=n=>n.title.toLowerCase().includes(t);
  node.classed('fade',n=>!hit(n)).classed('show',hit);
  link.classed('fade',l=>!hit(l.source)&&!hit(l.target));
});
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
