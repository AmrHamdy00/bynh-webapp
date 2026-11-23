import { asc } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, can } from '@/lib/auth/session';
import { parseRange, funnel, type Step } from '@/lib/analytics';
import RangePicker from '../analytics/RangePicker';
import { ActionForm, Submit } from '../../ui';
import { saveFunnelAction, deleteFunnelAction } from './actions';

export const metadata = { title: 'مسارات التحويل' };

/** Ready-made funnels for the site's main goals (shown until the team defines its own). */
const DEFAULTS: { name: string; steps: Step[] }[] = [
  { name: 'أي زيارة ← تحميل التطبيق', steps: [{ type: 'pageview', match: '*', label: 'زيارة الموقع' }, { type: 'click', match: 'app_download', label: 'نقر تحميل التطبيق' }] },
  { name: 'المدونة ← مقال ← تحميل التطبيق', steps: [{ type: 'pageview', match: '/المدونة/*', label: 'صفحة المدونة' }, { type: 'pageview', match: '/*', label: 'فتح صفحة أخرى' }, { type: 'click', match: 'app_download', label: 'تحميل التطبيق' }] },
  { name: 'الاستشارات القانونية ← تحميل التطبيق', steps: [{ type: 'pageview', match: '/استشارات-قانونية/', label: 'صفحة الاستشارات' }, { type: 'click', match: 'app_download', label: 'تحميل التطبيق' }] },
  { name: 'طلب تسجيل محامي', steps: [{ type: 'pageview', match: '/طلب-تسجيل-محامي/', label: 'صفحة انضم كمحامي' }, { type: 'click', match: 'lawyer_signup', label: 'نقر التسجيل' }] },
  { name: 'نموذج التسجيل', steps: [{ type: 'pageview', match: '/التسجيل/', label: 'صفحة التسجيل' }, { type: 'form', match: 'register', label: 'إرسال الطلب' }] },
];

export default async function Funnels({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const me = await requireUser('author');
  const r = parseRange(await searchParams);
  const saved = await db.select().from(s.funnels).orderBy(asc(s.funnels.id));
  const list = [...DEFAULTS.map((d) => ({ ...d, id: 0 })), ...saved];
  const results = await Promise.all(list.map((f) => funnel(r, f.steps)));
  return (
    <>
      <div className="top"><h1>مسارات التحويل</h1></div>
      <p className="muted small" style={{ marginBottom: 12 }}>كم جلسة أكملت كل خطوة بالترتيب داخل الزيارة نفسها.</p>
      <RangePicker r={r} />
      <div className="grid g2">{list.map((f, i) => {
        const res = results[i]; const top = Math.max(1, res[0]?.sessions || 0);
        return (
          <section className="card" key={`${f.id}-${f.name}`}>
            <h2 style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>{f.name}
              {f.id > 0 && can(me, 'editor') && <form action={deleteFunnelAction}><input type="hidden" name="id" value={f.id} /><button className="linkbtn small">حذف</button></form>}</h2>
            <ol className="funnel">{res.map((st, j) => {
              const pct = Math.round((st.sessions / top) * 100);
              const stepPct = j ? Math.round((st.sessions / Math.max(1, res[j - 1].sessions)) * 100) : 100;
              return (
                <li key={j}>
                  <div className="fl"><span>{j + 1}. {st.label}</span><span className="num">{st.sessions.toLocaleString('en-US')} <span className="muted">({pct}%)</span></span></div>
                  <span className="hbar"><i style={{ width: `${pct}%` }} /></span>
                  {j > 0 && <div className="small muted">من الخطوة السابقة: <span className="num">{stepPct}%</span></div>}
                </li>);
            })}</ol>
          </section>);
      })}</div>
      {can(me, 'editor') && (
        <section className="card" style={{ marginTop: 14 }}>
          <h2>مسار جديد</h2>
          <ActionForm action={saveFunnelAction}>
            <div className="field"><label>الاسم</label><input className="in" name="name" required maxLength={100} /></div>
            {[0, 1, 2, 3].map((i) => (
              <div className="grid g3" key={i}>
                <div className="field"><label>الخطوة {i + 1}</label><select className="sel" name="type" defaultValue={i === 0 ? 'pageview' : 'click'}><option value="pageview">زيارة صفحة</option><option value="click">نقرة</option><option value="form">إرسال نموذج</option></select></div>
                <div className="field"><label>المطابقة</label><input className="in" name="match" placeholder={i === 0 ? '/المدونة/*' : 'app_download'} /></div>
                <div className="field"><label>الاسم الظاهر</label><input className="in" name="label" /></div>
              </div>))}
            <p className="small muted" style={{ marginBottom: 10 }}>زيارة صفحة: المسار مع * لأي شيء. نقرة: app_download، whatsapp، client_login، lawyer_signup، phone، outbound. نموذج: register.</p>
            <Submit className="btn btn-p">حفظ المسار</Submit>
          </ActionForm>
        </section>)}
    </>
  );
}
