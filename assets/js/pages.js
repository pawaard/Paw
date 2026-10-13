/* Page-specific behaviour for inner pages (General Info, seasons, video, press, apply…). Builds on window.QEW. */
(() => {
  'use strict';
  const Q = window.QEW;
  if (!Q) return;
  const { $, $$, G, ST, t, reduceMotion, page } = Q;

  /* =========================================================
     GENERAL INFO — hero, emblem, crown story, journey, globe
     ========================================================= */
  const heroCrown = $('.hero__crown');
  if (heroCrown) {
    Q.mountSparks(heroCrown, 24);
    Q.tilt(heroCrown, $('.hero__visual'), { max: 9 });
    G.to('.hero__visual', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    G.to('.hero__copy', { yPercent: -10, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'center 40%', end: 'bottom top', scrub: true } });
    Q.onBoot(() => { if (!reduceMotion) G.set('.hero__title .wi', { yPercent: 118 }); });
    Q.onEnter(() => {
      Q.shineLoop(heroCrown, 1.2);
      if (reduceMotion) return;
      G.timeline({ defaults: { ease: 'expo.out' } })
        .fromTo('.hero__eyebrow', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 1 }, 0.05)
        .fromTo('.hero__title .wi', { yPercent: 118 }, { yPercent: 0, duration: 1.4, stagger: 0.08 }, 0.12)
        .fromTo(['.hero__lead', '.hero__ctas', '.hero .countdown'], { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.2, stagger: 0.1, clearProps: 'transform' }, 0.45)
        .fromTo('.hero__crown', { opacity: 0, scale: 0.86 }, { opacity: 1, scale: 1, duration: 1.8, clearProps: 'transform' }, 0.1)
        .fromTo(['.hero__astro', '.hero__rays', '.hero__floor'], { opacity: 0 }, { opacity: 1, duration: 2.2, ease: 'power2.out' }, 0.2)
        .fromTo('.hero__bar', { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.9);
    });
  }

  const nTrack = $('.nations__track');
  if (nTrack) {
    const NATIONS = ['Türkiye', 'Azerbaijan', 'Kazakhstan', 'Uzbekistan', 'Georgia', 'Hungary', 'Romania', 'Greece', 'Italy', 'France', 'Spain', 'Germany', 'Poland', 'United Kingdom', 'Egypt', 'Nigeria', 'Kenya', 'South Africa', 'UAE', 'India', 'Thailand', 'Philippines', 'Indonesia', 'Japan', 'South Korea', 'Australia', 'Brazil', 'Argentina', 'Colombia', 'Mexico', 'Canada', 'USA'];
    const set = NATIONS.map((n) => `<span>${n}</span>${Q.STAR}`).join('');
    nTrack.innerHTML = set + set;
  }

  const emblem = $('.about__emblem');
  if (emblem) {
    Q.mountSparks(emblem, 18);
    if (Q.DATA.emblem && !reduceMotion) {
      emblem.classList.add('is-armed');
      const tr = Q.buildTrace(emblem, Q.DATA.emblem, 'emblem');
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
            .add(() => Q.shineLoop(emblem, 4.5), 4.7);
        }
      });
    } else Q.shineLoop(emblem, 2);
  }

  const crownLogo = $('.crown__logo');
  if (crownLogo) {
    const hotspots = $$('.hotspot', crownLogo);
    const dotsWrap = $('.crown__dots');
    const panel = { idx: $('.crown__idx'), t: $('.crown__ptitle'), d: $('.crown__ptext') };
    const loupe = $('.loupe', crownLogo);
    let active = -1, autoTimer = 0, inView = false, hover = false;
    Q.mountSparks(crownLogo, 22);
    Q.shineLoop(crownLogo, 3);
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
    const placeLoupe = (i) => {
      const [x, y] = hsPos(hotspots[i]);
      const W = crownLogo.clientWidth, L = loupe.clientWidth, Z = 2.5;
      const lx = Math.min(0.8, Math.max(0.2, x < 0.5 ? x + 0.22 : x - 0.22));
      const ly = Math.min(0.8, Math.max(0.2, y < 0.4 ? y + 0.2 : y - 0.2));
      loupe.style.backgroundSize = `${W * Z}px ${W * Z}px`;
      loupe.style.backgroundPosition = `${L / 2 - x * W * Z}px ${L / 2 - y * W * Z}px`;
      loupe.style.setProperty('--lx', `${lx * 100}%`);
      loupe.style.setProperty('--ly', `${ly * 100}%`);
    };
    const fillPanel = (animate) => {
      if (active < 0) return;
      const h = hotspots[active];
      panel.idx.textContent = `${String(active + 1).padStart(2, '0')} / ${String(hotspots.length).padStart(2, '0')}`;
      panel.t.textContent = $('.sr', h).textContent;
      panel.d.textContent = $('[hidden]', h).textContent;
      if (animate && !reduceMotion) G.fromTo([panel.t, panel.d], { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.07, ease: 'expo.out', overwrite: true });
    };
    const restartAuto = () => {
      clearInterval(autoTimer);
      if (reduceMotion) return;
      autoTimer = setInterval(() => { if (inView && !hover) setActive(active + 1); }, 5200);
    };
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
      if (!hover) G.to(crownLogo, { '--mx': `${x * 100}%`, '--my': `${y * 100}%`, duration: 1.1, ease: 'power3.inOut' });
    }
    Q.onLang(() => fillPanel(false));
    $$('.crown__nav .arrow').forEach((b) => b.addEventListener('click', () => setActive(active + Number(b.dataset.dir), true)));
    const stageEl = $('.crown__stage');
    stageEl.addEventListener('pointerenter', () => { hover = true; });
    stageEl.addEventListener('pointerleave', () => { hover = false; });
    Q.tilt(crownLogo, stageEl, {
      max: 6,
      onLeave: () => { const [x, y] = hsPos(hotspots[active]); G.to(crownLogo, { '--mx': `${x * 100}%`, '--my': `${y * 100}%`, duration: 1, ease: 'power3.inOut' }); }
    });
    ST.create({ trigger: '.crown', start: 'top 70%', end: 'bottom 30%', onToggle: (self) => { inView = self.isActive; } });
    setActive(0);
    restartAuto();
    window.addEventListener('resize', () => { if (active >= 0) placeLoupe(active); });
  }

  const jTrack = $('.journey__track');
  if (jTrack) {
    const jLine = $('.journey__line');
    const stages = $$('.stage');
    let dotPos = [], lastP = 0;
    const measureLine = (horizontal) => {
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
    };
    const markStages = (p) => {
      lastP = p;
      jLine.style.setProperty('--jp', p.toFixed(4));
      stages.forEach((s, i) => s.classList.toggle('is-active', p >= dotPos[i] - 0.002));
    };
    const mm = G.matchMedia();
    mm.add('(min-width: 901px)', () => {
      measureLine(true);
      const dist = () => Math.max(0, jTrack.scrollWidth - window.innerWidth);
      G.to(jTrack, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: '.journey', start: 'top top', end: () => `+=${dist() * 1.6 + window.innerHeight * 0.3}`,
          pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1,
          onRefresh: () => measureLine(true), onUpdate: (self) => markStages(self.progress)
        }
      });
      markStages(0);
    });
    mm.add('(max-width: 900px)', () => {
      measureLine(false);
      ST.create({ trigger: jTrack, start: 'top 65%', end: 'bottom 65%', scrub: true, onRefresh: () => measureLine(false), onUpdate: (self) => markStages(self.progress) });
      markStages(0);
    });
  }

  if (!reduceMotion) {
    if ($('.pledge__mark')) G.fromTo('.pledge__mark', { yPercent: 10, rotate: -4 }, { yPercent: -10, rotate: 4, ease: 'none', scrollTrigger: { trigger: '.pledge', start: 'top bottom', end: 'bottom top', scrub: true } });
    $$('.partner').forEach((sec) => {
      const rays = $('.partner__rays', sec);
      if (rays) G.fromTo(rays, { opacity: 0 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: sec, start: 'top 90%', end: 'center center', scrub: true } });
    });
    if ($('.phero__mark')) G.to('.phero__mark', { yPercent: 18, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  const globeCanvas = $('.globe');
  if (globeCanvas && window.QEWGlobe) {
    const globeTag = $('.globe__tag');
    window.QEWGlobe(globeCanvas, {
      onHost: (x, y, vis) => {
        const w = globeTag.offsetWidth, room = globeCanvas.clientWidth;
        const left = x + 14 + w > room ? x - 14 - w : x + 14;
        globeTag.style.transform = `translate(${Math.max(0, left)}px, ${y - 40}px)`;
        globeTag.classList.toggle('is-on', vis);
      }
    });
  }

  /* =========================================================
     MODAL — gallery lightbox & film placeholder
     ========================================================= */
  let modal = null, modalItems = [], modalIndex = 0;
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement('div');
    modal.className = 'modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = `<div class="modal__bg"></div>
      <div class="modal__box">
        <div class="modal__media"></div>
        <p class="modal__cap"></p>
        <button type="button" class="modal__close" aria-label="Close"><span></span><span></span></button>
        <button type="button" class="modal__nav is-prev arrow" aria-label="Previous"><svg viewBox="0 0 24 24"><path d="M19 12H6M11 6l-6 6 6 6"/></svg></button>
        <button type="button" class="modal__nav is-next arrow" aria-label="Next"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg></button>
      </div>`;
    document.body.appendChild(modal);
    $('.modal__bg', modal).addEventListener('click', closeModal);
    $('.modal__close', modal).addEventListener('click', closeModal);
    $('.is-prev', modal).addEventListener('click', () => showItem(modalIndex - 1));
    $('.is-next', modal).addEventListener('click', () => showItem(modalIndex + 1));
    window.addEventListener('keydown', (e) => {
      if (!modal.classList.contains('is-open')) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft' && modalItems.length > 1) showItem(modalIndex - 1);
      if (e.key === 'ArrowRight' && modalItems.length > 1) showItem(modalIndex + 1);
    });
    return modal;
  }
  function showItem(i) {
    modalIndex = (i + modalItems.length) % modalItems.length;
    const it = modalItems[modalIndex];
    const media = $('.modal__media', modal);
    media.innerHTML = it.html;
    $('.modal__cap', modal).innerHTML = it.cap || '';
    if (!reduceMotion) G.fromTo(media, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.6, ease: 'expo.out' });
  }
  function openModal(items, index, kind) {
    ensureModal();
    modalItems = items;
    modal.dataset.kind = kind;
    modal.classList.toggle('has-nav', items.length > 1);
    showItem(index);
    modal.classList.add('is-open');
    if (Q.lenis) Q.lenis.stop();
    if (!reduceMotion) G.fromTo('.modal__box', { y: 30, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' });
    $('.modal__close', modal).focus({ preventScroll: true });
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove('is-open');
    if (Q.lenis) Q.lenis.start();
  }

  $$('[data-gallery]').forEach((gal) => {
    const items = $$('.gallery__item', gal);
    items.forEach((btn, i) => btn.addEventListener('click', () => {
      openModal(items.map((b) => {
        const ph = $('.ph', b).cloneNode(true);
        ph.classList.add('ph--cinema');
        const cap = $('.ph__tag', ph);
        const capHTML = cap ? cap.innerHTML : '';
        if (cap) cap.remove();
        return { html: ph.outerHTML, cap: capHTML };
      }), i, 'gallery');
    }));
  });
  $$('[data-video]').forEach((btn) => btn.addEventListener('click', () => {
    const ph = $('.ph', btn).cloneNode(true);
    ph.classList.add('ph--cinema');
    const title = $('.vplayer__meta b, .vcardx__title', btn);
    openModal([{
      html: `${ph.outerHTML}<div class="modal__film"><span class="vplayer__play">${$('.vplayer__play', btn) ? $('.vplayer__play', btn).innerHTML : ''}</span><p>${t('modal.video')}</p></div>`,
      cap: title ? title.innerHTML : ''
    }], 0, 'video');
  }));

  /* =========================================================
     FILTER CHIPS (video, press)
     ========================================================= */
  $$('[data-filter]').forEach((group) => {
    const grid = document.getElementById(group.dataset.filter);
    if (!grid) return;
    const items = $$('[data-cat]', grid);
    group.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip || chip.classList.contains('is-active')) return;
      $$('.chip', group).forEach((c) => c.classList.toggle('is-active', c === chip));
      const f = chip.dataset.f;
      const swap = () => {
        items.forEach((it) => { it.hidden = !(f === 'all' || it.dataset.cat === f); });
        const vis = items.filter((it) => !it.hidden);
        if (!reduceMotion) G.fromTo(vis, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.05, ease: 'expo.out', clearProps: 'transform' });
        else G.set(vis, { opacity: 1 });
        ST.refresh();
      };
      if (reduceMotion) swap();
      else G.to(items.filter((it) => !it.hidden), { opacity: 0, y: 14, duration: 0.25, stagger: 0.02, ease: 'power2.in', onComplete: swap });
    });
  });

  /* =========================================================
     SEASON PAGES — sticky tabs follow the scroll
     ========================================================= */
  const tabs = $$('.ytabs a');
  if (tabs.length) {
    const tabWrap = $('.ytabs__in');
    const setTab = (i) => {
      tabs.forEach((a, j) => a.classList.toggle('is-active', j === i));
      const a = tabs[i];
      if (tabWrap.scrollWidth > tabWrap.clientWidth) tabWrap.scrollTo({ left: a.offsetLeft - 24, behavior: 'smooth' });
    };
    tabs.forEach((a, i) => {
      const sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) ST.create({ trigger: sec, start: 'top 45%', end: 'bottom 45%', onToggle: (self) => { if (self.isActive) setTab(i); } });
    });
  }

  /* =========================================================
     FAQ — smooth open/close
     ========================================================= */
  $$('.faq__item').forEach((d) => {
    const sum = $('summary', d);
    const body = $('.faq__a', d);
    sum.addEventListener('click', (e) => {
      if (reduceMotion) return;
      e.preventDefault();
      if (d.open) {
        G.to(body, { height: 0, opacity: 0, duration: 0.45, ease: 'power3.inOut', onComplete: () => { d.open = false; G.set(body, { clearProps: 'all' }); ST.refresh(); } });
        d.classList.remove('is-open');
      } else {
        d.open = true;
        d.classList.add('is-open');
        G.fromTo(body, { height: 0, opacity: 0 }, { height: 'auto', opacity: 1, duration: 0.6, ease: 'power3.out', onComplete: () => { G.set(body, { clearProps: 'height' }); ST.refresh(); } });
      }
    });
  });

  // keep the pinned General Info journey honest when arriving via #journey etc.
  if (page === 'general') Q.onEnter(() => setTimeout(() => ST.refresh(), 400));
})();
