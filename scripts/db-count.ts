/** Prints the row count of a table (used by scripts/vercel-build.sh). */
import postgres from 'postgres';
import { dbUrl, isPooled } from '../lib/db/url';
const table = process.argv[2];
if (!['posts', 'users'].includes(table)) throw new Error('table?');
const sql = postgres(dbUrl(true), { max: 1, prepare: !isPooled(dbUrl(true)) });
sql.unsafe(`select count(*)::int n from ${table}`).then((r) => { console.log(r[0].n); return sql.end(); });
