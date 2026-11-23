import { getAllPosts, getTags, PER_PAGE } from '@/lib/wp';
import PostCard, { postHref } from './PostCard';
import BlogFilter from './BlogFilter';
import Shell from './Shell';

export const BLOG = '/المدونة/';
const pageHref = (n: number) => (n === 1 ? BLOG : `${BLOG}page/${n}/`);

/** /المدونة/ and /المدونة/page/N/ — static pages built from the WordPress REST API. */
export default async function BlogList({ page }: { page: number }) {
  const [posts, tags] = await Promise.all([getAllPosts(), getTags()]);
  const pages = Math.ceil(posts.length / PER_PAGE);
  const slice = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const feat = page === 1 ? slice[0] : null;
  const grid = feat ? slice.slice(1) : slice;
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n <= 2 || n >= pages - 1 || Math.abs(n - page) <= 1);

  return (
    <Shell current={BLOG}>
      <section className="bhero">
        <div className="wrap">
          <nav className="crumbs" aria-label="مسار التنقل"><a href="/">الرئيسية</a><span>/</span><span>المدونة</span>{page > 1 && <><span>/</span><span>صفحة {page}</span></>}</nav>
          <h1 className="h1">المدونة</h1>
          <p className="sub" style={{ marginInline: 'auto' }}>تطبيق بينه يقدم خدمة الاستشارات القانونية عبر ربط العملاء مع نخبة من المحامين المرخصين، بينه #درعك_وأمانك_القانوني</p>
          <BlogFilter tags={tags} />
        </div>
      </section>
      <section style={{ paddingBottom: 0 }}>
        <div className="wrap" id="blogServer">
          {feat && (
            <div id="featured">
              <a className="feat" href={postHref(feat.slug)}>
                <span className="img">{feat.image && <img src={feat.image} alt="" />}</span>
                <span className="ft-tx">
                  <span className="eyebrow">أحدث مقال</span>
                  <time dateTime={feat.date}>{feat.date} / بواسطة فريق بينه</time>
                  <h2>{feat.title}</h2>
                  <p>{feat.excerpt}</p>
                  <span className="more">اقرأ المقال <svg width="18" height="18"><use href="#i-arrow" /></svg></span>
                </span>
              </a>
            </div>
          )}
          <div className="list-head" id="list"><h2>جميع المقالات</h2><span>{posts.length} مقال</span></div>
          <div className="posts">{grid.map((p) => <PostCard key={p.id} p={p} />)}</div>
          <nav className="pager" aria-label="الصفحات">
            {page > 1 && <a href={pageHref(page - 1)} rel="prev">السابق</a>}
            {nums.map((n, i) => (
              <span key={n} style={{ display: 'contents' }}>
                {i > 0 && n - nums[i - 1] > 1 && <span className="gap">…</span>}
                {n === page ? <span aria-current="page">{n}</span> : <a href={pageHref(n)}>{n}</a>}
              </span>
            ))}
            {page < pages && <a href={pageHref(page + 1)} rel="next">التالي</a>}
          </nav>
        </div>
      </section>
      <section className="sec" style={{ paddingTop: 'clamp(56px,6vw,88px)' }}>
        <div className="wrap"><div className="cta-band"><div><h3>للحصول على استشارة قانونية متخصصة</h3><p>حمّل تطبيق بينه الآن أو قم بزيارة الموقع الإلكتروني وتواصل مع محامٍ مختص.</p></div><a className="btn btn-w" href="https://bynh.go.link/1mPkZ">حمل تطبيق بينه</a></div></div>
      </section>
    </Shell>
  );
}
