'use client';
/**
 * Charts for the analytics pages. Single-series by design (one hue, #2A86B0 — validated for lightness, chroma and
 * contrast on the white surface), 2px line + 10% area wash, hairline grid, crosshair + tooltip on hover/focus,
 * and every chart has a table view in the page.
 */
import { useMemo, useRef, useState } from 'react';

const C = '#2A86B0';
const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1)}K` : n.toLocaleString('en-US'));
const dayLabel = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('ar-SA-u-nu-latn', { day: 'numeric', month: 'short' });

export function TrendChart({ data, metric, label, secondary }: {
  data: { day: string; [k: string]: number | string }[]; metric: string; label: string; secondary?: { key: string; label: string };
}) {
  const W = 900, H = 240, P = { t: 12, r: 14, b: 26, l: 44 };
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const vals = data.map((d) => Number(d[metric]) || 0);
  // clean ticks: a 1/2/5 × 10^n step, about four intervals
  const { max, step } = useMemo(() => {
    const m = Math.max(1, ...vals);
    const raw = m / 4, mag = 10 ** Math.floor(Math.log10(raw));
    const st = Math.max(1, [1, 2, 5, 10].map((f) => f * mag).find((x) => x >= raw) || 10 * mag);
    return { max: Math.ceil(m / st) * st, step: st };
  }, [vals]);
  const x = (i: number) => P.l + (data.length <= 1 ? 0 : (i * (W - P.l - P.r)) / (data.length - 1));
  const y = (v: number) => P.t + (H - P.t - P.b) * (1 - v / max);
  const line = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(vals.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = Array.from({ length: Math.round(max / step) + 1 }, (_, i) => i * step);
  const every = Math.max(1, Math.ceil(data.length / 8));
  const move = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * W;
    // the svg is mirrored for RTL reading: time runs right → left
    const pos = W - px;
    setHover(Math.max(0, Math.min(data.length - 1, Math.round(((pos - P.l) / (W - P.l - P.r)) * (data.length - 1)))));
  };
  const h = hover !== null ? data[hover] : null;
  return (
    <div className="chart" style={{ position: 'relative' }}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${label} يومياً`} style={{ width: '100%', height: 'auto', display: 'block', transform: 'scaleX(-1)' }}
        onPointerMove={move} onPointerLeave={() => setHover(null)} tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') setHover((v) => Math.min(data.length - 1, (v ?? -1) + 1)); if (e.key === 'ArrowRight') setHover((v) => Math.max(0, (v ?? 1) - 1)); }}>
        {ticks.map((t) => <line key={t} x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} stroke="#EDF1F4" strokeWidth={1} />)}
        <path d={area} fill={C} opacity={0.1} />
        <path d={line} fill="none" stroke={C} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {hover !== null && <>
          <line x1={x(hover)} x2={x(hover)} y1={P.t} y2={H - P.b} stroke="#9FB3BF" strokeWidth={1} />
          <circle cx={x(hover)} cy={y(vals[hover])} r={5} fill={C} stroke="#fff" strokeWidth={2} />
        </>}
        {/* labels are drawn un-mirrored */}
        <g transform={`translate(${W},0) scale(-1,1)`} fontSize={11} fill="#7C93A0" fontFamily="var(--font)" style={{ direction: 'ltr' }}>
          {ticks.map((t) => <text key={t} x={W - P.l + 8} y={y(t) + 4} textAnchor="start">{fmt(t)}</text>)}
          {data.map((d, i) => ((i % every === 0 && data.length - 1 - i >= every / 2) || i === data.length - 1 ? <text key={d.day} x={W - x(i)} y={H - 8} textAnchor={i === 0 ? 'end' : i === data.length - 1 ? 'start' : 'middle'}>{dayLabel(d.day)}</text> : null))}
        </g>
      </svg>
      {h && (
        <div className="tip" style={(x(hover!) / W) < 0.6
          ? { right: `calc(${(x(hover!) / W) * 100}% + 10px)` }        /* tooltip to the left of the point */
          : { left: `calc(${(1 - x(hover!) / W) * 100}% + 10px)` }}>  {/* near the left edge: to its right */}
          <b>{dayLabel(h.day)}</b>
          <div>{label}: <span className="num">{fmt(Number(h[metric]))}</span></div>
          {secondary && <div className="muted">{secondary.label}: <span className="num">{fmt(Number(h[secondary.key]))}</span></div>}
        </div>
      )}
    </div>
  );
}

/** Horizontal bars inside a table row: value label at the tip, bar ≤ 24px, 4px rounded data-end. */
export function Bar({ value, max }: { value: number; max: number }) {
  return (
    <span className="hbar" aria-hidden="true"><i style={{ width: `${value > 0 ? Math.max(1, (value / Math.max(1, max)) * 100) : 0}%` }} /></span>
  );
}
