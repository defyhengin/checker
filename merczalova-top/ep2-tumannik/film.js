// «Мерцалова топь» — эпизод 2 «Туманник». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H;
  const k = W / 1080;
  const HY = Math.round(H * 0.47);
  const X0 = -0.5 * W, WW = 2.0 * W;      // мир шире кадра: камера поворачивается
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  // ---------- широкий статичный фон (рисуется один раз) ----------
  let BG = null, FOG = null;
  function buildBG() {
    const c = G.makeCanvas(WW, H), ctx = c.getContext('2d');
    ctx.translate(-X0, 0);
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0A0F2C'); g.addColorStop(1, '#2A3660');
    ctx.fillStyle = g; ctx.fillRect(X0, 0, WW, HY + 4);
    for (let i = 0; i < 120; i++) {
      const x = X0 + U.hash(i, 1) * WW, y = U.hash(i, 2) * HY * 0.75, r = (0.8 + U.hash(i, 3) * 1.6) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.25 + 0.45 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    G.ellipse(ctx, W * 0.3, H * 0.15, 70 * k, 70 * k, { fill: '#E6EADF', lw: 4, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 9 } });
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 30; i++) spruce(X0 + U.hash(i, 10) * WW, HY, (0.12 + 0.07 * U.hash(i, 11)) * H, '#1C2749', 30 + i);
    for (let i = 0; i < 26; i++) spruce(X0 + U.hash(i, 12) * WW, HY + 6 * k, (0.08 + 0.06 * U.hash(i, 13)) * H, '#131B37', 80 + i);
    // будка наблюдателя — ближе, чем в первой серии
    const hx = W * 0.62, hb = HY + 8 * k, q = 1.5 * k;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    G.line(ctx, [[hx - 22 * q, hb], [hx - 26 * q, hb + 26 * q]], { color: '#05070F', lw: 4, seed: 91 });
    G.line(ctx, [[hx + 22 * q, hb], [hx + 26 * q, hb + 26 * q]], { color: '#05070F', lw: 4, seed: 92 });
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#18244C'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(X0, HY, WW, H - HY);
    for (let i = 0; i < 14; i++) {
      const y = HY + 20 * k + i * 26 * k, w = (90 - i * 4) * k * (0.7 + 0.6 * U.hash(i, 40));
      G.line(ctx, [[W * 0.3 - w, y], [W * 0.3 + w, y]], { color: 'rgba(200,215,240,0.3)', lw: 3, seed: 200 + i });
    }
    for (let i = 0; i < 60; i++) {
      const x = X0 + U.hash(i, 50) * WW, h = (0.05 + 0.08 * U.hash(i, 51)) * H, lean = (U.hash(i, 52) - 0.5) * 0.25 * h;
      G.line(ctx, [[x, HY + 14 * k], [x + lean * 0.5, HY + 14 * k - h * 0.5], [x + lean, HY + 14 * k - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
      if (U.hash(i, 53) < 0.4) G.ellipse(ctx, x + lean * 0.95, HY + 14 * k - h * 0.95, 7 * k, 22 * k, { fill: '#2A1C14', lw: 2, seed: 400 + i, stroke: '#0A0A10' });
    }
    const pads = [[-0.3, 0.6, 140, 30], [0.2, 0.57, 120, 26], [0.75, 0.62, 150, 32], [0.35, 0.74, 180, 38], [1.2, 0.66, 160, 34], [-0.1, 0.8, 200, 42]];
    pads.forEach(([px, py, rx, ry], i) => {
      G.ellipse(ctx, px * W, py * H, rx * k, ry * k, { fill: '#1E4A47', lw: 4, seed: 500 + i, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
    });
    return c;
  }
  function buildFog() {
    const c = G.makeCanvas(WW, Math.round(H * 0.6)), ctx = c.getContext('2d');
    for (let i = 0; i < 110; i++) {
      const x = U.hash(i, 60) * WW, y = c.height * (0.38 + 0.24 * U.hash(i, 61)), r = (100 + 150 * U.hash(i, 62)) * k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(190,205,235,0.11)'); g.addColorStop(1, 'rgba(190,205,235,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    return c;
  }
  function fogLayer(ctx, t, y, drift, alpha, scale) {
    const off = ((t * drift) % WW + WW) % WW;
    ctx.save(); ctx.globalAlpha = alpha;
    const h = FOG.height * scale;
    ctx.drawImage(FOG, X0 - off, y - h / 2, WW, h);
    ctx.drawImage(FOG, X0 - off + WW, y - h / 2, WW, h);
    ctx.restore();
  }

  // ---------- кувшинка из первой серии (пасхалка вдали) ----------
  function tinyLily(ctx, x, y, s) {
    for (let i = 0; i < 7; i++) {
      const a = Math.PI + (Math.PI * (i + 0.5)) / 7;
      G.ellipse(ctx, x + Math.cos(a) * 14 * s, y + Math.sin(a) * 9 * s, 10 * s, 5 * s, { fill: '#C8F1F1', lw: 1.5, seed: 950 + i, stroke: '#3E8C93' });
    }
    glow(ctx, x, y - 6 * s, 90 * s, '90,200,210', 0.5);
  }

  // ---------- туманник ----------
  const STAGE = [
    { h: 0.17, base: 0.485 }, { h: 0.31, base: 0.56 }, { h: 0.52, base: 0.74 }, { h: 1.15, base: 1.2 },
  ];
  function tumannik(ctx, x, st, t, alpha) {
    const P = STAGE[st], h = P.h * H, base = P.base * H, sway = Math.sin(t * 0.9) * 0.02 * h;
    const wdt = h * 0.16;
    ctx.save(); ctx.globalAlpha = alpha;
    const ink = '#0A0F1E', body = '#28335A';
    // ноги уходят в воду
    G.line(ctx, [[x - wdt * 0.25, base - h * 0.42], [x - wdt * 0.3, base]], { color: ink, lw: Math.max(3, h * 0.025), seed: 600 + st });
    G.line(ctx, [[x + wdt * 0.25, base - h * 0.42], [x + wdt * 0.32, base]], { color: ink, lw: Math.max(3, h * 0.025), seed: 610 + st });
    // туловище
    const tw = wdt, top = base - h * 0.86;
    G.shape(ctx, [[x - tw * 0.5 + sway, top + h * 0.08], [x + tw * 0.5 + sway, top + h * 0.08], [x + tw * 0.62, base - h * 0.42], [x + tw * 0.2, base - h * 0.36], [x - tw * 0.2, base - h * 0.36], [x - tw * 0.62, base - h * 0.42]],
      { fill: body, lw: Math.max(2.5, h * 0.006), seed: 620 + st, stroke: ink, hatch: { color: 'rgba(5,8,20,0.35)', gap: Math.max(6, h * 0.012), angle: 0.9 } });
    // длинные руки до колен
    G.line(ctx, [[x - tw * 0.48 + sway, top + h * 0.12], [x - tw * 0.85, base - h * 0.5], [x - tw * 0.8, base - h * 0.28]], { color: ink, lw: Math.max(3, h * 0.02), seed: 630 + st });
    G.line(ctx, [[x + tw * 0.48 + sway, top + h * 0.12], [x + tw * 0.88, base - h * 0.5], [x + tw * 0.78, base - h * 0.27]], { color: ink, lw: Math.max(3, h * 0.02), seed: 640 + st });
    // голова, чуть наклонена
    const hx = x + sway * 1.5, hy = top - h * 0.02;
    G.ellipse(ctx, hx, hy, tw * 0.42, h * 0.085, { fill: body, lw: Math.max(2.5, h * 0.006), seed: 650 + st, stroke: ink });
    // бледные глаза
    for (const dx of [-0.16, 0.16]) {
      const ex = hx + dx * tw, ey = hy - h * 0.005, er = Math.max(3 * k, h * 0.011);
      ctx.fillStyle = '#E4F4EA'; ctx.beginPath(); ctx.arc(ex, ey, er, 0, 7); ctx.fill();
      glow(ctx, ex, ey, er * 9, '170,220,200', 0.35 * alpha);
    }
    ctx.restore();
  }
  // клубок тумана на месте исчезновения
  function puff(ctx, x, y, size, a) {
    if (a <= 0 || a >= 1) return;
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * 6.28, d = size * (0.2 + 0.8 * ease.outCubic(a));
      const r = size * 0.35 * (1 - a * 0.5);
      const gx = x + Math.cos(ang) * d * 0.6, gy = y + Math.sin(ang) * d * 0.4;
      const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, `rgba(200,212,240,${0.35 * (1 - a)})`); g.addColorStop(1, 'rgba(200,212,240,0)');
      ctx.fillStyle = g; ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
    }
  }

  // ---------- камера: поворот головы ----------
  function camX(t) {
    let x = 0;
    for (let i = 0; i < S.looks.length; i++) {
      const L = S.looks[i], B = S.backs[i];
      if (t >= L.from && t < B.from) x = L.dir * S.LOOK * ease.inOutCubic(r01(t, L.from, L.to));
      else if (t >= B.from && t < B.to) x = L.dir * S.LOOK * (1 - ease.inOutCubic(r01(t, B.from, B.to)));
    }
    return x * W;
  }

  // ---------- финальный глаз ----------
  function bigEye(ctx, t) {
    if (t < ev.eyeIn || t >= ev.cut) return;
    const u = ease.outCubic(r01(t, ev.eyeIn, ev.eye));
    const cx = lerp(W * 1.45, W * 0.86, u), cy = H * 0.44, R = W * 0.36;
    const open = t >= ev.eye ? ease.outBack(r01(t, ev.eye, ev.eye + 0.12), 2) : 0.06;
    G.ellipse(ctx, cx, cy, R * 1.25, R * 0.95, { fill: '#1F2848', lw: 6, seed: 860, stroke: '#070B18', hatch: { color: 'rgba(5,8,20,0.35)', gap: 12, angle: 0.8 } });
    const ry = Math.max(4 * k, R * 0.55 * open);
    G.ellipse(ctx, cx, cy, R * 0.85, ry, { fill: '#E2F3E8', lw: 6, seed: 861, stroke: '#070B18' });
    if (open > 0.2) {
      G.ellipse(ctx, cx - R * 0.12, cy, R * 0.34, Math.min(R * 0.34, ry * 0.95), { fill: '#7FC4B4', lw: 4, seed: 862, stroke: '#24524A' });
      G.ellipse(ctx, cx - R * 0.12, cy, R * 0.06, Math.min(R * 0.3, ry * 0.9), { fill: '#04070B', lw: 2, seed: 863, stroke: '#04070B' });
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(cx - R * 0.26, cy - ry * 0.35, R * 0.05, 0, 7); ctx.fill();
      glow(ctx, cx, cy, R * 2, '150,220,200', 0.25 * open);
    }
  }

  Studio.film({
    draw(ctx, t) {
      if (!BG) { BG = buildBG(); FOG = buildFog(); }
      const cx = camX(t);
      const z = 1 + 0.06 * r01(t, 0, ev.breath) + 0.05 * sm(t, ev.breath, ev.eye);
      ctx.save();
      ctx.translate(W / 2, H * 0.47); ctx.scale(z, z); ctx.translate(-W / 2 - cx, -H * 0.47);
      ctx.drawImage(BG, X0, 0, WW, H);
      // Морзе «ВЕРЬ» в окне будки
      const on = S.morseOn(t), wx = W * 0.62, wy = HY + 8 * k - 54 * k;
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 12 * k, wy - 12 * k, 24 * k, 24 * k);
      if (on) glow(ctx, wx, wy, 90 * k, '255,180,90', 0.6);
      glow(ctx, W * 0.3, H * 0.15, 240 * k, '150,170,220', 0.2);
      tinyLily(ctx, -W * 0.28, HY + 70 * k, 1.1 * k);
      fogLayer(ctx, t, HY - 10 * k, 18 * k, 0.75, 0.7);
      // туманник
      for (const st of S.stages) {
        if (t < st.t || t > st.end + 0.6) continue;
        const x = st.x * W;
        const P = STAGE[st.s];
        if (t < st.end) {
          const a = st.s === 3 ? 1 : 1 - r01(t, st.end - 0.08, st.end);
          tumannik(ctx, x, st.s, t, a);
        } else if (st.s < 3) {
          puff(ctx, x, P.base * H - P.h * H * 0.5, P.h * H * 0.6, r01(t, st.end, st.end + 0.6));
        }
      }
      fogLayer(ctx, t, H * 0.6, -26 * k, 0.5, 0.9);
      fogLayer(ctx, t, H * 0.78, 34 * k, 0.35, 1.0);
      bigEye(ctx, t);
      ctx.restore();
      // тишина перед глазом
      if (t >= ev.breath && t < ev.eye) { ctx.fillStyle = `rgba(4,6,16,${0.25 * r01(t, ev.breath, ev.breath + 0.3)})`; ctx.fillRect(0, 0, W, H); }
      const fl = t >= ev.eye && t < ev.cut ? 0.4 * Math.exp(-(t - ev.eye) * 14) : 0;
      if (fl > 0.01) { ctx.fillStyle = `rgba(200,240,230,${fl})`; ctx.fillRect(0, 0, W, H); }
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      Subs.draw(ctx, t, S.subtitles, { style: 'clean', size: Math.round(62 * k), y: H * 0.36, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
