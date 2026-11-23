import type { Metadata } from 'next';
import './admin.css';

export const metadata: Metadata = {
  title: { default: 'لوحة التحكم | بيّنه', template: '%s | لوحة التحكم' },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: 'same-origin',
};
export const dynamic = 'force-dynamic';

export default function AdminRoot({ children }: { children: React.ReactNode }) {
  return children;
}
