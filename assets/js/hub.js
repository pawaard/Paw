/* =========================================================
   THE ERA MAP (home) — a mosaic of organic tiles on a dotted gold map.
   Tiles are cells of a weighted Voronoi (power) diagram clipped to an ellipse,
   so they read like the country pieces of a map — one per season and section.
   ========================================================= */
(() => {
  'use strict';
  const Q = window.QEW;
  const hub = Q && Q.$('#hub');
  if (!Q || !hub) return;
  const { $, $$, G, t, reduceMotion, finePointer, body } = Q;
  const NS = 'http://www.w3.org/2000/svg';
  const mosaic = $('.mosaic');
  const stage = $('.hub__stage');
  const hdr = $('#hdr');

  const ICONS = {
    apply: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
    press: '<rect x="3" y="5" width="15" height="14" rx="1.5"/><path d="M18 9h3v8.5a1.5 1.5 0 0 1-3 0zM6 9h9M6 12.5h9M6 16h6"/>',
    video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9.5v5l4.5-2.5z"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
    mail: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3.5 7l8.5 6.5L20.5 7"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6-4.5-4.2 6.1-.7z"/>',
    academy: '<path d="M2.5 9.5L12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4.5c3 2.4 8 2.4 11 0v-4.5M21.5 9.5v5"/>'
  };

  // a = angle in degrees (0 = right, clockwise), r = ring radius, w = power-diagram weight
  const CELLS = [
    { id: 'info', kind: 'logo', a: 0, r: 0, w: 0.1, href: 'genel-bilgi.html', key: 'cell.info' },
    { id: 'y2026', kind: 'year', year: 2026, current: true, a: -90, r: 0.66, w: 0.03, href: 'sezon/2026.html' },
    { id: 'y2027', kind: 'year', year: 2027, next: true, a: -45, r: 0.66, href: 'sezon/2027.html' },
    { id: 'mrs', kind: 'brand', mono: 'Mrs.', a: 0, r: 0.68, href: 'mrs.html' },
    { id: 'teen', kind: 'brand', mono: 'Teen', a: 45, r: 0.66, href: 'teen.html' },
    { id: 'apply', kind: 'section', icon: 'apply', key: 'cell.apply', a: 90, r: 0.66, href: 'basvuru.html' },
    { id: 'press', kind: 'section', icon: 'press', key: 'cell.press', a: 135, r: 0.66, href: 'basin.html' },
    { id: 'video', kind: 'section', icon: 'video', key: 'cell.video', a: 180, r: 0.68, href: 'video.html' },
    { id: 'goodwill', kind: 'section', icon: 'heart', key: 'cell.goodwill', a: -135, r: 0.66, href: 'iyi-niyet.html' },
    { id: 'y2025', kind: 'year', year: 2025, a: -105, r: 1.08, href: 'sezon/2025.html' },
    { id: 'y2024', kind: 'year', year: 2024, a: -135, r: 1.08, href: 'sezon/2024.html' },
    { id: 'y2023', kind: 'year', year: 2023, a: -165, r: 1.08, href: 'sezon/2023.html' },
    { id: 'y2022', kind: 'year', year: 2022, a: 165, r: 1.08, href: 'sezon/2022.html' },
    { id: 'y2021', kind: 'year', year: 2021, a: 135, r: 1.08, href: 'sezon/2021.html' },
    { id: 'y2020', kind: 'year', year: 2020, a: 105, r: 1.08, href: 'sezon/2020.html' },
    { id: 'y2019', kind: 'year', year: 2019, a: 75, r: 1.08, href: 'sezon/2019.html' },
    { id: 'y2018', kind: 'year', year: 2018, a: 45, r: 1.08, href: 'sezon/2018.html' },
    { id: 'contact', kind: 'section', icon: 'mail', key: 'cell.contact', a: 15, r: 1.08, href: 'iletisim.html' },
    { id: 'about', kind: 'emblem', key: 'cell.about', a: -15, r: 1.08, w: 0.02, href: 'genel-bilgi.html#about' },
    { id: 'sponsor', kind: 'section', icon: 'star', key: 'cell.sponsor', a: -45, r: 1.08, href: 'iletisim.html#sponsorluk' },
    { id: 'academy', kind: 'section', icon: 'academy', key: 'cell.academy', a: -75, r: 1.08, href: 'genel-bilgi.html#journey' }
  ];
  // deterministic jitter so the tiles look hand-cut rather than mechanical
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  CELLS.forEach((c) => { c.ja = c.r ? (rand() - 0.5) * 10 : 0; c.jr = c.r ? (rand() - 0.5) * 0.07 : 0; c.w = c.w || 0; });

  /* ---------------- DOM ---------------- */
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'mosaic__svg');
  svg.setAttribute('aria-hidden', 'false');
  svg.innerHTML = `
    <defs>
      <linearGradient id="mz-fill" x1="0" y1="0" x2="0.3" y2="1"><stop offset="0" stop-color="#2a2013" stop-opacity=".9"/><stop offset="1" stop-color="#0b0906" stop-opacity=".94"/></linearGradient>
      <linearGradient id="mz-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a87b25"/><stop offset=".35" stop-color="#f1d384"/><stop offset=".55" stop-color="#fff4d2"/><stop offset=".75" stop-color="#e2b85a"/><stop offset="1" stop-color="#8a6420"/></linearGradient>
      <linearGradient id="mz-stroke" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="700"><stop offset="0" stop-color="#c99a3b" stop-opacity=".55"/><stop offset=".5" stop-color="#fbe9b6" stop-opacity=".6"/><stop offset="1" stop-color="#a67a24" stop-opacity=".5"/></linearGradient>
      <radialGradient id="mz-hover" cx=".5" cy=".38" r=".75"><stop offset="0" stop-color="#f3d27a" stop-opacity=".34"/><stop offset=".6" stop-color="#c99a3b" stop-opacity=".08"/><stop offset="1" stop-color="#c99a3b" stop-opacity="0"/></radialGradient>
      <radialGradient id="mz-spot"><stop offset="0" stop-color="#fff"/><stop offset=".45" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <mask id="mz-mask" maskUnits="userSpaceOnUse" x="-50" y="-50" width="4000" height="4000"><circle class="mz-spot" cx="0" cy="0" r="230" fill="url(#mz-spot)"/></mask>
    </defs>
    <g class="mz-cells"></g>
    <g class="mz-edges" mask="url(#mz-mask)"></g>`;
  const gCells = $('.mz-cells', svg);
  const gEdges = $('.mz-edges', svg);
  const spot = $('.mz-spot', svg);
  const strokeGrad = $('#mz-stroke', svg);
  const labels = document.createElement('div');
  labels.className = 'mosaic__labels';
  mosaic.append(svg, labels);

  const arrow = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
  function labelHTML(c) {
    const go = `<span class="lbl__go"><span data-i18n="cell.explore">${t('cell.explore')}</span>${arrow}</span>`;
    switch (c.kind) {
      case 'logo':
        return `<div class="lbl__in"><div class="logo-fx logo-fx--crown lbl__crown" data-sparks="crown"><div class="logo-fx__glow"></div><img class="logo-fx__img" src="assets/img/crown.webp" alt="" width="1100" height="1100"><div class="logo-fx__shine"></div><div class="logo-fx__sparks"></div></div><span class="lbl__cap" data-i18n="${c.key}">${t(c.key)}</span>${go}</div>`;
      case 'year':
        return `<div class="lbl__in">${c.current ? `<span class="lbl__tag" data-i18n="cell.current">${t('cell.current')}</span>` : ''}<b class="lbl__year">${c.year}</b><span class="lbl__cap" data-i18n="${c.next ? 'cell.next' : 'cell.season'}">${t(c.next ? 'cell.next' : 'cell.season')}</span>${go}</div>`;
      case 'brand':
        return `<div class="lbl__in"><span class="lbl__mono" lang="en">${c.mono}</span><span class="lbl__cap" lang="en">Queen Era World</span>${go}</div>`;
      case 'emblem':
        return `<div class="lbl__in"><img class="lbl__emblem" src="assets/img/emblem.webp" alt="" width="968" height="1083"><span class="lbl__cap" data-i18n="${c.key}">${t(c.key)}</span>${go}</div>`;
      default:
        return `<div class="lbl__in"><svg class="lbl__icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[c.icon]}</svg><span class="lbl__name" data-i18n="${c.key}">${t(c.key)}</span>${go}</div>`;
    }
  }
  const coverLabel = (c) => {
    if (c.kind === 'year') return { label: String(c.year), sub: t(c.next ? 'cell.next' : 'cell.season') };
    if (c.kind === 'logo') return { label: 'Miss Queen Era World', sub: t('cell.info') };
    if (c.kind === 'brand') return { label: `${c.mono} Queen Era World`, sub: '' };
    return { label: t(c.key), sub: '' };
  };
  const ariaLabel = (c) => (c.kind === 'year' ? `${c.year} — ${t(c.next ? 'cell.next' : 'cell.season')}` : c.kind === 'brand' ? `${c.mono} Queen Era World` : c.kind === 'logo' ? `Miss Queen Era World — ${t(c.key)}` : t(c.key));

  CELLS.forEach((c) => {
    const a = document.createElementNS(NS, 'a');
    a.setAttribute('href', c.href);
    a.setAttribute('class', `cell cell--${c.kind}${c.current ? ' cell--current' : ''}${c.next ? ' cell--next' : ''}`);
    a.innerHTML = '<path class="cell__shape"/><path class="cell__hover"/><path class="cell__glint" pathLength="1"/>';
    gCells.appendChild(a);
    const edge = document.createElementNS(NS, 'path');
    edge.setAttribute('class', 'mz-edge');
    gEdges.appendChild(edge);
    const lbl = document.createElement('div');
    lbl.className = `lbl lbl--${c.kind}${c.current ? ' lbl--current' : ''}${c.next ? ' lbl--next' : ''}`;
    lbl.innerHTML = labelHTML(c);
    labels.appendChild(lbl);
    Object.assign(c, { el: a, edge, lbl, shape: $('.cell__shape', a), hover: $('.cell__hover', a), glint: $('.cell__glint', a) });

    const on = () => setHover(c, true);
    const off = () => setHover(c, false);
    if (finePointer) { // touch taps would leave tiles stuck in the hover state
      a.addEventListener('pointerenter', on);
      a.addEventListener('pointerleave', off);
    }
    a.addEventListener('focus', on);
    a.addEventListener('blur', off);
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const r = svg.getBoundingClientRect();
      const sx = r.width / W, sy = r.height / H;
      Q.go(c.href, { poly: c.poly.map(([x, y]) => [r.left + x * sx, r.top + y * sy]), ...coverLabel(c) });
    });
  });
  const center = CELLS[0];
  const crownFx = $('.lbl__crown', center.lbl);
  Q.registerI18n(labels);
  Q.onLang(() => CELLS.forEach((c) => c.el.setAttribute('aria-label', ariaLabel(c))));
  CELLS.forEach((c) => c.el.setAttribute('aria-label', ariaLabel(c)));

  function setHover(c, on) {
    c.el.classList.toggle('is-hover', on);
    c.lbl.classList.toggle('is-hover', on);
    mosaic.classList.toggle('is-hovering', on);
  }

  /* ---------------- geometry ---------------- */
  function clipHalf(poly, ax, ay, b) { // keep a·p <= b
    const outPts = [];
    for (let i = 0; i < poly.length; i++) {
      const P = poly[i], R = poly[(i + 1) % poly.length];
      const fp = ax * P[0] + ay * P[1] - b, fr = ax * R[0] + ay * R[1] - b;
      if (fp <= 0) outPts.push(P);
      if ((fp <= 0) !== (fr <= 0)) { const k = fp / (fp - fr); outPts.push([P[0] + (R[0] - P[0]) * k, P[1] + (R[1] - P[1]) * k]); }
    }
    return outPts;
  }
  function rounded(pts, r) {
    let d = '';
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n];
      const l1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]), l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const rr = Math.min(r, l1 / 2, l2 / 2);
      const a = [p1[0] + ((p0[0] - p1[0]) / l1) * rr, p1[1] + ((p0[1] - p1[1]) / l1) * rr];
      const b = [p1[0] + ((p2[0] - p1[0]) / l2) * rr, p1[1] + ((p2[1] - p1[1]) / l2) * rr];
      d += `${i ? 'L' : 'M'}${a[0].toFixed(1)},${a[1].toFixed(1)}Q${p1[0].toFixed(1)},${p1[1].toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`;
    }
    return `${d}Z`;
  }
  function inradius(poly, cx, cy) {
    let m = Infinity;
    for (let i = 0; i < poly.length; i++) {
      const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
      const len = Math.hypot(bx - ax, by - ay) || 1;
      m = Math.min(m, Math.abs((bx - ax) * (ay - cy) - (ax - cx) * (by - ay)) / len);
    }
    return m;
  }

  let W = 0, H = 0, portrait = false;
  function layout() {
    const sr = stage.getBoundingClientRect();
    if (!sr.width || !sr.height) return;
    portrait = sr.width < sr.height * 0.95;
    const SX = portrait ? 0.92 : 1.2, SY = portrait ? 1.42 : 1;
    const RB = 1.42;
    const rx = RB * SX, ry = RB * SY;
    // leave the corners free for the side blocks (tagline/countdown, socials) on wide screens
    const availW = window.innerWidth >= 1100 ? Math.min(sr.width, window.innerWidth - 2 * 300) : sr.width;
    const s = Math.min(availW / (2 * rx), sr.height / (2 * ry));
    W = Math.round(2 * rx * s); H = Math.round(2 * ry * s);
    mosaic.style.width = `${W}px`;
    mosaic.style.height = `${H}px`;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    strokeGrad.setAttribute('x2', W); strokeGrad.setAttribute('y2', H);
    mosaic.style.setProperty('--unit', s.toFixed(1));
    const cx = W / 2, cy = H / 2;
    const gap = Math.max(4, Math.min(8, s * 0.026));
    const corner = Math.max(8, s * 0.055);
    const seeds = CELLS.map((c) => {
      const ang = ((c.a + c.ja) * Math.PI) / 180, rr = c.r ? c.r + c.jr : 0;
      return [cx + Math.cos(ang) * rr * SX * s, cy + Math.sin(ang) * rr * SY * s, c.w * s * s];
    });
    const ex = rx * s - gap / 2, ey = ry * s - gap / 2;
    const boundary = [];
    for (let k = 0; k < 160; k++) { const th = (k / 160) * Math.PI * 2; boundary.push([cx + Math.cos(th) * ex, cy + Math.sin(th) * ey]); }
    CELLS.forEach((c, i) => {
      const [px, py, pw] = seeds[i];
      let poly = boundary;
      seeds.forEach(([qx, qy, qw], j) => {
        if (i === j || !poly.length) return;
        const ax = 2 * (qx - px), ay = 2 * (qy - py);
        const b = qx * qx + qy * qy - px * px - py * py + pw - qw - (gap / 2) * Math.hypot(ax, ay);
        poly = clipHalf(poly, ax, ay, b);
      });
      c.poly = poly;
      const [mx, my] = Q.centroid(poly);
      c.cx = mx; c.cy = my;
      const d = rounded(poly, corner);
      c.shape.setAttribute('d', d); c.hover.setAttribute('d', d); c.glint.setAttribute('d', d); c.edge.setAttribute('d', d);
      const inr = inradius(poly, mx, my);
      c.lbl.style.left = `${mx}px`;
      c.lbl.style.top = `${my}px`;
      c.lbl.style.setProperty('--s', inr.toFixed(1));
    });
  }

  /* ---------------- motion ---------------- */
  const sides = $$('.hub__side, .hub__foot');
  function hideAll() {
    G.set(CELLS.map((c) => c.el), { opacity: 0 });
    G.set(CELLS.map((c) => c.lbl), { opacity: 0 });
    G.set(gEdges, { opacity: 0 });
    G.set(sides, { opacity: 0 });
  }
  let idleStarted = false;
  function assemble({ fast = false, withCenter = true } = {}) {
    mosaic.classList.remove('is-ready');
    const cx = W / 2, cy = H / 2;
    const maxD = Math.hypot(cx, cy);
    const tl = G.timeline({ onComplete: () => { mosaic.classList.add('is-ready'); startIdle(); } });
    CELLS.forEach((c) => {
      const dx = c.cx - cx, dy = c.cy - cy, d = Math.hypot(dx, dy) || 1;
      const at = (d / maxD) * (fast ? 0.35 : 0.65);
      const dur = fast ? 1.15 : 1.6;
      if (c.kind === 'logo') {
        tl.fromTo(c.el, { opacity: 0, scale: 0.85, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: dur, ease: 'expo.out', clearProps: 'transform,opacity' }, 0);
        if (withCenter) tl.fromTo(c.lbl, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: dur, ease: 'expo.out', clearProps: 'transform,opacity' }, 0.1);
        else { G.set(c.lbl, { opacity: 1 }); tl.fromTo($$('.lbl__cap, .lbl__go', c.lbl), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1, clearProps: 'all' }, 0.9); }
        return;
      }
      const push = (fast ? 150 : 240) + d * 0.75;
      const k = 0.75 + rand() * 0.55;
      const from = { x: (dx / d) * push * k, y: (dy / d) * push * k, rotation: (rand() - 0.5) * 70, scale: 0.5, opacity: 0 };
      const to = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1, duration: dur, ease: 'expo.out', clearProps: 'transform,opacity' };
      tl.fromTo(c.el, { ...from, transformOrigin: '50% 50%' }, to, at);
      tl.fromTo(c.lbl, from, to, at + 0.04);
    });
    tl.fromTo(gEdges, { opacity: 0 }, { opacity: 1, duration: 1.2 }, fast ? 0.5 : 0.9)
      .fromTo(sides, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, ease: 'expo.out', clearProps: 'transform' }, fast ? 0.45 : 0.9);
    return tl;
  }
  let glintTimer = 0;
  function startIdle() {
    if (idleStarted || reduceMotion) return;
    idleStarted = true;
    Q.shineLoop(crownFx, 1.5);
    CELLS.filter((c) => c.current || c.kind === 'logo').forEach((c) => {
      G.set(c.glint, { opacity: 0.95 });
      G.fromTo(c.glint, { strokeDashoffset: 0 }, { strokeDashoffset: -1, duration: c.kind === 'logo' ? 8 : 5, ease: 'none', repeat: -1 });
    });
    const pool = CELLS.filter((c) => !c.current && c.kind !== 'logo');
    let last = null;
    glintTimer = setInterval(() => {
      if (document.hidden) return;
      let c = pool[Math.floor(Math.random() * pool.length)];
      if (c === last) c = pool[(pool.indexOf(c) + 3) % pool.length];
      last = c;
      G.timeline()
        .set(c.glint, { strokeDashoffset: 0.25 })
        .to(c.glint, { opacity: 1, duration: 0.4 }, 0)
        .to(c.glint, { strokeDashoffset: -0.75, duration: 2.2, ease: 'power1.inOut' }, 0)
        .to(c.glint, { opacity: 0, duration: 0.6 }, 1.6);
    }, 1300);
  }

  // spotlight that lights the tile edges near the pointer (wanders on its own when idle)
  let pointerIn = false;
  const sp = { x: 0, y: 0 };
  const paintSpot = () => { spot.setAttribute('cx', sp.x.toFixed(1)); spot.setAttribute('cy', sp.y.toFixed(1)); };
  const spotX = G.quickTo(sp, 'x', { duration: 0.5, ease: 'power3.out', onUpdate: paintSpot });
  const spotY = G.quickTo(sp, 'y', { duration: 0.5, ease: 'power3.out', onUpdate: paintSpot });
  mosaic.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect();
    pointerIn = true;
    spotX(((e.clientX - r.left) / r.width) * W);
    spotY(((e.clientY - r.top) / r.height) * H);
  });
  mosaic.addEventListener('pointerleave', () => { pointerIn = false; });
  if (!reduceMotion) {
    G.ticker.add((time) => {
      if (pointerIn || !W) return;
      spotX(W / 2 + Math.cos(time * 0.33) * W * 0.36);
      spotY(H / 2 + Math.sin(time * 0.51) * H * 0.34);
    });
  }

  /* ---------------- dotted map background ---------------- */
  (function map() {
    const cv = $('.hub__map');
    const aura = $('.hub__aura');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    const dots = window.GLOBE_DOTS || [];
    const LON0 = -28, LON1 = 152, LAT0 = -12, LAT1 = 76;
    const CITIES = [[28.97, 41.01, 1], [49.87, 40.41], [76.95, 43.24], [69.24, 41.3], [44.79, 41.72], [19.04, 47.5], [26.1, 44.43], [23.73, 37.98], [12.5, 41.9], [2.35, 48.86], [13.4, 52.52], [21.01, 52.23], [31.24, 30.04], [55.27, 25.2], [77.21, 28.61], [100.5, 13.75], [126.98, 37.57], [139.69, 35.69], [-0.13, 51.51], [-3.7, 40.42], [74.6, 42.87], [106.9, 47.9], [3.38, 6.52], [36.82, -1.29]];
    let Wc = 0, Hc = 0, dpr = 1, k = 1, ox = 0, oy = 0, base = null, twinkles = [];
    const proj = (lon, lat) => [ox + (lon - LON0) * k, oy + (LAT1 - lat) * k];
    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      Wc = cv.width = Math.round(r.width * dpr); Hc = cv.height = Math.round(r.height * dpr);
      k = Math.max(Wc / (LON1 - LON0), Hc / (LAT1 - LAT0));
      ox = (Wc - (LON1 - LON0) * k) / 2; oy = (Hc - (LAT1 - LAT0) * k) / 2;
      base = document.createElement('canvas'); base.width = Wc; base.height = Hc;
      const b = base.getContext('2d');
      const sz = Math.max(1.2, 1.5 * dpr);
      const vis = [];
      for (let i = 0; i < dots.length; i += 2) {
        const [x, y] = proj(dots[i] / 10, dots[i + 1] / 10);
        if (x < -4 || y < -4 || x > Wc + 4 || y > Hc + 4) continue;
        const dx = (x - Wc / 2) / (Wc / 2), dy = (y - Hc / 2) / (Hc / 2);
        const a = 0.1 + 0.22 * Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 0.7);
        b.fillStyle = `rgba(226,184,90,${a.toFixed(3)})`;
        b.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        vis.push([x, y]);
      }
      twinkles = Array.from({ length: Math.min(90, vis.length) }, () => { const v = vis[Math.floor(Math.random() * vis.length)]; return { x: v[0], y: v[1], ph: Math.random() * 6.28, sp: 0.6 + Math.random() * 1.4 }; });
    }
    size();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(size, 150); });
    G.ticker.add((time) => {
      if (document.hidden || !base) return;
      ctx.clearRect(0, 0, Wc, Hc);
      ctx.drawImage(base, 0, 0);
      const sz = Math.max(1.6, 2 * dpr);
      for (const tw of twinkles) {
        const a = Math.max(0, Math.sin(time * tw.sp + tw.ph));
        if (a < 0.05) continue;
        ctx.fillStyle = `rgba(255,236,180,${(a * 0.85).toFixed(3)})`;
        ctx.fillRect(tw.x - sz / 2, tw.y - sz / 2, sz, sz);
      }
      for (const [lon, lat, host] of CITIES) {
        const [x, y] = proj(lon, lat);
        const pr = (time * (host ? 0.55 : 0.35) + lon * 0.013) % 1;
        ctx.strokeStyle = `rgba(243,210,122,${((1 - pr) * (host ? 0.7 : 0.28)).toFixed(3)})`;
        ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.arc(x, y, (2 + pr * (host ? 22 : 12)) * dpr, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = host ? 'rgba(255,246,220,.95)' : 'rgba(255,236,180,.7)';
        ctx.beginPath(); ctx.arc(x, y, (host ? 2.6 : 1.6) * dpr, 0, Math.PI * 2); ctx.fill();
      }
    });
    if (finePointer && !reduceMotion) {
      const mx = G.quickTo(cv, 'x', { duration: 1.2, ease: 'power3.out' }), my = G.quickTo(cv, 'y', { duration: 1.2, ease: 'power3.out' });
      const axq = G.quickTo(aura, 'x', { duration: 1.4, ease: 'power3.out' }), ayq = G.quickTo(aura, 'y', { duration: 1.4, ease: 'power3.out' });
      hub.addEventListener('pointermove', (e) => {
        const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
        mx(-nx * 26); my(-ny * 18); axq(nx * 60); ayq(ny * 40);
      });
    }
  })();

  /* ---------------- boot ---------------- */
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
  Q.mountSparks(crownFx, 14);

  function startFromIntro(replay) {
    hideAll();
    hdr.classList.add('is-intro');
    Q.intro.play({
      replay,
      target: () => crownFx,
      onFly: () => { hdr.classList.remove('is-intro'); assemble({ withCenter: false }); }
    });
  }
  Q.onBoot(() => {
    layout();
    if (document.fonts) document.fonts.ready.then(layout);
    const seen = Q.root.classList.contains('intro-seen') || reduceMotion || !Q.intro;
    if (seen) {
      const intro = $('#intro');
      if (intro) intro.classList.add('is-done');
      body.classList.remove('is-loading');
      hdr.classList.remove('is-intro');
      crownFx.classList.remove('is-pending');
      hideAll();
      Q.onEnter(() => assemble({ fast: true }));
      Q.coverOut();
    } else {
      startFromIntro(false);
    }
  });
  const replay = $('.hub__replay');
  if (replay) replay.addEventListener('click', () => startFromIntro(true));
})();
