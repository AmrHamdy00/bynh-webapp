/** Blog pagination: /المدونة/page/2/ … (same pattern WordPress uses today). */
import { notFound } from 'next/navigation';
import BlogList from '@/components/BlogList';
import { getAllPosts, PER_PAGE } from '@/lib/wp';
import { pageMeta } from '@/lib/seo';

export const dynamicParams = false;

export async function generateStaticParams() {
  const pages = Math.ceil((await getAllPosts()).length / PER_PAGE);
  return Array.from({ length: Math.max(0, pages - 1) }, (_, i) => ({ slug: 'المدونة', n: String(i + 2) }));
}

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props) {
  const { n } = await params;
  return pageMeta('/المدونة/', { title: `المدونة - صفحة ${n} | تطبيق بينه للاستشارات القانونية` });
}

export default async function Page({ params }: Props) {
  const { slug, n } = await params;
  if (decodeURIComponent(slug) !== 'المدونة') notFound();
  return <BlogList page={Number(n)} />;
}
