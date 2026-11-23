import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';
import { PAGES } from '@/lib/seo';
import { ActionForm, Submit } from '../../ui';
import { savePageSeoAction } from './actions';

export const metadata = { title: 'سيو الصفحات' };

export default async function PagesSeo() {
  await requireUser('editor');
  const rows = new Map((await db.select().from(s.pageSeo)).map((r) => [r.path, r]));
  return (
    <>
      <div className="top"><h1>سيو الصفحات</h1></div>
      <p className="muted small" style={{ marginBottom: 14 }}>العناوين والأوصاف المنقولة من Yoast. أي تعديل يظهر في الموقع فوراً.</p>
      <div className="grid">{Object.entries(PAGES).map(([path, d]) => {
        const r = rows.get(path); const y = r?.seo || {};
        return (
          <details key={path} className="card">
            <summary style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', gap: 10 }}><b>{r?.name || path}</b><span className="small muted">{path}</span></summary>
            <ActionForm action={savePageSeoAction} className="grid g2">
              <input type="hidden" name="path" value={path} />
              <div className="field"><label>عنوان السيو</label><input className="in" name="title" defaultValue={y.title || d.title} maxLength={200} /></div>
              <div className="field"><label>عنوان المشاركة</label><input className="in" name="ogTitle" defaultValue={y.ogTitle || ''} maxLength={200} /></div>
              <div className="field"><label>الوصف</label><textarea className="ta" name="description" defaultValue={y.description || d.description} maxLength={400} /></div>
              <div className="field"><label>وصف المشاركة</label><textarea className="ta" name="ogDescription" defaultValue={y.ogDescription || ''} maxLength={400} /></div>
              <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="noindex" defaultChecked={(y.robots || '').includes('noindex')} /> إخفاء من محركات البحث</label>
              <div><Submit className="btn btn-p btn-sm">حفظ</Submit></div>
            </ActionForm>
          </details>);
      })}</div>
    </>
  );
}
