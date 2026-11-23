import { desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { changePasswordAction, regenerateRecoveryAction } from '../../auth-actions';
import { ActionForm, Submit } from '../../ui';

export const metadata = { title: 'حسابي والأمان' };
const fmt = (d: Date | null) => (d ? d.toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' }) : '—');

export default async function Account({ searchParams }: { searchParams: Promise<{ change?: string }> }) {
  const me = await requireUser();
  const force = (await searchParams).change === '1';
  const sessions = await db.select().from(s.sessions).where(eq(s.sessions.userId, me.id)).orderBy(desc(s.sessions.lastSeenAt));
  const codesLeft = (await db.select().from(s.recoveryCodes).where(eq(s.recoveryCodes.userId, me.id))).filter((c) => !c.usedAt).length;
  const events = await db.select().from(s.auditLog).where(eq(s.auditLog.userId, me.id)).orderBy(desc(s.auditLog.at)).limit(15);
  return (
    <>
      <div className="top"><h1>حسابي والأمان</h1></div>
      {(force || me.mustChangePassword) && <div className="msg warn">يجب تغيير كلمة المرور المؤقتة قبل المتابعة.</div>}
      <div className="grid g2">
        <section className="card">
          <h2>تغيير كلمة المرور</h2>
          <ActionForm action={changePasswordAction}>
            <div className="field"><label htmlFor="cur">كلمة المرور الحالية</label><input className="in ltr" id="cur" name="current" type="password" autoComplete="current-password" required /></div>
            <div className="field"><label htmlFor="nw">كلمة المرور الجديدة</label><input className="in ltr" id="nw" name="next" type="password" autoComplete="new-password" minLength={12} required /><span className="hint">12 حرفاً على الأقل، بمزيج من الأحرف والأرقام والرموز.</span></div>
            <div className="field"><label htmlFor="cf">تأكيد كلمة المرور</label><input className="in ltr" id="cf" name="confirm" type="password" autoComplete="new-password" required /></div>
            <Submit className="btn btn-p">حفظ</Submit>
          </ActionForm>
        </section>
        <section className="card">
          <h2>رموز الاسترداد</h2>
          <p className="muted small" style={{ marginBottom: 12 }}>المتبقي: <b className="num">{codesLeft}</b> من 10. إنشاء رموز جديدة يُلغي القديمة.</p>
          <ActionForm action={regenerateRecoveryAction}>
            <div className="field"><label htmlFor="rp">كلمة المرور للتأكيد</label><input className="in ltr" id="rp" name="password" type="password" autoComplete="current-password" required /></div>
            <Submit className="btn btn-s">إنشاء رموز جديدة</Submit>
          </ActionForm>
        </section>
      </div>
      <section className="card" style={{ marginTop: 14 }}>
        <h2>الجلسات النشطة</h2>
        <div className="tbl-wrap"><table className="tbl"><thead><tr><th>الجهاز</th><th>IP</th><th>آخر نشاط</th><th></th></tr></thead><tbody>
          {sessions.map((x) => (
            <tr key={x.id}><td className="t small">{x.userAgent || '—'}</td><td className="num">{x.ip}</td><td>{fmt(x.lastSeenAt)}</td>
              <td>{x.id === me.sessionId ? <span className="badge pub">هذه الجلسة</span> : <form action="/api/admin/sessions/revoke/" method="post"><input type="hidden" name="id" value={x.id} /><button className="btn btn-d btn-sm">إنهاء</button></form>}</td></tr>
          ))}
        </tbody></table></div>
      </section>
      <section className="card" style={{ marginTop: 14 }}>
        <h2>آخر نشاط على حسابك</h2>
        <div className="tbl-wrap"><table className="tbl"><tbody>
          {events.map((e) => <tr key={e.id}><td>{e.action}</td><td className="num">{e.ip}</td><td>{fmt(e.at)}</td></tr>)}
        </tbody></table></div>
      </section>
    </>
  );
}
