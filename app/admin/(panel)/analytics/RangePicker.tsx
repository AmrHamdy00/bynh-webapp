import type { Range } from '@/lib/analytics';

const OPTS = [['1', 'اليوم'], ['7', '7 أيام'], ['30', '30 يوماً'], ['90', '90 يوماً'], ['365', 'سنة']] as const;
const iso = (d: Date) => new Date(+d + 3 * 3600_000).toISOString().slice(0, 10);

/** Date range in one row above the charts; the choice lives in the URL so it can be shared. */
export default function RangePicker({ r }: { r: Range }) {
  return (
    <form className="toolbar range" method="get">
      <div className="seg" role="group" aria-label="الفترة">
        {OPTS.map(([k, l]) => <a key={k} href={`?range=${k}`} aria-current={r.key === k ? 'true' : undefined}>{l}</a>)}
      </div>
      <input className="in ltr" type="date" name="from" defaultValue={iso(r.from)} aria-label="من" style={{ minWidth: 0, width: 150 }} />
      <input className="in ltr" type="date" name="to" defaultValue={iso(r.to)} aria-label="إلى" style={{ minWidth: 0, width: 150 }} />
      <button className="btn btn-s btn-sm">تطبيق</button>
    </form>
  );
}
