#!/usr/bin/env node
/* Builds every page of the site from shared partials.
   Usage: node tools/build.mjs   (writes the .html files into the project root and sezon/)
   English copy lives here / in tools/src; Turkish copy lives in assets/js/i18n.js under the same keys. */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = (f) => readFileSync(join(ROOT, 'tools/src', f), 'utf8');
const out = (f, html) => { mkdirSync(dirname(join(ROOT, f)), { recursive: true }); writeFileSync(join(ROOT, f), html); console.log('  built', f); };

/* ---------------- data ---------------- */
const CURRENT = 2026;
const NEXT = 2027;
const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
const COUNTRIES = {
  tr: 'Türkiye', az: 'Azerbaijan', kz: 'Kazakhstan', uz: 'Uzbekistan', ge: 'Georgia', hu: 'Hungary', ro: 'Romania',
  gr: 'Greece', it: 'Italy', fr: 'France', es: 'Spain', de: 'Germany', pl: 'Poland', gb: 'United Kingdom', md: 'Moldova',
  rs: 'Serbia', bg: 'Bulgaria', kg: 'Kyrgyzstan', mn: 'Mongolia', eg: 'Egypt', ng: 'Nigeria', za: 'South Africa',
  ae: 'UAE', in: 'India', th: 'Thailand', ph: 'Philippines', id: 'Indonesia', jp: 'Japan', kr: 'South Korea',
  br: 'Brazil', mx: 'Mexico', co: 'Colombia', us: 'USA', ca: 'Canada'
};
const CODES = Object.keys(COUNTRIES);
function rng(seed) { // mulberry32 — deterministic demo data per season
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (r, arr, n) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
function seasonData(year) {
  const r = rng(year * 7919);
  const d = pick(r, CODES, 12); // the season's delegates; winners come from among them
  const nations = 24 + Math.floor(r() * 30) + (year - 2018) * 2;
  return { queen: d[0], r1: d[1], r2: d[2], specials: d.slice(3, 9), delegates: pick(r, d, 12), nations, delegatesN: nations + 8 + Math.floor(r() * 18) };
}

/* ---------------- tiny helpers ---------------- */
const T = (key, en, tag = 'span', attrs = '') => `<${tag}${attrs ? ' ' + attrs : ''} data-i18n="${key}">${en}</${tag}>`;
const C = (code) => T(`c.${code}`, COUNTRIES[code]);
const STAR = '<svg class="star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l2.2 9.8L24 12l-9.8 2.2L12 24l-2.2-9.8L0 12l9.8-2.2z"/></svg>';
const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6"/></svg>';
const BACK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H6M11 6l-6 6 6 6"/></svg>';
const PLAY = '<svg class="play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
const CAM = '<svg class="cam" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-2.5h6L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.6"/></svg>';
const MAPI = '<svg class="mapi" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z"/><path d="M12 2.5v6.2M20.2 7.25l-5.4 3.1M20.2 16.75l-5.4-3.1M12 21.5v-6.2M3.8 16.75l5.4-3.1M3.8 7.25l5.4 3.1"/><circle cx="12" cy="12" r="3"/></svg>';
const SOCIAL = `
        <a href="#" aria-label="Instagram"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.4" cy="6.6" r="1.1"/></svg></a>
        <a href="#" aria-label="TikTok"><svg viewBox="0 0 24 24"><path d="M16.2 3c.4 2.5 2 4.1 4.4 4.3v3.1c-1.6 0-3.1-.5-4.4-1.3v6.2a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v3.2a2.5 2.5 0 1 0 1.6 2.3V3h3.1z"/></svg></a>
        <a href="#" aria-label="YouTube"><svg viewBox="0 0 24 24"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.1V8.9l5.2 3.1L10 15.1z"/></svg></a>
        <a href="#" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8.6V11h3l-.5 3.4H14V21h-3.5v-6.6H8V11h2.5V8.4c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1 0-1.2.6-1.2 1.4z"/></svg></a>
        <a href="#" aria-label="X"><svg viewBox="0 0 24 24"><path d="M4 4h4.2l4.3 5.8L17.6 4h1.9l-6.1 7 6.6 9h-4.2l-4.6-6.2L5.9 20H4l6.4-7.3z"/></svg></a>`;
// photo placeholder ("stage light" art) — swap for real <img> later
let phSeed = 1;
const PH = (label, cls = '') => {
  const r = rng(phSeed++);
  const v = (a, b) => (a + r() * (b - a)).toFixed(0);
  return `<div class="ph ${cls}" style="--x1:${v(10, 45)}%;--x2:${v(55, 90)}%;--y1:${v(-10, 30)}%;--h:${v(-14, 14)}deg;--b:${v(20, 80)}%"><span class="ph__tag">${CAM}${label}</span></div>`;
};

/* ---------------- nav ---------------- */
const NAV = [
  { id: 'info', href: 'genel-bilgi.html', key: 'nav.info', en: 'General Info' },
  { id: 'season', href: `sezon/${CURRENT}.html`, key: 'nav.season', en: `Season ${CURRENT}` },
  { id: 'video', href: 'video.html', key: 'nav.video', en: 'Video' },
  { id: 'press', href: 'basin.html', key: 'nav.press', en: 'Press' },
  { id: 'goodwill', href: 'iyi-niyet.html', key: 'nav.goodwill', en: 'Goodwill' },
  { id: 'contact', href: 'iletisim.html', key: 'nav.contact', en: 'Contact' }
];
const MENU_EXTRA = [
  { id: 'apply', href: 'basvuru.html', key: 'nav.apply', en: 'Apply' },
  { id: 'mrs', href: 'mrs.html', key: 'nav.mrs', en: 'Mrs. Queen Era World' },
  { id: 'teen', href: 'teen.html', key: 'nav.teen', en: 'Teen Queen Era World' }
];

const head = ({ p, title, desc, hub }) => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${title}</title>
  <meta name="description" content="${desc}">
  <meta name="theme-color" content="#050403">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${desc}">
  <meta property="og:image" content="${p}assets/img/og-image.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" type="image/png" href="${p}assets/img/favicon.png">
  <link rel="apple-touch-icon" href="${p}assets/img/apple-touch-icon.png">
  ${hub ? `<link rel="preload" href="${p}assets/img/crown.webp" as="image">\n  ` : ''}<link rel="stylesheet" href="${p}assets/css/style.css">
  <script>(function(d){d.classList.add('js');try{${hub
    ? "if(sessionStorage.getItem('qew-intro'))d.classList.add('pt-on','intro-seen');"
    : "d.classList.add('pt-on');"}}catch(e){${hub ? '' : "d.classList.add('pt-on');"}}})(document.documentElement);</script>
  <noscript><style>.intro,.pt{display:none!important}body.is-loading{overflow:auto}.hdr.is-intro{transform:none}.is-pending{opacity:1!important}</style></noscript>
</head>`;

const cover = (p) => `<div class="pt" aria-hidden="true"><div class="pt__inner"><img src="${p}assets/img/crown-640.webp" alt="" width="640" height="640"><b class="pt__label"></b><span class="pt__sub"></span></div></div>
<script>(function(){try{var s=JSON.parse(sessionStorage.getItem('qew-pt')||'null'),b=document.body;if(s&&s.label){document.querySelector('.pt__label').textContent=s.label;document.querySelector('.pt__sub').textContent=s.sub||'';}else if(b.dataset.ptLabel){document.querySelector('.pt__label').textContent=b.dataset.ptLabel;}}catch(e){}})();</script>`;

const header = (p, active, hub) => `
<header class="hdr${hub ? ' hdr--hub is-intro' : ''}" id="hdr">
  <a href="${p}index.html" class="hdr__brand" aria-label="Miss Queen Era World — map">
    <img src="${p}assets/img/crown-640.webp" alt="" width="46" height="46">
    <span class="hdr__word" lang="en"><b>Miss Queen Era</b><small>World</small></span>
  </a>
  <nav class="hdr__nav" aria-label="Main">
    ${hub ? '' : `<a href="${p}index.html" class="hdr__map">${MAPI}${T('nav.map', 'Map')}</a>`}
    ${NAV.map((n) => `<a href="${p}${n.href}"${n.id === active ? ' class="is-active" aria-current="page"' : ''} data-i18n="${n.key}">${n.en}</a>`).join('\n    ')}
  </nav>
  <div class="hdr__right">
    <div class="lang" role="group" aria-label="Language">
      <button type="button" data-lang="tr">TR</button><span></span><button type="button" data-lang="en">EN</button>
    </div>
    <a href="${p}basvuru.html" class="btn btn--gold btn--sm magnetic">${T('cta.apply', 'Apply Now')}</a>
    <button class="hdr__burger" type="button" aria-label="Menu" aria-expanded="false" aria-controls="menu"><span></span><span></span></button>
  </div>
  <div class="hdr__progress"><i></i></div>
</header>

<div class="menu" id="menu">
  <img class="menu__mark" src="${p}assets/img/emblem.webp" alt="" loading="lazy">
  <nav class="menu__nav" aria-label="Mobile">
    <a href="${p}index.html" style="--i:0"><small>00</small>${T('nav.map', 'Map')}</a>
    ${[...NAV, ...MENU_EXTRA].map((n, i) => `<a href="${p}${n.href}" style="--i:${i + 1}"><small>${String(i + 1).padStart(2, '0')}</small>${n.id === 'mrs' || n.id === 'teen' ? `<span lang="en">${n.en}</span>` : T(n.key, n.en)}</a>`).join('\n    ')}
  </nav>
  <div class="menu__foot">
    <a href="${p}basvuru.html" class="btn btn--gold">${T('cta.apply', 'Apply Now')}</a>
    <div class="lang" role="group" aria-label="Language">
      <button type="button" data-lang="tr">TR</button><span></span><button type="button" data-lang="en">EN</button>
    </div>
  </div>
</div>`;

const footer = (p) => `
<footer class="ftr" id="contact">
  <div class="wrap ftr__top">
    <div class="ftr__brand">
      <img src="${p}assets/img/crown-640.webp" alt="" width="96" height="96" loading="lazy">
      <p class="ftr__name" lang="en">Miss Queen Era World</p>
      ${T('ft.tag', 'Where Queens Are Born', 'p', 'class="ftr__tag"')}
      <div class="social">${SOCIAL}
      </div>
    </div>
    <div class="ftr__col">
      ${T('ft.explore', 'Explore', 'h4')}
      <a href="${p}index.html" data-i18n="nav.map">Map</a>
      ${NAV.slice(0, 5).map((n) => `<a href="${p}${n.href}" data-i18n="${n.key}">${n.en}</a>`).join('\n      ')}
      <a href="${p}basvuru.html" data-i18n="cta.apply">Apply Now</a>
    </div>
    <div class="ftr__col">
      ${T('ft.contact', 'Contact', 'h4')}
      <a href="mailto:info@missqueeneraworld.com">info@missqueeneraworld.com</a>
      <a href="tel:+902120000000">+90 (212) 000 00 00</a>
      ${T('ft.city', 'Istanbul, Türkiye', 'p')}
      ${T('ft.press', 'Press &amp; media: press@missqueeneraworld.com', 'p', 'class="ftr__small"')}
    </div>
    <div class="ftr__col ftr__news">
      ${T('ft.news', 'Newsletter', 'h4')}
      ${T('ft.newsp', 'Join our list for Grand Final announcements and exclusive content.', 'p')}
      <form class="news" novalidate>
        <input type="email" placeholder="Your email" data-i18n-attr="placeholder:ft.ph" aria-label="Email" required>
        <button type="submit" aria-label="Join">${ARROW}</button>
      </form>
      ${T('ft.newsok', 'Welcome to the era ✦', 'p', 'class="news__ok"')}
    </div>
  </div>
  <div class="ftr__word" aria-hidden="true" lang="en"><span class="ftr__word-o">Queen Era</span><span class="ftr__word-f">Queen Era</span></div>
  <div class="wrap ftr__bottom">
    ${T('ft.copy', '© 2026 Miss Queen Era World. All rights reserved.', 'p')}
    <div class="ftr__links">
      <a href="#" data-i18n="ft.privacy">Privacy</a>
      <a href="#" data-i18n="ft.cookies">Cookies</a>
      <a href="${p}index.html" class="ftr__replay">${STAR}${T('ft.map', 'Back to the era map')}</a>
    </div>
  </div>
</footer>`;

const fx = () => `
<div class="cursor" aria-hidden="true"><i class="cursor__ring"><span class="cursor__label"></span></i></div>
<canvas class="dust" aria-hidden="true"></canvas>
<div class="grain" aria-hidden="true"></div>`;

const scripts = (p, extra = []) => `
<script src="${p}assets/vendor/gsap.min.js"></script>
<script src="${p}assets/vendor/ScrollTrigger.min.js"></script>
<script src="${p}assets/vendor/lenis.min.js"></script>
<script src="${p}assets/js/logo-data.js"></script>
<script src="${p}assets/js/i18n.js"></script>
<script src="${p}assets/js/core.js"></script>
${extra.map((f) => `<script src="${p}assets/js/${f}"></script>`).join('\n')}`;

const meta = (key, en) => `<span hidden data-i18n="${key}">${en}</span>`;

function page({ file, p = '', pageId, active, title, desc, label, body, extraScripts = ['pages.js'], titleKey, titleEn, titleY = '', bodyClass = '' }) {
  const html = `${head({ p, title, desc, hub: false })}
<body class="${bodyClass}" data-page="${pageId}" data-pt-label="${label}">
${cover(p)}
${header(p, active, false)}
<main id="main">
${body}
</main>
${footer(p)}
${fx()}
<span hidden data-i18n="${titleKey || 'meta.' + pageId}" data-meta-title${titleY ? ` data-y="${titleY}"` : ''}>${titleEn}</span>
${meta('cursor.drag', 'Drag')}${meta('modal.video', 'The official film will be embedded here (YouTube / Vimeo).')}
${scripts(p, extraScripts)}
</body>
</html>
`;
  out(file, html);
}

/* page hero used by inner pages */
const phero = ({ p, crumbs, eyebrowKey, eyebrowEn, titleKey, titleEn, leadKey, leadEn, mark = 'crown', extra = '', cls = '' }) => `
<section class="phero ${cls}">
  <div class="phero__bg" aria-hidden="true"><svg class="astro phero__astro" viewBox="0 0 1000 1000"></svg><div class="rays phero__rays"></div></div>
  <div class="wrap phero__inner">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${p}index.html">${MAPI}${T('nav.map', 'Map')}</a>${crumbs.map((c) => `<span class="crumbs__sep">/</span>${c}`).join('')}</nav>
    <p class="eyebrow phero__eyebrow">${STAR}${T(eyebrowKey, eyebrowEn)}</p>
    <h1 class="display phero__title" data-split="hero" data-i18n="${titleKey}">${titleEn}</h1>
    ${leadKey ? T(leadKey, leadEn, 'p', 'class="phero__lead"') : ''}
    ${extra}
  </div>
  ${mark === 'crown' ? `<img class="phero__mark" src="${p}assets/img/crown-640.webp" alt="" width="640" height="640">` : mark === 'emblem' ? `<img class="phero__mark phero__mark--emblem" src="${p}assets/img/emblem.webp" alt="" width="968" height="1083">` : mark}
</section>`;

const ctaBand = ({ p, eyebrowKey, eyebrowEn, titleKey, titleEn, leadKey, leadEn, buttons }) => `
<section class="partner">
  <div class="rays partner__rays" aria-hidden="true"></div>
  <div class="wrap partner__inner">
    ${T(eyebrowKey, eyebrowEn, 'p', 'class="eyebrow"')}
    <h2 class="h2" data-split data-i18n="${titleKey}">${titleEn}</h2>
    ${T(leadKey, leadEn, 'p', 'class="sec-head__lead" data-reveal')}
    <div class="partner__ctas" data-reveal>${buttons}</div>
  </div>
</section>`;

const demoNote = () => `<p class="demo-note">${STAR}${T('demo.note', 'Names, photos and figures on this page are placeholders for the demo.')}</p>`;

/* ================= HUB (index.html) ================= */
function buildHub() {
  const p = '';
  const html = `${head({ p, title: 'Miss Queen Era World — Where Queens Are Born', desc: 'Miss Queen Era World — an international pageant uniting elegance, intellect and culture. Explore every season on the era map.', hub: true })}
<body class="is-loading" data-page="hub" data-pt-label="Miss Queen Era World">
${cover(p)}
${src('intro.html')}
${header(p, 'map', true)}

<main class="hub" id="hub">
  <canvas class="hub__map" aria-hidden="true"></canvas>
  <div class="hub__aura" aria-hidden="true"></div>
  <h1 class="sr">Miss Queen Era World — ${T('hub.h1', 'The era map')}</h1>
  <div class="hub__stage">
    <nav class="mosaic" aria-label="Era map"></nav>
  </div>
  <div class="hub__side hub__side--l">
    <p class="eyebrow">${STAR}${T('hero.eyebrow', '2027 Grand Final · Istanbul')}</p>
    <p class="hub__tag" data-i18n="hub.tag">Where <em>Queens</em><br>Are Born</p>
    <div class="countdown countdown--sm" aria-live="off">
      ${T('cd.label', 'Until the Grand Final', 'p', 'class="countdown__label"')}
      <div class="countdown__grid">
        <div><b data-cd="d">000</b>${T('cd.d', 'Days')}</div>
        <div><b data-cd="h">00</b>${T('cd.h', 'Hours')}</div>
        <div><b data-cd="m">00</b>${T('cd.m', 'Minutes')}</div>
        <div><b data-cd="s">00</b>${T('cd.s', 'Seconds')}</div>
      </div>
    </div>
  </div>
  <div class="hub__side hub__side--r">
    <p class="hub__hint"><i></i>${T('hub.hint', 'Choose a piece of the era')}</p>
    <div class="hub__social social">${SOCIAL}
    </div>
  </div>
  <div class="hub__foot">
    ${T('ft.copy', '© 2026 Miss Queen Era World. All rights reserved.', 'p')}
    <button type="button" class="ftr__replay hub__replay">${STAR}${T('ft.replay', 'Replay logo intro')}</button>
  </div>
</main>
${fx()}
<span hidden data-i18n="meta.title" data-meta-title>Miss Queen Era World — Where Queens Are Born</span>
${meta('cursor.drag', 'Drag')}
${meta('cell.info', 'General Info')}${meta('cell.about', 'Who We Are')}${meta('cell.season', 'Season')}${meta('cell.current', 'Current season')}
${meta('cell.next', 'Coming · Istanbul')}${meta('cell.final', 'Final')}${meta('cell.apply', 'Apply')}${meta('cell.press', 'Press')}
${meta('cell.video', 'Video')}${meta('cell.goodwill', 'Goodwill Ambassador')}${meta('cell.contact', 'Contact')}
${meta('cell.sponsor', 'Sponsorship')}${meta('cell.academy', 'Queen Academy')}${meta('cell.explore', 'Explore')}
${scripts(p, ['globe-data.js', 'intro.js', 'hub.js'])}
</body>
</html>
`;
  out('index.html', html);
}

/* ================= GENERAL INFO ================= */
function buildGeneral() {
  page({
    file: 'genel-bilgi.html', pageId: 'general', active: 'info', label: 'Miss Queen Era World',
    title: 'General Info — Miss Queen Era World', titleEn: 'General Info — Miss Queen Era World',
    desc: 'About Miss Queen Era World: our story, the six virtues, the crown, the road to the crown and our titles.',
    body: src('general.html'), extraScripts: ['globe-data.js', 'globe.js', 'pages.js']
  });
}

/* ================= SEASON PAGES ================= */
const AWARD_KEYS = ['aw.1', 'aw.2', 'aw.3', 'aw.4', 'aw.5', 'aw.6', 'aw.7', 'aw.8'];
const AWARD_EN = ['Best National Costume', 'Miss Talent', 'Miss Photogenic', 'Best Evening Gown', 'Goodwill Ambassador', 'People’s Choice', 'Miss Elegance', 'Best Interview'];
const GALLERY = [['gal.1', 'Coronation'], ['gal.2', 'National Costume Night'], ['gal.3', 'Evening Gown'], ['gal.4', 'Queen Academy'], ['gal.5', 'Press Conference'], ['gal.6', 'Backstage'], ['gal.7', 'Gala Dinner'], ['gal.8', 'Charity Visit']];

function yearNav(p, year) {
  const all = [...YEARS, NEXT];
  const i = all.indexOf(year);
  const prev = all[i - 1], next = all[i + 1];
  const card = (y, dirKey, dirEn, cls) => y ? `<a class="ynav__card ${cls}" href="${p}sezon/${y}.html" data-pt="${y}">
      <span class="ynav__dir">${cls === 'is-prev' ? BACK : ''}${T(dirKey, dirEn)}${cls === 'is-next' ? ARROW : ''}</span>
      <b class="ynav__year">${y}</b>
      ${T(y === NEXT ? 'cell.next' : 'cell.season', y === NEXT ? 'Coming · Istanbul' : 'Season', 'span', 'class="ynav__sub"')}
    </a>` : '<span class="ynav__card is-empty"></span>';
  return `
<section class="ynav">
  <div class="wrap ynav__grid">
    ${card(prev, 'yr.prev', 'Previous season', 'is-prev')}
    <a class="ynav__map" href="${p}index.html">${MAPI}${T('ft.map', 'Back to the era map')}</a>
    ${card(next, 'yr.next', 'Next season', 'is-next')}
  </div>
</section>`;
}

function buildSeason(year) {
  const p = '../';
  const { queen, r1, r2, specials, delegates, nations, delegatesN } = seasonData(year);
  const isCurrent = year === CURRENT;
  const name = T('yr.name', 'Full Name');
  const handle = '<span class="handle">@instagram</span>';

  const body = `
<section class="phero phero--year">
  <div class="phero__bg" aria-hidden="true"><svg class="astro phero__astro" viewBox="0 0 1000 1000"></svg><div class="rays phero__rays"></div></div>
  <div class="wrap phero__inner">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${p}index.html">${MAPI}${T('nav.map', 'Map')}</a><span class="crumbs__sep">/</span>${T('yr.crumb', 'Seasons')}<span class="crumbs__sep">/</span><span>${year}</span></nav>
    <div class="yhero">
      <div class="yhero__copy">
        <p class="eyebrow phero__eyebrow">${STAR}${isCurrent ? T('yr.eyebrow.current', 'Current season · Final &amp; results') : T('yr.eyebrow', 'Season final &amp; results')}</p>
        <h1 class="yhero__year" aria-label="Miss Queen Era World ${year}"><span class="yhero__o" aria-hidden="true">${year}</span><span class="yhero__f" aria-hidden="true">${year}</span></h1>
        <p class="yhero__title"><span lang="en">Miss Queen Era World</span> <b>${year}</b></p>
        <div class="yhero__facts">
          <div><b data-count="${nations}">${nations}</b>${T('yr.f.nations', 'Nations')}</div>
          <div><b data-count="${delegatesN}">${delegatesN}</b>${T('yr.f.delegates', 'Delegates')}</div>
          <div><b data-count="9">9</b>${T('yr.f.titles', 'Titles awarded')}</div>
        </div>
      </div>
      <a class="yhero__queen" href="#awards">
        ${PH(T('yr.photo.queen', 'Queen’s portrait'), 'ph--portrait')}
        <span class="yhero__badge"><img src="${p}assets/img/crown-640.webp" alt="" width="64" height="64">${T('yr.queen', 'The Queen')} ${year}</span>
      </a>
    </div>
  </div>
</section>

<nav class="ytabs" aria-label="Season sections"><div class="ytabs__in">
  <a href="#overview">${T('yr.t1', 'Overview')}</a><a href="#awards">${T('yr.t2', 'Awards')}</a><a href="#delegates">${T('yr.t3', 'Delegates')}</a><a href="#gallery">${T('yr.t4', 'Gallery')}</a><a href="#film">${T('yr.t5', 'Film')}</a>
</div></nav>

<section class="section ysec yover" id="overview">
  <div class="wrap yover__grid">
    <div>
      <p class="eyebrow"><span class="eyebrow__num">01</span>${T('yr.t1', 'Overview')}</p>
      <h2 class="h2" data-split data-i18n="yr.ov.title">A season of <em>new</em> stars</h2>
    </div>
    <div>
      ${T('yr.ov.p1', 'This season brought delegates from every corner of the world together for a week themed on culture, elegance and social impact — from the Queen Academy to the coronation night.', 'p', 'class="about__p" data-reveal')}
      ${T('yr.ov.p2', 'Below you will find the crowned queens and special award winners, the delegates, the photo gallery and the official film of the final.', 'p', 'class="about__p" data-reveal')}
    </div>
  </div>
</section>

<section class="section ysec" id="awards">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">02</span>${T('yr.t2', 'Awards')}</p>
      <h2 class="h2" data-split data-i18n="yr.aw.title">The <em>crowned</em> queens</h2>
    </header>
    <div class="podium">
      <article class="queen" data-reveal>
        ${PH(T('yr.photo.crowning', 'Coronation moment'), 'ph--wide')}
        <div class="queen__body">
          <span class="queen__badge"><img src="${p}assets/img/crown-640.webp" alt="" width="64" height="64"></span>
          <p class="queen__title" lang="en">Miss Queen Era World ${year}</p>
          <p class="queen__who">${C(queen)} <span class="queen__sep">/</span> ${name}</p>
          ${handle}
        </div>
      </article>
      <div class="runners">
        <article class="runner" data-reveal>
          ${PH(T('yr.photo', 'Photo'), 'ph--sq')}
          <div><p class="runner__rank">${T('yr.r1', '1st Runner-up')}</p><p class="runner__who">${C(r1)} / ${name}</p>${handle}</div>
        </article>
        <article class="runner" data-reveal>
          ${PH(T('yr.photo', 'Photo'), 'ph--sq')}
          <div><p class="runner__rank">${T('yr.r2', '2nd Runner-up')}</p><p class="runner__who">${C(r2)} / ${name}</p>${handle}</div>
        </article>
      </div>
    </div>
    <h3 class="specials__title" data-reveal>${T('aw.title', 'Special Awards')}</h3>
    <ol class="specials">
      ${specials.map((c, i) => `<li data-reveal><span class="specials__award">${T(AWARD_KEYS[i], AWARD_EN[i])}</span><span class="specials__who">${C(c)} / ${name}</span></li>`).join('\n      ')}
    </ol>
  </div>
</section>

<section class="section ysec ydel" id="delegates">
  <div class="wrap">
    <header class="sec-head sec-head--row">
      <div>
        <p class="eyebrow"><span class="eyebrow__num">03</span>${T('yr.t3', 'Delegates')}</p>
        <h2 class="h2" data-split data-i18n="yr.del.title">Faces of the <em>season</em></h2>
      </div>
      ${T('yr.del.lead', 'Every delegate represents her nation, her culture and her cause.', 'p', 'class="sec-head__lead" data-reveal')}
    </header>
    <div class="delegates">
      ${delegates.map((c, i) => `<article class="delegate" data-reveal>${PH('', 'ph--portrait ph--mini')}<span class="delegate__no">${String(i + 1).padStart(2, '0')}</span><p class="delegate__country">${C(c)}</p><p class="delegate__name">${name}</p></article>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section ysec" id="gallery">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">04</span>${T('yr.t4', 'Gallery')}</p>
      <h2 class="h2" data-split data-i18n="yr.gal.title">Moments to <em>remember</em></h2>
    </header>
    <div class="gallery" data-gallery>
      ${GALLERY.map(([k, en], i) => `<button type="button" class="gallery__item g${i + 1}" data-reveal>${PH(T(k, en))}</button>`).join('\n      ')}
    </div>
  </div>
</section>

<section class="section ysec" id="film">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">05</span>${T('yr.t5', 'Film')}</p>
      <h2 class="h2" data-split data-i18n="yr.film.title">The official <em>film</em></h2>
    </header>
    <button type="button" class="vplayer" data-video data-reveal>
      ${PH('', 'ph--cinema')}
      <span class="vplayer__play">${PLAY}</span>
      <span class="vplayer__meta"><b>${year} ${T('vid.final', 'Grand Final')}</b>${T('yr.film.sub', 'Coronation night — official film')}</span>
    </button>
  </div>
</section>
${yearNav(p, year)}
${demoNote()}`;

  page({
    file: `sezon/${year}.html`, p, pageId: 'season', active: isCurrent ? 'season' : '', label: String(year),
    title: `Season ${year} — Miss Queen Era World`, titleEn: `Season ${year} — Miss Queen Era World`, titleKey: 'meta.season', titleY: year,
    desc: `Miss Queen Era World ${year}: queens, special awards, delegates, gallery and film.`, body
  });
}

function buildNextSeason() {
  const p = '../';
  const year = NEXT;
  const steps = [1, 2, 3, 4, 5].map((i) => ({ i }));
  const EN = [
    ['January – March 2027', 'Application', 'The journey begins with an online application, a portfolio and a short introduction video.'],
    ['April – May 2027', 'National Castings', 'Our national directors host in-person castings in every country to select their delegates.'],
    ['June 2027', 'Queen Academy', 'An intensive programme in protocol, public speaking, runway, media and social impact.'],
    ['October 2027', 'Gala Week', 'National costume show, talent competition, evening gown and jury interviews.'],
    ['23 October 2027 · Istanbul', 'Coronation Night', 'Before the eyes of the world, the new queen is crowned and her year-long reign begins.']
  ];
  const body = `
<section class="phero phero--year phero--next">
  <div class="phero__bg" aria-hidden="true"><svg class="astro phero__astro" viewBox="0 0 1000 1000"></svg><div class="rays phero__rays"></div></div>
  <div class="wrap phero__inner">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${p}index.html">${MAPI}${T('nav.map', 'Map')}</a><span class="crumbs__sep">/</span>${T('yr.crumb', 'Seasons')}<span class="crumbs__sep">/</span><span>${year}</span></nav>
    <div class="yhero">
      <div class="yhero__copy">
        <p class="eyebrow phero__eyebrow">${STAR}${T('yr.eyebrow.next', 'Next season · Istanbul')}</p>
        <h1 class="yhero__year" aria-label="Miss Queen Era World ${year}"><span class="yhero__o" aria-hidden="true">${year}</span><span class="yhero__f" aria-hidden="true">${year}</span></h1>
        <p class="yhero__title"><span lang="en">Miss Queen Era World</span> <b>${year}</b></p>
        <div class="countdown" aria-live="off">
          ${T('cd.label', 'Until the Grand Final', 'p', 'class="countdown__label"')}
          <div class="countdown__grid">
            <div><b data-cd="d">000</b>${T('cd.d', 'Days')}</div>
            <div><b data-cd="h">00</b>${T('cd.h', 'Hours')}</div>
            <div><b data-cd="m">00</b>${T('cd.m', 'Minutes')}</div>
            <div><b data-cd="s">00</b>${T('cd.s', 'Seconds')}</div>
          </div>
        </div>
        <div class="hero__ctas">
          <a href="${p}basvuru.html" class="btn btn--gold magnetic">${T('cta.apply', 'Apply Now')}${ARROW}</a>
          <a href="#road" class="btn btn--ghost magnetic">${T('yr.next.road', 'The road to 2027')}</a>
        </div>
      </div>
      <div class="yhero__visual"><img src="${p}assets/img/crown.webp" alt="" width="1100" height="1100"></div>
    </div>
  </div>
</section>

<section class="section" id="road">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">01</span>${T('jr.eyebrow', 'The Journey')}</p>
      <h2 class="h2" data-split data-i18n="jr.title">The road to the <em>crown</em></h2>
    </header>
    <ol class="steps steps--5">
      ${steps.map(({ i }) => `<li class="step" data-reveal><span class="step__no">0${i}</span>${T(`jr.${i}.date`, EN[i - 1][0], 'p', 'class="step__date"')}${T(`jr.${i}.t`, EN[i - 1][1], 'h3')}${T(`jr.${i}.d`, EN[i - 1][2], 'p')}</li>`).join('\n      ')}
    </ol>
  </div>
</section>
${ctaBand({ p, eyebrowKey: 'yr.next.cta.e', eyebrowEn: 'Season 2027', titleKey: 'ap.title', titleEn: 'Your era begins <em>now</em>', leadKey: 'ap.lead', leadEn: 'Applications for the 2027 season open soon. Complete the pre-registration form and your national director will be in touch.', buttons: `<a href="${p}basvuru.html" class="btn btn--gold magnetic">${T('cta.apply', 'Apply Now')}</a><a href="${p}iletisim.html" class="btn btn--ghost magnetic">${T('pt.contact', 'Get in Touch')}</a>` })}
${yearNav(p, year)}`;
  page({
    file: `sezon/${year}.html`, p, pageId: 'season-next', active: '', label: String(year),
    title: `Season ${year} — Miss Queen Era World`, titleEn: `Season ${year} — Miss Queen Era World`, titleKey: 'meta.season', titleY: year,
    desc: `Miss Queen Era World ${year} — Grand Final in Istanbul. Applications, timeline and countdown.`, body
  });
}

/* ================= VIDEO ================= */
function buildVideo() {
  const p = '';
  const items = [
    ['finals', 2026, 'vid.final', 'Grand Final'], ['backstage', 2026, 'vid.academy', 'Queen Academy · Backstage'], ['interviews', 2026, 'vid.interview', 'Interview with the Queen'],
    ['finals', 2025, 'vid.final', 'Grand Final'], ['backstage', 2025, 'vid.costume', 'National Costume Night'], ['interviews', 2025, 'vid.jury', 'Words from the jury'],
    ['finals', 2024, 'vid.final', 'Grand Final'], ['backstage', 2024, 'vid.charity', 'Goodwill journey'], ['finals', 2023, 'vid.final', 'Grand Final']
  ];
  const catKey = { finals: ['vid.c1', 'Finals'], backstage: ['vid.c2', 'Backstage'], interviews: ['vid.c3', 'Interviews'] };
  const body = `
${phero({ p, crumbs: [T('nav.video', 'Video')], eyebrowKey: 'vid.eyebrow', eyebrowEn: 'Films', titleKey: 'vid.title', titleEn: 'Moments <em>in motion</em>', leadKey: 'vid.lead', leadEn: 'Grand finals, backstage stories and conversations with our queens — every season, on film.' })}
<section class="section vpage">
  <div class="wrap">
    <button type="button" class="vplayer vplayer--feature" data-video data-reveal>
      ${PH('', 'ph--cinema')}
      <span class="vplayer__play">${PLAY}</span>
      <span class="vplayer__meta"><b>2026 ${T('vid.final', 'Grand Final')}</b>${T('yr.film.sub', 'Coronation night — official film')}</span>
    </button>
    <div class="chips" role="group" aria-label="Filter" data-filter="vgrid">
      <button type="button" class="chip is-active" data-f="all">${T('chip.all', 'All')}</button>
      ${Object.entries(catKey).map(([k, [key, en]]) => `<button type="button" class="chip" data-f="${k}">${T(key, en)}</button>`).join('')}
    </div>
    <div class="vgrid" id="vgrid">
      ${items.map(([cat, y, k, en]) => `<button type="button" class="vcardx" data-video data-cat="${cat}" data-reveal>
        <span class="vcardx__thumb">${PH('', 'ph--cinema')}<span class="vplayer__play vplayer__play--sm">${PLAY}</span></span>
        <span class="vcardx__tag">${T(catKey[cat][0], catKey[cat][1])}</span>
        <span class="vcardx__title"><b>${y}</b> ${T(k, en)}</span>
      </button>`).join('\n      ')}
    </div>
  </div>
</section>
${demoNote()}`;
  page({ file: 'video.html', pageId: 'video', active: 'video', label: 'Video', title: 'Video — Miss Queen Era World', titleEn: 'Video — Miss Queen Era World', desc: 'Grand finals, backstage and interviews — Miss Queen Era World on film.', body });
}

/* ================= PRESS ================= */
function buildPress() {
  const p = '';
  const types = [['pr.t1', 'Newspaper'], ['pr.t2', 'Television'], ['pr.t3', 'Magazine'], ['pr.t4', 'Online']];
  const heads = [
    ['pr.h1', 'A new queen is crowned at the Miss Queen Era World final'], ['pr.h2', 'Delegates from 60 nations meet in Istanbul'],
    ['pr.h3', 'Beyond beauty: behind the scenes at the Queen Academy'], ['pr.h4', 'Goodwill Ambassador queen launches a project for children'],
    ['pr.h5', 'A colourful night of national costumes'], ['pr.h6', 'Applications open for the new season']
  ];
  const items = [[2026, 0, 0], [2026, 1, 1], [2026, 3, 2], [2025, 2, 3], [2025, 0, 4], [2025, 1, 5], [2024, 3, 0], [2024, 2, 1], [2024, 0, 2]];
  const body = `
${phero({ p, crumbs: [T('nav.press', 'Press')], eyebrowKey: 'pr.eyebrow', eyebrowEn: 'Media about us', titleKey: 'pr.title', titleEn: 'In the <em>press</em>', leadKey: 'pr.lead', leadEn: 'Newspapers, television and digital media on Miss Queen Era World — season by season.' })}
<section class="section">
  <div class="wrap">
    <div class="chips" role="group" aria-label="Filter" data-filter="pgrid">
      <button type="button" class="chip is-active" data-f="all">${T('chip.all', 'All')}</button>
      ${[2026, 2025, 2024].map((y) => `<button type="button" class="chip" data-f="${y}">${y}</button>`).join('')}
    </div>
    <div class="pgrid" id="pgrid">
      ${items.map(([y, ti, hi], i) => `<article class="clip clip--${ti + 1}${i % 4 === 0 ? ' clip--tall' : ''}" data-cat="${y}" data-reveal>
        <div class="clip__top"><span class="clip__type">${T(types[ti][0], types[ti][1])}</span><span class="clip__date">${y}</span></div>
        ${i % 4 === 0 ? PH('', 'ph--wide ph--mini') : ''}
        <p class="clip__outlet">${T('pr.outlet', 'Outlet name')}</p>
        ${T(heads[hi][0], heads[hi][1], 'h3', 'class="clip__head"')}
        <div class="clip__lines" aria-hidden="true"><i></i><i></i><i></i></div>
        <a href="#" class="link-arrow">${T('pr.read', 'Read the story')}${ARROW}</a>
      </article>`).join('\n      ')}
    </div>
  </div>
</section>
${ctaBand({ p, eyebrowKey: 'pr.kit.e', eyebrowEn: 'For journalists', titleKey: 'pr.kit.title', titleEn: 'Press <em>kit</em> &amp; accreditation', leadKey: 'pr.kit.lead', leadEn: 'Logos, official photos and accreditation requests for the Grand Final: press@missqueeneraworld.com', buttons: `<a href="#" class="btn btn--gold magnetic">${T('pr.kit.btn', 'Download press kit')}</a><a href="mailto:press@missqueeneraworld.com" class="btn btn--ghost magnetic">${T('pr.kit.mail', 'Email the press office')}</a>` })}
${demoNote()}`;
  page({ file: 'basin.html', pageId: 'press', active: 'press', label: 'Press', title: 'Press — Miss Queen Era World', titleEn: 'Press — Miss Queen Era World', desc: 'Miss Queen Era World in the press: newspapers, television, magazines and online.', body });
}

/* ================= GOODWILL ================= */
function buildGoodwill() {
  const p = '';
  const causes = [
    ['gw.c1', 'Girls’ Education', 'gw.c1d', 'Scholarships, mentoring and school supplies for girls in the communities our queens visit.', '<path pathLength="1" d="M32 18c-6-4-14-5-22-4v34c8-1 16 0 22 4 6-4 14-5 22-4V14c-8-1-16 0-22 4z"/><path pathLength="1" d="M32 18v34"/>'],
    ['gw.c2', 'Children’s Health', 'gw.c2d', 'Hospital visits, awareness campaigns and fundraising with partner health organisations.', '<path pathLength="1" d="M32 54S8 40 8 24c0-8 6-13 12-13 5 0 9 3 12 7 3-4 7-7 12-7 6 0 12 5 12 13 0 16-24 30-24 30z"/><path pathLength="1" d="M32 24v14M25 31h14"/>'],
    ['gw.c3', 'Cultural Heritage', 'gw.c3d', 'Projects that protect crafts, music and traditions — and carry them to new generations.', '<path pathLength="1" d="M8 22L32 8l24 14z"/><path pathLength="1" d="M12 22v28M22 22v28M32 22v28M42 22v28M52 22v28"/><path pathLength="1" d="M6 50h52M4 56h56"/>']
  ];
  const stepsEn = [['gw.s1', 'Choose a cause', 'gw.s1d', 'Every queen picks a cause close to her heart at the start of her reign.'], ['gw.s2', 'Build the project', 'gw.s2d', 'With our team and partners she designs a project with clear, measurable goals.'], ['gw.s3', 'Share the impact', 'gw.s3d', 'Progress is reported throughout the year and celebrated at the next Grand Final.']];
  const body = `
${phero({ p, crumbs: [T('nav.goodwill', 'Goodwill')], eyebrowKey: 'pl.eyebrow', eyebrowEn: 'Goodwill Ambassadors', titleKey: 'gw.title', titleEn: 'A crown is a <em>promise</em>', leadKey: 'pl.text', leadEn: 'Throughout her reign, every queen serves as a Goodwill Ambassador, leading projects for girls’ education, children’s health and the preservation of cultural heritage.', mark: 'emblem' })}
<section class="section">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">01</span>${T('gw.causes.e', 'Our causes')}</p>
      <h2 class="h2" data-split data-i18n="gw.causes.title">Three causes, <em>one</em> heart</h2>
    </header>
    <div class="virtues__grid virtues__grid--3">
      ${causes.map(([k, en, kd, end, icon], i) => `<article class="vcard" data-reveal><span class="vcard__num">${['I', 'II', 'III'][i]}</span><svg class="vcard__icon" viewBox="0 0 64 64" aria-hidden="true">${icon}</svg>${T(k, en, 'h3')}${T(kd, end, 'p')}<i class="vcard__line"></i></article>`).join('\n      ')}
    </div>
  </div>
</section>
<section class="section gw-steps">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">02</span>${T('gw.how.e', 'How it works')}</p>
      <h2 class="h2" data-split data-i18n="gw.how.title">From a cause to <em>change</em></h2>
    </header>
    <ol class="steps steps--3">
      ${stepsEn.map(([k, en, kd, end], i) => `<li class="step" data-reveal><span class="step__no">0${i + 1}</span>${T(k, en, 'h3')}${T(kd, end, 'p')}</li>`).join('\n      ')}
    </ol>
  </div>
</section>
<section class="section">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">03</span>${T('gw.amb.e', 'Our ambassadors')}</p>
      <h2 class="h2" data-split data-i18n="gw.amb.title">Queens who <em>gave back</em></h2>
    </header>
    <ol class="ambassadors">
      ${YEARS.slice().reverse().map((y) => { const c = seasonData(y).queen; return `<li data-reveal><a href="sezon/${y}.html" data-pt="${y}"><b class="ambassadors__year">${y}</b><span class="ambassadors__who"><span>${T('yr.queen', 'The Queen')} ${y}</span><small>${C(c)} / ${T('yr.name', 'Full Name')}</small></span><span class="ambassadors__project">${T('gw.project', 'Project title')}</span>${ARROW}</a></li>`; }).join('\n      ')}
    </ol>
  </div>
</section>
${ctaBand({ p, eyebrowKey: 'gw.cta.e', eyebrowEn: 'Partner with us', titleKey: 'gw.cta.title', titleEn: 'Support a <em>queen’s</em> project', leadKey: 'gw.cta.lead', leadEn: 'Foundations, brands and institutions can partner with our ambassadors on projects that last.', buttons: `<a href="iletisim.html" class="btn btn--gold magnetic">${T('pt.contact', 'Get in Touch')}</a>` })}
${demoNote()}`;
  page({ file: 'iyi-niyet.html', pageId: 'goodwill', active: 'goodwill', label: 'Goodwill', title: 'Goodwill Ambassadors — Miss Queen Era World', titleEn: 'Goodwill Ambassadors — Miss Queen Era World', desc: 'The Miss Queen Era World Goodwill Ambassador programme: girls’ education, children’s health and cultural heritage.', body });
}

/* ================= APPLY ================= */
function buildApply() {
  const p = '';
  const faq = [
    ['faq.1q', 'Who can apply?', 'faq.1a', 'Women aged 18–28 for Miss, married women aged 25–45 for Mrs. and girls aged 14–17 for Teen, from any country where we have a national director.'],
    ['faq.2q', 'Do I need pageant experience?', 'faq.2a', 'No. The Queen Academy prepares every delegate for the stage, the jury and the media.'],
    ['faq.3q', 'What happens after pre-registration?', 'faq.3a', 'Your national director reviews your profile and invites you to the national casting in your country.'],
    ['faq.4q', 'Are there any fees?', 'faq.4a', 'Participation terms vary by country and are shared by your national director before the casting.'],
    ['faq.5q', 'How are results announced?', 'faq.5a', 'Results are announced on coronation night and published on this site and our official social media accounts.']
  ];
  const body = `
${phero({ p, crumbs: [T('nav.apply', 'Apply')], eyebrowKey: 'fm.kicker', eyebrowEn: 'Season 2027', titleKey: 'apx.title', titleEn: 'Become the <em>next</em> queen', leadKey: 'ap.lead', leadEn: 'Applications for the 2027 season open soon. Complete the pre-registration form and your national director will be in touch.' })}
${src('apply.html').replace('<h2 class="h2" data-split data-i18n="ap.title">', '<h2 class="h2" data-split data-i18n="ap.title" id="form">')}
<section class="section faqsec">
  <div class="wrap faq__grid">
    <header class="sec-head">
      <p class="eyebrow">${T('faq.e', 'Questions')}</p>
      <h2 class="h2" data-split data-i18n="faq.title">Frequently <em>asked</em></h2>
    </header>
    <div class="faq">
      ${faq.map(([q, qe, a, ae]) => `<details class="faq__item" data-reveal><summary>${T(q, qe)}<i></i></summary><div class="faq__a">${T(a, ae, 'p')}</div></details>`).join('\n      ')}
    </div>
  </div>
</section>`;
  page({ file: 'basvuru.html', pageId: 'apply', active: '', label: 'Apply', title: 'Apply — Miss Queen Era World', titleEn: 'Apply — Miss Queen Era World', desc: 'Pre-register for the Miss Queen Era World 2027 season.', body });
}

/* ================= SUB-BRANDS ================= */
function buildBrand({ file, mono, id, metaKey, metaEn, descKey, descEn, who, gets }) {
  const p = '';
  const body = `
<section class="phero phero--brand">
  <div class="phero__bg" aria-hidden="true"><svg class="astro phero__astro" viewBox="0 0 1000 1000"></svg><div class="rays phero__rays"></div></div>
  <div class="wrap phero__inner brandhero">
    <div>
      <nav class="crumbs" aria-label="Breadcrumb"><a href="${p}index.html">${MAPI}${T('nav.map', 'Map')}</a><span class="crumbs__sep">/</span><span lang="en">${mono} Queen Era World</span></nav>
      ${T(metaKey, metaEn, 'p', 'class="eyebrow phero__eyebrow"')}
      <h1 class="display phero__title" lang="en" data-split="hero"><em>${mono}</em> Queen Era World</h1>
      ${T(descKey, descEn, 'p', 'class="phero__lead"')}
      <div class="hero__ctas"><a href="${p}basvuru.html" class="btn btn--gold magnetic">${T('cta.apply', 'Apply Now')}${ARROW}</a><a href="${p}genel-bilgi.html#titles" class="btn btn--ghost magnetic">${T('br.all', 'All titles')}</a></div>
    </div>
    <div class="brandhero__mono"><div class="monogram monogram--xl"><span lang="en">${mono}</span></div></div>
  </div>
</section>
<section class="section">
  <div class="wrap brand__grid">
    <div data-reveal>
      ${T('br.who', 'Who can enter', 'h2', 'class="reqs__title"')}
      <ul class="reqs">${who.map(([k, en]) => `<li>${STAR}${T(k, en)}</li>`).join('')}</ul>
    </div>
    <div data-reveal>
      ${T('br.gets', 'What the title offers', 'h2', 'class="reqs__title"')}
      <ul class="reqs">${gets.map(([k, en]) => `<li>${STAR}${T(k, en)}</li>`).join('')}</ul>
    </div>
  </div>
</section>
${ctaBand({ p, eyebrowKey: 'fm.kicker', eyebrowEn: 'Season 2027', titleKey: 'ap.title', titleEn: 'Your era begins <em>now</em>', leadKey: 'ap.lead', leadEn: 'Applications for the 2027 season open soon. Complete the pre-registration form and your national director will be in touch.', buttons: `<a href="${p}basvuru.html" class="btn btn--gold magnetic">${T('cta.apply', 'Apply Now')}</a>` })}`;
  page({ file, pageId: 'brand', active: '', label: `${mono}`, title: `${mono} Queen Era World`, titleEn: `${mono} Queen Era World`, titleKey: `meta.${id}`, desc: `${mono} Queen Era World — ${metaEn}.`, body });
}

/* ================= CONTACT ================= */
function buildContact() {
  const p = '';
  const cards = [
    ['ct.c1', 'General enquiries', 'info@missqueeneraworld.com', 'mailto:info@missqueeneraworld.com'],
    ['ct.c2', 'Phone', '+90 (212) 000 00 00', 'tel:+902120000000'],
    ['ct.c3', 'Press office', 'press@missqueeneraworld.com', 'mailto:press@missqueeneraworld.com'],
    ['ct.c4', 'National directors', 'directors@missqueeneraworld.com', 'mailto:directors@missqueeneraworld.com']
  ];
  const tiers = [['sp.t1', 'Main Sponsor', 'sp.t1d', 'Naming rights, stage branding, broadcast and the coronation moment.'], ['sp.t2', 'Official Partner', 'sp.t2d', 'Category exclusivity, gala week presence and digital campaigns.'], ['sp.t3', 'Supporter', 'sp.t3d', 'Goodwill projects, academy sessions and community events.']];
  const body = `
${phero({ p, crumbs: [T('nav.contact', 'Contact')], eyebrowKey: 'ct.eyebrow', eyebrowEn: 'Contact', titleKey: 'ct.title', titleEn: 'Let’s <em>talk</em>', leadKey: 'ct.lead', leadEn: 'Applications, partnerships, press or becoming a national director — our team in Istanbul is here for you.' })}
<section class="section">
  <div class="wrap contact__grid">
    <div class="contact__cards">
      ${cards.map(([k, en, v, href]) => `<a class="ccard" href="${href}" data-reveal>${T(k, en, 'span', 'class="ccard__k"')}<b class="ccard__v">${v}</b>${ARROW}</a>`).join('\n      ')}
      <div class="ccard ccard--static" data-reveal>${T('ct.c5', 'Office', 'span', 'class="ccard__k"')}${T('ft.city', 'Istanbul, Türkiye', 'b', 'class="ccard__v"')}</div>
      <div class="social contact__social" data-reveal>${SOCIAL}</div>
    </div>
    <form class="form cform" novalidate data-reveal>
      <div class="form__head"><img src="${p}assets/img/crown-640.webp" alt="" width="64" height="64" loading="lazy"><div>${T('ct.f.kicker', 'Write to us', 'p', 'class="form__kicker"')}${T('ct.f.title', 'Message', 'p', 'class="form__title"')}</div></div>
      <div class="form__grid">
        <div class="field"><input id="c-name" name="name" type="text" placeholder=" " required autocomplete="name"><label for="c-name" data-i18n="fm.name">Full name</label><small class="field__err"></small></div>
        <div class="field"><input id="c-email" name="email" type="email" placeholder=" " required autocomplete="email"><label for="c-email" data-i18n="fm.email">Email</label><small class="field__err"></small></div>
        <div class="field field--full field--select">
          <select id="c-topic" name="topic" required>
            <option value="" data-i18n="fm.choose">Choose…</option>
            <option data-i18n="ct.o1">Application</option><option data-i18n="ct.o2">Sponsorship &amp; partnership</option><option data-i18n="ct.o3">Press</option><option data-i18n="ct.o4">National director</option><option data-i18n="fm.other">Other</option>
          </select>
          <label for="c-topic" class="is-static" data-i18n="ct.topic">Topic</label><small class="field__err"></small>
        </div>
        <div class="field field--full"><textarea id="c-msg" name="message" rows="4" placeholder=" " required></textarea><label for="c-msg" data-i18n="ct.msg">Your message</label><small class="field__err"></small></div>
        <div class="field field--full"><label class="check"><input type="checkbox" name="consent" required><i></i><span data-i18n="fm.consent">I consent to the processing of my personal data in accordance with the privacy policy.</span></label><small class="field__err"></small></div>
      </div>
      <button class="btn btn--gold btn--block" type="submit">${T('ct.send', 'Send Message')}${ARROW}</button>
      ${T('fm.note', 'Demo form — no data is sent.', 'p', 'class="form__note"')}
      <div class="form__success" role="status">
        <div class="form__success-crown"><img src="${p}assets/img/crown-640.webp" alt="" width="640" height="640" loading="lazy"></div>
        ${T('ct.ok.t', 'Message received', 'p', 'class="form__title"')}
        ${T('ct.ok.d', 'Thank you — our team will get back to you shortly.', 'p')}
        <button type="button" class="link-arrow form__again">${T('fm.again', 'New registration')}${ARROW}</button>
      </div>
      ${meta('fm.err.req', 'This field is required')}${meta('fm.err.email', 'Please enter a valid email')}${meta('fm.err.consent', 'Please accept to continue')}
    </form>
  </div>
</section>
<section class="section sponsor" id="sponsorluk">
  <div class="wrap">
    <header class="sec-head">
      <p class="eyebrow"><span class="eyebrow__num">02</span>${T('pt.eyebrow', 'Sponsorship &amp; Partnerships')}</p>
      <h2 class="h2" data-split data-i18n="pt.title">Become a <em>partner</em> of the new era</h2>
      ${T('pt.lead', 'Contact our team for sponsorship, broadcast and brand partnerships.', 'p', 'class="sec-head__lead" data-reveal')}
    </header>
    <div class="titles__grid tiers">
      ${tiers.map(([k, en, kd, end], i) => `<article class="tcard${i === 0 ? ' tcard--main' : ''}" data-reveal><div class="tcard__art">${i === 0 ? `<img src="${p}assets/img/crown-640.webp" alt="" loading="lazy" width="640" height="640">` : `<div class="monogram"><span>${['', 'II', 'III'][i]}</span></div>`}</div>${T(k, en, 'h3')}${T(kd, end, 'p')}<a href="mailto:info@missqueeneraworld.com" class="link-arrow">${T('pt.deck', 'Sponsorship Deck')}${ARROW}</a></article>`).join('\n      ')}
    </div>
  </div>
</section>`;
  page({ file: 'iletisim.html', pageId: 'contact', active: 'contact', label: 'Contact', title: 'Contact — Miss Queen Era World', titleEn: 'Contact — Miss Queen Era World', desc: 'Contact Miss Queen Era World: applications, sponsorship, press and national directors.', body });
}

/* ================= run ================= */
console.log('Building Miss Queen Era World pages…');
buildHub();
buildGeneral();
YEARS.forEach(buildSeason);
buildNextSeason();
buildVideo();
buildPress();
buildGoodwill();
buildApply();
buildBrand({
  file: 'mrs.html', mono: 'Mrs.', id: 'mrs', metaKey: 'ti.2.m', metaEn: 'Ages 25–45 · Married women', descKey: 'ti.2.d', descEn: 'Honouring women who carry family, career and social impact together.',
  who: [['br.mrs.w1', 'Married women aged 25–45'], ['br.mrs.w2', 'A career, community or family story to share'], ['br.mrs.w3', 'Commitment to a social impact project']],
  gets: [['br.mrs.g1', 'A year-long reign as Mrs. Queen Era World'], ['br.mrs.g2', 'Goodwill Ambassador projects with our partners'], ['br.mrs.g3', 'International media and event appearances']]
});
buildBrand({
  file: 'teen.html', mono: 'Teen', id: 'teen', metaKey: 'ti.3.m', metaEn: 'Ages 14–17 · Young queens', descKey: 'ti.3.d', descEn: 'A youth programme giving tomorrow’s leaders confidence, education and inspiration.',
  who: [['br.teen.w1', 'Girls aged 14–17 with parental consent'], ['br.teen.w2', 'Curiosity, kindness and the courage to speak'], ['br.teen.w3', 'Enrolled in school or education']],
  gets: [['br.teen.g1', 'Confidence and public speaking workshops'], ['br.teen.g2', 'Mentoring from our queens'], ['br.teen.g3', 'A youth ambassador role in her community']]
});
buildContact();
console.log('Done.');
