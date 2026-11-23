import { notFound } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser, can } from '@/lib/auth/session';
import { SITE_URL } from '@/lib/content';
import { previewToken } from '@/lib/preview';
import PostForm from '../PostForm';
import { loadPost, taxonomies } from '../load';
import { restorePostAction } from '../actions';

export const metadata = { title: 'تحرير مقال' };
const fmt = (d: Date) => d.toLocaleString('ar-SA-u-nu-latn', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Riyadh' });

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser('author');
  const id = Number((await params).id);
  const post = await loadPost(id);
  if (!post) notFound();
  if (!can(me, 'editor') && (post.authorId !== me.id)) notFound();
  const { tags, categories } = await taxonomies();
  const revisions = await db.select({ id: s.postRevisions.id, at: s.postRevisions.at, name: s.users.displayName }).from(s.postRevisions)
    .leftJoin(s.users, eq(s.users.id, s.postRevisions.userId)).where(eq(s.postRevisions.postId, id)).orderBy(desc(s.postRevisions.at)).limit(10);
  const site = process.env.PUBLIC_ORIGIN || SITE_URL;
  return (
    <>
      <div className="top"><h1>تحرير مقال</h1><div className="acts"><a className="btn btn-s" href="/admin/posts/">كل المقالات</a><a className="btn btn-p" href="/admin/posts/new/">مقال جديد</a></div></div>
      {post.status === 'trash' && <div className="msg warn" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>هذا المقال في سلة المحذوفات.
        {can(me, 'editor') && <form action={restorePostAction}><input type="hidden" name="id" value={id} /><button className="btn btn-s btn-sm">استعادة كمسودة</button></form>}</div>}
      <PostForm post={post} tags={tags} categories={categories} canPublish={can(me, 'editor')} site={SITE_URL}
        previewUrl={`${site}/preview-draft/${id}/?t=${previewToken(id)}`} />
      {revisions.length > 0 && (
        <section className="card" style={{ marginTop: 14 }}><h2>سجل التعديلات</h2>
          <ul className="small muted" style={{ margin: 0, paddingInlineStart: 18 }}>{revisions.map((r) => <li key={r.id}>{fmt(r.at)} — {r.name || '—'}</li>)}</ul></section>)}
    </>
  );
}
