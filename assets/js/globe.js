/* Dotted gold globe — canvas 2D orthographic projection.
   Land dots come from globe-data.js; arcs fly from the host city to delegate nations. */
(function () {
  'use strict';
  const D2R = Math.PI / 180;

  const HOST = { name: 'Istanbul', lon: 28.97, lat: 41.01 };
  const CITIES = [
    [2.35, 48.86], [-0.13, 51.51], [12.5, 41.9], [19.04, 47.5], [49.87, 40.41], [76.95, 43.24], [69.24, 41.3],
    [44.79, 41.72], [55.27, 25.2], [31.24, 30.04], [3.38, 6.52], [36.82, -1.29], [28.05, -26.2], [77.21, 28.61],
    [100.5, 13.75], [139.69, 35.69], [126.98, 37.57], [120.98, 14.6], [151.21, -33.87], [-74, 40.71],
    [-99.13, 19.43], [-46.63, -23.55], [-79.38, 43.65], [-74.07, 4.71], [-3.7, 40.42], [13.4, 52.52],
    [21.01, 52.23], [23.73, 37.98], [26.1, 44.43], [106.85, -6.2], [-58.38, -34.6]
  ];

  function vec(lon, lat) {
    const la = lat * D2R, lo = lon * D2R;
    return [Math.cos(la) * Math.sin(lo), Math.sin(la), Math.cos(la) * Math.cos(lo)];
  }
  function slerp(a, b, t) {
    const d = Math.acos(Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])));
    if (d < 1e-6) return a.slice();
    const s = Math.sin(d), k1 = Math.sin((1 - t) * d) / s, k2 = Math.sin(t * d) / s;
    return [a[0] * k1 + b[0] * k2, a[1] * k1 + b[1] * k2, a[2] * k1 + b[2] * k2];
  }

  window.QEWGlobe = function (canvas, opts) {
    opts = opts || {};
    const ctx = canvas.getContext('2d');
    const raw = window.GLOBE_DOTS || [];
    const N = raw.length / 2;
    const P = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const v = vec(raw[2 * i] / 10, raw[2 * i + 1] / 10);
      P[3 * i] = v[0]; P[3 * i + 1] = v[1]; P[3 * i + 2] = v[2];
    }
    const host = vec(HOST.lon, HOST.lat);
    const arcs = CITIES.map(([lon, lat], i) => {
      const b = vec(lon, lat);
      const ang = Math.acos(host[0] * b[0] + host[1] * b[1] + host[2] * b[2]);
      const h = 0.05 + 0.22 * (ang / Math.PI);
      const steps = 48, pts = [];
      for (let s = 0; s <= steps; s++) {
        const t = s / steps, p = slerp(host, b, t), lift = 1 + h * Math.sin(Math.PI * t);
        pts.push([p[0] * lift, p[1] * lift, p[2] * lift]);
      }
      return { pts, end: b, phase: (i * 0.137) % 1, speed: 0.16 + (i % 5) * 0.025 };
    });

    let W = 0, H = 0, R = 0, cx = 0, cy = 0, dpr = 1;
    let yaw = -HOST.lon * D2R - 0.55, pitch = 0.42; // radians
    let vYaw = 0, dragging = false, lastX = 0, lastY = 0, running = false, raf = 0, last = 0, time = 0;
    let base = null; // pre-rendered sphere

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = W; canvas.height = H;
      cx = W / 2; cy = H / 2; R = Math.min(W, H) * 0.4;
      base = document.createElement('canvas'); base.width = W; base.height = H;
      const b = base.getContext('2d');
      // atmosphere glow
      const atm = b.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.28);
      atm.addColorStop(0, 'rgba(226,184,90,0.22)'); atm.addColorStop(0.35, 'rgba(201,154,59,0.08)'); atm.addColorStop(1, 'rgba(201,154,59,0)');
      b.fillStyle = atm; b.beginPath(); b.arc(cx, cy, R * 1.28, 0, Math.PI * 2); b.fill();
      // body
      const body = b.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      body.addColorStop(0, 'rgba(46,34,16,0.95)'); body.addColorStop(0.6, 'rgba(14,10,6,0.97)'); body.addColorStop(1, 'rgba(6,5,3,1)');
      b.fillStyle = body; b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2); b.fill();
      // rim
      b.strokeStyle = 'rgba(243,210,122,0.35)'; b.lineWidth = 1 * dpr; b.beginPath(); b.arc(cx, cy, R, 0, Math.PI * 2); b.stroke();
      // orbit ring
      b.save(); b.translate(cx, cy); b.rotate(-0.32); b.scale(1, 0.28);
      b.strokeStyle = 'rgba(226,184,90,0.16)'; b.lineWidth = 1 * dpr; b.setLineDash([2 * dpr, 7 * dpr]);
      b.beginPath(); b.arc(0, 0, R * 1.42, 0, Math.PI * 2); b.stroke(); b.restore();
    }

    // rotate a unit vector by yaw (Y axis) then pitch (X axis)
    let cyw, syw, cpt, spt;
    function setRot() { cyw = Math.cos(yaw); syw = Math.sin(yaw); cpt = Math.cos(pitch); spt = Math.sin(pitch); }
    const out = [0, 0, 0];
    function project(x, y, z) {
      const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw;
      const y2 = y * cpt - z1 * spt, z2 = y * spt + z1 * cpt;
      out[0] = cx + x1 * R; out[1] = cy - y2 * R; out[2] = z2;
      return out;
    }
    function visible(px, py, z) { return z > 0 || ((px - cx) ** 2 + (py - cy) ** 2) > R * R; }

    function frame(now) {
      raf = running ? requestAnimationFrame(frame) : 0;
      const dt = Math.min(0.05, (now - (last || now)) / 1000); last = now; time += dt;
      if (!dragging) { yaw += (0.09 + vYaw) * dt; vYaw *= 0.94; }
      setRot();
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(base, 0, 0);

      // dots, bucketed by depth for cheap limb darkening
      const sz = 1.55 * dpr;
      const buckets = [[], [], [], []];
      for (let i = 0; i < N; i++) {
        const p = project(P[3 * i], P[3 * i + 1], P[3 * i + 2]);
        if (p[2] <= 0.02) continue;
        const k = p[2] > 0.75 ? 3 : p[2] > 0.5 ? 2 : p[2] > 0.25 ? 1 : 0;
        buckets[k].push(p[0], p[1]);
      }
      const cols = ['rgba(201,154,59,0.28)', 'rgba(220,176,88,0.5)', 'rgba(236,198,112,0.72)', 'rgba(250,224,150,0.95)'];
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = cols[k];
        const b = buckets[k], s = sz * (0.7 + k * 0.12);
        for (let j = 0; j < b.length; j += 2) ctx.fillRect(b[j] - s / 2, b[j + 1] - s / 2, s, s);
      }

      // arcs
      ctx.lineCap = 'round';
      for (const a of arcs) {
        const pts = a.pts, n = pts.length;
        const scr = new Array(n);
        for (let s = 0; s < n; s++) { const p = project(pts[s][0], pts[s][1], pts[s][2]); scr[s] = [p[0], p[1], visible(p[0], p[1], p[2])]; }
        // faint full path
        ctx.strokeStyle = 'rgba(226,184,90,0.16)'; ctx.lineWidth = 1 * dpr; ctx.beginPath();
        let pen = false;
        for (let s = 0; s < n; s++) { if (scr[s][2]) { pen ? ctx.lineTo(scr[s][0], scr[s][1]) : ctx.moveTo(scr[s][0], scr[s][1]); pen = true; } else pen = false; }
        ctx.stroke();
        // travelling comet
        const t = (time * a.speed + a.phase) % 1.25; // pause between flights
        if (t <= 1) {
          const head = Math.floor(t * (n - 1)), tail = Math.max(0, head - 12);
          for (let s = tail; s < head; s++) {
            if (!scr[s][2] || !scr[s + 1][2]) continue;
            const f = (s - tail) / (head - tail || 1);
            ctx.strokeStyle = `rgba(255,236,180,${0.15 + f * 0.8})`; ctx.lineWidth = (0.6 + f * 1.6) * dpr;
            ctx.beginPath(); ctx.moveTo(scr[s][0], scr[s][1]); ctx.lineTo(scr[s + 1][0], scr[s + 1][1]); ctx.stroke();
          }
          if (scr[head][2]) {
            ctx.fillStyle = 'rgba(255,248,225,0.95)'; ctx.beginPath(); ctx.arc(scr[head][0], scr[head][1], 2 * dpr, 0, Math.PI * 2); ctx.fill();
          }
        }
        // destination marker
        const e = project(a.end[0], a.end[1], a.end[2]);
        if (e[2] > 0) {
          const pulse = (time * 0.7 + a.phase) % 1;
          ctx.strokeStyle = `rgba(243,210,122,${(1 - pulse) * 0.6 * e[2]})`; ctx.lineWidth = 1 * dpr;
          ctx.beginPath(); ctx.arc(e[0], e[1], (2 + pulse * 9) * dpr, 0, Math.PI * 2); ctx.stroke();
          ctx.fillStyle = `rgba(255,240,200,${0.5 + 0.5 * e[2]})`; ctx.beginPath(); ctx.arc(e[0], e[1], 1.8 * dpr, 0, Math.PI * 2); ctx.fill();
        }
      }

      // host city
      const h = project(host[0], host[1], host[2]);
      const hx = h[0], hy = h[1], hz = h[2];
      if (hz > 0) {
        const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 18 * dpr);
        g.addColorStop(0, 'rgba(255,246,220,0.95)'); g.addColorStop(0.3, 'rgba(243,210,122,0.5)'); g.addColorStop(1, 'rgba(243,210,122,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(hx, hy, 18 * dpr, 0, Math.PI * 2); ctx.fill();
        for (let k = 0; k < 2; k++) {
          const pr = (time * 0.5 + k * 0.5) % 1;
          ctx.strokeStyle = `rgba(255,236,180,${(1 - pr) * 0.8})`; ctx.lineWidth = 1.2 * dpr;
          ctx.beginPath(); ctx.arc(hx, hy, (4 + pr * 26) * dpr, 0, Math.PI * 2); ctx.stroke();
        }
      }
      if (opts.onHost) opts.onHost(hx / dpr, hy / dpr, hz > 0.15);
    }

    function start() { if (!running) { running = true; last = 0; raf = requestAnimationFrame(frame); } }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    canvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; vYaw = 0; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY;
      const k = 1 / (R / dpr);
      yaw += dx * k; pitch = Math.max(-0.9, Math.min(0.9, pitch + dy * k));
      vYaw = dx * k * 30;
    });
    const end = () => { dragging = false; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);

    resize();
    let rt; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
    let inView = !('IntersectionObserver' in window);
    if (!inView) {
      new IntersectionObserver((en) => en.forEach((x) => { inView = x.isIntersecting; inView ? start() : stop(); }), { rootMargin: '120px' }).observe(canvas);
    } else start();
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else if (inView) start(); });
    return { start, stop, resize };
  };
})();
