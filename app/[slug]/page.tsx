/**
 * One route for every root-level Arabic address, so all existing bynh.sa URLs keep working:
 *  - the Arabic-slug marketing pages (consultations, services, join as lawyer, FAQ, registration, blog)
 *  - all WordPress posts, which live at the site root: bynh.sa/<post-slug>/
 */
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import BlogList from '@/components/BlogList';
import Article from '@/components/Article';
import ConsultationsPage from '@/components/pages/ConsultationsPage';
import ServicesPage from '@/components/pages/ServicesPage';
import LawyersPage from '@/components/pages/LawyersPage';
import FaqPage from '@/components/pages/FaqPage';
import RegisterPage from '@/components/pages/RegisterPage';
import { getAllPosts, getPost, publicUrl, SITE_URL } from '@/lib/wp';
import { pageMeta, type PagePath } from '@/lib/seo';

const STATIC: Record<string, { path: PagePath; nav?: string; render: () => React.ReactNode }> = {
  'استشارات-قانونية': { path: '/استشارات-قانونية/', render: () => <ConsultationsPage /> },
  'خدمات-قانونية': { path: '/خدمات-قانونية/', render: () => <ServicesPage /> },
  'طلب-تسجيل-محامي': { path: '/طلب-تسجيل-محامي/', nav: '/طلب-تسجيل-محامي/', render: () => <LawyersPage /> },
  'الأسئلة-الشائعة': { path: '/الأسئلة-الشائعة/', nav: '/الأسئلة-الشائعة/', render: () => <FaqPage /> },
  'التسجيل': { path: '/التسجيل/', render: () => <RegisterPage /> },
};
const BLOG_SLUG = 'المدونة';

export const dynamicParams = false;

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return [...Object.keys(STATIC), BLOG_SLUG, ...posts.map((p) => p.slug)].map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };
const slugOf = async (params: Props['params']) => decodeURIComponent((await params).slug);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = await slugOf(params);
  if (STATIC[slug]) return pageMeta(STATIC[slug].path);
  if (slug === BLOG_SLUG) return pageMeta('/المدونة/');
  const post = await getPost(slug);
  if (!post) return {};
  const y = post.seo;
  const url = `${SITE_URL}/${encodeURI(post.slug)}/`;
  return {
    title: { absolute: y.title || `${post.title} - بينه` },
    description: y.description || post.excerpt,
    alternates: { canonical: publicUrl(y.canonical) || url },
    openGraph: { type: 'article', url, title: y.og_title || post.title, description: y.og_description || y.description || post.excerpt,
      siteName: 'بينه', locale: 'ar_SA', publishedTime: post.date, images: post.image ? [post.image] : y.og_image?.map((i) => i.url) },
    twitter: { card: 'summary_large_image', site: '@bynh_sa' },
  };
}

export default async function Page({ params }: Props) {
  const slug = await slugOf(params);
  const st = STATIC[slug];
  if (st) return <Shell current={st.nav}>{st.render()}</Shell>;
  if (slug === BLOG_SLUG) return <BlogList page={1} />;
  const post = await getPost(slug);
  if (!post) notFound();
  return <Article post={post} />;
}
