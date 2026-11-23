import { and, count, desc, ilike, or, type SQL } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, can } from '@/lib/auth/session';
import { ActionForm, Submit } from '../../ui';
import { updateMediaAction, deleteMediaAction } from './actions';
import Uploader from './Uploader';

export const metadata = { title: 'الوسائط' };
const PER = 48;

export default async function Media({ searchParams }: { searchParams: Promise<{ q?: string; p?: string; id?: string }> }) {
  const me = await requireUser('author');
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.p) || 1);
  const q = (sp.q || '').trim().slice(0, 100);
  const where: SQL | undefined = q ? and(or(ilike(s.media.path, `%${q}%`), ilike(s.media.alt, `%${q}%`), ilike(s.media.title, `%${q}%`))) : undefined;
  const [items, [{ n }]] = await Promise.all([
    db.select().from(s.media).where(where).orderBy(desc(s.media.createdAt), desc(s.media.id)).limit(PER).offset((page - 1) * PER),
    db.select({ n: count() }).from(s.media).where(where),
  ]);
  const sel = items.find((m) => m.id === Number(sp.id));
  const pages = Math.ceil(n / PER);
  const qs = (o: Record<string, string | number>) => '?' + new URLSearchParams({ ...(q ? { q } : {}), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) });
  return (
    <>
      <div className="top"><h1>الوسائط <span className="muted num small">{n}</span></h1><div className="acts"><Uploader /></div></div>
      <form className="toolbar"><input className="in" name="q" defaultValue={q} placeholder="ابحث…" /><button className="btn btn-s btn-sm">بحث</button></form>
      <div className={sel ? 'mlayout' : ''}>
        <div className="mgrid big">
          {items.map((m) => (
            <a key={m.id} className={`mitem${sel?.id === m.id ? ' on' : ''}`} href={qs({ p: page, id: m.id })} title={m.alt || m.title}>
              {m.mime.startsWith('image/') ? <img src={m.sizes?.medium?.path || m.sizes?.thumbnail?.path || m.path} alt="" loading="lazy" /> : <span className="file">PDF</span>}
            </a>))}
        </div>
        {sel && (
          <aside className="card mdetail">
            {sel.mime.startsWith('image/') && <img src={sel.sizes?.medium_large?.path || sel.path} alt="" />}
            <p className="small ltr" style={{ wordBreak: 'break-all', margin: '10px 0' }}><a href={sel.path} target="_blank" rel="noopener">{decodeURIComponent(sel.path)}</a></p>
            <p className="small muted num">{sel.width && `${sel.width}×${sel.height} · `}{sel.bytes ? `${Math.round(sel.bytes / 1024)} KB` : ''}</p>
            <ActionForm action={updateMediaAction}>
              <input type="hidden" name="id" value={sel.id} />
              <div className="field"><label htmlFor="alt">النص البديل (alt)</label><input className="in" id="alt" name="alt" defaultValue={sel.alt} maxLength={300} /><span className="hint">وصف قصير للصورة — مهم للسيو وقارئات الشاشة.</span></div>
              <div className="field"><label htmlFor="ttl">العنوان</label><input className="in" id="ttl" name="title" defaultValue={sel.title} maxLength={200} /></div>
              <Submit className="btn btn-p btn-sm">حفظ</Submit>
            </ActionForm>
            {can(me, 'editor') && <div style={{ marginTop: 12 }}><ActionForm action={deleteMediaAction}><input type="hidden" name="id" value={sel.id} /><Submit className="btn btn-d btn-sm">حذف نهائي</Submit></ActionForm></div>}
          </aside>)}
      </div>
      {pages > 1 && <nav className="pager">{Array.from({ length: pages }, (_, i) => i + 1).filter((x) => x <= 2 || x > pages - 2 || Math.abs(x - page) <= 2).map((x) =>
        x === page ? <span key={x} aria-current="page">{x}</span> : <a key={x} href={qs({ p: x })}>{x}</a>)}</nav>}
    </>
  );
}
