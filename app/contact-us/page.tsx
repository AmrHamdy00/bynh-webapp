import ContactPage from '@/components/pages/ContactPage';
import Shell from '@/components/Shell';
import { pageMeta } from '@/lib/seo';
export const metadata = pageMeta('/contact-us/');
export default function Page() { return <Shell current="/contact-us/"><ContactPage /></Shell>; }
