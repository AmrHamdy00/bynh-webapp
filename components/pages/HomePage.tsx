// Ported from the approved prototype. Copy is verbatim from bynh.sa.
/* eslint-disable react/no-unescaped-entities */
import type { ReactNode } from 'react';

export default function HomePage({ latest }: { latest: ReactNode }) {
  return (
    <>
{/* ============ HERO ============ */}
<section className="hero">
  <div className="wrap">
    <div className="rate"><span className="avs" aria-hidden="true"><img src="/img/av-c1.webp" alt="" /><img src="/img/av-c3.webp" alt="" /><img src="/img/av-c5.webp" alt="" /><img src="/img/av-c2.webp" alt="" /></span><span className="stars" aria-label="خمس نجوم">★★★★★</span>أكثر من ٥٠٠٠ تعليق إيجابي</div>
    <h1 className="h1" id="h1"><span className="w">تحتاج</span> <span className="w ac">استشـارة</span> <span className="w"><span className="chip" aria-hidden="true"><svg><use href="#i-chat" /></svg></span></span> <span className="w sf">أو خدمة</span> <span className="w">قانونـية؟</span></h1>
    <p className="sub">نخبة من المحامين والمستشارين القانونيين</p>
    <a className="btn btn-p" href="#consult">ابدأ الآن <svg width="18" height="18"><use href="#i-arrow" /></svg></a>
  </div>
  <div className="tray-wrap wrap" id="trayWrap">
    <div className="tray" aria-hidden="true"></div>
    <picture className="hero-shot" id="heroWin">
      <source media="(max-width:560px)" srcSet="/img/Header1mobile.webp" />
      <img src="/img/Header1.webp" alt="تطبيق بينه: جلسة استشارة مرئية مع محامٍ مرخص والشاشة الرئيسية للتطبيق" width="959" height="1000" />
    </picture>
    <div className="float fl1" aria-hidden="true"><span className="fd"></span><span><b>جلسات بالصوت والفيديو</b><small>بشكل فوري او مجدول لموعد محدد</small></span></div>
    <div className="float fl2" aria-hidden="true"><span className="fc"><svg width="12" height="12"><use href="#i-check" /></svg></span><span><b>محامين مرخصين</b><small>من وزارة العدل</small></span></div>
  </div>
</section>

{/* ============ STRIP ============ */}
<div className="strip">
  <p>موثوق به من أكثر من ٤٠ ألف عميل</p>
  <div className="marq" aria-hidden="true"><div className="marq-in">
    <span><svg width="22" height="22"><use href="#i-doc" /></svg>دراسة قضية</span><span><svg width="22" height="22"><use href="#i-cal" /></svg>حضور جلسات</span><span><svg width="22" height="22"><use href="#i-docfwd" /></svg>الترافع والتوكيل</span><span><svg width="22" height="22"><use href="#i-docpen" /></svg>كتابات قانونية</span><span><svg width="22" height="22"><use href="#i-docok" /></svg>العقود و الاتفاقيات</span><span><svg width="22" height="22"><use href="#i-docup" /></svg>طلبات تنفيذ</span>
    <span><svg width="22" height="22"><use href="#i-doc" /></svg>دراسة قضية</span><span><svg width="22" height="22"><use href="#i-cal" /></svg>حضور جلسات</span><span><svg width="22" height="22"><use href="#i-docfwd" /></svg>الترافع والتوكيل</span><span><svg width="22" height="22"><use href="#i-docpen" /></svg>كتابات قانونية</span><span><svg width="22" height="22"><use href="#i-docok" /></svg>العقود و الاتفاقيات</span><span><svg width="22" height="22"><use href="#i-docup" /></svg>طلبات تنفيذ</span>
  </div></div>
</div>

{/* ============ BENTO ============ */}
<section className="sec" id="about">
  <div className="wrap">
    <div className="c">
      <span className="eyebrow" data-up>عن بينـــه</span>
      <h2 className="h2" data-up>احصل على المشورة القانونية <span className="ac">الفعالة</span> التي تحتاج إليها</h2>
      <p className="sub" data-up>منصة قانونية رقمية تقدم كافة الخدمات والاستشارات القانونية التي تسهل وصول العملاء إلى نخبة من المحامين المرخصين من وزارة العدل</p>
    </div>
    <div className="bento" id="consult">
      <div className="bx" data-up>
        <img className="wm" src="/img/txt.png" alt="" aria-hidden="true" />
        <div className="card-ui" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} aria-hidden="true">
          <div className="bub th"><i style={{ width: '150px' }}></i><i style={{ width: '96px' }}></i></div>
          <div className="bub me wave"><svg width="14" height="14"><use href="#i-mic" /></svg><b style={{ height: '8px' }}></b><b style={{ height: '15px' }}></b><b style={{ height: '10px' }}></b><b style={{ height: '18px' }}></b><b style={{ height: '7px' }}></b><b style={{ height: '13px' }}></b><b style={{ height: '9px' }}></b><b style={{ height: '16px' }}></b></div>
          <div className="bub th" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}><svg width="18" height="18"><use href="#i-img" /></svg><i style={{ width: '70px' }}></i></div>
        </div>
        <div className="cap"><small>الرسائل الكتابية والرسائل الصوتية</small><b>الاستشارات النصية</b></div>
      </div>
      <div className="bx" data-up>
        <img className="wm" src="/img/video-call.png" alt="" aria-hidden="true" />
        <div className="card-ui" aria-hidden="true">
          <div className="call"><div><svg width="30" height="30"><use href="#i-user" /></svg></div><div><svg width="30" height="30"><use href="#i-user" /></svg></div></div>
          <div className="ctl"><span><svg width="16" height="16"><use href="#i-mic" /></svg></span><span className="on"><svg width="16" height="16"><use href="#i-video" /></svg></span><span><svg width="16" height="16"><use href="#i-cal" /></svg></span></div>
        </div>
        <div className="cap"><small>بشكل فوري او مجدول لموعد محدد</small><b>جلسات بالصوت والفيديو</b></div>
      </div>
      <div className="bx photo" data-up>
        <img className="ph" src="/img/app-hand.webp" alt="تطبيق بينه على الجوال" loading="lazy" />
        <div className="ph-ov"><img className="mk" src="/img/mark.png" alt="" /><div className="big" dir="ltr">+<span className="count" data-to="40000">40,000</span></div><p>موثوق به من أكثر من ٤٠ ألف عميل</p></div>
      </div>
      <div className="bx" data-up>
        <div className="orbit" aria-hidden="true">
          <span className="core"><svg width="24" height="24"><use href="#i-shield" /></svg></span>
          <span style={{ top: '6px', left: '24%' }}><svg width="20" height="20"><use href="#i-user" /></svg></span>
          <span style={{ top: '20px', right: '16%' }}><svg width="20" height="20"><use href="#i-user" /></svg></span>
          <span style={{ top: '44%', left: '6%' }}><svg width="20" height="20"><use href="#i-user" /></svg></span>
          <span style={{ top: '46%', right: '4%' }}><svg width="20" height="20"><use href="#i-user" /></svg></span>
          <span style={{ bottom: '2px', left: '30%' }}><svg width="20" height="20"><use href="#i-user" /></svg></span>
          <span style={{ bottom: '10px', right: '28%' }}><svg width="20" height="20"><use href="#i-user" /></svg></span>
        </div>
        <div className="cap"><small>محامي مسجل</small><b dir="ltr">+<span className="count" data-to="1500">1,500</span></b></div>
      </div>
      <div className="bx wide" data-up>
        <div className="wide-h"><span><small>الاجراءات والخدمات القانونية</small><b>تغطي جميع الجوانب القانونية</b></span><span className="eyebrow">الخدمات</span></div>
        <div className="board" aria-hidden="true">
          <div className="col"><h5>دراسة قضية</h5><div className="kc"><b>العقود</b><i className="sk" style={{ width: '80%' }}></i></div><div className="kc"><b>المرفقات</b><i className="sk" style={{ width: '60%' }}></i></div></div>
          <div className="col"><h5>كتابات قانونية</h5><div className="kc"><b>اللوائح</b><i className="sk" style={{ width: '70%' }}></i></div><div className="kc"><b>المذكرات الجوابية</b><i className="sk" style={{ width: '55%' }}></i></div></div>
          <div className="col"><h5>العقود و الاتفاقيات</h5><div className="kc"><b>صياغة</b><i className="sk" style={{ width: '75%' }}></i></div><div className="kc"><b>مراجعة</b><i className="sk" style={{ width: '50%' }}></i></div></div>
        </div>
      </div>
    </div>
  </div>
