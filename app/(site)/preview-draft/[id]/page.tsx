import { notFound } from 'next/navigation';
import Article from '@/components/Article';
import { getPostForPreview } from '@/lib/posts';
import { checkPreviewToken } from '@/lib/preview';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false }, title: 'معاينة' };

/** Draft preview on the public design, reachable only with a signed 30-minute link from the admin. */
export default async function Preview({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const id = Number((await params).id);
  if (!checkPreviewToken(id, (await searchParams).t)) notFound();
  const post = await getPostForPreview(id);
  if (!post) notFound();
  return (
    <>
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: '#8A6A22', color: '#fff', textAlign: 'center', padding: 6, fontSize: 14 }}>معاينة — هذه النسخة غير منشورة</div>
      <Article post={post} />
    </>
  );
}
