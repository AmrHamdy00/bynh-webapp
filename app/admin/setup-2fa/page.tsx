import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth/session';
import { pendingTotp } from '@/lib/auth/enroll';
import { totpQr } from '@/lib/auth/totp';
import { confirmTotpAction } from '../auth-actions';
import { ActionForm, Submit } from '../ui';

export const metadata = { title: 'تفعيل التحقق بخطوتين' };

/** Mandatory: nobody reaches the dashboard without an authenticator app. */
export default async function Setup() {
  const s = await currentSession();
  if (!s) redirect('/admin/login/');
  if (s.stage === 'full') redirect('/admin/');
  if (s.stage === 'mfa') redirect('/admin/login/code/');
  const p = await pendingTotp();
  if (!p) redirect('/admin/login/');
  const qr = await totpQr(p.username, p.secret);
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand"><img src="/img/mark.png" alt="" />بيّنه — لوحة التحكم</div>
        <h1>فعّل التحقق بخطوتين</h1>
        <p className="lead">امسح الرمز بتطبيق مصادقة (Google Authenticator أو Microsoft Authenticator أو Authy)، ثم أدخل الرمز الذي يظهر.</p>
        <div className="qr"><img src={qr} alt="رمز QR لإضافة الحساب في تطبيق المصادقة" width={220} height={220} /></div>
        <p className="small muted" style={{ marginBottom: 6 }}>أو أدخل هذا المفتاح يدوياً:</p>
        <div className="secret">{p.secret.replace(/(.{4})/g, '$1 ').trim()}</div>
        <div style={{ height: 16 }} />
        <ActionForm action={confirmTotpAction} codesNext="/admin/">
          <div className="field"><label htmlFor="c">الرمز من التطبيق</label><input className="in code" id="c" name="code" inputMode="numeric" autoComplete="one-time-code" required maxLength={7} /></div>
          <Submit>تفعيل</Submit>
        </ActionForm>
      </div>
    </main>
  );
}
