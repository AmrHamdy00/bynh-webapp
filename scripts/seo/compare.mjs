#!/usr/bin/env node
/**
 * Compares two SEO snapshots (see snapshot.mjs) and reports every difference that could cost rankings.
 *
 *   node scripts/seo/compare.mjs seo/baseline.json seo/local.json [--html seo/report.html]
 *
 * Rules per old URL:
 *  - an indexable page (200, not noindex) must still return 200 at the same path, or 301/308 to a page that does;
 *  - title, meta description, canonical, robots, og:title/description/image/type, article times, h1, JSON-LD types
 *    must match (whitespace/percent-encoding normalised);
 *  - a noindex page / non-HTML URL only needs to keep resolving (2xx/3xx/410), not to match.
 * Exit code 1 when there are blocking problems, so it can run in CI before every deploy.
 */
import { readFile, writeFile } from 'node:fs/promises';

const [aFile, bFile] = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const htmlOut = process.argv.includes('--html') ? process.argv[process.argv.indexOf('--html') + 1] : null;
const A = JSON.parse(await readFile(aFile, 'utf8'));
const B = JSON.parse(await readFile(bFile, 'utf8'));

const norm = (v) => {
  if (v == null) return '';
  if (Array.isArray(v)) return v.map(norm).join(' | ');
  let s = String(v).replace(/\s+/g, ' ').trim();
  try { s = decodeURI(s); } catch {}
  return s.replace(/^https?:\/\/[^/]+/, (h) => h.toLowerCase());
};
const sameUrl = (x, y) => norm(x).replace(/^https?:\/\/[^/]+/, '') === norm(y).replace(/^https?:\/\/[^/]+/, '');
const robotsSet = (r) => new Set(norm(r).toLowerCase().split(/\s*,\s*/).filter(Boolean));
const isIndexable = (p) => p.status === 200 && p.title !== undefined && !robotsSet(p.meta?.robots).has('noindex');

const FIELDS = [
  ['title', (p) => p.title],
  ['description', (p) => p.meta?.description],
  ['canonical', (p) => p.canonical, sameUrl],
  ['robots', (p) => p.meta?.robots, (x, y) => { const a = robotsSet(x), b = robotsSet(y); return [...a].every((k) => b.has(k)) && [...b].every((k) => a.has(k)); }],
  ['og:type', (p) => p.meta?.['og:type']],
  ['og:title', (p) => p.meta?.['og:title']],
  ['og:description', (p) => p.meta?.['og:description']],
  ['og:image', (p) => [].concat(p.meta?.['og:image'] || [])[0], sameUrl],
  ['article:published_time', (p) => p.meta?.['article:published_time']],
  ['article:modified_time', (p) => p.meta?.['article:modified_time']],
  ['h1', (p) => (p.h1 || [])[0]],
  ['lang', (p) => p.lang],
];
const SOFT = new Set(['og:type', 'article:modified_time', 'h1']); // reported, not blocking

const rows = [];
let blocking = 0, warnings = 0, ok = 0;
for (const [path, a] of Object.entries(A.pages)) {
  const b = B.pages[path];
  const issues = [];
  if (!b) issues.push({ field: 'missing', block: true, a: a.status, b: 'not fetched' });
  else if (isIndexable(a)) {
    if (b.status === 301 || b.status === 308) {
      const t = B.pages[b.location];
      issues.push({ field: 'status', block: false, a: 200, b: `${b.status} → ${b.location}${t ? ` (${t.status})` : ''}` });
    } else if (b.status !== 200) issues.push({ field: 'status', block: true, a: 200, b: b.status });
    else {
      for (const [name, get, eq] of FIELDS) {
        const x = get(a), y = get(b);
        if (!x && !y) continue;
        if ((name === 'og:image' || name === 'description') && !x) continue; // adding what was missing is fine
        const same = eq ? eq(x, y) : norm(x) === norm(y);
        if (!same) issues.push({ field: name, block: !SOFT.has(name), a: norm(x), b: norm(y) });
      }
      const lostTypes = (a.ldTypes || []).filter((t) => !(b.ldTypes || []).includes(t));
      if (lostTypes.length) issues.push({ field: 'json-ld', block: lostTypes.some((t) => ['Article', 'WebPage', 'BreadcrumbList', 'Organization', 'WebSite'].includes(t)), a: (a.ldTypes || []).join(','), b: `missing: ${lostTypes.join(',')}` });
      if (a.words && b.words && b.words < a.words * 0.6) issues.push({ field: 'content', block: false, a: `${a.words} words`, b: `${b.words} words` });
    }
  } else if (b.status >= 400 && b.status !== 410 && a.status < 400) {
    issues.push({ field: 'status', block: false, a: a.status, b: b.status });
  }
  if (!issues.length) ok++;
  for (const i of issues) { i.block ? blocking++ : warnings++; rows.push({ path, ...i }); }
}

const byField = {};
for (const r of rows) byField[r.field] = (byField[r.field] || 0) + 1;
console.log(`URLs checked: ${Object.keys(A.pages).length} — identical: ${ok}, blocking issues: ${blocking}, warnings: ${warnings}`);
console.log('by field:', byField);
for (const r of rows.slice(0, Number(process.env.SHOW || 40))) console.log(`${r.block ? '✖' : '!'} ${r.path}  [${r.field}]\n    old: ${r.a}\n    new: ${r.b}`);

if (htmlOut) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await writeFile(htmlOut, `<!doctype html><meta charset="utf-8"><title>SEO parity</title><body dir="ltr" style="font:14px system-ui;margin:24px">
<h1>SEO parity: ${esc(A.base)} → ${esc(B.base)}</h1><p>${Object.keys(A.pages).length} URLs · ${ok} identical · ${blocking} blocking · ${warnings} warnings</p>
<table border=1 cellpadding=6 style="border-collapse:collapse"><tr><th></th><th>URL</th><th>Field</th><th>Old</th><th>New</th></tr>
${rows.map((r) => `<tr><td>${r.block ? '✖' : '!'}</td><td dir=auto>${esc(r.path)}</td><td>${r.field}</td><td dir=auto>${esc(r.a)}</td><td dir=auto>${esc(r.b)}</td></tr>`).join('')}</table>`);
  console.log(`report: ${htmlOut}`);
}
process.exit(blocking ? 1 : 0);
