import { getAllPosts, withToc, SITE_URL, type Post } from '@/lib/wp';
import PostCard from './PostCard';
import Shell from './Shell';
import { BLOG } from './BlogList';

/** A WordPress post rendered at its original address: bynh.sa/<arabic-slug>/ */
export default async function Article({ post }: { post: Post }) {
  const all = await getAllPosts();
  // the WordPress body repeats the post title as its own <h1>; the page already has one
  const body = post.content.replace(/^([\s\S]{0,800}?)<h1[^>]*>[\s\S]*?<\/h1>/, '$1');
  const { html, toc } = withToc(body);
  // many posts open with their own cover image inside the content; don't show it twice
  const coverBase = post.image ? post.image.split('/').pop()!.replace(/-\d+x\d+(?=\.\w+$)/, '').replace(/\.\w+$/, '') : '';
  const coverInContent = !!coverBase && post.content.slice(0, 1500).includes(coverBase);
  const shared = (p: Post) => p.tags.filter((t) => post.tags.includes(t)).length;
  const related = all.filter((p) => p.id !== post.id).slice(0, 60).sort((a, b) => shared(b) - shared(a)).slice(0, 3);
  const url = encodeURIComponent(`${SITE_URL}/${encodeURI(post.slug)}/`);
  const share = [['X', `https://x.com/intent/tweet?url=${url}`], ['Facebook', `https://www.facebook.com/sharer/sharer.php?u=${url}`],
    ['LinkedIn', `https://www.linkedin.com/sharing/share-offsite/?url=${url}`], ['WhatsApp', `https://wa.me/?text=${url}`]];
  const ld = { '@context': 'https://schema.org', '@type': 'Article', headline: post.title, datePublished: post.date, image: post.image || undefined,
    author: { '@type': 'Organization', name: 'فريق بينه' }, publisher: { '@type': 'Organization', name: 'بينه', logo: { '@type': 'ImageObject', url: `${SITE_URL}/img/mark.png` } },
    mainEntityOfPage: `${SITE_URL}/${encodeURI(post.slug)}/` };

  return (
    <Shell current={BLOG}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <section className="ahero">
        <div className="wrap">
          <nav className="crumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>/</span><a href={BLOG}>المدونة</a><span>/</span><span>{post.title}</span></nav>
          <h1>{post.title}</h1>
          <div className="ameta"><time dateTime={post.date}>{post.date}</time><span className="dt"></span>بواسطة فريق بينه</div>
          <div className="atags">{post.tags.map((t) => <span className="tchip" key={t}>{t}</span>)}</div>
          {post.image && !coverInContent && <div className="aimg"><img src={post.image} alt="" /></div>}
        </div>
      </section>
      <section style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="wrap agrid">
          <div>
            {/* WordPress content, as authored */}
            <article className="prose" dangerouslySetInnerHTML={{ __html: html }} />
            <div className="share"><b>شارك في نشر الموضوع</b>{share.map(([n, h]) => <a key={n} href={h} rel="noopener">{n}</a>)}</div>
          </div>
          <aside className="aside">
            {toc.length > 0 && (
              <nav className="toc" aria-label="محتويات المقال"><p>محتويات المقال</p>{toc.map((t) => <a key={t.id} href={`#${t.id}`}>{t.text}</a>)}</nav>
            )}
            <div className="aside-cta"><b>للحصول على استشارة قانونية متخصصة</b><p>حمّل تطبيق بينه الآن أو قم بزيارة الموقع الإلكتروني وتواصل مع محامٍ مختص.</p><a className="btn btn-w" href="https://bynh.go.link/1mPkZ">حمل تطبيق بينه</a></div>
          </aside>
        </div>
      </section>
      <section className="sec">
        <div className="wrap">
          <div className="blog-head"><div><span className="eyebrow">المدونة</span><h2 className="h2">مقالات أخرى</h2></div><a className="btn btn-s" href={BLOG}>المزيد من مقالات بينه</a></div>
          <div className="posts">{related.map((p) => <PostCard key={p.id} p={p} />)}</div>
        </div>
      </section>
    </Shell>
  );
}
