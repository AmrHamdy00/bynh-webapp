import type { Metadata } from 'next';
import type { Post } from './posts';
import { SITE_URL, absUrl, absJson, encPath, postPath, DEFAULT_ROBOTS } from './content';

const robotsObj = (r: string): Metadata['robots'] => {
  const parts = r.split(',').map((x) => x.trim());
  const o: Record<string, unknown> = { index: !parts.includes('noindex'), follow: !parts.includes('nofollow') };
  const gb: Record<string, unknown> = {};
  for (const p of parts) {
    const [k, v] = p.split(':');
    if (k === 'max-snippet') gb['max-snippet'] = +v;
    if (k === 'max-image-preview') gb['max-image-preview'] = v;
    if (k === 'max-video-preview') gb['max-video-preview'] = +v;
  }
  return { ...o, ...gb } as Metadata['robots'];
};
export { robotsObj };

/** Metadata for a post — mirrors what Yoast printed on WordPress, field for field. */
export function postMetadata(post: Post): Metadata {
  const y = post.seo;
  const url = SITE_URL + encPath(postPath(post.slug));
  const title = y.title || `${post.title} | بينه`;
  const description = y.description || post.excerpt.slice(0, 160);
  const img = y.ogImage || (post.cover ? { url: post.cover.path, width: post.cover.width ?? undefined, height: post.cover.height ?? undefined, type: post.cover.mime } : undefined);
  return {
    title: { absolute: title },
    description,
    robots: robotsObj(y.robots || DEFAULT_ROBOTS),
    alternates: { canonical: absUrl(y.canonical) || url },
    openGraph: {
      locale: 'ar_AR', type: 'article', title: y.ogTitle || title, description: y.ogDescription || description, url, siteName: 'بينه',
      publishedTime: post.publishedAt.replace(/\.\d{3}Z$/, '+00:00'), modifiedTime: post.modifiedAt.replace(/\.\d{3}Z$/, '+00:00'),
      images: img ? [{ url: absUrl(img.url)!, width: img.width, height: img.height, type: img.type }] : undefined,
    },
    twitter: {
      card: 'summary_large_image', creator: '@bynh_sa', site: '@bynh_sa',
      ...(y.twitterTitle ? { title: y.twitterTitle } : {}), ...(y.twitterDescription ? { description: y.twitterDescription } : {}),
      ...(y.twitterImage ? { images: [absUrl(y.twitterImage)!] } : {}),
    },
    other: {
      'article:publisher': 'https://www.facebook.com/bynh.sa',
      'twitter:label1': 'كُتب بواسطة', 'twitter:data1': post.authorName,
      ...(post.readingMinutes ? { 'twitter:label2': 'وقت القراءة المُقدّر', 'twitter:data2': `${post.readingMinutes} دقائق` } : {}),
    },
  };
}

/** JSON-LD: the imported Yoast graph when present (with URLs on SITE_URL), otherwise the same graph generated. */
export function postJsonLd(post: Post) {
  if (post.schema) return absJson(post.schema);
  const url = SITE_URL + encPath(postPath(post.slug));
  const img = post.cover ? absUrl(post.cover.path) : undefined;
  const iso = (d: string) => d.replace(/\.\d{3}Z$/, '+00:00');
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', '@id': `${url}#article`, isPartOf: { '@id': url }, author: { name: post.authorName, '@id': `${SITE_URL}/#/schema/person/team` },
        headline: post.title, datePublished: iso(post.publishedAt), dateModified: iso(post.modifiedAt), mainEntityOfPage: { '@id': url },
        publisher: { '@id': `${SITE_URL}/#organization` }, ...(img ? { image: { '@id': `${url}#primaryimage` }, thumbnailUrl: img } : {}),
        keywords: post.tags, articleSection: post.categories, inLanguage: 'ar' },
      { '@type': 'WebPage', '@id': url, url, name: post.seo.title || post.title, isPartOf: { '@id': `${SITE_URL}/#website` },
        ...(img ? { primaryImageOfPage: { '@id': `${url}#primaryimage` }, image: { '@id': `${url}#primaryimage` }, thumbnailUrl: img } : {}),
        datePublished: iso(post.publishedAt), dateModified: iso(post.modifiedAt), description: post.seo.description || post.excerpt,
        breadcrumb: { '@id': `${url}#breadcrumb` }, inLanguage: 'ar', potentialAction: [{ '@type': 'ReadAction', target: [url] }] },
      ...(img ? [{ '@type': 'ImageObject', inLanguage: 'ar', '@id': `${url}#primaryimage`, url: img, contentUrl: img, width: post.cover!.width, height: post.cover!.height }] : []),
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
        { '@type': 'ListItem', position: 2, name: post.title }] },
      { '@type': 'WebSite', '@id': `${SITE_URL}/#website`, url: `${SITE_URL}/`, name: 'بينه', description: 'تطبيق محامين واستشارات قانونية',
        publisher: { '@id': `${SITE_URL}/#organization` }, inLanguage: 'ar',
        potentialAction: [{ '@type': 'SearchAction', target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?s={search_term_string}` }, 'query-input': { '@type': 'PropertyValueSpecification', valueRequired: true, valueName: 'search_term_string' } }] },
      { '@type': 'Organization', '@id': `${SITE_URL}/#organization`, name: 'بينه', url: `${SITE_URL}/`,
        logo: { '@type': 'ImageObject', inLanguage: 'ar', '@id': `${SITE_URL}/#/schema/logo/image/`, url: `${SITE_URL}/img/mark.png`, contentUrl: `${SITE_URL}/img/mark.png`, caption: 'بينه' },
        image: { '@id': `${SITE_URL}/#/schema/logo/image/` }, sameAs: ['https://www.facebook.com/bynh.sa', 'https://x.com/bynh_sa'] },
      { '@type': 'Person', '@id': `${SITE_URL}/#/schema/person/team`, name: post.authorName },
    ],
  };
}
