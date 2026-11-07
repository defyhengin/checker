// «Мерцалова топь» — эпизод 9 «Пряталки». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const CX = W * 0.52, GY = H * 0.62;            // кочка
  const REED = W * 0.4, LEAF = W * 0.68;         // укрытия
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#120F18', PALE = '#DCD8E8', PALE_D = '#ABA5C0', EAR_IN = '#B98C9E';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const BOOTH = { x: W * 0.3, b: HY + 6 * k, q: 1.32 * k };

  function scenery(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    for (let i = 0; i < 70; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.8, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    G.ellipse(ctx, W * 0.8, H * 0.13, 62 * k, 62 * k, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 9 } });
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 16; i++) spruce(U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.13 + 0.07 * U.hash(i, 15)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 14; i++) spruce(U.hash(i, 16) * W * 1.1 - W * 0.05, HY + 6 * k, (0.09 + 0.06 * U.hash(i, 17)) * H, '#121A35', 60 + i);
    const { x: hx, b: hb, q } = BOOTH;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    for (let i = 0; i < 14; i++) {
      const y = HY + 20 * k + i * 26 * k, w = (80 - i * 4) * k * (0.7 + 0.6 * U.hash(i, 40));
      G.line(ctx, [[W * 0.8 - w, y], [W * 0.8 + w, y]], { color: 'rgba(200,215,240,0.32)', lw: 3, seed: 200 + i });
    }
    for (let i = 0; i < 30; i++) {
      const x = U.hash(i, 53) * W, h = (0.05 + 0.08 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * h;
      G.line(ctx, [[x, HY + 14 * k], [x + lean * 0.5, HY + 14 * k - h * 0.5], [x + lean, HY + 14 * k - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
    }
    const pads = [[0.18, 0.7, 140, 30], [0.08, 0.8, 120, 26], [0.88, 0.76, 130, 28], [0.4, 0.86, 170, 36]];
    pads.forEach(([px, py, rx, ry], i) => G.ellipse(ctx, px * W, py * H, rx * k, ry * k, { fill: '#1E4A47', lw: 4, seed: 500 + i, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } }));
  }



  // ---------- Прятыш ----------
  // o: { hop, crouch (0..1 — сколько спряталось), cover (руки на глазах), peek (глаз между пальцами), look (-1..1) }
  function pry(ctx, x, y, sc, t, o) {
    const s = k * sc;
    const by = y - o.hop * 40 * s + o.crouch * 150 * s;
    const ear = Math.sin(t * 2.2) * 0.08;
    // тело-капелька
    G.ellipse(ctx, x, by - 55 * s, 34 * s, 52 * s, { fill: PALE, lw: 3, seed: 3000, stroke: INK, hatch: { color: 'rgba(60,50,80,0.16)', gap: 8, angle: 0.6 } });
    // ножки
    for (const d of [-1, 1]) G.line(ctx, [[x + d * 14 * s, by - 10 * s], [x + d * 18 * s, by + 4 * s]], { color: PALE_D, lw: 6 * s, seed: 3001 + d });
    // голова
    const hx = x + o.look * 6 * s, hy = by - 125 * s;
    // уши — огромные, как у летучей мыши
    for (const d of [-1, 1]) {
      const a = d * (0.5 + ear * d);
      const tipx = hx + d * 95 * s + Math.sin(a) * 10 * s, tipy = hy - 120 * s;
      G.poly(ctx, [[hx + d * 14 * s, hy - 26 * s], [tipx, tipy], [hx + d * 52 * s, hy + 4 * s]], { fill: PALE, lw: 3, seed: 3010 + d, stroke: INK });
      G.poly(ctx, [[hx + d * 22 * s, hy - 24 * s], [lerp(hx + d * 22 * s, tipx, 0.82), lerp(hy - 24 * s, tipy, 0.82)], [hx + d * 44 * s, hy - 4 * s]], { fill: EAR_IN, lw: 0, seed: 3012 + d });
    }
    G.ellipse(ctx, hx, hy, 50 * s, 44 * s, { fill: PALE, lw: 3.5, seed: 3020, stroke: INK });
    // глаза — большие, чёрные, с бликом
    for (const d of [-1, 1]) {
      const ex = hx + d * 20 * s + o.look * 4 * s, ey = hy - 2 * s;
      ctx.fillStyle = '#07060B'; ctx.beginPath(); ctx.ellipse(ex, ey, 14 * s, 17 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(ex - 4 * s, ey - 6 * s, 4.5 * s, 0, 7); ctx.fill();
    }
    // крошечная улыбка
    ctx.strokeStyle = INK; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.arc(hx, hy + 18 * s, 7 * s, 0.2, Math.PI - 0.2); ctx.stroke();
    // ручки: висят или закрывают глаза длинными пальчиками
    for (const d of [-1, 1]) {
      const sx = x + d * 26 * s, sy = by - 82 * s;
      const down = [x + d * 40 * s, by - 30 * s];
      const peekOff = (d === 1 ? o.peek : 0);
      const up = [hx + d * 20 * s, hy + 26 * s];
      const wx = lerp(down[0], up[0], o.cover), wy = lerp(down[1], up[1], o.cover);
      G.line(ctx, [[sx, sy], [lerp(sx, wx, 0.5) + d * 16 * s, lerp(sy, wy, 0.5)], [wx, wy]], { color: PALE_D, lw: 5 * s, seed: 3030 + d });
      for (let f = 0; f < 3; f++) {
        const fa = lerp(Math.PI / 2 + d * 0.2 + (f - 1) * 0.25, -Math.PI / 2 + (f - 1) * 0.22 + d * 0.15, o.cover);
        const len = lerp(18, 38, o.cover) * s;
        const ox = wx + (f - 1) * 7 * s * o.cover * d, oy = wy + peekOff * (f - 1) * 9 * s;
        G.line(ctx, [[ox, oy], [ox + Math.cos(fa) * len + peekOff * (f - 1) * 6 * s, oy + Math.sin(fa) * len]], { color: PALE_D, lw: 3.5 * s, seed: 3040 + f + d * 5 });
      }
    }
  }

  function hummock(ctx, t) {
    G.ellipse(ctx, CX, GY - 6 * k, 190 * k, 46 * k, { fill: '#2A4A3C', lw: 4, seed: 520, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.4)', gap: 7, angle: -0.6 } });
  }
  function reed(ctx, t) {
    const lean = Math.sin(t * 1.2) * 4 * k;
    G.line(ctx, [[REED, GY + 10 * k], [REED + lean * 0.5, GY - 160 * k], [REED + lean, GY - 330 * k]], { color: '#0B1712', lw: 7 * k, seed: 3100 });
    G.ellipse(ctx, REED + lean, GY - 300 * k, 9 * k, 34 * k, { fill: '#3A2A1E', lw: 2, seed: 3101, stroke: '#0B1712' });
  }
  function leaf(ctx, t) {
    // круглый лист кувшинки, поставленный «ребром» на стебле
    const lx = LEAF, ly = GY - 70 * k;
    G.line(ctx, [[lx, GY + 10 * k], [lx + 4 * k, ly + 60 * k]], { color: '#0E2421', lw: 8 * k, seed: 3110 });
    G.ellipse(ctx, lx, ly, 100 * k, 84 * k, { fill: '#1E4A47', lw: 4, seed: 3111, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.45; G.line(ctx, [[lx, ly + 20 * k], [lx + Math.cos(a) * 90 * k, ly + 20 * k + Math.sin(a) * 80 * k]], { color: 'rgba(8,22,21,0.6)', lw: 2 * k, seed: 3120 + i }); }
  }

  // где и как он сейчас
  function state(t) {
    const beatPh = ((t - S.clock.OFFSET) / S.BEAT) % 1;
    let x = CX, y = GY - 20 * k, hop = 0, crouch = 0, look = 0, behind = null;
    if (t < ev.hide1) { hop = Math.abs(Math.sin(Math.PI * beatPh)) * (t > 0.6 ? 1 : 0); look = Math.sin(t * 1.5) * 0.6; }
    else if (t < ev.hide2) { x = REED + 6 * k; y = GY + 4 * k; behind = 'reed'; look = -0.4 + 0.2 * Math.sin(t * 3); }
    else if (t < ev.back) { x = LEAF + 10 * k; y = GY - 30 * k + 8 * k * Math.sin(t * 2.4); behind = 'leaf'; look = 0.5 * Math.sin(t * 1.3); }
    else { x = CX; y = GY - 20 * k; }
    // перебежки — короткий прыжок в новое место
    for (const [t0, x0, x1] of [[ev.hide1, CX, REED + 6 * k], [ev.hide2, REED + 6 * k, LEAF], [ev.back, LEAF, CX]]) {
      const p = r01(t, t0 - 0.35, t0);
      if (p > 0 && p < 1) { x = lerp(x0, x1, ease.inOutQuad(p)); hop = Math.sin(Math.PI * p) * 1.8; crouch = 0; behind = null; }
    }
    const cover = sm(t, ev.cover - 0.3, ev.cover);
    const peek = sm(t, ev.peek, ev.peek + 0.25);
    return { x, y, hop, crouch, look, behind, cover, peek, gone: t >= ev.gone };
  }

  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
    ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 10 * k, wy - 10 * k, 20 * k, 20 * k);
    if (on) glow(ctx, wx, wy, 75 * k, '255,180,90', 0.6);
    glow(ctx, W * 0.8, H * 0.13, 230 * k, '150,170,220', 0.2);
    glow(ctx, W * 0.86, HY + 24 * k, 90 * k, '90,200,210', 0.22 + 0.06 * Math.sin(t * 1.3));
    ctx.fillStyle = '#C8F1F1'; ctx.beginPath(); ctx.ellipse(W * 0.86, HY + 24 * k, 8 * k, 3.5 * k, 0, 0, 7); ctx.fill();
    // светлячки
    for (let i = 0; i < 9; i++) {
      const x = (0.15 + 0.7 * U.hash(i, 3200)) * W + Math.sin(t * 0.8 + i) * 30 * k, y = (0.42 + 0.18 * U.hash(i, 3201)) * H + Math.sin(t * 1.1 + i * 2) * 20 * k;
      const a = (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)) * (t >= ev.gone && t < ev.hit ? 0 : 1);
      glow(ctx, x, y, 40 * k, '255,210,120', 0.45 * a);
    }
    hummock(ctx, t);
    leaf(ctx, t);
    const st = state(t);
    if (!st.gone) {
      if (st.behind === 'leaf') {
        // сначала он, потом лист поверх; над краем торчат уши и глаза
        pry(ctx, st.x, st.y, 1.1, t, st); leaf(ctx, t);
      } else {
        pry(ctx, st.x, st.y, 1.1, t, st);
      }
    }
    reed(ctx, t);
  }

  // ---------- удар: лицо у объектива ----------
  function closeUp(ctx, t) {
    // лицо во весь кадр; в огромных глазах отражается красная точка REC
    const p = ease.outCubic(r01(t, ev.hit, ev.hit + 0.1));
    const s = k * lerp(5.2, 6.4, p), hx = W / 2, hy = H * 0.5;
    for (const d of [-1, 1]) {
      G.poly(ctx, [[hx + d * 20 * s, hy - 30 * s], [hx + d * 110 * s, hy - 140 * s], [hx + d * 56 * s, hy + 6 * s]], { fill: PALE, lw: 5, seed: 3410 + d, stroke: INK });
      G.poly(ctx, [[hx + d * 28 * s, hy - 26 * s], [hx + d * 96 * s, hy - 118 * s], [hx + d * 48 * s, hy - 2 * s]], { fill: EAR_IN, lw: 0, seed: 3412 + d });
    }
    G.ellipse(ctx, hx, hy, 52 * s, 46 * s, { fill: PALE, lw: 6, seed: 3420, stroke: INK, hatch: { color: 'rgba(60,50,80,0.12)', gap: 10, angle: 0.6 } });
    for (const d of [-1, 1]) {
      const ex = hx + d * 21 * s, ey = hy - 3 * s;
      ctx.fillStyle = '#050408'; ctx.beginPath(); ctx.ellipse(ex, ey, 16 * s, 19 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ex - 5 * s, ey - 7 * s, 3 * s, 0, 7); ctx.fill();
      ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(ex + 4 * s, ey + 5 * s, 1.3 * s, 0, 7); ctx.fill();
      glow(ctx, ex + 4 * s, ey + 5 * s, 6 * s, '255,60,50', 0.6);
    }
    // улыбка шире, чем раньше
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.arc(hx, hy + 14 * s, 13 * s, 0.25, Math.PI - 0.25); ctx.stroke();
  }

  // ---------- последний экран ----------
  const pix = document.createElement('canvas');
  function pixelText(ctx, text, cx, cy, scale, color) {
    const fs = 11, px = pix.getContext('2d');
    px.font = `bold ${fs}px monospace`;
    const w = Math.ceil(px.measureText(text).width) + 4;
    pix.width = w; pix.height = fs + 6;
    px.font = `bold ${fs}px monospace`; px.textBaseline = 'top'; px.fillStyle = color;
    px.fillText(text, 2, 2);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pix, Math.round(cx - (w * scale) / 2), Math.round(cy - (pix.height * scale) / 2), w * scale, pix.height * scale);
    ctx.restore();
  }
  function endCard(ctx, t) {
    const a = r01(t, ev.title + 0.3, ev.title + 0.6) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const sc = Math.round(4 * k), y = H * 0.42 + 210 * k;
    if (t < ev.title + 1.4) {
      const secs = String(2 + Math.floor(t - ev.title)).padStart(2, '0');
      const dot = Math.floor((t - ev.title) * 2) % 2 === 0 ? '●' : ' ';
      pixelText(ctx, `${dot} REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
    } else if (Math.floor(t * 6) % 7 !== 0) {
      pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
    }
    ctx.restore();
    // в темноте загорается окно будки, в нём силуэт с ушами; окно мигает Морзе
    if (t < ev.window) return;
    const b = (1 - r01(t, S.DURATION - 0.5, S.DURATION));
    const cx = W / 2, cy = H * 0.7, ww = 150 * k, wh = 120 * k;
    const lit = S.morseOn(t) ? 1 : 0.35;
    ctx.save(); ctx.globalAlpha = b;
    G.poly(ctx, [[cx - 150 * k, cy + 120 * k], [cx - 150 * k, cy - 60 * k], [cx, cy - 170 * k], [cx + 150 * k, cy - 60 * k], [cx + 150 * k, cy + 120 * k]], { fill: '#0A0D18', lw: 3, seed: 3300, stroke: '#1C2236' });
    ctx.fillStyle = `rgba(255,200,116,${0.9 * lit})`; ctx.fillRect(cx - ww / 2, cy - wh / 2, ww, wh);
    glow(ctx, cx, cy, 260 * k, '255,180,90', 0.4 * lit);
    // силуэт: голова и два огромных уха, торчат за раму
    ctx.fillStyle = '#05060B';
    ctx.beginPath(); ctx.ellipse(cx, cy + 22 * k, 30 * k, 27 * k, 0, 0, 7); ctx.fill();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + d * 8 * k, cy + 6 * k); ctx.lineTo(cx + d * 64 * k, cy - 66 * k); ctx.lineTo(cx + d * 34 * k, cy + 22 * k); ctx.closePath(); ctx.fill(); }
    ctx.fillRect(cx - 34 * k, cy + 44 * k, 68 * k, wh / 2 - 44 * k);
    G.line(ctx, [[cx, cy - wh / 2], [cx, cy + wh / 2]], { color: '#0A0D18', lw: 6 * k, seed: 3301 });
    G.line(ctx, [[cx - ww / 2, cy], [cx + ww / 2, cy]], { color: '#0A0D18', lw: 6 * k, seed: 3302 });
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      // камера: близко у кочки, с «поиска» медленно пятится
      const z = 1.6 - 0.45 * sm(t, ev.count0, ev.gone) - 0.06 * sm(t, ev.gone, ev.hit);
      const cx = lerp(CX + 20 * k, CX, sm(t, ev.count0, ev.gone)), cy = lerp(H * 0.47, H * 0.46, sm(t, ev.count0, ev.gone));
      const sh = t >= ev.hit ? 14 * k * Math.exp(-(t - ev.hit) * 7) : 0;
      ctx.save();
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.56 + U.noise1(t * 30, 2) * sh); ctx.scale(z, z); ctx.translate(-cx, -cy);
      world(ctx, t);
      ctx.restore();
      if (t >= ev.hit && t < ev.cut) { ctx.fillStyle = 'rgba(3,4,10,0.55)'; ctx.fillRect(0, 0, W, H); closeUp(ctx, t); }
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
