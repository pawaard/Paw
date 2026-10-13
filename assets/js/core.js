/* =========================================================
   MISS QUEEN ERA WORLD — shared runtime for every page
   (smooth scroll, i18n, page transitions, header/menu, reveals, forms, cursor, dust)
   Page scripts (hub.js, intro.js, pages.js) build on window.QEW.
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const body = document.body;
  const page = body.dataset.page || '';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const DATA = window.LOGO_DATA || {};
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const session = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z"/></svg>';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!location.hash) window.scrollTo(0, 0);

  if (!G || !ST) { // libraries failed to load — show the static page
    root.classList.remove('pt-on');
    const intro = $('#intro');
    if (intro) intro.classList.add('is-done');
    body.classList.remove('is-loading');
    $$('.is-pending').forEach((el) => el.classList.remove('is-pending'));
    return;
  }
  G.registerPlugin(ST);
  G.config({ nullTargetWarn: false });

  const bootHooks = [];
  const enterHooks = [];

  /* ---------------------------------------------------------
     Smooth scroll
     --------------------------------------------------------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (k) => Math.min(1, 1.001 - Math.pow(2, -10 * k)), smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((time) => lenis.raf(time * 1000));
    G.ticker.lagSmoothing(0);
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, ...opts });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts.immediate ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: opts.immediate ? 'auto' : 'smooth' });
  };
  const currentScroll = () => (lenis ? lenis.scroll : window.scrollY);

  /* ---------------------------------------------------------
     Split text (words, masked)
     --------------------------------------------------------- */
  function splitWords(el) {
    const frag = document.createDocumentFragment();
    const walk = (node, parent) => {
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { parent.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span'); w.className = 'w';
            const i = document.createElement('span'); i.className = 'wi'; i.textContent = part;
            w.appendChild(i); parent.appendChild(w);
          });
        } else if (n.nodeName === 'BR') {
          parent.appendChild(document.createElement('br'));
        } else if (n.nodeType === 1) {
          const c = n.cloneNode(false); parent.appendChild(c); walk(n, c);
        }
      });
    };
    walk(el, frag);
    el.innerHTML = '';
    el.appendChild(frag);
    return $$('.wi', el);
  }
  const splitST = new Map();
  function armSplit(el) {
    const words = $$('.wi', el);
    if (reduceMotion || el.dataset.revealed) return;
    G.set(words, { yPercent: 118 });
    splitST.set(el, ST.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: () => { el.dataset.revealed = '1'; G.to(words, { yPercent: 0, duration: 1.3, ease: 'expo.out', stagger: 0.07 }); }
    }));
  }
  // data-split="" → reveal on scroll; any other value (hero/manual) → a page script animates it
  function setSplit(el, html) {
    if (html != null) el.innerHTML = html;
    splitWords(el);
    if (el.dataset.split) return;
    const old = splitST.get(el);
    if (old) old.kill();
    armSplit(el);
  }

  /* ---------------------------------------------------------
     i18n — English is captured from the markup, Turkish from i18n.js
     --------------------------------------------------------- */
  const TR = window.I18N_TR || {};
  const EN = {};
  const i18nEls = [];
  const attrEls = [];
  function capture(scope) {
    $$('[data-i18n]', scope).forEach((el) => { if (EN[el.dataset.i18n] == null) EN[el.dataset.i18n] = el.innerHTML.trim(); i18nEls.push(el); });
    $$('[data-i18n-attr]', scope).forEach((el) => {
      el.dataset.i18nAttr.split(';').forEach((pair) => { const [a, k] = pair.split(':'); if (EN[k] == null) EN[k] = el.getAttribute(a); });
      attrEls.push(el);
    });
  }
  capture(document);
  $$('template').forEach((tpl) => $$('[data-i18n]', tpl.content).forEach((el) => { if (EN[el.dataset.i18n] == null) EN[el.dataset.i18n] = el.innerHTML.trim(); }));
  let lang = store.get('qew-lang') || ((navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en');
  if (lang !== 'tr') lang = 'en';
  const t = (k, vars) => {
    let s = lang === 'tr' && TR[k] != null ? TR[k] : EN[k] != null ? EN[k] : k;
    if (vars) Object.keys(vars).forEach((v) => { s = s.split(`{${v}}`).join(vars[v]); });
    return s;
  };
  const langHooks = [];
  function paint(el) {
    const vars = el.dataset.y ? { y: el.dataset.y } : null;
    const html = t(el.dataset.i18n, vars);
    if (el.hasAttribute('data-split')) setSplit(el, html);
    else el.innerHTML = html;
  }
  function applyLang(l, initial) {
    lang = l === 'tr' ? 'tr' : 'en';
    root.lang = lang;
    store.set('qew-lang', lang);
    i18nEls.forEach(paint);
    attrEls.forEach((el) => el.dataset.i18nAttr.split(';').forEach((pair) => { const [a, k] = pair.split(':'); el.setAttribute(a, t(k)); }));
    $$('[data-lang]').forEach((b) => b.classList.toggle('is-active', b.dataset.lang === lang));
    const mt = $('[data-meta-title]');
    if (mt) document.title = mt.textContent.trim();
    langHooks.forEach((fn) => fn(initial));
    if (!initial) ST.refresh();
  }
  // register nodes created by page scripts after load
  function registerI18n(scope) {
    const before = i18nEls.length;
    capture(scope);
    i18nEls.slice(before).forEach(paint);
  }
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* ---------------------------------------------------------
     Logo FX helpers
     --------------------------------------------------------- */
  function mountSparks(el, count) {
    const host = el && $('.logo-fx__sparks', el);
    const pts = el && (DATA[el.dataset.sparks] || {}).sparkles;
    if (!host || !pts || reduceMotion) return;
    host.innerHTML = '';
    const pool = pts.slice().sort(() => Math.random() - 0.5).slice(0, count || pts.length);
    pool.forEach(([x, y, s]) => {
      const sp = document.createElement('i');
      sp.className = 'spark';
      sp.style.cssText = `--x:${x};--y:${y};--s:${Math.max(0.25, s)};--dur:${(3.6 + Math.random() * 4).toFixed(2)}s;--del:${(-Math.random() * 7).toFixed(2)}s`;
      host.appendChild(sp);
    });
  }
  function shineLoop(el, delay = 0) {
    const sh = el && $('.logo-fx__shine', el);
    if (!sh || reduceMotion) return null;
    return G.fromTo(sh, { '--sx': '130%' }, { '--sx': '-30%', duration: 1.9, ease: 'power2.inOut', repeat: -1, repeatDelay: 5.2, delay });
  }
  function buildTrace(host, data, uid) {
    const NS = 'http://www.w3.org/2000/svg';
    const [, , vw, vh] = data.vb.split(' ').map(Number);
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'logo-fx__trace');
    svg.setAttribute('viewBox', data.vb);
    svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML = `<defs><linearGradient id="tg-${uid}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${vw}" y2="${vh}">` +
      '<stop offset="0" stop-color="#9c7020"/><stop offset=".32" stop-color="#f3d27a"/><stop offset=".5" stop-color="#fff8e3"/>' +
      '<stop offset=".68" stop-color="#e2b85a"/><stop offset="1" stop-color="#8a6420"/></linearGradient></defs>' +
      `<g stroke="url(#tg-${uid})">${data.d.map((d) => `<path d="${d}"/>`).join('')}</g>`;
    host.appendChild(svg);
    const items = $$('path', svg).map((p) => {
      const len = p.getTotalLength();
      const b = p.getBBox();
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = len;
      return { p, len, dist: Math.hypot(b.x + b.width / 2 - vw / 2, b.y + b.height / 2 - vh * 0.48) };
    }).sort((a, b) => a.dist - b.dist);
    return { svg, paths: items.map((i) => i.p), reset() { items.forEach((i) => { i.p.style.strokeDashoffset = i.len; }); svg.style.opacity = 1; } };
  }
  function tilt(el, area, { max = 8, onLeave } = {}) {
    if (!el || !area || !finePointer || reduceMotion) return;
    const rx = G.quickTo(el, 'rotationX', { duration: 0.9, ease: 'power3.out' });
    const ry = G.quickTo(el, 'rotationY', { duration: 0.9, ease: 'power3.out' });
    area.addEventListener('pointermove', (e) => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      ry((x - 0.5) * max * 1.4); rx(-(y - 0.5) * max);
      const lr = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${((e.clientX - lr.left) / lr.width) * 100}%`);
      el.style.setProperty('--my', `${((e.clientY - lr.top) / lr.height) * 100}%`);
      el.classList.add('is-lit');
    });
    area.addEventListener('pointerleave', () => { rx(0); ry(0); if (onLeave) onLeave(); else el.classList.remove('is-lit'); });
  }
  function buildAstro(svg) {
    let stars = '';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const x = 500 + Math.cos(a) * 452, y = 500 + Math.sin(a) * 452, r = i % 3 === 0 ? 9 : 5;
      stars += `<path class="st" d="M${x} ${y - r}L${x + r * 0.22} ${y - r * 0.22}L${x + r} ${y}L${x + r * 0.22} ${y + r * 0.22}L${x} ${y + r}L${x - r * 0.22} ${y + r * 0.22}L${x - r} ${y}L${x - r * 0.22} ${y - r * 0.22}Z"/>`;
    }
    svg.innerHTML =
      '<g class="a1"><circle cx="500" cy="500" r="494"/><circle class="tick" cx="500" cy="500" r="480"/><circle class="tick-lg" cx="500" cy="500" r="476"/></g>' +
      `<g class="a2"><circle class="dash" cx="500" cy="500" r="430"/>${stars}</g>` +
      '<g class="a3"><circle cx="500" cy="500" r="372"/><circle class="dash" cx="500" cy="500" r="340"/>' +
      '<path class="moon" d="M500 118a36 36 0 1 0 0 72a28 28 0 1 1 0-72z"/><path class="moon" d="M500 810a36 36 0 1 1 0 72a28 28 0 1 0 0-72z"/></g>';
  }
  $$('svg.astro').forEach(buildAstro);

  /* ---------------------------------------------------------
     Page transitions — a cover that grows out of the clicked shape
     --------------------------------------------------------- */
  const pt = $('.pt');
  const ptLabel = pt && $('.pt__label', pt);
  const ptSub = pt && $('.pt__sub', pt);
  let navigating = false;
  // numbers must not carry a trailing ".0": the browser normalises "515.0px" to "515px" and GSAP then can't pair the values
  const n1 = (v) => String(Math.round(v * 10) / 10);
  const polyStr = (pts) => `polygon(${pts.map(([x, y]) => `${n1(x)}px ${n1(y)}px`).join(', ')})`;
  function centroid(poly) {
    let a = 0, x = 0, y = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x0, y0] = poly[i], [x1, y1] = poly[(i + 1) % poly.length];
      const f = x0 * y1 - x1 * y0; a += f; x += (x0 + x1) * f; y += (y0 + y1) * f;
    }
    return Math.abs(a) < 1e-6 ? poly[0] : [x / (3 * a), y / (3 * a)];
  }
  // sample a convex polygon along N rays from its centre (so it can morph into a circle)
  function resample(poly, cx, cy, n) {
    const out = [];
    for (let k = 0; k < n; k++) {
      const th = (k / n) * Math.PI * 2 - Math.PI / 2;
      const dx = Math.cos(th), dy = Math.sin(th);
      let best = 0;
      for (let i = 0; i < poly.length; i++) {
        const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
        const ex = bx - ax, ey = by - ay;
        const den = dx * ey - dy * ex;
        if (Math.abs(den) < 1e-9) continue;
        const tt = ((ax - cx) * ey - (ay - cy) * ex) / den;
        const u = ((ax - cx) * dy - (ay - cy) * dx) / den;
        if (tt > 0 && u >= -1e-6 && u <= 1 + 1e-6) { best = tt; break; }
      }
      out.push([cx + dx * best, cy + dy * best]);
    }
    return out;
  }
  function setCoverText(label, sub) {
    if (ptLabel) ptLabel.textContent = label || '';
    if (ptSub) ptSub.textContent = sub || '';
  }
  function go(href, { poly, label, sub } = {}) {
    if (navigating) return;
    navigating = true;
    session.set('qew-pt', JSON.stringify({ label: label || '', sub: sub || '' }));
    if (!pt || reduceMotion) { location.href = href; return; }
    setCoverText(label, sub);
    G.killTweensOf(pt);
    G.set('.pt__inner', { y: 0, opacity: 1 });
    pt.classList.add('is-active');
    const nav = () => { location.href = href; };
    if (poly && poly.length > 2) {
      const [cx, cy] = centroid(poly);
      const n = 48;
      const from = resample(poly, cx, cy, n);
      const W = window.innerWidth, H = window.innerHeight;
      const R = Math.max(Math.hypot(cx, cy), Math.hypot(W - cx, cy), Math.hypot(cx, H - cy), Math.hypot(W - cx, H - cy)) * 1.06;
      const to = from.map((_, k) => { const th = (k / n) * Math.PI * 2 - Math.PI / 2; return [cx + Math.cos(th) * R, cy + Math.sin(th) * R]; });
      G.fromTo(pt, { clipPath: polyStr(from) }, { clipPath: polyStr(to), duration: 0.85, ease: 'expo.inOut', onComplete: nav });
      G.fromTo('.pt__inner', { scale: 0.7, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'expo.out', delay: 0.25 });
    } else {
      G.fromTo(pt, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.inOut', onComplete: nav });
      G.fromTo('.pt__inner', { y: 50, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'expo.out', delay: 0.2 });
    }
  }
  function runEnter() { enterHooks.forEach((fn) => fn()); }
  function coverOut() {
    return new Promise((res) => {
      if (!pt || (!root.classList.contains('pt-on') && !pt.classList.contains('is-active'))) { runEnter(); res(); return; }
      G.set(pt, { clipPath: 'inset(0% 0% 0% 0%)' }); // hand over from the CSS cover without a visible gap
      pt.classList.add('is-active');
      root.classList.remove('pt-on');
      const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
      Promise.race([fonts, wait(700)]).then(() => wait(reduceMotion ? 0 : 120)).then(() => {
        const done = () => { pt.classList.remove('is-active'); G.set(pt, { clearProps: 'clipPath' }); G.set('.pt__inner', { clearProps: 'all' }); session.set('qew-pt', ''); res(); };
        if (reduceMotion) { done(); runEnter(); return; }
        G.fromTo(pt, { clipPath: 'inset(0% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.05, ease: 'expo.inOut', onComplete: done });
        G.to('.pt__inner', { y: -70, opacity: 0, duration: 0.7, ease: 'power2.in' });
        G.delayedCall(0.32, runEnter);
      });
    });
  }
  // back/forward cache: the old page comes back still covered — uncover it
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    navigating = false;
    if (pt && pt.classList.contains('is-active')) {
      G.to(pt, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.8, ease: 'expo.inOut', onComplete: () => { pt.classList.remove('is-active'); G.set(pt, { clearProps: 'clipPath' }); } });
    }
  });
  const sameDoc = (url) => url.pathname === location.pathname && url.search === location.search;
  const internal = (url) => (location.protocol === 'file:' ? url.protocol === 'file:' : url.origin === location.origin);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    const raw = a.getAttribute('href');
    if (!raw || /^(mailto:|tel:|javascript:)/i.test(raw)) return;
    if (raw === '#') { e.preventDefault(); return; }
    const url = new URL(raw, location.href);
    if (!internal(url)) return;
    if (sameDoc(url)) { // in-page anchor
      const el = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
      if (!el) return;
      e.preventDefault();
      setMenu(false);
      hdr && hdr.classList.remove('is-hidden');
      scrollTo(el, { offset: -20 });
      return;
    }
    if (!/\.html?$/i.test(url.pathname) && !url.pathname.endsWith('/')) return;
    e.preventDefault();
    setMenu(false);
    const txt = (a.dataset.pt || (a.querySelector('[data-i18n]') || a).textContent || '').replace(/\s+/g, ' ').trim();
    go(url.href, { label: txt.length <= 32 ? txt : '' });
  });
  // warm the cache for pages the visitor is about to open
  const prefetched = new Set();
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest && e.target.closest('a[href$=".html"], a[href*=".html#"]');
    if (!a || location.protocol === 'file:') return;
    const url = new URL(a.getAttribute('href'), location.href);
    const key = url.pathname;
    if (prefetched.has(key) || sameDoc(url) || !internal(url)) return;
    prefetched.add(key);
    const l = document.createElement('link'); l.rel = 'prefetch'; l.href = url.pathname; document.head.appendChild(l);
  }, { passive: true });

  /* ---------------------------------------------------------
     Header & menu
     --------------------------------------------------------- */
  const hdr = $('#hdr');
  let lastY = 0;
  function onScroll(y) {
    if (!hdr) return;
    hdr.classList.toggle('is-scrolled', y > 30);
    if (y > lastY + 3 && y > 520 && !body.classList.contains('menu-open')) hdr.classList.add('is-hidden');
    else if (y < lastY - 3) hdr.classList.remove('is-hidden');
    body.classList.toggle('hdr-hidden', hdr.classList.contains('is-hidden'));
    lastY = y;
    const max = root.scrollHeight - window.innerHeight;
    hdr.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  }
  if (lenis) lenis.on('scroll', (e) => onScroll(e.scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  const burger = $('.hdr__burger');
  function setMenu(open) {
    if (!burger || open === body.classList.contains('menu-open')) return;
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (lenis && !body.classList.contains('is-loading')) (open ? lenis.stop() : lenis.start());
  }
  if (burger) burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ---------------------------------------------------------
     Ribbon (word marquee) — reacts to scroll velocity
     --------------------------------------------------------- */
  let ribbonTweens = [];
  function buildRibbon() {
    ribbonTweens.forEach((tw) => tw.kill());
    ribbonTweens = [];
    $$('[data-ribbon]').forEach((track, idx) => {
      const keys = idx === 0 ? ['rib.1', 'rib.2', 'rib.3', 'rib.4', 'rib.5', 'rib.6'] : ['rib.b1', 'rib.b2', 'rib.b3'];
      let set = '';
      for (let r = 0; r < (idx === 0 ? 2 : 3); r++) {
        keys.forEach((k, i) => { set += `<span class="ribbon__item${idx === 0 && i % 2 === 0 ? ' is-fill' : ''}">${t(k)}</span>${STAR.replace('<svg', '<svg class="ribbon__sep"')}`; });
      }
      track.innerHTML = set + set;
      if (reduceMotion) return;
      ribbonTweens.push(idx === 0
        ? G.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 46, ease: 'none', repeat: -1 })
        : G.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 64, ease: 'none', repeat: -1 }));
    });
  }
  langHooks.push(buildRibbon);
  if (lenis) {
    lenis.on('scroll', (e) => {
      if (!ribbonTweens.length) return;
      const boost = 1 + Math.min(Math.abs(e.velocity) * 0.09, 5);
      ribbonTweens.forEach((tw) => G.to(tw, { timeScale: boost, duration: 0.4, overwrite: true }));
    });
  }

  /* ---------------------------------------------------------
     Reveals & counters
     --------------------------------------------------------- */
  function setupReveals(scope = document) {
    if (reduceMotion) return;
    const reveals = $$('[data-reveal]', scope).filter((el) => !el.classList.contains('tcard') && !el.dataset.armed);
    reveals.forEach((el) => { el.dataset.armed = '1'; });
    if (reveals.length) {
      G.set(reveals, { opacity: 0, y: 44 });
      ST.batch(reveals, {
        start: 'top 92%', once: true,
        onEnter: (batch) => G.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, overwrite: true, clearProps: 'transform' })
      });
    }
    const cards = $$('.tcard', scope).filter((el) => !el.dataset.armed);
    cards.forEach((el) => { el.dataset.armed = '1'; });
    if (cards.length) {
      G.set(cards, { opacity: 0, clipPath: 'inset(18% 0% 0% 0% round 28px)' });
      ST.batch(cards, {
        start: 'top 90%', once: true,
        onEnter: (batch) => G.to(batch, { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4, ease: 'expo.out', stagger: 0.12, clearProps: 'clipPath' })
      });
    }
  }
  function setupCounters(scope = document) {
    $$('[data-count]', scope).forEach((el) => {
      const end = +el.dataset.count;
      const o = { v: 0 };
      if (reduceMotion) { el.textContent = end; return; }
      el.textContent = '0';
      ST.create({ trigger: el, start: 'top 94%', once: true, onEnter: () => G.to(o, { v: end, duration: 2.2, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
    });
  }

  /* ---------------------------------------------------------
     Countdown → Grand Final (Istanbul, UTC+3)
     --------------------------------------------------------- */
  const cdTarget = new Date('2027-10-23T20:00:00+03:00').getTime();
  const cdEls = { d: $$('[data-cd="d"]'), h: $$('[data-cd="h"]'), m: $$('[data-cd="m"]'), s: $$('[data-cd="s"]') };
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  function tick() {
    let diff = Math.max(0, cdTarget - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    cdEls.d.forEach((el) => { el.textContent = pad(d, 3); });
    cdEls.h.forEach((el) => { el.textContent = pad(h); });
    cdEls.m.forEach((el) => { el.textContent = pad(m); });
    cdEls.s.forEach((el) => { el.textContent = pad(s); });
  }
  if (cdEls.d.length) { tick(); setInterval(tick, 1000); }

  /* ---------------------------------------------------------
     Forms (demo only — nothing is sent)
     --------------------------------------------------------- */
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  $$('form.form').forEach((form) => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let firstBad = null;
      $$('.field', form).forEach((f) => { f.classList.remove('is-invalid'); const er = $('.field__err', f); if (er) er.textContent = ''; });
      $$('[required]', form).forEach((inp) => {
        let msg = '';
        if (inp.type === 'checkbox') { if (!inp.checked) msg = t('fm.err.consent'); }
        else if (!inp.value.trim()) msg = t('fm.err.req');
        else if (inp.type === 'email' && !emailOk(inp.value)) msg = t('fm.err.email');
        if (msg) {
          const f = inp.closest('.field');
          f.classList.add('is-invalid');
          $('.field__err', f).textContent = msg;
          if (!firstBad) firstBad = f;
        }
      });
      if (firstBad) {
        G.fromTo(firstBad, { x: -10 }, { x: 0, duration: 0.7, ease: 'elastic.out(1, 0.3)', clearProps: 'transform' });
        const inp = $('input, select, textarea', firstBad);
        if (inp) inp.focus({ preventScroll: true });
        return;
      }
      const btn = $('button[type="submit"]', form);
      btn.classList.add('is-busy');
      setTimeout(() => {
        btn.classList.remove('is-busy');
        form.classList.add('is-sent');
        G.fromTo($$('.form__success > *', form), { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out', delay: 0.15 });
        G.fromTo($('.form__success-crown', form), { scale: 0.6, rotate: -8 }, { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.5)', delay: 0.1 });
      }, 900);
    });
    $$('input, select, textarea', form).forEach((inp) => inp.addEventListener('input', () => {
      const f = inp.closest('.field');
      if (f && f.classList.contains('is-invalid')) { f.classList.remove('is-invalid'); const er = $('.field__err', f); if (er) er.textContent = ''; }
    }));
    const again = $('.form__again', form);
    if (again) again.addEventListener('click', () => { form.reset(); form.classList.remove('is-sent'); });
  });
  $$('form.news').forEach((news) => news.addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('input', news);
    const ok = emailOk(inp.value);
    news.classList.toggle('is-invalid', !ok);
    const okEl = news.parentElement && $('.news__ok', news.parentElement);
    if (okEl) okEl.classList.toggle('is-on', ok);
    if (ok) inp.value = '';
  }));

  /* ---------------------------------------------------------
     Footer wordmark — fitted, fills with gold on scroll
     --------------------------------------------------------- */
  const word = $('.ftr__word');
  if (word) {
    const fitWord = () => {
      const o = $('.ftr__word-o', word);
      word.style.fontSize = '100px';
      const w = o.getBoundingClientRect().width;
      const target = Math.min(word.clientWidth * 0.94, 1800);
      word.style.fontSize = `${Math.floor((100 * target) / Math.max(1, w))}px`;
    };
    fitWord();
    window.addEventListener('resize', fitWord);
    if (document.fonts) document.fonts.ready.then(fitWord);
    ST.create({ trigger: word, start: 'top 98%', end: 'bottom 70%', scrub: true, onUpdate: (s) => word.style.setProperty('--fw', `${(s.progress * 100).toFixed(1)}%`) });
  }

  /* ---------------------------------------------------------
     Pointer niceties: magnetic buttons, cursor ring, card glow
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    $$('.magnetic').forEach((el) => {
      const qx = G.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
      const qy = G.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        qx((e.clientX - r.left - r.width / 2) * 0.22);
        qy((e.clientY - r.top - r.height / 2) * 0.32);
      });
      el.addEventListener('pointerleave', () => { qx(0); qy(0); });
    });
    root.classList.add('has-cursor');
    const cur = $('.cursor');
    const label = cur && $('.cursor__label', cur);
    if (cur) {
      const cx = G.quickTo(cur, 'x', { duration: 0.45, ease: 'power3.out' });
      const cy = G.quickTo(cur, 'y', { duration: 0.45, ease: 'power3.out' });
      window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); cur.classList.remove('is-hidden'); }, { passive: true });
      document.addEventListener('pointerover', (e) => {
        const isDrag = e.target.closest('[data-cursor="drag"], .globe');
        const isHover = e.target.closest('a, button, .hotspot, .pill, input, select, textarea, .vcard, .tcard, summary');
        cur.classList.toggle('is-drag', !!isDrag);
        cur.classList.toggle('is-hover', !isDrag && !!isHover);
        label.textContent = isDrag ? t('cursor.drag') : '';
      });
      document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cur.classList.add('is-hidden'); });
    }
  }
  $$('.vcard').forEach((c) => c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------------------------------------------------------
     Gold dust (fixed, screen-blended, parallax with scroll)
     --------------------------------------------------------- */
  (function dust() {
    const c = $('.dust');
    if (reduceMotion || !c) return;
    const ctx = c.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const size = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); W = c.width = Math.round(window.innerWidth * dpr); H = c.height = Math.round(window.innerHeight * dpr); };
    size();
    window.addEventListener('resize', size);
    const N = window.innerWidth < 760 ? 24 : 54;
    const parts = Array.from({ length: N }, () => ({
      x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, r: 0.5 + Math.random() * 1.5,
      vx: (Math.random() - 0.5) * 0.000012, vy: -(0.000008 + Math.random() * 0.00002), tw: Math.random() * 6.28, ts: 0.6 + Math.random() * 1.6
    }));
    const bokeh = Array.from({ length: 7 }, () => ({ x: Math.random(), y: Math.random(), r: 30 + Math.random() * 70, z: 0.1 + Math.random() * 0.3, tw: Math.random() * 6.28 }));
    G.ticker.add((time, dt) => {
      if (document.hidden) return;
      ctx.clearRect(0, 0, W, H);
      const sy = currentScroll();
      for (const b of bokeh) {
        const y = ((b.y - (sy / window.innerHeight) * b.z * 0.25) % 1 + 1) % 1;
        const a = 0.035 + 0.025 * Math.sin(time * 0.4 + b.tw);
        const g = ctx.createRadialGradient(b.x * W, y * H, 0, b.x * W, y * H, b.r * dpr);
        g.addColorStop(0, `rgba(226,176,90,${a})`); g.addColorStop(1, 'rgba(226,176,90,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(b.x * W, y * H, b.r * dpr, 0, Math.PI * 2); ctx.fill();
      }
      for (const p of parts) {
        p.x = (p.x + p.vx * dt + 1) % 1;
        p.y = (p.y + p.vy * dt + 1) % 1;
        const y = ((p.y - (sy / window.innerHeight) * p.z * 0.35) % 1 + 1) % 1;
        const a = (0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * p.ts + p.tw))) * p.z * 0.8;
        ctx.fillStyle = `rgba(255,222,150,${a})`;
        ctx.beginPath(); ctx.arc(p.x * W, y * H, p.r * p.z * 1.3 * dpr, 0, Math.PI * 2); ctx.fill();
      }
    });
  })();

  /* ---------------------------------------------------------
     Generic page-hero entrance (inner pages)
     --------------------------------------------------------- */
  function heroEnter() {
    if (reduceMotion) return;
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.crumbs, .phero__eyebrow', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08 }, 0)
      .fromTo('.phero [data-split="hero"] .wi', { yPercent: 118 }, { yPercent: 0, duration: 1.4, stagger: 0.07 }, 0.08)
      .fromTo('.phero__lead, .phero .hero__ctas, .yhero__title, .yhero__facts, .phero .countdown', { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.08, clearProps: 'transform' }, 0.35)
      .from('.phero__mark, .yhero__queen, .yhero__visual, .brandhero__mono', { opacity: 0, y: 50, duration: 1.6, clearProps: 'transform,opacity' }, 0.15)
      .fromTo('.yhero__o', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.4 }, 0.05)
      .fromTo('.yhero__f', { backgroundSize: '100% 0%' }, { backgroundSize: '100% 100%', duration: 2.4, ease: 'power2.inOut' }, 0.5)
      .from('.phero__astro, .phero__rays', { opacity: 0, duration: 2, ease: 'power2.out', clearProps: 'opacity' }, 0.1);
  }
  if (page !== 'hub' && page !== 'general') enterHooks.push(heroEnter);

  /* ---------------------------------------------------------
     Boot (after page scripts have registered their hooks)
     --------------------------------------------------------- */
  function boot() {
    applyLang(lang, true);
    $$('[data-split]:not([data-i18n])').forEach((el) => setSplit(el));
    if (!reduceMotion && page !== 'hub') G.set('.phero [data-split="hero"] .wi', { yPercent: 118 });
    setupReveals();
    setupCounters();
    bootHooks.forEach((fn) => fn());
    if (page !== 'hub') {
      coverOut().then(() => {
        ST.refresh();
        if (location.hash) {
          const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
          if (el) scrollTo(el, { offset: -20, immediate: true });
        }
      });
    }
    window.addEventListener('load', () => ST.refresh());
  }
  document.addEventListener('DOMContentLoaded', boot);

  window.QEW = {
    $, $$, G, ST, root, body, page, reduceMotion, finePointer, DATA, STAR, store, session, wait,
    get lenis() { return lenis; },
    t, get lang() { return lang; }, onLang: (fn) => langHooks.push(fn), registerI18n, splitWords, setSplit,
    mountSparks, shineLoop, buildTrace, tilt, buildAstro, centroid,
    go, coverOut, setCoverText, scrollTo, setMenu, setupReveals, setupCounters,
    onBoot: (fn) => bootHooks.push(fn), onEnter: (fn) => enterHooks.push(fn)
  };
})();
