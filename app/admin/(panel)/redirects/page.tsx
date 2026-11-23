import { desc, ilike, or } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { ActionForm, Submit } from '../../ui';
import { saveRedirectAction, deleteRedirectAction } from './actions';

export const metadata = { title: 'التحويلات' };

export default async function Redirects({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireUser('editor');
  const q = ((await searchParams).q || '').trim().slice(0, 100);
  const rows = await db.select().from(s.redirects).where(q ? or(ilike(s.redirects.fromPath, `%${q}%`), ilike(s.redirects.toPath, `%${q}%`)) : undefined).orderBy(desc(s.redirects.createdAt)).limit(500);
  return (
    <>
      <div className="top"><h1>التحويلات</h1></div>
      <p className="muted small" style={{ marginBottom: 14 }}>301 = نقل دائم (ينقل قوة الرابط في جوجل). 302 = مؤقت. 410 = محذوف نهائياً. تُضاف تحويلات تلقائياً عند تغيير رابط مقال منشور أو حذفه.</p>
      <section className="card" style={{ marginBottom: 14 }}>
        <ActionForm action={saveRedirectAction} className="grid g4">
          <div className="field"><label htmlFor="f">من</label><input className="in" id="f" name="from" placeholder="/الرابط-القديم/" required /></div>
          <div className="field"><label htmlFor="t">إلى</label><input className="in" id="t" name="to" placeholder="/الرابط-الجديد/ أو https://…" /></div>
          <div className="field"><label htmlFor="c">النوع</label><select className="sel" id="c" name="code" defaultValue="301"><option value="301">301 دائم</option><option value="302">302 مؤقت</option><option value="410">410 محذوف</option></select></div>
          <div className="field"><label>&nbsp;</label><Submit className="btn btn-p">إضافة / تحديث</Submit></div>
        </ActionForm>
      </section>
      <form className="toolbar"><input className="in" name="q" defaultValue={q} placeholder="بحث…" /><button className="btn btn-s btn-sm">بحث</button></form>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>من</th><th>إلى</th><th>النوع</th><th>الزيارات</th><th>ملاحظة</th><th></th></tr></thead>
        <tbody>{rows.map((r) => (
          <tr key={r.id}><td className="t">{r.fromPath}</td><td className="t">{r.toPath || '—'}</td><td className="num">{r.code}</td><td className="num">{r.hits}</td><td className="small muted">{r.note}</td>
            <td><form action={deleteRedirectAction}><input type="hidden" name="id" value={r.id} /><button className="btn btn-d btn-sm">حذف</button></form></td></tr>))}
        </tbody></table></div>
    </>
  );
}
