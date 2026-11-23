'use client';
/**
 * Page behaviour for the static site. Every navigation is a full page load (plain <a> links, nginx serves
 * static HTML), so this runs once per page and wires up whatever elements that page has.
 */
import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function Behaviors() {
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T | null;
    const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => Array.from(r.querySelectorAll(s)) as T[];
    const off: (() => void)[] = [];
    const on = (t: EventTarget, ev: string, fn: EventListener, o?: AddEventListenerOptions) => { t.addEventListener(ev, fn, o); off.push(() => t.removeEventListener(ev, fn)); };

    /* header menu (under 1080px) */
    const burger = $('#burger'), mnav = $('#mnav');
    const menu = (open: boolean) => {
      if (!burger || !mnav) return;
      document.body.classList.toggle('mopen', open);
      burger.setAttribute('aria-expanded', String(open));
      if (open) { mnav.removeAttribute('inert'); document.documentElement.style.overflow = 'hidden'; }
      else { mnav.setAttribute('inert', ''); document.documentElement.style.overflow = ''; }
    };
    if (burger && mnav) {
      on(burger, 'click', () => menu(!document.body.classList.contains('mopen')));
      $$('a', mnav).forEach((a) => on(a, 'click', () => menu(false)));
      on(window, 'keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape') menu(false); });
    }

    /* FAQ: one open at a time */
    const ds = $$<HTMLDetailsElement>('.faq details');
    ds.forEach((d) => on(d, 'toggle', () => { if (d.open) ds.forEach((o) => { if (o !== d) o.open = false; }); }));

    /* services "working process": step follows the panel in view */
    const steps = $$('#steps .st'), panels = $$('#panels .pn');
    if (steps.length) {
      const sync = () => {
        const mid = innerHeight * 0.5; let k = 0, bd = 1e9;
        panels.forEach((p, i) => { const r = p.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid); if (d < bd) { bd = d; k = i; } });
        steps.forEach((s, i) => s.classList.toggle('on', i === k));
      };
      on(window, 'scroll', sync, { passive: true }); sync();
      steps.forEach((s, i) => on(s, 'click', () => {
        const r = panels[i].getBoundingClientRect();
        scrollTo({ top: scrollY + r.top - (innerHeight - r.height) / 2, behavior: reduce ? 'auto' : 'smooth' });
      }));
    }

    /* navy accordion: auto-advances every 6s, click to pick */
    const items = $$('#acc li'); let cur = 0; let timer: ReturnType<typeof setTimeout> | undefined;
    const pick = (i: number) => {
      cur = i;
      items.forEach((li, k) => { li.classList.toggle('on', k === i); $('button', li)?.setAttribute('aria-expanded', String(k === i)); });
      if (!reduce) { clearTimeout(timer); timer = setTimeout(() => pick((cur + 1) % items.length), 6000); }
    };
    if (items.length) { items.forEach((li, i) => { const b = $('button', li); if (b) on(b, 'click', () => pick(i)); }); pick(0); off.push(() => clearTimeout(timer)); }

    /* table of contents links: smooth scroll */
    $$<HTMLAnchorElement>('.toc a[href^="#"]').forEach((a) => on(a, 'click', (e) => {
      const t = document.getElementById(a.getAttribute('href')!.slice(1));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); history.replaceState(null, '', a.getAttribute('href')); }
    }));

    /* registration form (التسجيل): validate; submission endpoint is wired at launch */
    const rf = $<HTMLFormElement>('#regForm');
    if (rf) {
      on(rf, 'submit', (e) => {
        e.preventDefault();
        let ok = true;
        $$<HTMLInputElement>('[required]', rf).forEach((el) => {
          const v = el.value.trim();
          const good = !!v && (el.type !== 'email' || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) && (el.type !== 'tel' || /^[+\d\s-]{8,}$/.test(v));
          el.setAttribute('aria-invalid', String(!good)); if (!good) ok = false;
        });
        const err = $('#fErr'); if (err) err.hidden = ok;
        if (!ok) { $<HTMLElement>('[aria-invalid="true"]', rf)?.focus(); return; }
        rf.hidden = true; const done = $('#regDone'); if (done) done.hidden = false;
      });
      const again = $('#regAgain');
      if (again) on(again, 'click', () => { rf.reset(); $$('[aria-invalid]', rf).forEach((el) => el.removeAttribute('aria-invalid')); rf.hidden = false; const done = $('#regDone'); if (done) done.hidden = true; });
    }

    /* copy-to-clipboard buttons (contact page) */
    $$<HTMLButtonElement>('button.copy-btn').forEach((b) => on(b, 'click', () => {
      const t = b.dataset.copy || '';
      navigator.clipboard?.writeText(t).then(() => { b.textContent = 'تم النسخ'; setTimeout(() => { b.textContent = 'نسخ'; }, 1600); }, () => {});
    }));

    /* motion */
    if (reduce) return () => off.forEach((f) => f());
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      if ($('#h1')) {
        gsap.timeline({ defaults: { ease: 'expo.out' } })
          .from('.rate', { y: 14, opacity: 0, duration: 0.7 })
          .from('#h1 .w', { y: 40, opacity: 0, duration: 1, stagger: 0.07 }, '-=.4')
          .from('#h1 .chip', { scale: 0, rotate: -30, duration: 0.8, ease: 'back.out(2)' }, '-=.7')
          .from('.hero .sub, .hero .btn', { y: 14, opacity: 0, duration: 0.7, stagger: 0.08 }, '-=.6')
          .from('.hero .tray', { y: 60, opacity: 0, duration: 1.1 }, '-=.5')
          .from('#heroWin', { y: 90, opacity: 0, duration: 1.2 }, '-=.9')
          .from('.hero .float', { scale: 0.8, opacity: 0, duration: 0.8, stagger: 0.15, ease: 'back.out(1.6)' }, '-=.6');
        gsap.to('.fl1', { y: -50, ease: 'none', scrollTrigger: { trigger: '#trayWrap', start: 'top 70%', end: 'bottom top', scrub: true } });
        gsap.to('.fl2', { y: -100, ease: 'none', scrollTrigger: { trigger: '#trayWrap', start: 'top 70%', end: 'bottom top', scrub: true } });
      }
      $$('[data-up]').forEach((el) => gsap.from(el, { y: 34, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 90%' } }));
      if ($('#tab')) gsap.fromTo('#tab', { rotateX: 38, scale: 0.82, y: 40 }, { rotateX: 0, scale: 1, y: 0, ease: 'none', scrollTrigger: { trigger: '.dev-stage', start: 'top 95%', end: 'top 20%', scrub: 0.7 } });
      if ($('.cl-dev')) gsap.from('.cl-dev', { y: 120, ease: 'none', scrollTrigger: { trigger: '.closing', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 } });
      if ($('.board-shot')) gsap.fromTo('.board-shot img', { scale: 1.12 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.board-shot', start: 'top bottom', end: 'bottom 60%', scrub: true } });
      $$('.count').forEach((el) => {
        const to = Number(el.dataset.to), o = { v: 0 };
        ScrollTrigger.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => {
          gsap.to(o, { v: to, duration: 2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
        } });
      });
    });
    return () => { off.forEach((f) => f()); ctx.revert(); };
  }, []);
  return null;
}
