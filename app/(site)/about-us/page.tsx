import AboutPage from '@/components/pages/AboutPage';
import Shell from '@/components/Shell';
import PageJsonLd from '@/components/PageJsonLd';
import { pageMeta } from '@/lib/seo';
export const generateMetadata = () => pageMeta('/about-us/');
export default function Page() { return <Shell current="/about-us/"><PageJsonLd path="/about-us/" /><AboutPage /></Shell>; }
