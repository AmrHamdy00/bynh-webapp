/**
 * bynh.sa — Next.js server (public site + admin at admin.bynh.sa), behind nginx.
 * Public pages are pre-rendered/cached HTML; the admin and APIs are dynamic.
 */
const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
];

const nextConfig = {
  trailingSlash: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  serverExternalPackages: ['@node-rs/argon2', 'sharp'],
  experimental: { serverActions: { bodySizeLimit: '12mb' } },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      { source: '/sitemap.xml', destination: '/sitemap_index.xml', permanent: true },
      { source: '/comments/feed', destination: '/feed/', permanent: true },
      { source: '/feed/rss', destination: '/feed/', permanent: true },
      { source: '/feed/rss2', destination: '/feed/', permanent: true },
      { source: '/feed/atom', destination: '/feed/', permanent: true },
    ];
  },
};
export default nextConfig;
