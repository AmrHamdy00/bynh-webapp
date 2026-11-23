import { redirect } from 'next/navigation';
import { currentSession } from '@/lib/auth/session';
import { loginAction } from '../auth-actions';
import { ActionForm, Submit } from '../ui';

export const metadata = { title: 'تسجيل الدخول' };

export default async function Login() {
  const s = await currentSession();
  if (s?.stage === 'full') redirect('/admin/');
  return (
    <main className="auth">
      <div className="auth-card">
        <div className="auth-brand"><img src="/img/mark.png" alt="" />بيّنه — لوحة التحكم</div>
        <h1>تسجيل الدخول</h1>
        <p className="lead">للمصرّح لهم فقط. يتم تسجيل كل محاولة دخول.</p>
        <ActionForm action={loginAction}>
          <div className="field"><label htmlFor="u">اسم المستخدم</label><input className="in ltr" id="u" name="username" autoComplete="username" required maxLength={64} autoFocus /></div>
          <div className="field"><label htmlFor="p">كلمة المرور</label><input className="in ltr" id="p" name="password" type="password" autoComplete="current-password" required maxLength={256} /></div>
          <Submit>متابعة</Submit>
        </ActionForm>
      </div>
    </main>
  );
}