</section>

{/* ============ WORKING PROCESS ============ */}
<section className="sec" id="services" style={{ paddingTop: '0' }}>
  <div className="wrap">
    <div className="c">
      <span className="eyebrow" data-up>الخدمات</span>
      <h2 className="h2" data-up>الاجراءات والخدمات <span className="chip" aria-hidden="true"><svg><use href="#i-docok" /></svg></span> <span className="ac">القانونية</span></h2>
      <p className="sub" data-up>تغطي جميع الجوانب القانونية، مما يساعدك في حماية حقوقك وتحقيق أهدافك بثقة واطمئنان</p>
    </div>
    <div className="wp">
      <div className="steps" id="steps">
        <div className="st on"><div className="st-h"><b>دراسة قضية</b><span>01</span></div><div className="st-b"><p>اذا كان موضوعك يحتوي الكثير من التفاصيل والعقود والمرفقات وصكوك الاحكام المطلوب دراستها للوصول للاجابات التي تحتاجها.</p></div></div>
        <div className="st"><div className="st-h"><b>حضور جلسات</b><span>02</span></div><div className="st-b"><p>اذا كنت مشغول، حصل لك ظرف او ما عندك رغبة تحضر الجلسة لاي سبب كان. وكل محامي/ة يحضر الجلسة ويترافع عنك فيها</p></div></div>
        <div className="st"><div className="st-h"><b>الترافع والتوكيل</b><span>03</span></div><div className="st-b"><p>توكيل محامي للترافع عنك في القضية بشكل كامل حتى صدور الحكم الابتدائي او القطعي وتقديم طلب التنفيذ عند الحاجة</p></div></div>
        <div className="st"><div className="st-h"><b>كتابات قانونية</b><span>04</span></div><div className="st-b"><p>صياغة اللوائح والمذكرات الجوابية الاعتراضية وصحائف الدعوى والنقض الالتماس وغيرها من الخطابات بطريقة قانونية سليمة</p></div></div>
        <div className="st"><div className="st-h"><b>العقود و الاتفاقيات</b><span>05</span></div><div className="st-b"><p>العقد شريعة المتعاقدين، صياغة ومراجعة العقود والاتفاقيات ودراسة العقود والبحث في امكانية فسخها</p></div></div>
        <div className="st"><div className="st-h"><b>طلبات تنفيذ</b><span>06</span></div><div className="st-b"><p>رفع طلب التنفيذ و/أو متابعة الاجراءات حتى اخر اجراء ضد المنفذ ضده امام محكمة التنفيذ</p></div></div>
      </div>
      <div className="panels" id="panels">
        <div className="pn">
          <div className="cap-m"><b>دراسة قضية</b><p>اذا كان موضوعك يحتوي الكثير من التفاصيل والعقود والمرفقات وصكوك الاحكام المطلوب دراستها للوصول للاجابات التي تحتاجها.</p></div>
          <div className="pcard" aria-hidden="true"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-doc" /></svg></span><span><b>دراسة قضية</b><small>العقود والمرفقات وصكوك الاحكام</small></span><span className="pill">قيد الدراسة</span></div>
            <div className="list" style={{ marginTop: '12px' }}><div className="li"><span className="n">١</span><span className="t"><b>العقود</b><i className="sk" style={{ width: '78%' }}></i><i className="sk" style={{ width: '50%' }}></i></span><span className="tag ok"><svg width="10" height="10"><use href="#i-check" /></svg>تم</span></div><div className="li"><span className="n">٢</span><span className="t"><b>المرفقات</b><i className="sk" style={{ width: '66%' }}></i><i className="sk" style={{ width: '44%' }}></i></span><span className="tag ok"><svg width="10" height="10"><use href="#i-check" /></svg>تم</span></div><div className="li att"><span className="n">٣</span><span className="t"><b>صكوك الاحكام</b><i className="sk" style={{ width: '72%' }}></i><i className="sk" style={{ width: '48%' }}></i></span><span className="tag at">مطلوب</span></div></div></div>
        </div>
        <div className="pn t">
          <div className="cap-m"><b>حضور جلسات</b><p>اذا كنت مشغول، حصل لك ظرف او ما عندك رغبة تحضر الجلسة لاي سبب كان. وكل محامي/ة يحضر الجلسة ويترافع عنك فيها</p></div>
          <div className="pcard" aria-hidden="true"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-cal" /></svg></span><span><b>حضور جلسات</b><small>محامي/ة يحضر الجلسة</small></span></div>
            <div className="cal"><span className="x">ح</span><span className="x">ن</span><span className="x">ث</span><span className="x">ر</span><span className="x">خ</span><span className="x">ج</span><span className="x">س</span><span>١</span><span>٢</span><span>٣</span><span>٤</span><span>٥</span><span>٦</span><span>٧</span><span>٨</span><span>٩</span><span className="on">١٠</span><span>١١</span><span>١٢</span><span>١٣</span><span>١٤</span></div>
            <div className="note" style={{ marginTop: '12px' }}><span className="av"><svg width="15" height="15"><use href="#i-user" /></svg></span><span style={{ flex: '1' }}><b>محامي/ة</b><small>يحضر الجلسة ويترافع عنك فيها</small></span></div></div>
        </div>
        <div className="pn n">
          <div className="cap-m"><b>الترافع والتوكيل</b><p>توكيل محامي للترافع عنك في القضية بشكل كامل حتى صدور الحكم الابتدائي او القطعي وتقديم طلب التنفيذ عند الحاجة</p></div>
          <div className="pcard" aria-hidden="true"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-docfwd" /></svg></span><span><b>الترافع والتوكيل</b><small>بشكل كامل</small></span></div>
            <div className="tl"><div className="d"><i><svg width="11" height="11"><use href="#i-check" /></svg></i><span><b>توكيل محامي</b><i className="sk" style={{ width: '150px' }}></i></span></div><div className="d"><i><svg width="11" height="11"><use href="#i-check" /></svg></i><span><b>صدور الحكم الابتدائي او القطعي</b><i className="sk" style={{ width: '120px' }}></i></span></div><div><i></i><span><b>تقديم طلب التنفيذ</b><small>عند الحاجة</small></span></div></div></div>
        </div>
        <div className="pn">
          <div className="cap-m"><b>كتابات قانونية</b><p>صياغة اللوائح والمذكرات الجوابية الاعتراضية وصحائف الدعوى والنقض الالتماس وغيرها من الخطابات بطريقة قانونية سليمة</p></div>
          <div className="pcard" aria-hidden="true"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-docpen" /></svg></span><span><b>كتابات قانونية</b><small>بطريقة قانونية سليمة</small></span><span className="pill">مسودة</span></div>
            <div className="list" style={{ marginTop: '12px' }}><div className="li"><span className="n">١</span><span className="t"><b>اللوائح</b><i className="sk" style={{ width: '74%' }}></i></span></div><div className="li"><span className="n">٢</span><span className="t"><b>المذكرات الجوابية</b><i className="sk" style={{ width: '60%' }}></i></span></div><div className="li"><span className="n">٣</span><span className="t"><b>صحائف الدعوى</b><i className="sk" style={{ width: '68%' }}></i></span></div></div></div>
        </div>
        <div className="pn t">
          <div className="cap-m"><b>العقود و الاتفاقيات</b><p>العقد شريعة المتعاقدين، صياغة ومراجعة العقود والاتفاقيات ودراسة العقود والبحث في امكانية فسخها</p></div>
          <div className="pcard" aria-hidden="true"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-docok" /></svg></span><span><b>العقود و الاتفاقيات</b><small>العقد شريعة المتعاقدين</small></span></div>
            <div className="list" style={{ marginTop: '12px' }}><div className="li"><span className="n">١</span><span className="t"><b>صياغة</b><i className="sk" style={{ width: '70%' }}></i></span><span className="tag ok"><svg width="10" height="10"><use href="#i-check" /></svg>تم</span></div><div className="li"><span className="n">٢</span><span className="t"><b>مراجعة</b><i className="sk" style={{ width: '58%' }}></i></span><span className="tag ok"><svg width="10" height="10"><use href="#i-check" /></svg>تم</span></div><div className="li"><span className="n">٣</span><span className="t"><b>دراسة العقود</b><i className="sk" style={{ width: '64%' }}></i></span></div></div></div>
        </div>
        <div className="pn n">
          <div className="cap-m"><b>طلبات تنفيذ</b><p>رفع طلب التنفيذ و/أو متابعة الاجراءات حتى اخر اجراء ضد المنفذ ضده امام محكمة التنفيذ</p></div>
          <div className="pcard" aria-hidden="true"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-docup" /></svg></span><span><b>طلبات تنفيذ</b><small>امام محكمة التنفيذ</small></span><span className="pill">قيد المتابعة</span></div>
            <div className="tl"><div className="d"><i><svg width="11" height="11"><use href="#i-check" /></svg></i><span><b>رفع طلب التنفيذ</b><i className="sk" style={{ width: '140px' }}></i></span></div><div className="d"><i><svg width="11" height="11"><use href="#i-check" /></svg></i><span><b>متابعة الاجراءات</b><i className="sk" style={{ width: '110px' }}></i></span></div><div><i></i><span><b>اخر اجراء</b><small>ضد المنفذ ضده</small></span></div></div></div>
        </div>
      </div>
    </div>
    <div className="c" style={{ marginTop: 'clamp(36px,4vw,56px)' }}><a className="btn btn-p" href="https://bynh.go.link/1mPkZ">حمل تطبيق بينه <svg width="18" height="18"><use href="#i-arrow" /></svg></a></div>
  </div>
