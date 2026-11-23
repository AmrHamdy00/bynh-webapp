import { defineConfig } from 'drizzle-kit';
import { dbUrl } from './lib/db/url';
export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: dbUrl(true) },
});
