'use client';
import { useActionState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import type { FormState } from './auth-actions';

export function Submit({ children, className = 'btn btn-p btn-block', pendingText = 'جارٍ…' }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return <button className={className} type="submit" disabled={pending}>{pending ? pendingText : children}</button>;
}

export function Msg({ state }: { state: FormState }) {
  if (state?.error) return <div className="msg err" role="alert">{state.error}</div>;
  if (state?.ok) return <div className="msg ok" role="status">{state.ok}</div>;
  return null;
}

/** A form bound to a server action that returns FormState; shows errors/success above the fields. */
export function ActionForm({ action, children, className, codesNext }: {
  action: (s: FormState, f: FormData) => Promise<FormState>; children: React.ReactNode; className?: string; codesNext?: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  useEffect(() => { if (state?.go) window.location.assign(state.go); }, [state]);
  if (state?.codes) return <RecoveryCodes codes={state.codes} next={codesNext} />;
  return (
    <form action={formAction} className={className}>
      <Msg state={state} />
      {children}
    </form>
  );
}

export function RecoveryCodes({ codes, next }: { codes: string[]; next?: string }) {
  const text = codes.join('\n');
  return (
    <div>
      <div className="msg warn">احفظ رموز الاسترداد في مكان آمن. كل رمز يُستخدم مرة واحدة إذا فقدت جوالك، ولن تظهر مرة أخرى.</div>
      <div className="codes">{codes.map((c) => <span key={c}>{c}</span>)}</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-s" type="button" onClick={() => navigator.clipboard.writeText(text)}>نسخ</button>
        <a className="btn btn-s" download="bynh-recovery-codes.txt" href={`data:text/plain;charset=utf-8,${encodeURIComponent(text)}`}>تنزيل</a>
        {next && <form action="/api/admin/session/rotate/" method="post"><input type="hidden" name="next" value={next} /><button className="btn btn-p" type="submit">متابعة إلى لوحة التحكم</button></form>}
      </div>
    </div>
  );
}
