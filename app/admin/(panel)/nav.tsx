'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type Item = { href: string; label: string } | { group: string };

export function SideNav({ items, user, logout }: { items: Item[]; user: { name: string; role: string }; logout: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const active = (href: string) => (href === '/admin/' ? path === '/admin/' || path === '/admin' : path.startsWith(href));
  return (
    <>
      <button className="btn btn-s btn-sm mtoggle" type="button" onClick={() => setOpen(true)} style={{ position: 'fixed', top: 12, insetInlineStart: 12, zIndex: 40 }}>القائمة</button>
      <aside className={`side${open ? ' open' : ''}`}>
        <div className="brand"><img src="/img/mark.png" alt="" />بيّنه</div>
        {items.map((it, i) => ('group' in it
          ? <div className="grp" key={i}>{it.group}</div>
          : <a key={it.href} href={it.href} aria-current={active(it.href) ? 'page' : undefined}>{it.label}</a>))}
        <div className="me"><b>{user.name}</b>{user.role}{logout}</div>
      </aside>
    </>
  );
}
