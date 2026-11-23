import 'server-only';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

/** One pool per process (kept across dev hot reloads). DATABASE_URL e.g. postgres://bynh:***@127.0.0.1:5432/bynh */
const g = globalThis as unknown as { __pg?: ReturnType<typeof postgres> };
const client = (g.__pg ??= postgres(process.env.DATABASE_URL || 'postgres://bynh:bynh_dev_pw@127.0.0.1:5432/bynh', {
  max: Number(process.env.DATABASE_POOL || 10),
  idle_timeout: 30,
  connection: { application_name: 'bynh-web' },
}));
export const db = drizzle(client, { schema });
export { schema };
