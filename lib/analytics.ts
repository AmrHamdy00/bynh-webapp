import 'server-only';
/** Reporting queries over the events table. All day buckets are in Riyadh time. */
import { sql } from 'drizzle-orm';
import { db } from './db';

export type Range = { from: Date; to: Date; days: number; key: string };
const TZ = 'Asia/Riyadh';

/** ?range=7|30|90|365 or ?from=YYYY-MM-DD&to=YYYY-MM-DD */
export function parseRange(sp: { range?: string; from?: string; to?: string }): Range {
  if (sp.from && sp.to && /^\d{4}-\d{2}-\d{2}$/.test(sp.from) && /^\d{4}-\d{2}-\d{2}$/.test(sp.to)) {
    const from = new Date(`${sp.from}T00:00:00+03:00`), to = new Date(`${sp.to}T23:59:59+03:00`);
    if (+from < +to) return { from, to, days: Math.ceil((+to - +from) / 86400000), key: 'custom' };
  }
  const days = [1, 7, 30, 90, 365].includes(Number(sp.range)) ? Number(sp.range) : 30;
  const to = new Date();
  return { from: new Date(+to - days * 86400000), to, days, key: String(days) };
}
const prev = (r: Range): Range => ({ from: new Date(+r.from - (+r.to - +r.from)), to: r.from, days: r.days, key: r.key });
const rows = async <T,>(q: ReturnType<typeof sql>) => (await db.execute(q)) as unknown as T[];
const W = (r: Range) => sql`at >= ${r.from.toISOString()}::timestamptz and at < ${r.to.toISOString()}::timestamptz`;

export async function summary(r: Range) {
  const one = async (x: Range) => (await rows<{ visitors: number; sessions: number; pageviews: number; engaged: number; bounce: number }>(sql`
    with pv as (select session, count(*) n from events where type = 'pageview' and ${W(x)} group by session)
    select
      (select count(distinct visitor)::int from events where type = 'pageview' and ${W(x)}) visitors,
      (select count(*)::int from pv) sessions,
      (select coalesce(sum(n),0)::int from pv) pageviews,
      (select coalesce(round(avg(t)),0)::int from (select session, sum(value) t from events where type = 'engage' and ${W(x)} group by session) e) engaged,
      (select coalesce(round(100.0 * count(*) filter (where n = 1) / nullif(count(*),0)),0)::int from pv) bounce`))[0];
  const [now, before] = await Promise.all([one(r), one(prev(r))]);
  return { now, before };
}

export async function daily(r: Range) {
  const from = r.from.toISOString(), to = r.to.toISOString();
  return rows<{ day: string; visitors: number; pageviews: number }>(sql`
    with d as (select gs::date as dt from generate_series((${from}::timestamptz at time zone 'Asia/Riyadh')::date, (${to}::timestamptz at time zone 'Asia/Riyadh')::date, interval '1 day') gs),
    e as (select (at at time zone 'Asia/Riyadh')::date as dt, visitor from events where type = 'pageview' and at >= ${from}::timestamptz and at < ${to}::timestamptz)
    select to_char(d.dt, 'YYYY-MM-DD') as "day", count(distinct e.visitor)::int as visitors, count(e.visitor)::int as pageviews
    from d left join e on e.dt = d.dt group by d.dt order by d.dt`);
}

export async function breakdown(r: Range, dim: 'path' | 'source' | 'device' | 'browser' | 'os' | 'country' | 'campaign', limit = 15) {
  const col = dim === 'path' ? sql`path` : dim === 'source' ? sql`coalesce(utm_source, referrer_host, 'مباشر')` : dim === 'campaign' ? sql`utm_campaign`
    : dim === 'device' ? sql`device` : dim === 'browser' ? sql`browser` : dim === 'os' ? sql`os` : sql`coalesce(country, '—')`;
  return rows<{ key: string; visitors: number; views: number }>(sql`
    select ${col} as key, count(distinct visitor)::int visitors, count(*)::int views from events
    where type = 'pageview' and ${W(r)} ${dim === 'campaign' ? sql`and utm_campaign is not null` : sql``}
    group by 1 order by views desc limit ${limit}`);
}

