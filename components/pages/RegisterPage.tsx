// Ported from the approved prototype. Copy is verbatim from bynh.sa.
/* eslint-disable react/no-unescaped-entities */
import type { ReactNode } from 'react';

export default function RegisterPage() {
  return (
    <>
<section className="phero">
  <div className="wrap">
    <nav className="crumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>/</span><span>التسجيل</span></nav>
    <h1 className="h1" data-up>سجــل طــلبك <span className="ac">الآن</span></h1>
    
  </div>
</section><section className="sec" style={{ paddingTop: 'clamp(24px,3vw,40px)' }}><div className="wrap">
  <form className="rform" id="regForm" noValidate data-up>
    <label className="field"><span>الاسم *</span><input id="f-name" name="name" type="text" autoComplete="name" placeholder="الاسم*" required /></label>
    <label className="field"><span>البريد الاكتروني *</span><input id="f-email" name="email" type="email" autoComplete="email" dir="ltr" placeholder="البريد الاكتروني*" required /></label>
    <label className="field"><span>رقم الهاتف *</span><input id="f-phone" name="phone" type="tel" autoComplete="tel" dir="ltr" placeholder="رقم الهاتف*" required /></label>
    <label className="field"><span>الباقه *</span><select id="f-pkg" name="package" required><option value="">الباقه*</option><option>تأسيس الشركة (1350 ريال)</option><option>تأسيس وهيكلة الشركة (2650 ريال)</option></select></label>
    <label className="field full"><span>ملاحظات</span><textarea id="f-notes" name="notes" rows={5} placeholder="ملاحظات"></textarea></label>
    <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }} />
    <p className="ferr" id="fErr" hidden role="alert">يرجى تعبئة الحقول المطلوبة (*) بشكل صحيح.</p>
    <div className="full"><button className="btn btn-p" type="submit">تسجيــل الطلب</button></div>
  </form>
  <div className="rdone" id="regDone" hidden role="status"><span className="ic"><svg width="22" height="22"><use href="#i-check" /></svg></span><h2>تم استلام طلبك</h2><button type="button" className="btn btn-s" id="regAgain">طلب جديد</button></div>
</div></section>
    </>
  );
}
