import LegalPage from '@/components/LegalPage';
import { pageMeta } from '@/lib/seo';
export const metadata = pageMeta('/service-provider-agreement/');
export default function Page() { return <LegalPage file="provider-agreement.html" title="اتفاقية الاستخدام (مزود الخدمة)" crumb="اتفاقية الاستخدام (مزود الخدمة)" />; }
