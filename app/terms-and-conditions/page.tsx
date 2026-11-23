import LegalPage from '@/components/LegalPage';
import { pageMeta } from '@/lib/seo';
export const metadata = pageMeta('/terms-and-conditions/');
export default function Page() { return <LegalPage file="terms.html" title="الشروط والأحكام – اتفاقية الاستخدام للعميل" crumb="الشروط والأحكام" />; }
