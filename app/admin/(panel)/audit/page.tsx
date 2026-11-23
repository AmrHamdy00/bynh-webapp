import { desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';

export const metadata = { title: 'سجل النشاط' };
const fmt = (d: Date) => d.toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeStyle: 'medium', timeZone: 'Asia/Riyadh' });

export default async function Audit({ searchParams }: { searchParams: Promise<{ p?: string }> }) {
  await requireUser('admin');
  const page = Math.max(1, Number((await searchParams).p) || 1);
  const rows = await db.select({ a: s.auditLog, name: s.users.displayName }).from(s.auditLog).leftJoin(s.users, eq(s.users.id, s.auditLog.userId))
    .orderBy(desc(s.auditLog.at)).limit(100).offset((page - 1) * 100);
  return (
    <>
      <div className="top"><h1>سجل النشاط</h1></div>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>الوقت</th><th>المستخدم</th><th>الإجراء</th><th>العنصر</th><th>IP</th><th>تفاصيل</th></tr></thead>
        <tbody>{rows.map(({ a, name }) => (
          <tr key={a.id}><td className="small">{fmt(a.at)}</td><td>{name || '—'}</td><td className="ltr">{a.action}</td>
            <td className="ltr small">{a.entity ? `${a.entity} #${a.entityId}` : ''}</td><td className="num small">{a.ip}</td>
            <td className="ltr small t">{a.data ? JSON.stringify(a.data) : ''}</td></tr>
        ))}</tbody>
      </table></div>
      <div className="pager">{page > 1 && <a href={`?p=${page - 1}`}>السابق</a>}{rows.length === 100 && <a href={`?p=${page + 1}`}>التالي</a>}</div>
    </>
  );
}