</section>

{/* ============ NAVY BLOCK: join as lawyer ============ */}
<section className="navy sec" id="join">
  <div className="wrap">
    <div className="nv-top">
      <div className="nv-ic" data-up><img src="/img/mark.png" alt="" /></div>
      <span className="eyebrow" data-up>انضم كمحامي</span>
      <h2 className="h2" data-up>محامي مرخص؟</h2>
      <p className="sub" data-up style={{ marginInline: 'auto' }}>إنضمامك الى بينه سيتيح لك فرصة تنظيم الطلبات من استشارات قانونية ودراسة القضايا الواردة من العملاء حسب ماتقوم بتقديره مقابل اتعاب كل خدمة.</p>
    </div>
    <div className="nv-split">
      <div>
        <span className="eyebrow">لماذا تختار بينـــه كشريك؟</span>
        <h3>جميع المحامين المنضمين حاصلون على ترخيص من وزارة العدل</h3>
        <a className="btn btn-w" href="https://lawyers.bynh.app/register/step-one">سجل الآن <svg width="18" height="18"><use href="#i-arrow" /></svg></a>
      </div>
      <ul className="acc" id="acc">
        <li className="on"><button type="button" aria-expanded="true">زيادة قاعدة العملاء<span>01</span></button><div className="ab"><p>في بينه، نتيح لك فرصة الظهور أمام عدد أكبر من العملاء الباحثين عن محامٍ موثوق. من خلال تواجدك على المنصة، تتوسّع قاعدة عملائك وتزداد احتمالية حصولك على قضايا جديدة بشكل مستمر.</p></div></li>
        <li><button type="button" aria-expanded="false">تعزيز حضورك المهني<span>02</span></button><div className="ab"><p>مجرد انضمامك إلى منصة مرخّصة وموثوقة مثل بينه يضعك أمام العملاء كمحامٍ معتمد واحترافي. نحرص على تقديمك بصورة مهنية تعكس خبرتك، وتبني الثقة بينك وبين عملائك.</p></div></li>
        <li><button type="button" aria-expanded="false">إدارة مرنة لوقتك<span>03</span></button><div className="ab"><p>نوفّر لك تقنيات متقدمة تساعدك على تنظيم مواعيدك، جدولة الجلسات، والتواصل مع عملائك بكل سهولة. المنصة تدعم التواصل المكتوب، المرئي، أو الصوتي، لتناسب رغبة العميل وطبيعة كل حالة قانونية وتوفّر عليك الجهد والوقت.</p></div></li>
      </ul>
    </div>
    <div className="ps">
      <div className="p1" data-up>
        <h4>من خلال بينه</h4>
        <p>استقبل طلبات من عملاء يبحثون عن محامٍ مرخّص</p>
        <ul>
          <li><svg width="16" height="16"><use href="#i-check" /></svg>تقديم الاستشارات القانونية المكتوبة أو الصوتية أو المرئية</li>
          <li><svg width="16" height="16"><use href="#i-check" /></svg>صياغة العقود والاتفاقيات بأنواعها</li>
          <li><svg width="16" height="16"><use href="#i-check" /></svg>حضور الجلسات والنيابة عن الموكلين</li>
          <li><svg width="16" height="16"><use href="#i-check" /></svg>مراجعة ودراسة القضايا وتقديم الرأي القانوني فيها</li>
        </ul>
      </div>
      <div className="p2" data-up>
        <h4>تستطيع تحديد أتعابك لكل خدمة</h4>
        <p>تستطيع تحديد أتعابك لكل خدمة، وإنشاء ملف تعريفي يعكس خبراتك وتخصصاتك، مع دعم تقني متواصل وتنظيم مواعيد مرن يتيح لك التركيز على عملك دون انشغال بالجوانب الإدارية.</p>
      </div>
      <div className="p3 shot" data-up><img src="/img/law0img.webp" alt="لوحة المحامي في تطبيق بينه: الرصيد وعدد الاستشارات والمشاهدات" loading="lazy" /></div>
    </div>
    <figure className="board-shot" data-up><img src="/img/law-board.webp" alt="لوحة تحكم المحامي في بينه على الحاسب" loading="lazy" /></figure>
  </div>
