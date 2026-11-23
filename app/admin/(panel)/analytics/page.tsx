import { requireUser } from '@/lib/auth/session';
import { parseRange, summary, daily, breakdown } from '@/lib/analytics';
import RangePicker from './RangePicker';
import Stat from './Stat';
import { TrendChart, Bar } from './charts';

export const metadata = { title: 'الزيارات' };
const DEV = { mobile: 'جوال', desktop: 'كمبيوتر', tablet: 'تابلت' } as Record<string, string>;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function Table({ title, rows, keyLabel, map }: { title: string; rows: { key: string; visitors: number; views: number }[]; keyLabel: string; map?: Record<string, string> }) {
  const max = Math.max(1, ...rows.map((r) => r.views));
  return (
    <section className="card">
      <h2>{title}</h2>
      {rows.length ? <table className="tbl mini"><thead><tr><th>{keyLabel}</th><th>زوار</th><th>مشاهدات</th></tr></thead><tbody>
        {rows.map((r) => <tr key={r.key}><td className="t"><div className="t">{map?.[r.key] || r.key}</div><Bar value={r.views} max={max} /></td><td className="num">{r.visitors}</td><td className="num">{r.views}</td></tr>)}
      </tbody></table> : <p className="empty">لا توجد بيانات في هذه الفترة.</p>}
    </section>
  );
}

export default async function Traffic({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireUser('author');
  const r = parseRange(await searchParams);
  const [sum, days, pages, sources, devices, browsers, countries, campaigns] = await Promise.all([
    summary(r), daily(r), breakdown(r, 'path'), breakdown(r, 'source'), breakdown(r, 'device'), breakdown(r, 'browser'), breakdown(r, 'country'), breakdown(r, 'campaign'),
  ]);
  const { now, before } = sum;
  return (
    <>
      <div className="top"><h1>الزيارات</h1></div>
      <RangePicker r={r} />
      <div className="grid g4">
        <Stat label="الزوار" now={now.visitors} before={before.visitors} />
        <Stat label="الجلسات" now={now.sessions} before={before.sessions} />
        <Stat label="مشاهدات الصفحات" now={now.pageviews} before={before.pageviews} />
        <Stat label="نسبة الارتداد" now={now.bounce} before={before.bounce} unit="%" lowerIsBetter />
      </div>
      <section className="card" style={{ marginTop: 14 }}>
        <h2>الزوار يومياً <span className="small muted">· متوسط وقت التفاعل للجلسة <span className="num">{mmss(now.engaged)}</span></span></h2>
        <TrendChart data={days} metric="visitors" label="الزوار" secondary={{ key: 'pageviews', label: 'المشاهدات' }} />
        <details className="small" style={{ marginTop: 8 }}><summary>عرض كجدول</summary>
          <table className="tbl mini"><thead><tr><th>اليوم</th><th>زوار</th><th>مشاهدات</th></tr></thead><tbody>{days.map((d) => <tr key={d.day}><td className="num">{d.day}</td><td className="num">{d.visitors}</td><td className="num">{d.pageviews}</td></tr>)}</tbody></table>
        </details>
      </section>
      <div className="grid g2" style={{ marginTop: 14 }}>
        <Table title="أكثر الصفحات زيارة" rows={pages} keyLabel="الصفحة" />
        <Table title="المصادر" rows={sources} keyLabel="المصدر" />
        <Table title="الأجهزة" rows={devices} keyLabel="الجهاز" map={DEV} />
        <Table title="المتصفحات" rows={browsers} keyLabel="المتصفح" />
        <Table title="الدول" rows={countries} keyLabel="الدولة" />
        <Table title="الحملات (UTM)" rows={campaigns} keyLabel="الحملة" />
      </div>
    </>
  );
}
