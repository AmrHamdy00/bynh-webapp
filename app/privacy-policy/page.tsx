import LegalPage from '@/components/LegalPage';
import { pageMeta } from '@/lib/seo';
export const metadata = pageMeta('/privacy-policy/');
export default function Page() { return <LegalPage file="privacy.html" title="سياسة الخصوصية" crumb="سياسة الخصوصية" />; }
