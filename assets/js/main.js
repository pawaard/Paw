/* =========================================================
   MISS QUEEN ERA WORLD — interactions & motion
   ========================================================= */
(() => {
  'use strict';

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const body = document.body;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const G = window.gsap;
  const ST = window.ScrollTrigger;
  const DATA = window.LOGO_DATA || {};
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } }
  };
  const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z"/></svg>';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  if (!G || !ST) { // libraries failed to load — show the static page
    $('#intro').classList.add('is-done');
    body.classList.remove('is-loading');
    return;
  }
  G.registerPlugin(ST);
  G.config({ nullTargetWarn: false });

  /* ---------------------------------------------------------
     Smooth scroll
     --------------------------------------------------------- */
  let lenis = null;
  if (!reduceMotion && window.Lenis) {
    lenis = new window.Lenis({ duration: 1.15, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ST.update);
    G.ticker.add((time) => lenis.raf(time * 1000));
    G.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const scrollTo = (target, opts = {}) => {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, ...opts });
    else if (typeof target === 'number') window.scrollTo({ top: target, behavior: opts.immediate ? 'auto' : 'smooth' });
    else target.scrollIntoView({ behavior: 'smooth' });
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
  function setSplit(el, html) {
    el.innerHTML = html;
    splitWords(el);
    if (el.dataset.split === 'manual') return;
    const old = splitST.get(el);
    if (old) old.kill();
    armSplit(el);
  }

  /* ---------------------------------------------------------
     i18n — English is captured from the markup, Turkish from i18n.js
     --------------------------------------------------------- */
  const TR = window.I18N_TR || {};
  const EN = {};
  const i18nEls = $$('[data-i18n]');
  const attrEls = $$('[data-i18n-attr]');
  i18nEls.forEach((el) => { EN[el.dataset.i18n] = el.innerHTML.trim(); });
  attrEls.forEach((el) => el.dataset.i18nAttr.split(';').forEach((pair) => { const [a, k] = pair.split(':'); EN[k] = el.getAttribute(a); }));
  let lang = store.get('qew-lang') || ((navigator.language || '').toLowerCase().startsWith('tr') ? 'tr' : 'en');
  const t = (k) => (lang === 'tr' && TR[k] != null ? TR[k] : EN[k] != null ? EN[k] : k);
  const langHooks = [];

  function applyLang(l, initial) {
    lang = l === 'tr' ? 'tr' : 'en';
    root.lang = lang;
    store.set('qew-lang', lang);
    i18nEls.forEach((el) => {
      const html = t(el.dataset.i18n);
      if (el.hasAttribute('data-split')) setSplit(el, html);
      else el.innerHTML = html;
    });
    attrEls.forEach((el) => el.dataset.i18nAttr.split(';').forEach((pair) => { const [a, k] = pair.split(':'); el.setAttribute(a, t(k)); }));
    $$('[data-lang]').forEach((b) => b.classList.toggle('is-active', b.dataset.lang === lang));
    document.title = t('meta.title');
    langHooks.forEach((fn) => fn(initial));
    if (!initial) ST.refresh();
  }
  $$('[data-lang]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.lang !== lang) applyLang(b.dataset.lang); }));

  /* ---------------------------------------------------------
     Logo FX helpers
     --------------------------------------------------------- */
  function mountSparks(el, count) {
    const host = $('.logo-fx__sparks', el);
    const pts = (DATA[el.dataset.sparks] || {}).sparkles;
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
    const sh = $('.logo-fx__shine', el);
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
    if (!finePointer || reduceMotion) return;
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

  /* ---------------------------------------------------------
     INTRO — particles → line art → gold reveal → flare → wordmark → fly to hero
     --------------------------------------------------------- */
  const intro = $('#intro');
  const introLogo = $('.intro__logo');
  const introImg = $('.logo-fx__img', introLogo);
  const heroCrown = $('.hero__crown');
  const hdr = $('#hdr');
  let introTrace = null;
  let introTl = null;
  let heroShine = null;

  // wordmark → letters
  const nameEl = $('.intro__name');
  nameEl.innerHTML = nameEl.textContent.split('').map((c) => (c === ' ' ? ' ' : `<span class="ch">${c}</span>`)).join('');

  function introParticles(canvas, stage) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (canvas.width = Math.round(window.innerWidth * dpr));
    const H = (canvas.height = Math.round(window.innerHeight * dpr));
    const r = stage.getBoundingClientRect();
    const tp = (DATA.crown && DATA.crown.particles) || [];
    const step = window.innerWidth < 700 ? 2 : 1; // fewer particles on phones
    const cx = W / 2, cy = H / 2;
    const parts = [];
    for (let i = 0; i < tp.length / 2; i += step) {
      const a = Math.random() * Math.PI * 2;
      const rad = Math.max(W, H) * (0.5 + Math.random() * 0.55);
      parts.push({
        sx: cx + Math.cos(a) * rad, sy: cy + Math.sin(a) * rad,
        tx: (r.left + (tp[2 * i] / 1000) * r.width) * dpr, ty: (r.top + (tp[2 * i + 1] / 1000) * r.height) * dpr,
        d: Math.random() * 0.45, s: (0.7 + Math.random() * 1.5) * dpr, tw: Math.random() * 6.28,
        spin: (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random() * 0.9), px: 0, py: 0
      });
    }
    const state = { p: 0, fade: 1 };
    let first = true;
    const draw = (time) => {
      ctx.clearRect(0, 0, W, H);
      if (state.fade <= 0.001) return;
      ctx.globalCompositeOperation = 'lighter';
      for (const q of parts) {
        const tt = Math.min(1, Math.max(0, state.p * 1.45 - q.d));
        const e = 1 - Math.pow(1 - tt, 3);
        const ang = (1 - e) * q.spin * 1.7;
        const bx = q.sx + (q.tx - q.sx) * e - cx, by = q.sy + (q.ty - q.sy) * e - cy;
        const c = Math.cos(ang), s = Math.sin(ang);
        const x = cx + bx * c - by * s, y = cy + bx * s + by * c;
        const twinkle = tt >= 1 ? 0.55 + 0.45 * Math.sin(time * 4 + q.tw) : 1;
        const alpha = tt <= 0 ? 0 : state.fade * (0.3 + 0.7 * e) * twinkle;
        if (!first && tt > 0 && tt < 1) {
          ctx.strokeStyle = `rgba(243,200,110,${alpha * 0.55})`;
          ctx.lineWidth = q.s * 0.7;
          ctx.beginPath(); ctx.moveTo(q.px, q.py); ctx.lineTo(x, y); ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,232,176,${alpha})`;
        ctx.fillRect(x - q.s / 2, y - q.s / 2, q.s, q.s);
        q.px = x; q.py = y;
      }
      first = false;
      ctx.globalCompositeOperation = 'source-over';
    };
    G.ticker.add(draw);
    return { state, destroy() { G.ticker.remove(draw); ctx.clearRect(0, 0, W, H); } };
  }

  function preload() {
    const counter = { v: 0 };
    const out = $('.intro__count');
    const paint = () => { out.textContent = String(Math.round(counter.v)).padStart(3, '0'); };
    G.to(counter, { v: 88, duration: 1.3, ease: 'power2.out', onUpdate: paint });
    const img = introImg;
    const imgReady = img.complete && img.naturalWidth ? Promise.resolve() : new Promise((res) => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); });
    const decoded = imgReady.then(() => (img.decode ? img.decode().catch(() => {}) : null));
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    const minTime = new Promise((res) => setTimeout(res, 1000));
    const maxTime = new Promise((res) => setTimeout(res, 6000));
    return Promise.race([Promise.all([decoded, fonts, minTime]), maxTime]).then(() => new Promise((res) => {
      G.to(counter, { v: 100, duration: 0.35, overwrite: true, onUpdate: paint, onComplete: res });
    }));
  }

  function resetIntro() {
    intro.classList.remove('is-done');
    body.classList.add('is-loading');
    heroCrown.classList.add('is-pending');
    hdr.classList.add('is-intro');
    G.set(intro, { autoAlpha: 1 });
    G.set('.intro__bg', { opacity: 1 });
    G.set(introLogo, { x: 0, y: 0, scale: 1 });
    G.set(introImg, { opacity: 0, '--r': '0%', filter: 'none' });
    G.set($('.logo-fx__glow', introLogo), { opacity: 0 });
    G.set($('.logo-fx__sparks', introLogo), { opacity: 0 });
    G.set(['.intro__title', '.intro__meta', '.intro__skip'], { opacity: 1, y: 0 });
    G.set('.intro__name .ch', { opacity: 0 });
    G.set('.intro__tag', { opacity: 0 });
    G.set('.intro__ln', { scaleX: 0 });
    G.set('.intro__beam', { scaleX: 0, opacity: 1 });
    if (introTrace) introTrace.reset();
  }

  function playIntro(isReplay) {
    skipRequested = false;
    resetIntro();
    if (lenis) lenis.stop();
    if (!introTrace && DATA.crown) introTrace = buildTrace(introLogo, DATA.crown, 'intro');
    mountSparks(introLogo, 26);
    const ready = isReplay ? Promise.resolve() : preload();
    ready.then(() => {
      const fx = introParticles($('.intro__fx'), $('.intro__stage'));
      const flareI = $('.logo-fx__flare i', introLogo);
      const flareB = $('.logo-fx__flare b', introLogo);
      introTl = G.timeline({ defaults: { ease: 'power3.out' } });
      introTl
        .to('.intro__meta', { opacity: isReplay ? 0 : 0.5, duration: 0.6 }, 0)
        .to(fx.state, { p: 1, duration: 2.5, ease: 'none' }, 0)
        .to('.intro__beam', { scaleX: 1, duration: 1.6, ease: 'expo.inOut' }, 0.25)
        .to('.intro__beam', { opacity: 0, duration: 1.3 }, 1.7);
      if (introTrace) {
        introTl
          .to(introTrace.paths, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut', stagger: { amount: 1.15 } }, 0.95)
          .to(introTrace.svg, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 3.05);
      }
      introTl
        .to($('.logo-fx__glow', introLogo), { opacity: 1, duration: 1.6 }, 2.2)
        .set(introImg, { opacity: 1 }, 2.6)
        .fromTo(introImg, { '--r': '0%' }, { '--r': '95%', duration: 1.45, ease: 'power2.inOut' }, 2.6)
        .fromTo(introImg, { filter: 'brightness(2.4) saturate(0.5)' }, { filter: 'brightness(1) saturate(1)', duration: 1.7, ease: 'power2.out', clearProps: 'filter' }, 2.6)
        .to(fx.state, { fade: 0, duration: 1.1, ease: 'power1.in' }, 2.85)
        .fromTo(flareI, { scale: 0, opacity: 1 }, { scale: 1.25, duration: 0.55, ease: 'expo.out' }, 3.25)
        .to(flareI, { scale: 0.4, opacity: 0, duration: 1.5, ease: 'power2.out' }, 3.8)
        .fromTo(flareB, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.8, ease: 'expo.out' }, 3.25)
        .to(flareB, { opacity: 0, duration: 1.3 }, 3.9)
        .fromTo($('.logo-fx__shine', introLogo), { '--sx': '130%' }, { '--sx': '-30%', duration: 1.5, ease: 'power2.inOut' }, 3.45)
        .to($('.logo-fx__sparks', introLogo), { opacity: 1, duration: 0.8 }, 3.4)
        .fromTo('.intro__name .ch', { opacity: 0, y: 24, filter: 'blur(10px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.1, stagger: 0.034, ease: 'expo.out' }, 3.55)
        .fromTo('.intro__tag', { opacity: 0, letterSpacing: '0.2em' }, { opacity: 1, letterSpacing: '0.5em', duration: 1.7, ease: 'expo.out' }, 4.05)
        .to('.intro__ln', { scaleX: 1, duration: 1.3, ease: 'expo.out' }, 4.2)
        .add(() => outro(fx), 5.9);
      if (skipRequested) introTl.timeScale(6);
    });
  }

  function outro(fx) {
    const from = introLogo.getBoundingClientRect();
    const to = heroCrown.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const s = to.width / from.width;
    const tl = G.timeline({ onComplete: finish });
    tl.to(['.intro__title', '.intro__meta', '.intro__skip'], { opacity: 0, y: -18, duration: 0.6, ease: 'power2.in' }, 0)
      .to(introLogo, { x: dx, y: dy, scale: s, duration: 1.5, ease: 'expo.inOut' }, 0.05)
      .to('.intro__bg', { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 0.45)
      .add(heroEnter, 0.55);
    if (introTl) introTl.timeScale() > 1 && tl.timeScale(2);
    function finish() {
      heroCrown.classList.remove('is-pending');
      intro.classList.add('is-done');
      body.classList.remove('is-loading');
      fx.destroy();
      if (lenis) lenis.start();
      ST.refresh();
      if (!heroShine) heroShine = shineLoop(heroCrown, 1.2);
    }
  }

  let skipRequested = false;
  function skipIntro() {
    skipRequested = true;
    if (introTl && introTl.isActive()) introTl.timeScale(6);
  }
  $('.intro__skip').addEventListener('click', skipIntro);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !intro.classList.contains('is-done')) skipIntro(); });
  $('.ftr__replay').addEventListener('click', () => {
    if (lenis) lenis.scrollTo(0, { immediate: true, force: true }); else window.scrollTo(0, 0);
    requestAnimationFrame(() => playIntro(true));
  });

  /* ---------------------------------------------------------
     HERO
     --------------------------------------------------------- */
  function heroEnter() {
    hdr.classList.remove('is-intro');
    const words = $$('.hero__title .wi');
    const tl = G.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.hero__eyebrow', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1 }, 0.05)
      .fromTo(words, { yPercent: 118 }, { yPercent: 0, duration: 1.4, stagger: 0.08 }, 0.12)
      .fromTo(['.hero__lead', '.hero__ctas', '.countdown'], { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1 }, 0.45)
      .fromTo(['.hero__astro', '.hero__rays', '.hero__floor'], { opacity: 0 }, { opacity: 1, duration: 2.2, ease: 'power2.out' }, 0.2)
      .fromTo('.hero__bar', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.9);
    return tl;
  }
  mountSparks(heroCrown, 24);
  tilt(heroCrown, $('.hero__visual'), { max: 9 });

  // gentle parallax as the hero scrolls away
  G.to('.hero__visual', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.hero__copy', { yPercent: -10, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center 40%', end: 'bottom top', scrub: true } });

  // countdown → Grand Final (Istanbul, UTC+3)
  const target = new Date('2027-10-23T20:00:00+03:00').getTime();
  const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
  const pad = (n, l = 2) => String(n).padStart(l, '0');
  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 864e5); diff -= d * 864e5;
    const h = Math.floor(diff / 36e5); diff -= h * 36e5;
    const m = Math.floor(diff / 6e4); diff -= m * 6e4;
    const s = Math.floor(diff / 1e3);
    cd.d.textContent = pad(d, 3); cd.h.textContent = pad(h); cd.m.textContent = pad(m); cd.s.textContent = pad(s);
  }
  tick(); setInterval(tick, 1000);

  // astrolabe rings (hero + crown section)
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
     Header, menu, anchors
     --------------------------------------------------------- */
  let lastY = 0;
  function onScroll(y) {
    hdr.classList.toggle('is-scrolled', y > 30);
    if (y > lastY + 3 && y > 520 && !body.classList.contains('menu-open')) hdr.classList.add('is-hidden');
    else if (y < lastY - 3) hdr.classList.remove('is-hidden');
    lastY = y;
    const max = root.scrollHeight - window.innerHeight;
    hdr.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
  }
  if (lenis) lenis.on('scroll', (e) => onScroll(e.scroll));
  else window.addEventListener('scroll', () => onScroll(window.scrollY), { passive: true });

  const burger = $('.hdr__burger');
  function setMenu(open) {
    body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', String(open));
    if (lenis) (open ? lenis.stop() : lenis.start());
  }
  burger.addEventListener('click', () => setMenu(!body.classList.contains('menu-open')));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && body.classList.contains('menu-open')) setMenu(false); });

  $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href');
    if (id.length < 2) { e.preventDefault(); return; }
    const el = $(id);
    if (!el) return;
    e.preventDefault();
    if (body.classList.contains('menu-open')) setMenu(false);
    hdr.classList.remove('is-hidden');
    scrollTo(id === '#home' ? 0 : el, { offset: id === '#contact' ? 0 : -10 });
  }));

  const navLinks = $$('.hdr__nav a');
  ['about', 'crown', 'journey', 'titles', 'global', 'archive', 'contact'].forEach((id) => {
    const sec = document.getElementById(id);
    if (!sec) return;
    ST.create({
      trigger: sec, start: 'top 45%', end: 'bottom 45%',
      onToggle: (self) => { if (self.isActive) navLinks.forEach((l) => l.classList.toggle('is-active', l.getAttribute('href') === `#${id}`)); }
    });
  });
  ST.create({ trigger: '.hero', start: 'top top', end: 'bottom 45%', onEnter: () => navLinks.forEach((l) => l.classList.remove('is-active')), onEnterBack: () => navLinks.forEach((l) => l.classList.remove('is-active')) });

  /* ---------------------------------------------------------
     Ribbon & nations marquees
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
      const boost = 1 + Math.min(Math.abs(e.velocity) * 0.09, 5);
      ribbonTweens.forEach((tw) => G.to(tw, { timeScale: boost, duration: 0.4, overwrite: true }));
    });
  }
  const NATIONS = ['Türkiye', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan', 'Georgia', 'Hungary', 'Romania', 'Greece', 'Italy', 'France', 'Spain', 'Germany', 'Poland', 'United Kingdom', 'Egypt', 'Nigeria', 'Kenya', 'South Africa', 'UAE', 'India', 'Thailand', 'Philippines', 'Indonesia', 'Japan', 'South Korea', 'Australia', 'Brazil', 'Argentina', 'Colombia', 'Mexico', 'Canada', 'USA'];
  const nTrack = $('.nations__track');
  const nSet = NATIONS.map((n) => `<span>${n}</span>${STAR}`).join('');
  nTrack.innerHTML = nSet + nSet;

  /* ---------------------------------------------------------
     Generic reveals & counters
     --------------------------------------------------------- */
  if (!reduceMotion) {
    const reveals = $$('[data-reveal]').filter((el) => !el.classList.contains('tcard'));
    G.set(reveals, { opacity: 0, y: 44 });
    ST.batch(reveals, {
      start: 'top 90%', once: true,
      onEnter: (batch) => G.to(batch, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.09, overwrite: true, clearProps: 'transform' })
    });
    const cards = $$('.tcard');
    G.set(cards, { opacity: 0, clipPath: 'inset(18% 0% 0% 0% round 28px)' });
    ST.batch(cards, {
      start: 'top 88%', once: true,
      onEnter: (batch) => G.to(batch, { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 28px)', duration: 1.4, ease: 'expo.out', stagger: 0.12, clearProps: 'clipPath' })
    });
  }
  $$('[data-count]').forEach((el) => {
    const end = +el.dataset.count;
    const o = { v: 0 };
    if (reduceMotion) { el.textContent = end; return; }
    ST.create({ trigger: el, start: 'top 92%', once: true, onEnter: () => G.to(o, { v: end, duration: 2.4, ease: 'power3.out', onUpdate: () => { el.textContent = Math.round(o.v); } }) });
  });

  /* ---------------------------------------------------------
     ABOUT — emblem draws itself, then turns to gold
     --------------------------------------------------------- */
  const emblem = $('.about__emblem');
  mountSparks(emblem, 18);
  if (emblem && DATA.emblem && !reduceMotion) {
    emblem.classList.add('is-armed');
    const tr = buildTrace(emblem, DATA.emblem, 'emblem');
    const img = $('.logo-fx__img', emblem);
    ST.create({
      trigger: emblem, start: 'top 72%', once: true,
      onEnter: () => {
        G.timeline()
          .to(tr.paths, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: { amount: 1.2 } }, 0)
          .set(img, { opacity: 1 }, 1.55)
          .fromTo(img, { '--r': '0%' }, { '--r': '130%', duration: 1.9, ease: 'power2.inOut' }, 1.55)
          .to(tr.svg, { opacity: 0, duration: 1.3 }, 2.3)
          .add(() => emblem.classList.remove('is-armed'), 3.3)
          .fromTo($('.logo-fx__shine', emblem), { '--sx': '130%' }, { '--sx': '-30%', duration: 1.7, ease: 'power2.inOut' }, 3.0)
          .add(() => shineLoop(emblem, 4.5), 4.7);
      }
    });
  } else if (emblem) shineLoop(emblem, 2);

  /* ---------------------------------------------------------
     VIRTUES — cursor-following glow
     --------------------------------------------------------- */
  $$('.vcard').forEach((c) => c.addEventListener('pointermove', (e) => {
    const r = c.getBoundingClientRect();
    c.style.setProperty('--mx', `${e.clientX - r.left}px`);
    c.style.setProperty('--my', `${e.clientY - r.top}px`);
  }));

  /* ---------------------------------------------------------
     THE CROWN — hotspots, loupe, spotlight
     --------------------------------------------------------- */
  const crownLogo = $('.crown__logo');
  const hotspots = $$('.hotspot', crownLogo);
  const dotsWrap = $('.crown__dots');
  const panel = { idx: $('.crown__idx'), t: $('.crown__ptitle'), d: $('.crown__ptext') };
  const loupe = $('.loupe', crownLogo);
  let active = -1, autoTimer = 0, crownInView = false, crownHover = false;
  mountSparks(crownLogo, 22);
  shineLoop(crownLogo, 3);
  crownLogo.classList.add('is-lit');
  hotspots.forEach((h, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', String(i + 1));
    b.addEventListener('click', () => setActive(i, true));
    dotsWrap.appendChild(b);
    h.addEventListener('click', () => setActive(i, true));
    h.addEventListener('pointerenter', () => setActive(i, true));
  });
  const dotBtns = $$('button', dotsWrap);
  const hsPos = (h) => [parseFloat(h.style.getPropertyValue('--x')) / 100, parseFloat(h.style.getPropertyValue('--y')) / 100];
  function placeLoupe(i) {
    const [x, y] = hsPos(hotspots[i]);
    const W = crownLogo.clientWidth, L = loupe.clientWidth, Z = 2.5;
    const lx = Math.min(0.8, Math.max(0.2, x < 0.5 ? x + 0.22 : x - 0.22));
    const ly = Math.min(0.8, Math.max(0.2, y < 0.4 ? y + 0.2 : y - 0.2));
    loupe.style.backgroundSize = `${W * Z}px ${W * Z}px`;
    loupe.style.backgroundPosition = `${L / 2 - x * W * Z}px ${L / 2 - y * W * Z}px`;
    loupe.style.setProperty('--lx', `${lx * 100}%`);
    loupe.style.setProperty('--ly', `${ly * 100}%`);
  }
  function setActive(i, user) {
    i = (i + hotspots.length) % hotspots.length;
    if (user) restartAuto();
    if (i === active) return;
    active = i;
    hotspots.forEach((h, j) => h.classList.toggle('is-active', j === i));
    dotBtns.forEach((b, j) => b.classList.toggle('is-active', j === i));
    fillPanel(true);
    loupe.classList.remove('is-on');
    placeLoupe(i);
    void loupe.offsetWidth;
    loupe.classList.add('is-on');
    const [x, y] = hsPos(hotspots[i]);
    if (!crownHover) G.to(crownLogo, { '--mx': `${x * 100}%`, '--my': `${y * 100}%`, duration: 1.1, ease: 'power3.inOut' });
  }
  function fillPanel(animate) {
    if (active < 0) return;
    const h = hotspots[active];
    panel.idx.textContent = `${String(active + 1).padStart(2, '0')} / ${String(hotspots.length).padStart(2, '0')}`;
    panel.t.textContent = $('.sr', h).textContent;
    panel.d.textContent = $('[hidden]', h).textContent;
    if (animate && !reduceMotion) G.fromTo([panel.t, panel.d], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out', overwrite: true });
  }
  langHooks.push(() => fillPanel(false));
  function restartAuto() {
    clearInterval(autoTimer);
    if (reduceMotion) return;
    autoTimer = setInterval(() => { if (crownInView && !crownHover) setActive(active + 1); }, 5200);
  }
  $$('.crown__nav .arrow').forEach((b) => b.addEventListener('click', () => setActive(active + Number(b.dataset.dir), true)));
  const crownStage = $('.crown__stage');
  crownStage.addEventListener('pointerenter', () => { crownHover = true; });
  crownStage.addEventListener('pointerleave', () => { crownHover = false; });
  tilt(crownLogo, crownStage, {
    max: 6,
    onLeave: () => { const [x, y] = hsPos(hotspots[active]); G.to(crownLogo, { '--mx': `${x * 100}%`, '--my': `${y * 100}%`, duration: 1, ease: 'power3.inOut' }); }
  });
  ST.create({ trigger: '.crown', start: 'top 70%', end: 'bottom 30%', onToggle: (self) => { crownInView = self.isActive; } });
  setActive(0);
  restartAuto();
  window.addEventListener('resize', () => { if (active >= 0) placeLoupe(active); });

  /* ---------------------------------------------------------
     JOURNEY — horizontal pinned timeline (desktop), vertical (mobile)
     --------------------------------------------------------- */
  const jTrack = $('.journey__track');
  const jLine = $('.journey__line');
  const stages = $$('.stage');
  let dotPos = [], lastP = 0;
  function measureLine(horizontal) {
    const dots = stages.map((s) => $('.stage__dot', s));
    if (horizontal) {
      const xs = dots.map((d, i) => stages[i].offsetLeft + d.offsetLeft + d.offsetWidth / 2);
      const y = stages[0].offsetTop + dots[0].offsetTop + dots[0].offsetHeight / 2;
      jLine.style.cssText = `left:${xs[0]}px;width:${xs[xs.length - 1] - xs[0]}px;top:${y}px;`;
      dotPos = xs.map((x) => (x - xs[0]) / (xs[xs.length - 1] - xs[0]));
    } else {
      const ys = dots.map((d, i) => stages[i].offsetTop + d.offsetTop + d.offsetHeight / 2);
      jLine.style.cssText = `top:${ys[0]}px;height:${ys[ys.length - 1] - ys[0]}px;`;
      dotPos = ys.map((y) => (y - ys[0]) / (ys[ys.length - 1] - ys[0]));
    }
    jLine.style.setProperty('--jp', lastP.toFixed(4));
  }
  function markStages(p) {
    lastP = p;
    jLine.style.setProperty('--jp', p.toFixed(4));
    stages.forEach((s, i) => s.classList.toggle('is-active', p >= dotPos[i] - 0.002));
  }
  const mm = G.matchMedia();
  mm.add('(min-width: 901px)', () => {
    measureLine(true);
    const dist = () => Math.max(0, jTrack.scrollWidth - window.innerWidth);
    G.to(jTrack, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: {
        trigger: '.journey', start: 'top top', end: () => `+=${dist() * 1.6 + window.innerHeight * 0.3}`,
        pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
        onRefresh: () => measureLine(true),
        onUpdate: (self) => markStages(self.progress)
      }
    });
    markStages(0);
  });
  mm.add('(max-width: 900px)', () => {
    measureLine(false);
    ST.create({
      trigger: jTrack, start: 'top 65%', end: 'bottom 65%', scrub: true,
      onRefresh: () => measureLine(false),
      onUpdate: (self) => markStages(self.progress)
    });
    markStages(0);
  });

  /* ---------------------------------------------------------
     GOODWILL — parallax emblem watermark
     --------------------------------------------------------- */
  if (!reduceMotion) {
    G.fromTo('.pledge__mark', { yPercent: 10, rotate: -4 }, { yPercent: -10, rotate: 4, ease: 'none', scrollTrigger: { trigger: '.pledge', start: 'top bottom', end: 'bottom top', scrub: true } });
    G.fromTo('.partner__rays', { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: '.partner', start: 'top 90%', end: 'center center', scrub: true } });
  }

  /* ---------------------------------------------------------
     GLOBE
     --------------------------------------------------------- */
  const globeCanvas = $('.globe');
  const globeTag = $('.globe__tag');
  if (globeCanvas && window.QEWGlobe) {
    window.QEWGlobe(globeCanvas, {
      onHost: (x, y, vis) => {
        const w = globeTag.offsetWidth, room = globeCanvas.clientWidth;
        const left = x + 14 + w > room ? x - 14 - w : x + 14;
        globeTag.style.transform = `translate(${Math.max(0, left)}px, ${y - 40}px)`;
        globeTag.classList.toggle('is-on', vis);
      }
    });
  }

  /* ---------------------------------------------------------
     ARCHIVE — cards + drag to scroll
     --------------------------------------------------------- */
  const rail = $('.archive__rail');
  const tpl = $('#acard-tpl');
  $$('[data-i18n]', tpl.content).forEach((el) => { EN[el.dataset.i18n] = el.innerHTML.trim(); });
  for (let y = 2026; y >= 2019; y--) {
    const node = tpl.content.firstElementChild.cloneNode(true);
    $('.acard__year', node).textContent = y;
    rail.appendChild(node);
    $$('[data-i18n]', node).forEach((el) => { el.innerHTML = t(el.dataset.i18n); i18nEls.push(el); });
  }
  let drag = null;
  rail.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, left: rail.scrollLeft, moved: 0 };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    drag.moved = Math.max(drag.moved, Math.abs(dx));
    if (drag.moved > 5) rail.classList.add('is-dragging');
    rail.scrollLeft = drag.left - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    drag = null;
    requestAnimationFrame(() => rail.classList.remove('is-dragging'));
  });
  rail.addEventListener('click', (e) => { if (rail.classList.contains('is-dragging')) e.preventDefault(); }, true);
  $$('.archive__ctrl .arrow').forEach((b) => b.addEventListener('click', () => {
    const card = $('.acard', rail);
    rail.scrollBy({ left: Number(b.dataset.dir) * (card.offsetWidth + 20), behavior: 'smooth' });
  }));
  if (!reduceMotion) {
    G.from($$('.acard', rail), { opacity: 0, x: 80, duration: 1.3, ease: 'expo.out', stagger: 0.07, clearProps: 'transform', scrollTrigger: { trigger: rail, start: 'top 85%', once: true } });
  }

  /* ---------------------------------------------------------
     FORMS (demo only — nothing is sent)
     --------------------------------------------------------- */
  const form = $('form.form');
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
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
      G.fromTo('.form__success > *', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 1, stagger: 0.08, ease: 'expo.out', delay: 0.15 });
      G.fromTo('.form__success-crown', { scale: 0.6, rotate: -8 }, { scale: 1, rotate: 0, duration: 1.4, ease: 'elastic.out(1, 0.5)', delay: 0.1 });
    }, 900);
  });
  $$('input, select, textarea', form).forEach((inp) => inp.addEventListener('input', () => {
    const f = inp.closest('.field');
    if (f && f.classList.contains('is-invalid')) { f.classList.remove('is-invalid'); const er = $('.field__err', f); if (er) er.textContent = ''; }
  }));
  $('.form__again').addEventListener('click', () => { form.reset(); form.classList.remove('is-sent'); });

  const news = $('form.news');
  news.addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('input', news);
    const ok = emailOk(inp.value);
    news.classList.toggle('is-invalid', !ok);
    $('.news__ok').classList.toggle('is-on', ok);
    if (ok) inp.value = '';
  });

  /* ---------------------------------------------------------
     FOOTER — fitted wordmark that fills with gold on scroll
     --------------------------------------------------------- */
  const word = $('.ftr__word');
  function fitWord() {
    const o = $('.ftr__word-o', word);
    word.style.fontSize = '100px';
    const w = o.getBoundingClientRect().width;
    const target = Math.min(word.clientWidth * 0.94, 1800);
    word.style.fontSize = `${Math.floor((100 * target) / Math.max(1, w))}px`;
  }
  fitWord();
  window.addEventListener('resize', fitWord);
  if (document.fonts) document.fonts.ready.then(fitWord);
  ST.create({ trigger: word, start: 'top 98%', end: 'bottom 70%', scrub: true, onUpdate: (s) => word.style.setProperty('--fw', `${(s.progress * 100).toFixed(1)}%`) });

  /* ---------------------------------------------------------
     Magnetic buttons
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
  }

  /* ---------------------------------------------------------
     Cursor ring
     --------------------------------------------------------- */
  if (finePointer && !reduceMotion) {
    root.classList.add('has-cursor');
    const cur = $('.cursor');
    const label = $('.cursor__label');
    const cx = G.quickTo(cur, 'x', { duration: 0.45, ease: 'power3.out' });
    const cy = G.quickTo(cur, 'y', { duration: 0.45, ease: 'power3.out' });
    window.addEventListener('pointermove', (e) => { cx(e.clientX); cy(e.clientY); cur.classList.remove('is-hidden'); }, { passive: true });
    document.addEventListener('pointerover', (e) => {
      const isDrag = e.target.closest('[data-cursor="drag"], .globe');
      const isHover = e.target.closest('a, button, .hotspot, .pill, input, select, textarea, .vcard, .tcard');
      cur.classList.toggle('is-drag', !!isDrag);
      cur.classList.toggle('is-hover', !isDrag && !!isHover);
      label.textContent = isDrag ? t('cursor.drag') : '';
    });
    document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) cur.classList.add('is-hidden'); });
  }

  /* ---------------------------------------------------------
     Gold dust (fixed, screen-blended, parallax with scroll)
     --------------------------------------------------------- */
  (function dust() {
    if (reduceMotion) return;
    const c = $('.dust');
    const ctx = c.getContext('2d');
    let W = 0, H = 0, dpr = 1;
    const size = () => { dpr = Math.min(window.devicePixelRatio || 1, 2); W = c.width = Math.round(window.innerWidth * dpr); H = c.height = Math.round(window.innerHeight * dpr); };
    size();
    window.addEventListener('resize', size);
    const N = window.innerWidth < 760 ? 26 : 58;
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
     Boot
     --------------------------------------------------------- */
  applyLang(lang, true);
  if (reduceMotion) {
    intro.classList.add('is-done');
    body.classList.remove('is-loading');
    heroCrown.classList.remove('is-pending');
    if (lenis) lenis.start();
  } else {
    playIntro(false);
  }
  window.addEventListener('load', () => ST.refresh());
})();
