const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString('en-US'));
/** Stat tile: label · value · signed delta vs the previous period of the same length (colour = good/bad direction). */
export default function Stat({ label, now, before, unit = '', lowerIsBetter = false }: { label: string; now: number; before: number; unit?: string; lowerIsBetter?: boolean }) {
  const d = before ? Math.round(((now - before) / before) * 100) : null;
  const good = d === null || d === 0 ? null : (d > 0) !== lowerIsBetter;
  return (
    <div className="card stat">
      <div className="k">{label}</div>
      <div className="v num">{fmt(now)}{unit}</div>
      <div className={`d ${good === null ? 'muted' : good ? 'up' : 'down'}`}>{d === null ? '—' : `${d > 0 ? '▲ +' : d < 0 ? '▼ ' : ''}${d}%`} <span className="muted">عن الفترة السابقة</span></div>
    </div>
  );
}
