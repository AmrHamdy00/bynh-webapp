// Ported from the approved prototype. Copy is verbatim from bynh.sa.
/* eslint-disable react/no-unescaped-entities */
import type { ReactNode } from 'react';

export default function ConsultationsPage() {
  return (
    <>
<section className="phero">
  <div className="wrap">
    <nav className="crumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>/</span><span>الاستشارات القانونية</span></nav>
    <h1 className="h1" data-up>الاستشارات القانونية <span className="ac">من بينه</span></h1>
    <p className="sub" data-up>إذا كنت تبحث عن نصيحة قانونية موثوقة أو استشارة محامي في مسألة قانونية مهمة،  فأنت هنا في المكان الصحيح!</p><p className="sub" data-up>في تطبيق بينه، نقدم لك خدمة استشارات قانونية تتيح لك الحصول على مشورتك القانونية من محامين متخصصين بكل سرعة وأمان، مع ضمان أعلى مستويات الخصوصية.</p><p className="sub" data-up>يتوفر في التطبيق نوعين رئيسيين من الاستشارات القانونية، يمكنك اختيار الأنسب لك بناء على احتياجك ورغبتك.</p>
  </div>
</section><section className="sec"><div className="wrap splits"><div className="split" data-up>
  <div className="split-tx"><span className="num">01</span><h2>استشارة قانونية عن طريق محادثة نصية</h2><p>لطلب استشارتك القانونية وطرح أسئلتك حول موضوع معين، بعد اختيار نوع التخصص الذي تحتاجه، ستتمكن من الاطلاع على قائمة المحامين المتخصصين في موضوعك، واختيار محامي استشارة مناسب لك لمساعدتك.</p><p>تتم الاستشارات القانونية عبر الرسائل النصية ولا تدعم الاتصال، مع إمكانية إرسال الصور والمستندات المتعلقة بالقضية، مما يسهل على المحامي فهم التفاصيل وتقديم المشورة التي تحتاجها بكل دقة واحترافية.</p></div>
  <div className="split-vis "><div className="pcard"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-chat" /></svg></span><span><b>محادثة نصية</b><small>الرسائل النصية · الصور والمستندات</small></span></div><div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}><div className="bub th"><i style={{ width: '170px' }}></i><i style={{ width: '110px' }}></i></div><div className="bub me"><i style={{ width: '140px' }}></i></div><div className="bub th" style={{ flexDirection: 'row', alignItems: 'center', gap: '8px' }}><svg width="18" height="18"><use href="#i-img" /></svg><i style={{ width: '70px' }}></i></div></div></div></div>
</div><div className="split rev" data-up>
  <div className="split-tx"><span className="num">02</span><h2>استشارة قانونية عن طريق جلسة صوتية/مرئية</h2><p>لطلب استشارتك القانونية وطرح أسئلتك بشكل فوري، بعد اختيارك لمدة الاستشارة ووصف موضوع الاستشارة القانونية، سيتم توصيلك بالمحامي المتواجد والمناسب لموضوعك للحصول على استشارتك خلال وقت قصير.</p><p>تتم الاستشارة الفورية عبر الصوت والصورة أو عبر الكتابة، مع إمكانية إرسال الصور والمستندات المتعلقة بالقضية مما يتيح لك الحصول على إجابات سريعة ودقيقة حسب احتياجاتك.</p></div>
  <div className="split-vis t"><img src="/img/Header1.webp" alt="جلسة استشارة مرئية في تطبيق بينه" loading="lazy" style={{ width: 'min(420px,100%)', filter: 'drop-shadow(0 30px 40px rgba(8,58,81,.3))' }} /></div>
</div><div className="split" data-up>
  <div className="split-tx"><span className="num">03</span><h2>استشارة قانونية عن طريق جلسة مجدولة (بموعد مسبق)</h2><p>لطلب استشارتك القانونية وطرح أسئلتك في الوقت الذي يناسبك، يمكنك اختيار نوع التخصص القانوني الذي تحتاجه، ثم استعراض قائمة المحامين المتاحين وحجز جلسة استشارية في الموعد الذي تختاره مسبقا.</p><p>تتيح لك الاستشارة المجدولة تنظيم وقتك والتواصل مع المحامي مباشرة في الموعد المحدد، سواء عبر مكالمة صوتية أو مرئية أو من خلال الرسائل النصية، مع إمكانية إرسال الملفات والمستندات بشكل مسبق، ليكون المحامي مطّلعا على تفاصيل القضية وجاهزا لتقديم المشورة القانونية المناسبة.</p></div>
  <div className="split-vis "><div className="pcard"><div className="doc-h"><span className="ic"><svg width="18" height="18"><use href="#i-cal" /></svg></span><span><b>جلسة مجدولة</b><small>بموعد مسبق</small></span></div><div className="cal"><span className="x">ح</span><span className="x">ن</span><span className="x">ث</span><span className="x">ر</span><span className="x">خ</span><span className="x">ج</span><span className="x">س</span><span>١</span><span>٢</span><span>٣</span><span>٤</span><span>٥</span><span>٦</span><span>٧</span><span>٨</span><span>٩</span><span className="on">١٠</span><span>١١</span><span>١٢</span><span>١٣</span><span>١٤</span></div></div></div>
</div></div></section><section className="sec" style={{ paddingTop: '0' }}><div className="wrap"><div className="cta-band" data-up><div><h3>حمل تطبيق بينه</h3><p>هل الاستشارة برسوم أم مجانية؟ أسعار الاستشارات القانونية في بينه تبدأ من 100 ريال فقط، وتختلف حسب تقدير كل محامي لأتعابه، يمكنك الاطلاع عليها من التطبيق واختيار المناسب لك.</p></div><a className="btn btn-w" href="https://bynh.go.link/1mPkZ">حمل تطبيق بينه</a></div></div></section>
    </>
  );
}
