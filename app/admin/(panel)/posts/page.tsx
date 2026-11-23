import { and, count, desc, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, can } from '@/lib/auth/session';
import { trashPostsAction } from './actions';

export const metadata = { title: 'المقالات' };
const PER = 30;
const STATUS = { published: ['منشور', 'pub'], draft: ['مسودة', 'draft'], scheduled: ['مجدول', 'sch'], trash: ['محذوف', 'trash'] } as const;
const d = (x: Date | null) => (x ? x.toLocaleDateString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeZone: 'Asia/Riyadh' }) : '—');

export default async function Posts({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; p?: string }> }) {
  const me = await requireUser('author');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.p) || 1);
  const q = (sp.q || '').trim().slice(0, 100);
  const st = sp.status && sp.status in STATUS ? (sp.status as keyof typeof STATUS) : null;
  const conds: SQL[] = [st ? eq(s.posts.status, st) : ne(s.posts.status, 'trash')];
  if (q) conds.push(or(ilike(s.posts.title, `%${q}%`), ilike(s.posts.slug, `%${q}%`))!);
  if (!can(me, 'editor')) conds.push(eq(s.posts.authorId, me.id));
  const where = and(...conds);
  const [rows, [{ n }], counts] = await Promise.all([
    db.select({ id: s.posts.id, title: s.posts.title, slug: s.posts.slug, status: s.posts.status, publishedAt: s.posts.publishedAt, modifiedAt: s.posts.modifiedAt,
      views: sql<number>`(select count(*)::int from events e where e.type = 'pageview' and e.path = '/' || ${s.posts.slug} || '/' and e.at > now() - interval '30 days')` })
      .from(s.posts).where(where).orderBy(desc(sql`coalesce(${s.posts.publishedAt}, ${s.posts.createdAt})`)).limit(PER).offset((page - 1) * PER),
    db.select({ n: count() }).from(s.posts).where(where),
    db.select({ status: s.posts.status, n: count() }).from(s.posts).groupBy(s.posts.status),
  ]);
  const pages = Math.ceil(n / PER);
  const qs = (o: Record<string, string | number | undefined>) => '?' + new URLSearchParams(Object.entries({ q, status: st ?? undefined, ...o }).filter(([, v]) => v !== undefined && v !== '') as [string, string][]).toString();
  const cnt = Object.fromEntries(counts.map((c) => [c.status, c.n]));
  return (
    <>
      <div className="top"><h1>المقالات</h1><div className="acts"><a className="btn btn-p" href="/admin/posts/new/">مقال جديد</a></div></div>
      <form className="toolbar">
        <input className="in" name="q" defaultValue={q} placeholder="ابحث في العناوين والروابط…" />
        <select className="sel" name="status" defaultValue={st ?? ''} style={{ minWidth: 140 }}>
          <option value="">الكل ({(cnt.published || 0) + (cnt.draft || 0) + (cnt.scheduled || 0)})</option>
          {Object.entries(STATUS).map(([k, [l]]) => <option key={k} value={k}>{l} ({cnt[k] || 0})</option>)}
        </select>
        <button className="btn btn-s btn-sm">تصفية</button>
      </form>
      <form action={trashPostsAction}>
        <div className="tbl-wrap"><table className="tbl">
          <thead><tr>{can(me, 'editor') && <th></th>}<th>العنوان</th><th>الحالة</th><th>تاريخ النشر</th><th>آخر تعديل</th><th>زيارات 30 يوماً</th></tr></thead>
          <tbody>{rows.length ? rows.map((r) => (
            <tr key={r.id}>
              {can(me, 'editor') && <td><input type="checkbox" name="id" value={r.id} aria-label="تحديد" /></td>}
              <td className="t"><a href={`/admin/posts/${r.id}/`}>{r.title}</a></td>
              <td><span className={`badge ${STATUS[r.status][1]}`}>{STATUS[r.status][0]}</span></td>
              <td className="small">{d(r.publishedAt)}</td><td className="small">{d(r.modifiedAt)}</td><td className="num">{r.views}</td>
            </tr>)) : <tr><td colSpan={6} className="empty">لا توجد مقالات.</td></tr>}</tbody>
        </table></div>
        {can(me, 'editor') && st !== 'trash' && rows.length > 0 && <div style={{ marginTop: 10 }}><button className="btn btn-d btn-sm">نقل المحدد إلى المحذوفات</button> <span className="small muted">روابط المقالات المنشورة المحذوفة تُحوَّل للمدونة تلقائياً.</span></div>}
      </form>
      {pages > 1 && <nav className="pager">{Array.from({ length: pages }, (_, i) => i + 1).filter((x) => x <= 2 || x > pages - 2 || Math.abs(x - page) <= 2).map((x) =>
        x === page ? <span key={x} aria-current="page">{x}</span> : <a key={x} href={qs({ p: x })}>{x}</a>)}</nav>}
    </>
  );
}
