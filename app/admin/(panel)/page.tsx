import { count, eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { parseRange, summary, daily, blogReading, clicks } from '@/lib/analytics';
import Stat from './analytics/Stat';
import { TrendChart } from './analytics/charts';

export const metadata = { title: 'نظرة عامة' };

export default async function Overview() {
  const me = await requireUser();
  const r = parseRange({ range: '30' });
  const [[drafts], [leads], sum, days, top, c] = await Promise.all([
    db.select({ n: count() }).from(s.posts).where(eq(s.posts.status, 'draft')),
    db.select({ n: count() }).from(s.leads).where(eq(s.leads.status, 'new')),
    summary(r), daily(r), blogReading(r, 5), clicks(r),
  ]);
  const downloads = c.byKind.find((k) => k.kind === 'app_download')?.clicks || 0;
  return (
    <>
      <div className="top"><h1>أهلاً {me.displayName}</h1><div className="acts"><a className="btn btn-p" href="/admin/posts/new/">مقال جديد</a></div></div>
      <p className="muted small" style={{ marginBottom: 12 }}>آخر 30 يوماً</p>
      <div className="grid g4">
        <Stat label="الزوار" now={sum.now.visitors} before={sum.before.visitors} />
        <Stat label="مشاهدات الصفحات" now={sum.now.pageviews} before={sum.before.pageviews} />
        <div className="card stat"><div className="k">نقرات تحميل التطبيق</div><div className="v num">{downloads.toLocaleString('en-US')}</div><div className="d"><a href="/admin/analytics/clicks/">كل النقرات</a></div></div>
        <div className="card stat"><div className="k">طلبات تسجيل جديدة</div><div className="v num">{leads.n}</div><div className="d"><a href="/admin/leads/">عرض الطلبات</a> · <span className="muted">مسودات: {drafts.n}</span></div></div>
      </div>
      <section className="card" style={{ marginTop: 14 }}><h2>الزوار يومياً</h2><TrendChart data={days} metric="visitors" label="الزوار" secondary={{ key: 'pageviews', label: 'المشاهدات' }} /></section>
      <section className="card" style={{ marginTop: 14 }}><h2>أكثر المقالات قراءة</h2>
        {top.length ? <table className="tbl mini"><thead><tr><th>المقال</th><th>مشاهدات</th><th>عمق القراءة</th></tr></thead><tbody>
          {top.map((x) => <tr key={x.path}><td className="t">{x.title?.replace(/ \| بينه$/, '') || x.path}</td><td className="num">{x.views}</td><td className="num">{x.depth}%</td></tr>)}
        </tbody></table> : <p className="empty">لا توجد قراءات بعد.</p>}
      </section>
    </>
  );
}
