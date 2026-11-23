import { count, eq } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { requireUser } from '@/lib/auth/session';

export const metadata = { title: 'نظرة عامة' };

export default async function Overview() {
  const me = await requireUser();
  const [[posts], [drafts], [media], [leads]] = await Promise.all([
    db.select({ n: count() }).from(s.posts).where(eq(s.posts.status, 'published')),
    db.select({ n: count() }).from(s.posts).where(eq(s.posts.status, 'draft')),
    db.select({ n: count() }).from(s.media),
    db.select({ n: count() }).from(s.leads).where(eq(s.leads.status, 'new')),
  ]);
  return (
    <>
      <div className="top"><h1>أهلاً {me.displayName}</h1><div className="acts"><a className="btn btn-p" href="/admin/posts/new/">مقال جديد</a></div></div>
      <div className="grid g4">
        <div className="card stat"><div className="k">مقالات منشورة</div><div className="v num">{posts.n}</div></div>
        <div className="card stat"><div className="k">مسودات</div><div className="v num">{drafts.n}</div></div>
        <div className="card stat"><div className="k">ملفات الوسائط</div><div className="v num">{media.n}</div></div>
        <div className="card stat"><div className="k">طلبات تسجيل جديدة</div><div className="v num">{leads.n}</div></div>
      </div>
    </>
  );
}
