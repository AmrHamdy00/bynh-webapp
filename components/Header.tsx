export default function Header({ current }: { current?: string }) {
  return (
    <>
<header className="hdr">
  <div className="wrap hdr-in">
    <a className="brand" href="/"><img src="/img/mark.png" alt="" width="32" height="32" />بيّنه</a>
    <nav className="nav" aria-label="القائمة الرئيسية"><a href="/" aria-current={current === '/' ? 'page' : undefined}>الرئيسية</a><a href="/طلب-تسجيل-محامي/" aria-current={current === '/طلب-تسجيل-محامي/' ? 'page' : undefined}>انضم كمحامي</a><a href="/المدونة/" aria-current={current === '/المدونة/' ? 'page' : undefined}>المدونة</a><a href="/about-us/" aria-current={current === '/about-us/' ? 'page' : undefined}>من نحن</a><a href="/الأسئلة-الشائعة/" aria-current={current === '/الأسئلة-الشائعة/' ? 'page' : undefined}>الأسئلة الشائعة</a><a href="/contact-us/" aria-current={current === '/contact-us/' ? 'page' : undefined}>تواصل معنا</a></nav>
    <a className="btn btn-p" href="https://bynh.go.link/1mPkZ">تحميل التطبيق <svg width="18" height="18"><use href="#i-arrow" /></svg></a>
    <button className="burger" id="burger" type="button" aria-label="القائمة" aria-expanded="false" aria-controls="mnav"><i></i><i></i></button>
  </div>
</header>
<nav className="mnav" id="mnav" aria-label="القائمة" inert><a href="/">الرئيسية</a><a href="/طلب-تسجيل-محامي/">انضم كمحامي</a><a href="/المدونة/">المدونة</a><a href="/about-us/">من نحن</a><a href="/الأسئلة-الشائعة/">الأسئلة الشائعة</a><a href="/contact-us/">تواصل معنا</a><a href="https://client.bynh.app/">تسجيل الدخول</a></nav>
    </>
  );
}
