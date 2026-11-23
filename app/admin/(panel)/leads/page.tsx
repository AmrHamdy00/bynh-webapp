import { desc } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { setLeadStatusAction } from './actions';

export const metadata = { title: 'طلبات التسجيل' };
const ST = { new: 'جديد', contacted: 'تم التواصل', closed: 'مغلق', spam: 'مزعج' } as const;
const fmt = (d: Date) => d.toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' });

export default async function Leads() {
  await requireUser('editor');
  const rows = await db.select().from(s.leads).orderBy(desc(s.leads.at)).limit(300);
  return (
    <>
      <div className="top"><h1>طلبات التسجيل</h1><div className="acts"><a className="btn btn-s" href="/api/admin/leads.csv">تصدير CSV</a></div></div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>التاريخ</th><th>الاسم</th><th>الجوال</th><th>البريد</th><th>الباقة</th><th>ملاحظات</th><th>الحالة</th></tr></thead>
        <tbody>{rows.length ? rows.map((r) => (
          <tr key={r.id}><td className="small">{fmt(r.at)}</td><td>{r.data.name}</td><td className="ltr"><a href={`tel:${r.data.phone}`}>{r.data.phone}</a></td>
            <td className="ltr"><a href={`mailto:${r.data.email}`}>{r.data.email}</a></td><td className="small">{r.data.package}</td><td className="small t">{r.data.notes}</td>
            <td><form action={setLeadStatusAction} style={{ display: 'flex', gap: 6 }}><input type="hidden" name="id" value={r.id} />
              <select className="sel" name="status" defaultValue={r.status} style={{ height: 34, width: 'auto' }}>{Object.entries(ST).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <button className="btn btn-s btn-sm">حفظ</button></form></td></tr>)) : <tr><td colSpan={7} className="empty">لا توجد طلبات بعد.</td></tr>}
        </tbody></table></div>
    </>
  );
}
