import ContactPage from '@/components/pages/ContactPage';
import Shell from '@/components/Shell';
import PageJsonLd from '@/components/PageJsonLd';
import { pageMeta } from '@/lib/seo';
export const generateMetadata = () => pageMeta('/contact-us/');
export default function Page() { return <Shell current="/contact-us/"><PageJsonLd path="/contact-us/" /><ContactPage /></Shell>; }
