import { requireUser, can } from '@/lib/auth/session';
import { SideNav } from './nav';
import { MFA_DISABLED } from '@/lib/auth/flags';

const ROLE = { admin: 'مدير', editor: 'محرر', author: 'كاتب' } as const;

export default async function Panel({ children }: { children: React.ReactNode }) {
  const u = await requireUser();
  const items = [
    { href: '/admin/', label: 'نظرة عامة' },
    { group: 'المحتوى' },
    { href: '/admin/posts/', label: 'المقالات' },
    { href: '/admin/media/', label: 'الوسائط' },
    ...(can(u, 'editor') ? [{ href: '/admin/pages-seo/', label: 'سيو الصفحات' }, { href: '/admin/redirects/', label: 'التحويلات' }] : []),
    { group: 'التحليلات' },
    { href: '/admin/analytics/', label: 'الزيارات' },
    { href: '/admin/analytics/blog/', label: 'قراءة المدونة' },
    { href: '/admin/analytics/clicks/', label: 'النقرات' },
    { href: '/admin/funnels/', label: 'مسارات التحويل' },
    { href: '/admin/analytics/404/', label: 'روابط مكسورة' },
    ...(can(u, 'editor') ? [{ group: 'الطلبات' }, { href: '/admin/leads/', label: 'طلبات التسجيل' }] : []),
    ...(can(u, 'admin') ? [{ group: 'الإدارة' }, { href: '/admin/users/', label: 'المستخدمون' }, { href: '/admin/audit/', label: 'سجل النشاط' }] : []),
    { href: '/admin/account/', label: 'حسابي والأمان' },
  ];
  return (
    <div className="shell">
      <SideNav items={items} user={{ name: u.displayName, role: ROLE[u.role] }}
        logout={<form action="/api/admin/logout/" method="post"><button type="submit">تسجيل الخروج</button></form>} />
      <main className="main">
        {MFA_DISABLED && <div className="msg warn">نسخة تجريبية: التحقق بخطوتين معطّل مؤقتاً (AUTH_DISABLE_2FA). لا تستخدم هذا الإعداد في الموقع الحقيقي.</div>}
        {children}
      </main>
    </div>
  );
}