/** Per-article reading: views, readers, average depth, completion (≥ 90 %), average engaged time. */
export async function blogReading(r: Range, limit = 50) {
  return rows<{ path: string; title: string | null; views: number; readers: number; depth: number; completion: number; seconds: number }>(sql`
    with v as (select path, count(*) views, count(distinct visitor) readers, max(title) title from events where type = 'pageview' and ${W(r)} group by path),
    rd as (select path, avg(d) depth, 100.0 * count(*) filter (where d >= 90) / nullif(count(*),0) completion
           from (select path, session, max(value) d from events where type = 'read' and ${W(r)} group by path, session) x group by path),
    en as (select path, avg(t) seconds from (select path, session, sum(value) t from events where type = 'engage' and ${W(r)} group by path, session) x group by path)
    select v.path, v.title, v.views::int, v.readers::int, coalesce(round(rd.depth),0)::int depth, coalesce(round(rd.completion),0)::int completion, coalesce(round(en.seconds),0)::int seconds
    from v join rd on rd.path = v.path left join en on en.path = v.path
    order by v.views desc limit ${limit}`);
}

export async function clicks(r: Range) {
  const [byKind, byLabel, byPage] = await Promise.all([
    rows<{ kind: string; clicks: number; visitors: number }>(sql`select split_part(label,'|',1) kind, count(*)::int clicks, count(distinct visitor)::int visitors from events where type = 'click' and ${W(r)} group by 1 order by 2 desc`),
    rows<{ kind: string; text: string; clicks: number }>(sql`select split_part(label,'|',1) kind, split_part(label,'|',2) text, count(*)::int clicks from events where type = 'click' and ${W(r)} group by 1,2 order by 3 desc limit 30`),
    rows<{ path: string; clicks: number; downloads: number }>(sql`select path, count(*)::int clicks, (count(*) filter (where label like 'app_download|%'))::int downloads from events where type = 'click' and ${W(r)} group by 1 order by 2 desc limit 20`),
  ]);
  return { byKind, byLabel, byPage };
}

export async function notFound(r: Range) {
  return rows<{ path: string; hits: number; referrer: string | null; last: string }>(sql`
    select path, count(*)::int hits, mode() within group (order by referrer_host) referrer, max(at)::text last
    from events where type = 'notfound' and ${W(r)} group by path order by hits desc limit 200`);
}

export type Step = { type: 'pageview' | 'click' | 'form'; match: string; label: string };
/**
 * Funnel: sessions that did step 1, then step 2 later in the same session, and so on.
 * match: pageview → path, * as wildcard ("/المدونة/*"); click → kind or kind|text prefix ("app_download"); form → form name.
 */
export async function funnel(r: Range, steps: Step[]) {
  const cond = (st: Step) => {
    const pat = st.match.replace(/[%_]/g, (c) => '\\' + c).replace(/\*/g, '%');
    if (st.type === 'pageview') return sql`type = 'pageview' and path like ${pat}`;
    if (st.type === 'click') return sql`type = 'click' and (label like ${pat + '|%'} or label like ${pat})`;
    return sql`type = 'form' and label like ${pat}`;
  };
  const out: { label: string; sessions: number }[] = [];
  let prevQ: ReturnType<typeof sql> | null = null;
  for (const [i, st] of steps.entries()) {
    const q: ReturnType<typeof sql> = i === 0
      ? sql`select session, min(at) t from events where ${cond(st)} and ${W(r)} group by session`
      : sql`select e.session, min(e.at) t from events e join (${prevQ}) p on p.session = e.session and e.at > p.t where ${cond(st)} and ${W(r)} group by e.session`;
    const [{ n }] = await rows<{ n: number }>(sql`select count(*)::int n from (${q}) x`);
    out.push({ label: st.label, sessions: n });
    prevQ = q;
  }
  return out;
}
