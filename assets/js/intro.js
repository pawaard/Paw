/* Cinematic logo intro — particles → line art → gold reveal → flare → wordmark → the crown flies to its target.
   QEW.intro.play({ target: () => element, onFly(), onDone(), replay }) */
(() => {
  'use strict';
  const Q = window.QEW;
  const intro = Q && Q.$('#intro');
  if (!Q || !intro) return;
  const { $, G, DATA, body, reduceMotion } = Q;
  const introLogo = $('.intro__logo');
  const introImg = $('.logo-fx__img', introLogo);
  let introTrace = null;
  let introTl = null;
  let skipRequested = false;
  let opts = {};

  const nameEl = $('.intro__name');
  nameEl.innerHTML = nameEl.textContent.split('').map((c) => (c === ' ' ? ' ' : `<span class="ch">${c}</span>`)).join('');

  function particles(canvas, stage) {
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (canvas.width = Math.round(window.innerWidth * dpr));
    const H = (canvas.height = Math.round(window.innerHeight * dpr));
    const r = stage.getBoundingClientRect();
    const tp = (DATA.crown && DATA.crown.particles) || [];
    const step = window.innerWidth < 700 ? 2 : 1;
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
    const paintCount = () => { out.textContent = String(Math.round(counter.v)).padStart(3, '0'); };
    G.to(counter, { v: 88, duration: 1.3, ease: 'power2.out', onUpdate: paintCount });
    const img = introImg;
    const imgReady = img.complete && img.naturalWidth ? Promise.resolve() : new Promise((res) => { img.addEventListener('load', res, { once: true }); img.addEventListener('error', res, { once: true }); });
    const decoded = imgReady.then(() => (img.decode ? img.decode().catch(() => {}) : null));
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
    return Promise.race([Promise.all([decoded, fonts, Q.wait(1000)]), Q.wait(6000)]).then(() => new Promise((res) => {
      G.to(counter, { v: 100, duration: 0.35, overwrite: true, onUpdate: paintCount, onComplete: res });
    }));
  }

  function reset() {
    intro.classList.remove('is-done');
    body.classList.add('is-loading');
    const target = opts.target && opts.target();
    if (target) target.classList.add('is-pending');
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

  function outro(fx) {
    const target = opts.target();
    const from = introLogo.getBoundingClientRect();
    const to = target.getBoundingClientRect();
    const dx = to.left + to.width / 2 - (from.left + from.width / 2);
    const dy = to.top + to.height / 2 - (from.top + from.height / 2);
    const s = to.width / from.width;
    const tl = G.timeline({ onComplete: finish });
    tl.to(['.intro__title', '.intro__meta', '.intro__skip'], { opacity: 0, y: -18, duration: 0.6, ease: 'power2.in' }, 0)
      .to(introLogo, { x: dx, y: dy, scale: s, duration: 1.5, ease: 'expo.inOut' }, 0.05)
      .to('.intro__bg', { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 0.45)
      .add(() => { if (opts.onFly) opts.onFly(); }, 0.35);
    if (introTl && introTl.timeScale() > 1) tl.timeScale(2);
    function finish() {
      target.classList.remove('is-pending');
      intro.classList.add('is-done');
      body.classList.remove('is-loading');
      fx.destroy();
      Q.session.set('qew-intro', '1');
      if (Q.lenis) Q.lenis.start();
      if (opts.onDone) opts.onDone();
    }
  }

  function play(o) {
    opts = o || {};
    skipRequested = false;
    if (reduceMotion) {
      intro.classList.add('is-done');
      body.classList.remove('is-loading');
      const target = opts.target && opts.target();
      if (target) target.classList.remove('is-pending');
      if (opts.onFly) opts.onFly();
      if (opts.onDone) opts.onDone();
      return;
    }
    reset();
    if (Q.lenis) Q.lenis.stop();
    if (!introTrace && DATA.crown) introTrace = Q.buildTrace(introLogo, DATA.crown, 'intro');
    Q.mountSparks(introLogo, 26);
    const ready = opts.replay ? Promise.resolve() : preload();
    ready.then(() => {
      const fx = particles($('.intro__fx'), $('.intro__stage'));
      const flareI = $('.logo-fx__flare i', introLogo);
      const flareB = $('.logo-fx__flare b', introLogo);
      introTl = G.timeline({ defaults: { ease: 'power3.out' } });
      introTl
        .to('.intro__meta', { opacity: opts.replay ? 0 : 0.5, duration: 0.6 }, 0)
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

  function skip() {
    skipRequested = true;
    if (introTl && introTl.isActive()) introTl.timeScale(6);
  }
  $('.intro__skip').addEventListener('click', skip);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !intro.classList.contains('is-done')) skip(); });

  Q.intro = { play, skip };
})();
