'use client';
/**
 * First-party, cookieless analytics (~2 KB). Sends to /api/collect/ with sendBeacon:
 *  - pageview (path, title, referrer host, UTM)       - read: how far down the article the visitor got (%)
 *  - engage: seconds the tab was actually visible     - click: app download, WhatsApp, login, lawyer sign-up, phone…
 *  - form: registration submitted                     - notfound: a 404 with the referring page
 * No cookies, no localStorage, no fingerprinting: the session id lives in sessionStorage (one tab) and the visitor
 * id is a salted daily hash made on the server, never stored raw. Honours Do Not Track / Global Privacy Control.
 */
import { useEffect } from 'react';

const ENDPOINT = '/api/collect/';
type Ev = { t: string; l?: string; v?: number };

function sid() {
  try {
    let s = sessionStorage.getItem('bynh_sid');
    if (!s) { s = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem('bynh_sid', s); }
    return s;
  } catch { return 'nosession'; }
}

function classify(a: HTMLAnchorElement): string | null {
  const href = a.getAttribute('href') || '';
  if (href.startsWith('tel:')) return 'phone';
  if (href.startsWith('mailto:')) return 'email';
  let u: URL;
  try { u = new URL(href, location.href); } catch { return null; }
  const h = u.hostname;
  if (h.endsWith('go.link') || h.includes('apps.apple.com') || h.includes('play.google.com')) return 'app_download';
  if (h === 'wa.me' || h.includes('whatsapp')) return 'whatsapp';
  if (h === 'client.bynh.app') return 'client_login';
  if (h === 'lawyers.bynh.app') return 'lawyer_signup';
  if (/(x|twitter|facebook|instagram|linkedin|tiktok|snapchat|youtube)\.com$/.test(h)) return 'social';
  if (h !== location.hostname) return 'outbound';
  if (a.classList.contains('btn')) return 'cta';
  return null;
}

export default function Tracker({ notFound = false }: { notFound?: boolean }) {
  useEffect(() => {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === '1' || nav.globalPrivacyControl || /bot|crawler|spider|headless/i.test(navigator.userAgent)) return;
    if (!notFound && document.querySelector('[data-notfound]')) return; // the 404 page reports itself
    let path = location.pathname;
    try { path = decodeURIComponent(path); } catch {}
    const q = new URLSearchParams(location.search);
    const ref = document.referrer ? (() => { try { const r = new URL(document.referrer); return r.hostname === location.hostname ? null : r.hostname; } catch { return null; } })() : null;
    const base = { p: path, s: sid(), w: innerWidth };
    const send = (evs: Ev[], extra: Record<string, unknown> = {}) => {
      const body = JSON.stringify({ ...base, ...extra, e: evs });
      if (!navigator.sendBeacon?.(ENDPOINT, body)) fetch(ENDPOINT, { method: 'POST', body, keepalive: true }).catch(() => {});
    };

    send([{ t: notFound ? 'notfound' : 'pageview' }], { ti: document.title.slice(0, 200), r: ref, us: q.get('utm_source'), um: q.get('utm_medium'), uc: q.get('utm_campaign') });
    if (notFound) return;

    // reading depth (articles and legal pages) + engaged time
    const article = document.querySelector<HTMLElement>('article.prose');
    let maxPct = 0, visibleMs = 0, since = document.visibilityState === 'visible' ? Date.now() : 0, flushed = false;
    const onScroll = () => {
      if (!article) return;
      const r = article.getBoundingClientRect();
      const seen = Math.min(r.height, Math.max(0, innerHeight - r.top));
      const pct = Math.round((seen / Math.max(1, r.height)) * 100);
      // milestones go out as they happen, so depth is recorded even if the exit beacon is lost
      const hit = [25, 50, 75, 90].filter((m) => pct >= m && maxPct < m).pop();
      maxPct = Math.max(maxPct, pct);
      if (hit) send([{ t: 'read', v: hit }]);
    };
    const flush = () => {
      if (since) { visibleMs += Date.now() - since; since = 0; }
      if (flushed) return;
      const evs: Ev[] = [{ t: 'engage', v: Math.min(3600, Math.round(visibleMs / 1000)) }];
      if (article) evs.push({ t: 'read', v: Math.min(100, maxPct) });
      send(evs); flushed = true;
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') flush();
      else { since = Date.now(); flushed = false; }
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as Element | null)?.closest?.('a');
      if (!a) return;
      const kind = classify(a as HTMLAnchorElement);
      if (kind) send([{ t: 'click', l: `${kind}|${((a.textContent || '').trim() || a.getAttribute('href') || '').slice(0, 80)}` }]);
      if ((a as HTMLAnchorElement).href && !(a as HTMLAnchorElement).href.includes('#')) flush(); // leaving the page
    };
    const onForm = (e: Event) => send([{ t: 'form', l: String((e as CustomEvent).detail || 'form') }]);
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
    document.addEventListener('visibilitychange', onVis);
    addEventListener('pagehide', flush);
    document.addEventListener('click', onClick, { capture: true });
    addEventListener('bynh:form', onForm);
    return () => {
      removeEventListener('scroll', onScroll); document.removeEventListener('visibilitychange', onVis); removeEventListener('pagehide', flush);
      document.removeEventListener('click', onClick, { capture: true }); removeEventListener('bynh:form', onForm);
    };
  }, [notFound]);
  return null;
}