</section>

{/* ============ STATS + DEVICE ============ */}
<section className="sec">
  <div className="wrap">
    <div className="sp">
      <h2 className="h2" data-up>تطبيق بينه يقدم خدمة <span className="ac">الاستشارات القانونية</span> <span className="chip" aria-hidden="true"><svg><use href="#i-shield" /></svg></span> عبر ربط العملاء مع نخبة من المحامين المرخصين</h2>
      <div data-up><p className="sub" style={{ marginTop: '0' }}>بينه #درعك_وأمانك_القانوني</p><a className="btn btn-p" href="https://bynh.go.link/1mPkZ">ابدأ الآن <svg width="18" height="18"><use href="#i-arrow" /></svg></a></div>
    </div>
    <div className="stats">
      <div><span>عميل</span><b dir="ltr">+<span className="count" data-to="40000">40,000</span></b></div>
      <div><span>متوسط عدد العملاء شهرياً</span><b dir="ltr">+<span className="count" data-to="10000">10,000</span></b></div>
      <div><span>متوسط الزيارات الشهرية</span><b dir="ltr">+<span className="count" data-to="234000">234,000</span></b></div>
      <div><span>محامي مسجل</span><b dir="ltr">+<span className="count" data-to="1500">1,500</span></b></div>
    </div>
    <div className="dev-stage" aria-hidden="true">
      <div className="tab" id="tab"><div className="tab-s">
        <div className="ts-side"><span className="brand"><img src="/img/mark.png" alt="" />بيّنه</span><a className="on"><svg width="16" height="16"><use href="#i-chat" /></svg>الاستشارات القانونية</a><a><svg width="16" height="16"><use href="#i-doc" /></svg>الخدمات القانونية</a><a><svg width="16" height="16"><use href="#i-cal" /></svg>جلسة مجدولة</a><a><svg width="16" height="16"><use href="#i-users" /></svg>المحامين</a></div>
        <div className="ts-main">
          <div className="ts-h"><b>الاستشارات القانونية</b><span className="srch"></span></div>
          <div className="ts-cards"><div className="tsc nv"><span className="ic"><svg width="18" height="18"><use href="#i-chat" /></svg></span><b>الاستشارات النصية</b><i className="sk" style={{ width: '80%', background: 'rgba(255,255,255,.2)' }}></i></div><div className="tsc"><span className="ic"><svg width="18" height="18"><use href="#i-video" /></svg></span><b>جلسات بالصوت والفيديو</b><i className="sk" style={{ width: '70%' }}></i></div><div className="tsc"><span className="ic"><svg width="18" height="18"><use href="#i-cal" /></svg></span><b>جلسة مجدولة</b><i className="sk" style={{ width: '60%' }}></i></div></div>
          <div className="ts-row">
            <div className="lawyers"><div className="lw"><span className="av"><svg width="15" height="15"><use href="#i-user" /></svg></span><span className="t"><i className="sk"></i><i className="sk" style={{ width: '40%' }}></i></span><span className="bk">حجز</span></div><div className="lw"><span className="av"><svg width="15" height="15"><use href="#i-user" /></svg></span><span className="t"><i className="sk"></i><i className="sk" style={{ width: '50%' }}></i></span><span className="bk">حجز</span></div><div className="lw"><span className="av"><svg width="15" height="15"><use href="#i-user" /></svg></span><span className="t"><i className="sk"></i><i className="sk" style={{ width: '35%' }}></i></span><span className="bk">حجز</span></div><div className="lw"><span className="av"><svg width="15" height="15"><use href="#i-user" /></svg></span><span className="t"><i className="sk"></i><i className="sk" style={{ width: '45%' }}></i></span><span className="bk">حجز</span></div></div>
            <div className="lawyers" style={{ justifyContent: 'space-between' }}><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-cal" /></svg></span><span><b>جلسة مجدولة</b><small>بموعد مسبق</small></span></div><div className="cal" style={{ gridTemplateColumns: 'repeat(5,1fr)' }}><span>٨</span><span>٩</span><span className="on">١٠</span><span>١١</span><span>١٢</span></div></div>
          </div>
        </div>
      </div></div>
    </div>
  </div>
