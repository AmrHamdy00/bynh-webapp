import HomePage from '@/components/pages/HomePage';
import PostCard from '@/components/PostCard';
import Shell from '@/components/Shell';
import PageJsonLd from '@/components/PageJsonLd';
import { getAllPosts } from '@/lib/posts';
import { pageMeta } from '@/lib/seo';

export const generateMetadata = () => pageMeta('/');

export default async function Home() {
  const latest = (await getAllPosts()).slice(0, 3);
  return (
    <Shell current="/">
      <PageJsonLd path="/" />
      <HomePage latest={<div className="posts" id="latest">{latest.map((p) => <PostCard key={p.id} p={p} />)}</div>} />
    </Shell>
  );
}
