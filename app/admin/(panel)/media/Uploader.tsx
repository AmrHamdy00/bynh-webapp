'use client';
import { useRef, useState } from 'react';

export default function Uploader() {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState('');
  const run = async (files: FileList) => {
    for (const [i, f] of Array.from(files).entries()) {
      setBusy(`${i + 1}/${files.length}`);
      const fd = new FormData(); fd.append('file', f); fd.append('alt', '');
      const r = await fetch('/api/admin/media/', { method: 'POST', body: fd });
      if (!r.ok) alert(`${f.name}: ${(await r.json().catch(() => null))?.error || 'فشل الرفع'}`);
    }
    setBusy(''); location.reload();
  };
  return (
    <>
      <button type="button" className="btn btn-p" disabled={!!busy} onClick={() => ref.current?.click()}>{busy ? `جارٍ الرفع ${busy}` : 'رفع ملفات'}</button>
      <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" hidden onChange={(e) => e.target.files?.length && run(e.target.files)} />
    </>
  );
}