</section>

{/* ============ REVIEWS ============ */}
<section className="sec" style={{ paddingTop: '0' }}>
  <div className="wrap">
    <div className="c">
      <span className="eyebrow" data-up>من آراء عملاؤنا</span>
      <h2 className="h2" data-up>أكثر من ٥٠٠٠ تعليق إيجابي</h2>
      <p className="sub" data-up>أكثر من ٥٠٠٠ تعليق إيجابي يعكس مدى سهولة الاستخدام والموثوقية العالية داخل المنصة</p>
    </div>
    <div className="rv-grid">
      <article className="rv" data-up><div className="rv-h"><span className="av">إ</span><b>إبراهيم محمد</b></div><p>تطبيق ممتاز للاستشارات القانونية ، واجهتني مشكلة في الشركة الخاصة بي وتم حلها عن طريق التطبيق انصح بشدة أي شخص لتجربة ممتازه و محامين ذو ثقة كبيرة. الله يوفقكم مشكورين🙏♥️</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      <article className="rv feat" data-up><b>٥٠٠٠+</b><div className="stars" aria-label="خمس نجوم">★★★★★</div><p>تعليق إيجابي يعكس مدى سهولة الاستخدام والموثوقية العالية داخل المنصة</p></article>
      <article className="rv" data-up><div className="rv-h"><span className="av">م</span><b>محمد الدوسري</b></div><p>مهم جدا تحفظ حقك أو جزء من حقك حتى لايضيع حقك بالكامل مثل ماضاع حقي لأني لا اعرف ولم استشر أهل الاختصاص . شكرا لكم تطبيق مهم جدا وسهل الاستخدام ويوجد من تستشيره في أوقات لا تتوقعها.</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      <article className="rv" data-up><div className="rv-h"><span className="av">ر</span><b>راشد الخطيب</b></div><p>شكرا لهذه المنصة المفيدة جدا لكافة شرائح المجتمع . وما تضم من نخبة الاستاذة من المستشارين والمحامين . حيث تم تعاملي معهم فوجدت الاهتمام اللحظي والتواصل المستمر والفائدة القانونية شكرا لك 🙏🙏🙏</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      <article className="rv" data-up><div className="rv-h"><span className="av">أ</span><b>أحمد</b></div><p>التطبيق فوق الممتاز، وما شاء الله المحامين المنضمين ليه ذوو خبرات وكفاءة عالية جدا، كنت محتار من كثرة المحامين الممتازين والحمدلله اتوفقت في احد ساعدني جدا ..</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      <article className="rv" data-up><div className="rv-h"><span className="av">ه</span><b>هناء</b></div><p>خدمتهم ممتازة والتواصل مع المحامي كان سلس وواضح. المحامي فهم موضوعي بسرعة</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      <article className="rv" data-up><div className="rv-h"><span className="av">و</span><b>وليد</b></div><p>المحامي فاهم وساعدني كثير. استفدت من خبرته وحصلت على الحل المناسب لمشكلتي</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      <article className="rv" data-up><div className="rv-h"><span className="av">ع</span><b>عبد الرحمن</b></div><p>كنت محتاج مساعدة عاجلة وفعلاً لقيت المحامي المناسب وتواصلت معه بكل سهولة</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      <article className="rv" data-up><div className="rv-h"><span className="av">ا</span><b>العنود</b></div><p>التطبيق سهل الاستخدام ومحامييهم خبراء. من أول مرة استخدمت التطبيق وأنا مرتاح جداً</p><div className="stars" aria-label="خمس نجوم">★★★★★</div></article>
      </div>
  </div>
