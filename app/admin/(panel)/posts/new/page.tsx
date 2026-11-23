import { requireUser, can } from '@/lib/auth/session';
import { SITE_URL } from '@/lib/content';
import PostForm from '../PostForm';
import { taxonomies } from '../load';

export const metadata = { title: 'مقال جديد' };

export default async function NewPost() {
  const me = await requireUser('author');
  const { tags, categories } = await taxonomies();
  const defaults = { id: null, title: '', slug: '', status: 'draft' as const, excerpt: '', content: '', publishedAt: '', cover: null,
    tagIds: tags.filter((t) => ['استشارات قانونية', 'تطبيق بينه'].includes(t.name)).map((t) => t.id),
    categoryIds: categories.filter((c) => c.name === 'تطبيق بينه').map((c) => c.id), seo: {} };
  return (
    <>
      <div className="top"><h1>مقال جديد</h1><div className="acts"><a className="btn btn-s" href="/admin/posts/">كل المقالات</a></div></div>
      <PostForm post={defaults} tags={tags} categories={categories} canPublish={can(me, 'editor')} site={SITE_URL} previewUrl={null} />
    </>
  );
}
