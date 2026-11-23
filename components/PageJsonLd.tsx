import { pageJsonLd, type PagePath } from '@/lib/seo';

/** Structured data of a coded page (the graph Yoast published for it on WordPress). */
export default async function PageJsonLd({ path }: { path: PagePath }) {
  const ld = await pageJsonLd(path);
  if (!ld) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />;
}