</section>

{/* ============ FAQ ============ */}
<section className="sec" id="faq" style={{ paddingTop: '0' }}>
  <div className="wrap">
    <div className="c"><h2 className="h2" data-up>الأسئلة الشائعة</h2></div>
    <div className="faq" data-up>
      <details open><summary>ما هي منصة بينـــه؟<svg width="20" height="20"><use href="#i-down" /></svg></summary><p>بينه منصة قانونية رقمية تقدم كافة الخدمات والاستشارات القانونية، مما يسهل وصول العملاء إلى نخبة من المحامين المرخصين من وزارة العدل. نوفر لك سهولة في اختيار المحامي المناسب لحاجتك، وخيارات تواصل متعددة، بالإضافة إلى أنظمة دفع آمنة ومتنوعة لضمان راحتك وأمانك. مع بينه، تحصل على خدمات قانونية موثوقة وميسرة في أي وقت ومن أي مكان.</p></details>
      <details><summary>هل جميع المحامين مرخصيين؟<svg width="20" height="20"><use href="#i-down" /></svg></summary><p>نعم، جميع المحامين العاملين معنا مرخصون ومعتمدون من وزارة العدل. نحن نحرص على أن يكون فريقنا مكونًا من محامين ذوي كفاءة عالية وخبرة في مختلف المجالات القانونية، لضمان تقديم أفضل الخدمات القانونية لعملائنا.</p></details>
      <details><summary>كيف يتم التأكد من جودة المحامين كمقدمين للخدمة؟<svg width="20" height="20"><use href="#i-down" /></svg></summary><p>نحن نحرص على اختيار محامين ذوي خبرة واسعة ومعرفة متعمقة في المجالات القانونية المختلفة. يتم التأكد من جودة المحامين من خلال عملية تقييم دقيقة تشمل التحقق من مؤهلاتهم الأكاديمية، تراخيصهم المهنية، وخبراتهم السابقة. كما نقوم بمراقبة جودة الخدمة المقدمة، مما يضمن التزامنا بتقديم أعلى مستويات الجودة في كل مرحلة من مراحل التعامل القانوني.</p></details>
      <details><summary>هل المنصة آمنه؟<svg width="20" height="20"><use href="#i-down" /></svg></summary><p>نعم، نحن نولي أهمية قصوى لأمن وخصوصية بيانات عملائنا، ونستخدم أحدث التقنيات والمعايير الأمنية لحماية المعلومات الشخصية والبيانات القانونية التي يتم تبادلها عبر المنصة، جميع الاتصالات مشفرة بشكل آمن، ويتم تخزين البيانات في بيئات آمنة تحميها من أي وصول غير مصرح به، نحن ملتزمون بتطبيق أفضل الممارسات الأمنية لضمان أن تظل تجربتك معنا آمنة وسرية تماما.</p></details>
    </div>
    <div className="c" style={{ marginTop: '28px' }}><a className="btn btn-s" href="/الأسئلة-الشائعة/">المزيد من الأسئلة</a></div>
  </div>
