/** Blog pagination: /المدونة/page/2/ … (same pattern WordPress uses today). */
import { notFound } from 'next/navigation';
import BlogList from '@/components/BlogList';
import { getAllPosts, PER_PAGE } from '@/lib/posts';
import { pageMeta } from '@/lib/seo';

export const dynamicParams = true;
export async function generateStaticParams() { return []; }

type Props = { params: Promise<{ slug: string; n: string }> };

export async function generateMetadata({ params }: Props) {
  await params;
  return pageMeta('/المدونة/'); // WordPress/Yoast served page N with page 1's title and canonical
}

export default async function Page({ params }: Props) {
  const { slug, n } = await params;
  const num = Number(n);
  if (decodeURIComponent(slug) !== 'المدونة' || !/^\d+$/.test(n) || num < 2) notFound();
  if (num > Math.ceil((await getAllPosts()).length / PER_PAGE)) notFound();
  return <BlogList page={num} />;
}
