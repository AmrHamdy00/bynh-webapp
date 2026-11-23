import 'server-only';
import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db, schema } from './db';
import { SITE_URL, absUrl, absJson, DEFAULT_ROBOTS } from './content';
import { robotsObj } from './post-meta';

export const PAGES_TAG = 'pages';

/** Titles and descriptions carried over verbatim from the current WordPress/Yoast setup (keeps search rankings). */
export const PAGES = {
  '/': { title: 'بينه | استشارات وخدمات قانونية | محامين مرخصين من وزارة العدل', description: 'تطبيق محامين بينه يوفر استشارات قانونية مع أكثر من 4000 محامي ومحامية مرخصين من وزارة العدل، اطلب نصائح قانونية موثوقة وآمنة، حمل التطبيق' },
  '/about-us/': { title: 'من نحن | تطبيق محامين بينه للاستشارات القانونية', description: 'بينه منصة قانونية رقمية تقدم كافة الخدمات والاستشارات القانونية التي تسهل وصول العملاء إلى نخبة من الخبراء والمختصين المرخصين من وزارة العدل' },
  '/contact-us/': { title: 'تواصل معنا | تطبيق بينه للاستشارات والخدمات القانونية', description: 'الآن في دقائق تقدر تستشير أو توكّل محامي مرخّص وموثوق من بين أكثر من 4000 محامي على تطبيق بيّنه في التخصص اللي تحتاجه تواصل معنا' },
  '/استشارات-قانونية/': { title: 'الاستشارات القانونية من بينه | تطبيق خدمات واستشارات قانونية', description: 'هل تبحث عن نصيحة قانونية؟ تواصل الآن مع محامي موثوق ومرخص عبر تطبيق بينه للاستشارات القانونية في المملكة.. حمل التطبيق الآن' },
  '/خدمات-قانونية/': { title: 'الخدمات القانونية من بينه | تطبيق استشارات قانونية', description: 'بينه منصة قانونية رقمية تقدم كل الخدمات والاستشارات القانونية التي تسهل وصول العملاء إلى نخبة من الخبراء والمختصين المرخصين من وزارة العدل' },
  '/طلب-تسجيل-محامي/': { title: 'طلب تسجيل محامي | تطبيق بينه القانوني', description: 'انضم إلى بينه واحصل على فرصة تنظيم الطلبات من استشارات قانونية ودراسة القضايا الواردة من العملاء حسب ماتقوم بتقديره مقابل اتعاب كل خدمة' },
  '/الأسئلة-الشائعة/': { title: 'الأسئلة الشائعة | تطبيق بينه القانوني', description: 'الأسئلة الشائعة حول تطبيق بينه لتقديم كل الخدمات والاستشارات القانونية، للتسهيل على العملاء للوصول لنخبة المحامين المرخصين من وزارة العدل' },
  '/التسجيل/': { title: 'سجل طلبك الآن | تطبيق بينه القانوني', description: 'سجل طلبك على بينه منصة قانونية رقمية بها كل الخدمات والاستشارات القانونية لتسهيل وصول العملاء إلى نخبة من المحامين المرخصين من وزارة العدل' },
  '/المدونة/': { title: 'المدونة | تطبيق بينه للاستشارات القانونية', description: 'الآن في دقائق تقدر تستشير أو توكّل محامي مرخّص وموثوق من بين أكثر من 4000 محامي على تطبيق بيّنه في التخصص اللي تحتاجه' },
  '/privacy-policy/': { title: 'سياسة الخصوصية | تطبيق بينه للاستشارات والخدمات القانونية', description: 'الأن في دقائق تقدر تستشير أو توكّل محامي مرخّص وموثوق من بين أكثر من 3000 محامي على تطبيق بيّنه في التخصص اللي تحتاجه.' },
  '/terms-and-conditions/': { title: 'الشروط والأحكام – اتفاقية الاستخدام للعميل | بينه للاستشارات القانونية', description: 'تعرف على الشروط والأحكام في اتفاقية الاستخدام للعميل داخل تطبيق بينه للاستشارات القانونية، التطبيق المسجل في السعودية' },
  '/service-provider-agreement/': { title: 'اتفاقية الاستخدام مزود الخدمة | تطبيق بينه للاستشارت القانونية', description: 'اتفاقية الاستخدام لمزودي الخدمات في تطبيق بينه للاستشارات و الخدمات القانونية تعرف عليها الآن من هذه الصفحة' },
} as const;
export type PagePath = keyof typeof PAGES;

const pageRow = unstable_cache(async (path: string) => {
  const [r] = await db.select().from(schema.pageSeo).where(eq(schema.pageSeo.path, path)).limit(1);
  return r ? { ...r, publishedAt: r.publishedAt?.toISOString() ?? null, modifiedAt: r.modifiedAt.toISOString() } : null;
}, ['page-seo'], { tags: [PAGES_TAG], revalidate: 3600 });

const iso = (d?: string | null) => (d ? d.replace(/\.\d{3}Z$/, '+00:00') : undefined);

/**
 * Metadata for a coded page: the Yoast data imported from WordPress (editable in the admin), falling back to the
 * constants above. Mirrors what WordPress printed: robots, canonical, og:type article, modified time, Twitter.
 */
export async function pageMeta(path: PagePath, extra?: { title?: string }): Promise<Metadata> {
  const row = await pageRow(path).catch(() => null);
  const y = row?.seo || {};
  const p = PAGES[path];
  const title = extra?.title || y.title || p.title;
  const description = y.description || p.description;
  const url = `${SITE_URL}${encodeURI(path)}`;
  const img = y.ogImage;
  return {
    title: { absolute: title },
    description,
    robots: robotsObj(y.robots || DEFAULT_ROBOTS),
    alternates: { canonical: absUrl(y.canonical) || url },
    openGraph: {
      locale: 'ar_AR', type: (path === '/' || row?.ogType === 'website' ? 'website' : 'article'), title: extra?.title || y.ogTitle || title,
      description: y.ogDescription || description, url, siteName: 'بينه',
      ...(path !== '/' && row?.ogType !== 'website' && row ? { modifiedTime: iso(row.modifiedAt) } : {}),
      images: img ? [{ url: absUrl(img.url)!, width: img.width, height: img.height, type: img.type }] : [`${SITE_URL}/img/Header1.webp`],
    },
    twitter: { card: 'summary_large_image', site: '@bynh_sa', creator: '@bynh_sa' },
    other: { 'article:publisher': 'https://www.facebook.com/bynh.sa' },
  };
}

/** JSON-LD of a coded page: the imported Yoast graph (URLs on SITE_URL). */
export async function pageJsonLd(path: PagePath) {
  const row = await pageRow(path).catch(() => null);
  return row?.schema ? absJson(row.schema) : null;
}
