import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth/session';
import { codeAction } from '../../auth-actions';
import { ActionForm, Submit } from '../../ui';

export const metadata = { title: 'رمز التحقق' };

export default async function Code({ searchParams }: { searchParams: Promise<{ recovery?: string }> }) {
  const s = await currentSession();
  if (!s) redirect('/admin/login/');
  if (s.stage === 'full') redirect('/admin/');
  if (s.stage === 'setup') redirect('/admin/setup-2fa/');
  const recovery = (await searchParams).recovery === '1';
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand"><img src="/img/mark.png" alt="" />بيّنه — لوحة التحكم</div>
        <h1>{recovery ? 'رمز الاسترداد' : 'رمز التحقق'}</h1>
        <p className="lead">{recovery ? 'أدخل أحد رموز الاسترداد التي حفظتها عند تفعيل التحقق بخطوتين.' : 'أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة على جوالك.'}</p>
        <ActionForm action={codeAction}>
          <input type="hidden" name="mode" value={recovery ? 'recovery' : 'totp'} />
          <div className="field">
            <label htmlFor="c">{recovery ? 'رمز الاسترداد' : 'الرمز'}</label>
            {recovery
              ? <input className="in ltr" id="c" name="code" autoComplete="off" required maxLength={32} placeholder="XXXX-XXXX-XXXX-XXXX" autoFocus />
              : <input className="in code" id="c" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required maxLength={7} autoFocus />}
          </div>
          <Submit>تحقق</Submit>
        </ActionForm>
        <div className="small" style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
          <a href={recovery ? '/admin/login/code/' : '/admin/login/code/?recovery=1'}>{recovery ? 'استخدم تطبيق المصادقة' : 'فقدت جوالك؟ استخدم رمز استرداد'}</a>
          <form action="/api/admin/logout/" method="post"><button className="linkbtn" type="submit">إلغاء</button></form>
        </div>
      </div>
    </main>
  );
}
