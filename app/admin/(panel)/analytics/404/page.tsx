import { requireUser } from '@/lib/auth/session';
import { parseRange, notFound } from '@/lib/analytics';
import RangePicker from '../RangePicker';

export const metadata = { title: 'روابط مكسورة' };

export default async function NotFoundReport({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireUser('author');
  const r = parseRange(await searchParams);
  const rows = await notFound(r);
  return (
    <>
      <div className="top"><h1>روابط مكسورة (404)</h1></div>
      <p className="muted small" style={{ marginBottom: 12 }}>صفحات طلبها الزوار ولم توجد. حوّل المهم منها إلى صفحة مناسبة للحفاظ على الزيارات وترتيب جوجل.</p>
      <RangePicker r={r} />
      <div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>الرابط</th><th>مرات الطلب</th><th>جاء من</th><th>آخر مرة</th><th></th></tr></thead>
        <tbody>{rows.length ? rows.map((x) => (
          <tr key={x.path}><td className="t">{x.path}</td><td className="num">{x.hits}</td><td className="ltr small">{x.referrer || 'مباشر'}</td><td className="small num">{x.last.slice(0, 16)}</td>
            <td><a className="btn btn-s btn-sm" href={`/admin/redirects/?from=${encodeURIComponent(x.path)}`}>تحويل</a></td></tr>)) : <tr><td colSpan={5} className="empty">لا توجد روابط مكسورة في هذه الفترة.</td></tr>}
        </tbody></table></div>
    </>
  );
}