</section>

{/* ============ BLOG (WordPress REST API) ============ */}
<section className="sec" id="blog" style={{ paddingTop: '0' }}>
  <div className="wrap">
    <div className="blog-head">
      <div>
        <span className="eyebrow" data-up>المدونة</span>
        <h2 className="h2" data-up>المدونة</h2>
        <p className="sub" data-up>تطبيق بينه يقدم خدمة الاستشارات القانونية عبر ربط العملاء مع نخبة من المحامين المرخصين، بينه #درعك_وأمانك_القانوني</p>
      </div>
      <a className="btn btn-s" href="/المدونة/" data-up>المزيد من مقالات بينه</a>
    </div>
    {latest}
  </div>
</section>

{/* ============ CLOSING ============ */}
<section className="closing">
  <img className="pat pat1" src="/img/foot.png" alt="" aria-hidden="true" /><img className="pat pat2" src="/img/kk.png" alt="" aria-hidden="true" />
  <div className="wrap" style={{ position: 'relative', zIndex: '1' }}>
    <div className="cl-ic" data-up><img src="/img/mark.png" alt="" /></div>
    <h2 className="h2" data-up>وش تنتظـــــر؟ حمـــل التطبيق الآن</h2>
    <p className="sub" data-up style={{ marginInline: 'auto' }}>تطبيق بينه يقدم خدمة الاستشارات القانونية عبر ربط العملاء مع نخبة من المحامين المرخصين</p>
    <a className="btn btn-w" data-up href="https://bynh.go.link/1mPkZ">ابدأ الآن <svg width="18" height="18"><use href="#i-arrow" /></svg></a>
    <div className="stores"><span>متوفر على</span><a href="https://bynh.go.link/1mPkZ">App Store</a><a href="https://bynh.go.link/1mPkZ">Google Play</a><a href="https://bynh.go.link/1mPkZ">AppGallery</a></div>
    <div className="cl-dev" aria-hidden="true">
      <div className="win"><div className="win-top"><span className="dots"><i></i><i></i><i></i></span><b><img src="/img/mark.png" alt="" />الاستشارات النصية</b></div>
        <div className="win-body"><div className="wb-a"><div className="ready"><span className="ic"><svg width="20" height="20"><use href="#i-chat" /></svg></span><span><b>الاستشارات النصية</b><small>الرسائل الكتابية والرسائل الصوتية</small></span></div><div className="tick"><svg width="18" height="18"><use href="#i-check" /></svg>الصور والمستندات</div></div><div className="wb-b"><div className="bub th"><i style={{ width: '140px' }}></i><i style={{ width: '90px' }}></i></div><div className="bub me"><i style={{ width: '120px' }}></i></div></div></div></div>
      <div className="phone"><div className="ph-s"><span className="hi">بيّنه</span><span className="big" dir="ltr">+1,500</span><small>محامي مسجل</small><div className="bars"><i style={{ height: '40%' }}></i><i style={{ height: '65%' }}></i><i style={{ height: '50%' }}></i><i style={{ height: '85%' }}></i><i style={{ height: '60%' }}></i><i style={{ height: '95%' }}></i></div><div className="note" style={{ padding: '8px' }}><span className="av" style={{ width: '22px', height: '22px' }}><svg width="12" height="12"><use href="#i-user" /></svg></span><span style={{ flex: '1' }}><i className="sk" style={{ marginTop: '4px' }}></i><i className="sk" style={{ width: '60%' }}></i></span></div></div></div>
    </div>
  </div>
</section>
    </>
  );
}
