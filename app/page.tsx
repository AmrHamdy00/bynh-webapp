import HomePage from '@/components/pages/HomePage';
import PostCard from '@/components/PostCard';
import Shell from '@/components/Shell';
import { getAllPosts } from '@/lib/wp';
import { pageMeta } from '@/lib/seo';

export const metadata = pageMeta('/');

export default async function Home() {
  const latest = (await getAllPosts()).slice(0, 3);
  return (
    <Shell current="/">
      <HomePage latest={<div className="posts" id="latest">{latest.map((p) => <PostCard key={p.id} p={p} />)}</div>} />
    </Shell>
  );
}
