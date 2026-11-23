import LegalPage from '@/components/LegalPage';
import { pageMeta } from '@/lib/seo';
export const generateMetadata = () => pageMeta('/privacy-policy/');
export default function Page() { return <LegalPage path="/privacy-policy/" file="privacy.html" title="سياسة الخصوصية" crumb="سياسة الخصوصية" />; }
