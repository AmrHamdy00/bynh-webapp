import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withToc } from '@/lib/content';
import Shell from './Shell';
import PageJsonLd from './PageJsonLd';
import type { PagePath } from '@/lib/seo';

/** Legal documents (privacy, terms, provider agreement) — text verbatim from bynh.sa, kept in content/legal/*.html. */
export default function LegalPage({ file, title, crumb, path }: { file: string; title: string; crumb: string; path: PagePath }) {
  const { html, toc } = withToc(readFileSync(join(process.cwd(), 'content/legal', file), 'utf8'));
  return (
    <Shell>
      <PageJsonLd path={path} />
      <section className="phero">
        <div className="wrap">
          <nav className="crumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>/</span><span>{crumb}</span></nav>
          <h1 className="h1" style={{ fontSize: 'clamp(30px,4vw,52px)' }}>{title}</h1>
        </div>
      </section>
      <section style={{ paddingBottom: 'clamp(64px,8vw,110px)' }}>
        <div className="wrap agrid legal">
          <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
          <aside className="aside">
            {toc.length > 0 && <nav className="toc" aria-label="المحتويات"><p>المحتويات</p>{toc.map((t) => <a key={t.id} href={`#${t.id}`}>{t.text}</a>)}</nav>}
            <div className="aside-cta"><b>أسئلة عن الشروط؟</b><p>الدعم الفني: support@bynh.sa</p><a className="btn btn-w" href="/contact-us/">تواصل معنا</a></div>
          </aside>
        </div>
      </section>
    </Shell>
  );
}
