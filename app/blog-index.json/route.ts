/** /blog-index.json — lightweight list of all posts, built at export time, used by the blog search and tag filter. */
import { getAllPosts } from '@/lib/posts';

export const revalidate = 300;

export async function GET() {
  const posts = (await getAllPosts()).map(({ slug, date, title, excerpt, imageSmall, tags }) => ({ slug, date, title, excerpt, imageSmall, tags }));
  return Response.json({ total: posts.length, posts });
}
