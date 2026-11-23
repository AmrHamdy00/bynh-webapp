import { pageSitemap } from '@/lib/feeds';
export const revalidate = 300;
export const GET = () => pageSitemap();
