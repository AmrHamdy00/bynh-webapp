import LegalPage from '@/components/LegalPage';
import { pageMeta } from '@/lib/seo';
export const generateMetadata = () => pageMeta('/service-provider-agreement/');
export default function Page() { return <LegalPage path="/service-provider-agreement/" file="provider-agreement.html" title="اتفاقية الاستخدام (مزود الخدمة)" crumb="اتفاقية الاستخدام (مزود الخدمة)" />; }
