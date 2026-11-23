import { asc } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { ActionForm, Submit } from '../../ui';
import { createUserAction, setRoleAction, toggleDisabledAction, resetAccessAction, unlockAction } from './actions';

export const metadata = { title: 'المستخدمون' };
const ROLE = { admin: 'مدير', editor: 'محرر', author: 'كاتب' } as const;
const fmt = (d: Date | null) => (d ? d.toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' }) : '—');

export default async function Users() {
  const me = await requireUser('admin');
  const users = await db.select().from(s.users).orderBy(asc(s.users.id));
  return (
    <>
      <div className="top"><h1>المستخدمون</h1></div>
      <p className="muted small" style={{ marginBottom: 14 }}>المدير: كل الصلاحيات. المحرر: كل المقالات والوسائط والسيو والتحويلات. الكاتب: مقالاته فقط كمسودات للمراجعة. التحقق بخطوتين إلزامي للجميع.</p>
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>الاسم</th><th>المستخدم</th><th>الدور</th><th>التحقق بخطوتين</th><th>آخر دخول</th><th>الحالة</th><th></th></tr></thead>
        <tbody>{users.map((u) => {
          const self = u.id === me.id;
          const locked = u.lockedUntil && u.lockedUntil > new Date();
          return (
            <tr key={u.id}>
              <td>{u.displayName}</td><td className="ltr">{u.username}</td>
              <td>{self ? ROLE[u.role] : (
                <form action={setRoleAction} style={{ display: 'flex', gap: 6 }}>
                  <input type="hidden" name="id" value={u.id} />
                  <select className="sel" name="role" defaultValue={u.role} style={{ height: 34, width: 'auto' }}>{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
                  <button className="btn btn-s btn-sm">حفظ</button>
                </form>)}</td>
              <td>{u.totpEnabled ? <span className="badge pub">مفعّل</span> : <span className="badge sch">بانتظار التفعيل</span>}</td>
              <td>{fmt(u.lastLoginAt)}</td>
              <td>{u.disabled ? <span className="badge trash">معطّل</span> : locked ? <span className="badge sch">مقفل مؤقتاً</span> : <span className="badge">نشط</span>}</td>
              <td>{!self && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {locked && <form action={unlockAction}><input type="hidden" name="id" value={u.id} /><button className="btn btn-s btn-sm">فك القفل</button></form>}
                  <form action={toggleDisabledAction}><input type="hidden" name="id" value={u.id} /><button className={`btn btn-sm ${u.disabled ? 'btn-s' : 'btn-d'}`}>{u.disabled ? 'تفعيل' : 'تعطيل'}</button></form>
                  <details><summary className="btn btn-s btn-sm" style={{ listStyle: 'none' }}>إعادة تعيين الدخول</summary>
                    <ActionForm action={resetAccessAction}><input type="hidden" name="id" value={u.id} /><p className="small muted" style={{ margin: '8px 0' }}>يلغي كلمة المرور والتحقق بخطوتين وينهي جلساته.</p><Submit className="btn btn-d btn-sm">تأكيد</Submit></ActionForm>
                  </details>
                </div>)}</td>
            </tr>
          );
        })}</tbody>
      </table></div>
      <section className="card" style={{ marginTop: 16, maxWidth: 560 }}>
        <h2>إضافة مستخدم</h2>
        <ActionForm action={createUserAction}>
          <div className="field"><label htmlFor="dn">الاسم</label><input className="in" id="dn" name="displayName" required maxLength={80} /></div>
          <div className="field"><label htmlFor="un">اسم المستخدم</label><input className="in ltr" id="un" name="username" required pattern="[a-zA-Z0-9._-]{3,32}" /></div>
          <div className="field"><label htmlFor="em">البريد (اختياري)</label><input className="in ltr" id="em" name="email" type="email" /></div>
          <div className="field"><label htmlFor="rl">الدور</label><select className="sel" id="rl" name="role" defaultValue="author">{Object.entries(ROLE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <Submit className="btn btn-p">إنشاء</Submit>
        </ActionForm>
      </section>
    </>
  );
}
