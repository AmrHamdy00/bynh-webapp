'use client';
/**
 * Search + tag filter for the blog. The paginated list is static HTML; when the visitor searches or picks a tag,
 * this loads /blog-index.json (generated at build time from WordPress) and shows the matching posts instead.
 */
import { useEffect, useMemo, useState } from 'react';
import PostCard from './PostCard';

type Lite = { slug: string; date: string; title: string; excerpt: string; imageSmall: string | null; tags: string[] };
const PER = 9;

export default function BlogFilter({ tags }: { tags: { name: string; count: number }[] }) {
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);
  const [all, setAll] = useState<Lite[] | null>(null);
  const active = !!term || !!tag;

  // /المدونة/?q=… (also where the old WordPress search /?s=… now lands)
  useEffect(() => {
    const q0 = new URLSearchParams(location.search).get('q')?.trim();
    if (q0) { setQ(q0); setTerm(q0); }
  }, []);

  useEffect(() => {
    if (active && !all) fetch('/blog-index.json').then((r) => r.json()).then((d) => setAll(d.posts)).catch(() => setAll([]));
    document.getElementById('blogServer')?.toggleAttribute('hidden', active);
  }, [active, all]);

  const hits = useMemo(() => (all || []).filter((p) => (!tag || p.tags.includes(tag)) && (!term || (p.title + ' ' + p.excerpt).includes(term))), [all, term, tag]);
  const pages = Math.max(1, Math.ceil(hits.length / PER));
  const shown = hits.slice((page - 1) * PER, page * PER);
  const go = (n: number) => { setPage(n); document.getElementById('list')?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <>
      <form className="bsearch" role="search" onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); setPage(1); }}>
        <label className="sr" htmlFor="q" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>ابحث في المدونة</label>
        <input id="q" type="search" placeholder="ابحث في المدونة…" autoComplete="off" value={q}
          onChange={(e) => { setQ(e.target.value); if (!e.target.value) { setTerm(''); setPage(1); } }} />
        <button className="btn btn-p" type="submit">بحث</button>
      </form>
      <div className="chips-row" role="group" aria-label="الوسوم">
        <button type="button" className="tchip" aria-pressed={!tag} onClick={() => { setTag(''); setPage(1); }}>الكل</button>
        {tags.filter((t) => t.count > 1).map((t) => (
          <button key={t.name} type="button" className="tchip" aria-pressed={tag === t.name} onClick={() => { setTag(t.name); setPage(1); }}>
            {t.name} <small>{t.count}</small>
          </button>
        ))}
      </div>
      {active && (
        <div className="wrap" id="blogClient" style={{ paddingInline: 0, textAlign: 'start' }}>
          <div className="list-head"><h2>{term ? `نتائج البحث: ${term}` : tag}</h2><span>{all ? `${hits.length} مقال` : '…'}</span></div>
          <div className="posts" aria-live="polite">
            {all && (shown.length ? shown.map((p) => <PostCard key={p.slug} p={p} />) : <p className="empty">لا توجد مقالات مطابقة لبحثك.</p>)}
          </div>
          {pages > 1 && (
            <nav className="pager" aria-label="الصفحات">
              {page > 1 && <button type="button" onClick={() => go(page - 1)}>السابق</button>}
              {Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n <= 2 || n >= pages - 1 || Math.abs(n - page) <= 1).map((n, i, arr) => (
                <span key={n} style={{ display: 'contents' }}>
                  {i > 0 && n - arr[i - 1] > 1 && <span className="gap">…</span>}
                  {n === page ? <span aria-current="page">{n}</span> : <button type="button" onClick={() => go(n)}>{n}</button>}
                </span>
              ))}
              {page < pages && <button type="button" onClick={() => go(page + 1)}>التالي</button>}
            </nav>
          )}
        </div>
      )}
    </>
  );
}
