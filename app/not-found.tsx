import Shell from '@/components/Shell';

export default function NotFound() {
  return (
    <Shell>
      <section className="phero" style={{ paddingBlock: 'clamp(80px,10vw,140px)' }}>
        <div className="wrap">
          <h1 className="h1">404</h1>
          <p className="sub">الصفحة غير موجودة.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
            <a className="btn btn-p" href="/">الرئيسية</a>
            <a className="btn btn-s" href="/المدونة/">المدونة</a>
          </div>
        </div>
      </section>
    </Shell>
  );
}
