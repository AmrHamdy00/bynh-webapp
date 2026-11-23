import { requireUser } from '@/lib/auth/session';
import { parseRange, clicks } from '@/lib/analytics';
import RangePicker from '../RangePicker';
import { Bar } from '../charts';

export const metadata = { title: 'النقرات' };
const KIND: Record<string, string> = { app_download: 'تحميل التطبيق', whatsapp: 'واتساب', client_login: 'تسجيل دخول العميل', lawyer_signup: 'تسجيل محامي',
  phone: 'اتصال هاتفي', email: 'بريد إلكتروني', social: 'شبكات التواصل', outbound: 'روابط خارجية', cta: 'أزرار داخلية' };

export default async function Clicks({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  await requireUser('author');
  const r = parseRange(await searchParams);
  const c = await clicks(r);
  const max = Math.max(1, ...c.byKind.map((x) => x.clicks));
  return (
    <>
      <div className="top"><h1>النقرات</h1></div>
      <RangePicker r={r} />
      <div className="grid g2">
        <section className="card"><h2>حسب النوع</h2>
          {c.byKind.length ? <table className="tbl mini"><thead><tr><th>النوع</th><th>نقرات</th><th>زوار</th></tr></thead><tbody>
            {c.byKind.map((x) => <tr key={x.kind}><td><div>{KIND[x.kind] || x.kind}</div><Bar value={x.clicks} max={max} /></td><td className="num">{x.clicks}</td><td className="num">{x.visitors}</td></tr>)}
          </tbody></table> : <p className="empty">لا توجد نقرات.</p>}
        </section>
        <section className="card"><h2>الصفحات التي تولّد النقرات</h2>
          {c.byPage.length ? <table className="tbl mini"><thead><tr><th>الصفحة</th><th>نقرات</th><th>تحميل التطبيق</th></tr></thead><tbody>
            {c.byPage.map((x) => <tr key={x.path}><td className="t">{x.path}</td><td className="num">{x.clicks}</td><td className="num">{x.downloads}</td></tr>)}
          </tbody></table> : <p className="empty">—</p>}
        </section>
      </div>
      <section className="card" style={{ marginTop: 14 }}><h2>أكثر الأزرار والروابط نقراً</h2>
        <table className="tbl mini"><thead><tr><th>النوع</th><th>النص</th><th>نقرات</th></tr></thead><tbody>
          {c.byLabel.map((x, i) => <tr key={i}><td>{KIND[x.kind] || x.kind}</td><td className="t">{x.text}</td><td className="num">{x.clicks}</td></tr>)}
        </tbody></table>
      </section>
    </>
  );
}
