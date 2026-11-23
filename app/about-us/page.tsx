import AboutPage from '@/components/pages/AboutPage';
import Shell from '@/components/Shell';
import { pageMeta } from '@/lib/seo';
export const metadata = pageMeta('/about-us/');
export default function Page() { return <Shell current="/about-us/"><AboutPage /></Shell>; }
