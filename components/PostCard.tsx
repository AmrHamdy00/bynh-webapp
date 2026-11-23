import type { Post } from '@/lib/wp';

export const postHref = (slug: string) => `/${slug}/`;

export default function PostCard({ p }: { p: Pick<Post, 'slug' | 'date' | 'title' | 'excerpt' | 'imageSmall'> }) {
  return (
    <a className="post" href={postHref(p.slug)}>
      <span className="img">
        {p.imageSmall ? <img src={p.imageSmall} alt="" loading="lazy" width={768} height={621} /> : <span className="noimg"><img src="/img/mark.png" alt="" /></span>}
      </span>
      <time dateTime={p.date}>{p.date} / بواسطة فريق بينه</time>
      <h3>{p.title}</h3>
      <p>{p.excerpt}</p>
    </a>
  );
}
