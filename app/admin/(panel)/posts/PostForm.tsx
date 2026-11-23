'use client';
import { useActionState, useEffect, useMemo, useState } from 'react';
import RichEditor from './RichEditor';
import { MediaPicker, type MediaItem } from './MediaPicker';
import { savePostAction } from './actions';
import { Msg, Submit } from '../../ui';

export type PostInput = {
  id: number | null; title: string; slug: string; status: 'draft' | 'published' | 'scheduled' | 'trash'; excerpt: string; content: string;
  publishedAt: string; cover: { id: number; path: string } | null; tagIds: number[]; categoryIds: number[];
  seo: { title?: string; description?: string; canonical?: string; robots?: string; ogTitle?: string; ogDescription?: string; focusKeyword?: string };
};

const slugify = (s: string) => s.normalize('NFC').replace(/[ً-ٰٟـ]/g, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 90);
const strip = (h: string) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export default function PostForm({ post, tags, categories, canPublish, site, previewUrl }: {
  post: PostInput; tags: { id: number; name: string }[]; categories: { id: number; name: string }[]; canPublish: boolean; site: string; previewUrl: string | null;
}) {
  const [state, action] = useActionState(savePostAction, undefined);
  useEffect(() => { if (state?.go) window.location.assign(state.go); }, [state]);
  const [title, setTitle] = useState(post.title);
  const [slug, setSlug] = useState(post.slug);
  const [slugTouched, setSlugTouched] = useState(!!post.id);
  const [status, setStatus] = useState(post.status === 'trash' ? 'draft' : post.status);
  const [excerpt, setExcerpt] = useState(post.excerpt);
  const [seoTitle, setSeoTitle] = useState(post.seo.title || '');
  const [seoDesc, setSeoDesc] = useState(post.seo.description || '');
  const [kw, setKw] = useState(post.seo.focusKeyword || '');
  const [cover, setCover] = useState(post.cover);
  const [picker, setPicker] = useState(false);

  const effSlug = slugTouched ? slug : slugify(title);
  const effTitle = seoTitle || (title ? `${title} | بينه` : '');
  const effDesc = seoDesc || excerpt.slice(0, 160);
  const checks = useMemo(() => {
    const k = kw.trim();
    const body = strip(post.content);
    return [
      { ok: effTitle.length >= 30 && effTitle.length <= 65, t: `طول عنوان السيو ${effTitle.length} حرفاً (الأفضل 30–65)` },
      { ok: effDesc.length >= 110 && effDesc.length <= 160, t: `طول الوصف ${effDesc.length} حرفاً (الأفضل 110–160)` },
      ...(k ? [
        { ok: effTitle.includes(k), t: 'الكلمة المفتاحية في عنوان السيو' },
        { ok: effDesc.includes(k), t: 'الكلمة المفتاحية في الوصف' },
        { ok: effSlug.includes(slugify(k)), t: 'الكلمة المفتاحية في الرابط' },
        { ok: body.slice(0, 600).includes(k), t: 'الكلمة المفتاحية في بداية المقال' },
      ] : [{ ok: false, t: 'حدّد كلمة مفتاحية لتحليل أدق' }]),
      { ok: !!cover, t: 'صورة بارزة (تظهر عند المشاركة وفي جوجل)' },
    ];
  }, [kw, effTitle, effDesc, effSlug, cover, post.content]);
  const live = post.id && post.status === 'published';

  return (
    <form action={action} className="pform">
      <input type="hidden" name="id" value={post.id ?? ''} />
      <div className="pmain">
        <Msg state={state} />
        <div className="field"><label htmlFor="t">العنوان (يظهر في الصفحة)</label>
          <input className="in big" id="t" name="title" value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} /></div>
        <div className="field"><label htmlFor="sl">الرابط</label>
          <div className="slug"><span className="ltr muted">{site}/</span>
            <input className="in" id="sl" name="slug" value={effSlug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value); }} required maxLength={200} /><span className="muted">/</span></div>
          {live && effSlug !== post.slug && <span className="hint" style={{ color: 'var(--att)' }}>سيتم تحويل الرابط القديم تلقائياً (301) للحفاظ على ترتيب جوجل.</span>}
        </div>
        <RichEditor name="content" initialHtml={post.content} />
        <div className="field" style={{ marginTop: 14 }}><label htmlFor="ex">المقتطف (يظهر في قائمة المدونة)</label>
          <textarea className="ta" id="ex" name="excerpt" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} maxLength={600} /></div>

        <section className="card" style={{ marginTop: 6 }}>
          <h2>السيو (محركات البحث)</h2>
          <div className="serp" aria-label="معاينة نتيجة جوجل">
            <div className="serp-url ltr">{site.replace('https://', '')} › {decodeURIComponent(effSlug)}</div>
            <div className="serp-title">{effTitle || 'عنوان المقال'}</div>
            <div className="serp-desc">{effDesc || 'وصف المقال الذي يظهر في نتائج البحث.'}</div>
          </div>
          <div className="grid g2">
            <div className="field"><label htmlFor="kw">الكلمة المفتاحية</label><input className="in" id="kw" name="focusKeyword" value={kw} onChange={(e) => setKw(e.target.value)} maxLength={100} /></div>
            <div className="field"><label htmlFor="st">عنوان السيو <span className="muted num">{effTitle.length}</span></label><input className="in" id="st" name="seoTitle" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} placeholder={title ? `${title} | بينه` : ''} maxLength={200} /></div>
          </div>
          <div className="field"><label htmlFor="sd">الوصف <span className="muted num">{effDesc.length}</span></label><textarea className="ta" id="sd" name="seoDescription" value={seoDesc} onChange={(e) => setSeoDesc(e.target.value)} placeholder={excerpt.slice(0, 160)} maxLength={400} style={{ minHeight: 70 }} /></div>
          <ul className="checks">{checks.map((c) => <li key={c.t} className={c.ok ? 'ok' : 'no'}>{c.t}</li>)}</ul>
          <details style={{ marginTop: 10 }}><summary className="small" style={{ cursor: 'pointer' }}>إعدادات متقدمة</summary>
            <div className="grid g2" style={{ marginTop: 10 }}>
              <div className="field"><label htmlFor="ogt">عنوان المشاركة (فيسبوك/واتساب)</label><input className="in" id="ogt" name="ogTitle" defaultValue={post.seo.ogTitle || ''} maxLength={200} /></div>
              <div className="field"><label htmlFor="ogd">وصف المشاركة</label><input className="in" id="ogd" name="ogDescription" defaultValue={post.seo.ogDescription || ''} maxLength={400} /></div>
              <div className="field"><label htmlFor="can">الرابط القانوني (canonical)</label><input className="in ltr" id="can" name="seoCanonical" defaultValue={post.seo.canonical || ''} placeholder="تلقائي" maxLength={500} /></div>
              <label className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" name="noindex" defaultChecked={(post.seo.robots || '').includes('noindex')} /> إخفاء من محركات البحث (noindex)</label>
            </div>
          </details>
        </section>
      </div>

      <aside className="pside">
        <section className="card">
          <h2>النشر</h2>
          <div className="field"><label htmlFor="ps">الحالة</label>
            <select className="sel" id="ps" name="status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="draft">مسودة</option>
              {canPublish && <option value="published">منشور</option>}
              {canPublish && <option value="scheduled">مجدول</option>}
            </select></div>
          {(status !== 'draft' || post.publishedAt) && (
            <div className="field"><label htmlFor="pa">تاريخ النشر (توقيت الرياض)</label>
              <input className="in ltr" id="pa" type="datetime-local" name="publishedAt" defaultValue={post.publishedAt} /></div>)}
          {!canPublish && <p className="small muted" style={{ marginBottom: 10 }}>سيراجع المحرر المسودة وينشرها.</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Submit className="btn btn-p">{status === 'published' ? (live ? 'تحديث' : 'نشر') : status === 'scheduled' ? 'جدولة' : 'حفظ المسودة'}</Submit>
            {previewUrl && <a className="btn btn-s" href={previewUrl} target="_blank" rel="noopener">معاينة</a>}
            {live && <a className="btn btn-s" href={`${site}/${post.slug}/`} target="_blank" rel="noopener">عرض</a>}
          </div>
        </section>
        <section className="card">
          <h2>الصورة البارزة</h2>
          <input type="hidden" name="coverMediaId" value={cover?.id ?? ''} />
          {cover ? <img src={cover.path} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 8 }} /> : <p className="small muted" style={{ marginBottom: 8 }}>لا توجد صورة.</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-s btn-sm" onClick={() => setPicker(true)}>{cover ? 'تغيير' : 'اختيار صورة'}</button>
            {cover && <button type="button" className="btn btn-s btn-sm" onClick={() => setCover(null)}>إزالة</button>}
          </div>
        </section>
        <section className="card">
          <h2>الوسوم</h2>
          <div className="checklist">{tags.map((t) => <label key={t.id}><input type="checkbox" name="tags" value={t.id} defaultChecked={post.tagIds.includes(t.id)} /> {t.name}</label>)}</div>
          <input className="in" name="newTag" placeholder="وسم جديد" maxLength={60} style={{ marginTop: 8 }} />
        </section>
        <section className="card">
          <h2>التصنيف</h2>
          <div className="checklist">{categories.map((t) => <label key={t.id}><input type="checkbox" name="categories" value={t.id} defaultChecked={post.categoryIds.includes(t.id)} /> {t.name}</label>)}</div>
        </section>
      </aside>
      {picker && <MediaPicker onClose={() => setPicker(false)} onPick={(m: MediaItem) => { setCover({ id: m.id, path: m.sizes?.medium_large?.path || m.sizes?.large?.path || m.path }); setPicker(false); }} />}
    </form>
  );
}
