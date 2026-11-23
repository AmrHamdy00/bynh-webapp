'use client';
import { useEffect, useRef, useState } from 'react';

export type MediaItem = { id: number; path: string; alt: string; title: string; width: number | null; height: number | null; mime: string;
  sizes: Record<string, { path: string; width: number; height: number }> };

/** Modal media library: search, pick, or upload a new image (re-encoded on the server). */
export function MediaPicker({ onPick, onClose }: { onPick: (m: MediaItem) => void; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);

  const load = async (p: number, query: string) => {
    const r = await fetch(`/api/admin/media/?page=${p}&q=${encodeURIComponent(query)}&images=1`, { cache: 'no-store' });
    if (!r.ok) { setErr('تعذر تحميل الوسائط'); return; }
    const d = await r.json();
    setItems((x) => (p === 1 ? d.items : [...x, ...d.items])); setMore(d.more); setPage(p);
  };
  useEffect(() => { const t = setTimeout(() => load(1, q), 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose(); addEventListener('keydown', k); return () => removeEventListener('keydown', k); }, [onClose]);

  const upload = async (f: File) => {
    setBusy(true); setErr('');
    const fd = new FormData(); fd.append('file', f); fd.append('alt', prompt('وصف الصورة (نص بديل للسيو وذوي الإعاقة البصرية):') || '');
    const r = await fetch('/api/admin/media/', { method: 'POST', body: fd });
    setBusy(false);
    if (!r.ok) { setErr((await r.json().catch(() => null))?.error || 'فشل الرفع'); return; }
    onPick(await r.json());
  };

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="مكتبة الوسائط" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="toolbar">
          <input className="in" placeholder="ابحث باسم الملف أو الوصف…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
          <button type="button" className="btn btn-p btn-sm" disabled={busy} onClick={() => file.current?.click()}>{busy ? 'جارٍ الرفع…' : 'رفع صورة'}</button>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <span style={{ flex: 1 }} />
          <button type="button" className="btn btn-s btn-sm" onClick={onClose}>إغلاق</button>
        </div>
        {err && <div className="msg err">{err}</div>}
        <div className="mgrid">
          {items.map((m) => (
            <button type="button" key={m.id} className="mitem" onClick={() => onPick(m)} title={m.alt || m.title}>
              <img src={m.sizes?.medium?.path || m.sizes?.thumbnail?.path || m.path} alt="" loading="lazy" />
            </button>
          ))}
        </div>
        {more && <div style={{ textAlign: 'center', marginTop: 12 }}><button type="button" className="btn btn-s btn-sm" onClick={() => load(page + 1, q)}>المزيد</button></div>}
      </div>
    </div>
  );
}
