import { desc } from 'drizzle-orm';
import { db, schema as s } from '@/lib/db';
import { currentSession, can, audit } from '@/lib/auth/session';

export async function GET() {
  const u = await currentSession();
  if (!u || u.stage !== 'full' || !can(u, 'editor')) return new Response('Unauthorized', { status: 401 });
  const rows = await db.select().from(s.leads).orderBy(desc(s.leads.at));
  // prefix cells that a spreadsheet would treat as formulas (CSV injection)
  const cell = (v: unknown) => { let t = String(v ?? ''); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
  const csv = '﻿' + [['date', 'name', 'phone', 'email', 'package', 'notes', 'status'].join(','),
    ...rows.map((r) => [r.at.toISOString(), r.data.name, r.data.phone, r.data.email, r.data.package, r.data.notes, r.status].map(cell).join(','))].join('\r\n');
  await audit(u.id, 'leads.export', { data: { rows: rows.length } });
  return new Response(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bynh-leads.csv"', 'Cache-Control': 'no-store' } });
}
