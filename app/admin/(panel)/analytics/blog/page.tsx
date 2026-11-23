import { requireUser } from '@/lib/auth/session';
import { parseRange, blogReading } from '@/lib/analytics';
import RangePicker from '../RangePicker';
import { Bar } from '../charts';

export const metadata = { title: 'قراءة المدونة' };
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default async function BlogReading({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireUser('author');
  const r = parseRange(await searchParams);
  const rows = await blogReading(r, 100);
  const tot = rows.reduce((a, x) => ({ views: a.views + x.views, readers: a.readers + x.readers }), { views: 0, readers: 0 });
  const avgDepth = rows.length ? Math.round(rows.reduce((a, x) => a + x.depth * x.views, 0) / Math.max(1, tot.views)) : 0;
  const avgDone = rows.length ? Math.round(rows.reduce((a, x) => a + x.completion * x.views, 0) / Math.max(1, tot.views)) : 0;
  const max = Math.max(1, ...rows.map((x) => x.views));
  return (
    <>
      <div className="top"><h1>قراءة المدونة</h1></div>
      <RangePicker r={r} />
      <div className="grid g4">
        <div className="card stat"><div className="k">مشاهدات المقالات</div><div className="v num">{tot.views.toLocaleString('en-US')}</div></div>
        <div className="card stat"><div className="k">قرّاء</div><div className="v num">{tot.readers.toLocaleString('en-US')}</div></div>
        <div className="card stat"><div className="k">متوسط عمق القراءة</div><div className="v num">{avgDepth}%</div></div>
        <div className="card stat"><div className="k">أكملوا القراءة (90%+)</div><div className="v num">{avgDone}%</div></div>
      </div>
      <div className="tbl-wrap" style={{ marginTop: 14 }}><table className="tbl">
        <thead><tr><th>المقال</th><th>مشاهدات</th><th>قرّاء</th><th>عمق القراءة</th><th>أكملوا</th><th>متوسط الوقت</th></tr></thead>
        <tbody>{rows.length ? rows.map((x) => (
          <tr key={x.path}><td className="t"><a href={x.path} target="_blank" rel="noopener" className="t" style={{ display: 'block' }}>{x.title?.replace(/ \| بينه$/, '') || x.path}</a><Bar value={x.views} max={max} /></td>
            <td className="num">{x.views}</td><td className="num">{x.readers}</td><td><span className="meter"><i style={{ width: `${x.depth}%` }} /></span> <span className="num">{x.depth}%</span></td>
            <td className="num">{x.completion}%</td><td className="num">{mmss(x.seconds)}</td></tr>)) : <tr><td colSpan={6} className="empty">لا توجد قراءات في هذه الفترة.</td></tr>}
        </tbody></table></div>
    </>
  );
}
