import LegalPage from '@/components/LegalPage';
import { pageMeta } from '@/lib/seo';
export const generateMetadata = () => pageMeta('/terms-and-conditions/');
export default function Page() { return <LegalPage path="/terms-and-conditions/" file="terms.html" title="الشروط والأحكام – اتفاقية الاستخدام للعميل" crumb="الشروط والأحكام" />; }
