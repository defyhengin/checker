// «Мерцалова топь» — эпизод 5 «Улыбыши». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const CX = W * 0.5, GY = H * 0.66;            // большая кувшинка с малышами
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#15121C', SKIN = '#C4BDD3', SKIN_D = '#9D95B0';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  // будка — как в 4-й серии
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
    // большая кувшинка малышей
    G.ellipse(ctx, CX, GY + 10 * k, 330 * k, 78 * k, { fill: '#1E4A47', lw: 4, seed: 520, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
    G.line(ctx, [[CX, GY + 10 * k], [CX + 300 * k, GY + 30 * k]], { color: '#081615', lw: 4, seed: 521 });
    G.ellipse(ctx, CX - 250 * k, GY - 4 * k, 22 * k, 12 * k, { fill: '#E8D9F0', lw: 2.5, seed: 522, stroke: '#2A2030' });
    // крупные камыши у камеры по краям
    for (let i = 0; i < 9; i++) {
      const left = i % 2 === 0, x = left ? W * (0.02 + 0.03 * i) : W * (1.0 - 0.025 * i), h = (0.32 + 0.14 * U.hash(i, 72)) * H;
      const lean = (left ? 1 : -1) * 0.08 * h;
      G.line(ctx, [[x, H + 20], [x + lean * 0.5, H - h * 0.5], [x + lean, H - h]], { color: '#050916', lw: 10 * k, seed: 600 + i });
      if (U.hash(i, 73) < 0.5) G.ellipse(ctx, x + lean, H - h, 13 * k, 40 * k, { fill: '#1E140E', lw: 3, seed: 620 + i, stroke: '#050508' });
    }
  }


  // ---------- улыбка: тёмный рот или светящийся серп ----------
  function smile(ctx, x, y, w, h, { glowA = 0, ghost = false, tilt = 0, alpha = 1 } = {}) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(-w, -h * 0.15);
    ctx.quadraticCurveTo(0, h * 1.25, w, -h * 0.15);
    ctx.quadraticCurveTo(0, h * (ghost ? 0.3 : 0.55), -w, -h * 0.15);
    ctx.closePath();
    ctx.fillStyle = ghost ? '#DDF6F4' : '#2A1420'; ctx.fill();
    // ряд мелких зубок — улыбка шире, чем надо (у призрачной — тёмные щели между зубами)
    ctx.fillStyle = ghost ? 'rgba(10,30,40,0.75)' : '#F2EEE4';
    for (let i = 1; i < 8; i++) {
      const u = i / 8, xx = -w + 2 * w * u, top = -h * 0.15 + h * (ghost ? 0.6 : 1.1) * u * (1 - u) * 2 * 0.62;
      if (ghost) ctx.fillRect(xx - w * 0.015, top, w * 0.03, h * 0.28);
      else ctx.fillRect(xx - w * 0.04, top - h * 0.02, w * 0.08, h * 0.16);
    }
    ctx.restore();
    if (glowA > 0) glow(ctx, x, y + h * 0.4, w * 2.6, '90,200,210', glowA);
  }

  // ---------- малыш ----------
  const BX = [-0.24, -0.12, 0, 0.12, 0.24];
  function hopY(i, t) {
    for (const h of S.hops) if (h.who === i && t >= h.t - EIGHTH_UP && t < h.t) return Math.sin(Math.PI * (t - (h.t - EIGHTH_UP)) / EIGHTH_UP) * 70 * k;
    return 0;
  }
  const EIGHTH_UP = S.EIGHTH * 0.9;
  function baby(ctx, i, t) {
    const sleep = sm(t, ev.sleep - 0.3, ev.sleep + 0.6);
    const gone = r01(t, ev.gone, ev.gone + 0.35);
    const x = CX + BX[i] * W * 0.9, base = GY - 8 * k + Math.abs(BX[i]) * 30 * k;
    const y = base - hopY(i, t) - (1 - sleep) * Math.abs(Math.sin(t * 1.7 + i)) * 4 * k;
    const sq = 1 - 0.18 * sleep;                       // свернулся во сне
    const lean = sleep * (i % 2 ? 0.25 : -0.25);
    const hr = 54 * k, by = y - 30 * k * sq, hy = y - 78 * k * sq;
    // улыбка, которая остаётся
    const smX = x + Math.sin(lean) * 40 * k, smY = hy + 14 * k;
    if (gone < 1) {
      ctx.save(); ctx.globalAlpha = 1 - gone;
      // тельце
      G.ellipse(ctx, x, by, 30 * k, 26 * k * sq, { fill: SKIN_D, lw: 3, seed: 1600 + i, stroke: INK });
      // голова
      ctx.translate(x, y); ctx.rotate(lean); ctx.translate(-x, -y);
      G.ellipse(ctx, x, hy, hr, hr * 0.9 * sq, { fill: SKIN, lw: 3.5, seed: 1610 + i, stroke: INK, hatch: { color: 'rgba(40,30,60,0.18)', gap: 8, angle: 0.6 } });
      // глаза: точки / сонные дуги
      for (const s of [-1, 1]) {
        const ex = x + s * 17 * k, ey = hy - 10 * k;
        if (sleep < 0.5) { ctx.fillStyle = '#0A0A0A'; ctx.beginPath(); ctx.arc(ex, ey, 5.5 * k, 0, 7); ctx.fill(); }
        else G.line(ctx, [[ex - 7 * k, ey], [ex, ey + 4 * k], [ex + 7 * k, ey]], { color: INK, lw: 3 * k, seed: 1620 + i + s });
        ctx.fillStyle = 'rgba(232,140,150,0.45)'; ctx.beginPath(); ctx.ellipse(x + s * 30 * k, hy + 6 * k, 8 * k, 5 * k, 0, 0, 7); ctx.fill();
      }
      smile(ctx, x, hy + 10 * k, 30 * k, 22 * k);
      ctx.restore();
    }
  }

  // ---------- финал: улыбки вокруг камеры ----------
  function crowd(ctx, t) {
    if (t < ev.hit) return;
    for (let i = 0; i < S.smiles.length; i++) {
      const s = S.smiles[i];
      const on = 1; // все загораются ровно на ударе
      if (on <= 0) continue;
      const sc = 0.8 + s.depth * 2.6;
      const x = s.x * W, y = HY + (s.y - 0.3) * (H - HY) * 0.9 + s.depth * 120 * k;
      smile(ctx, x, y + Math.sin(t * 1.1 + i) * 3 * k * sc, 22 * k * sc, 16 * k * sc, { ghost: true, tilt: s.tilt, glowA: 0.18 * on, alpha: on * (0.55 + 0.45 * s.depth) });
    }
  }

  function fireflies(ctx, t) {
    if (t > ev.gone) return;
    const fade = 1 - r01(t, ev.sleep, ev.gone);
    for (let i = 0; i < 4; i++) {
      const x = W * (0.2 + 0.6 * U.hash(i, 1500)) + Math.sin(t * 0.7 + i * 2) * 60 * k;
      const y = H * (0.42 + 0.12 * U.hash(i, 1501)) + Math.sin(t * 1.1 + i) * 30 * k;
      const a = (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)) * (0.4 + 0.6 * fade);
      ctx.fillStyle = `rgba(255,233,176,${a})`; ctx.beginPath(); ctx.arc(x, y, 5 * k, 0, 7); ctx.fill();
      glow(ctx, x, y, 60 * k, '255,190,90', 0.55 * a);
    }
  }

  // ---------- последний экран: журнал камеры + улыбка в темноте ----------
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
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = a;
      const sc = Math.round(4 * k), y = H * 0.42 + 95 * k;
      if (t < ev.title + 1.4) {
        const secs = String(8 + Math.floor(t - ev.title)).padStart(2, '0');
        const dot = Math.floor((t - ev.title) * 2) % 2 === 0 ? '●' : ' ';
        pixelText(ctx, `${dot} REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
      } else if (Math.floor(t * 6) % 7 !== 0) {
        pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
      }
      ctx.restore();
    }
    // в темноте медленно проступает улыбка
    const eT = ev.title + 0.9, o = ease.inOutQuad(r01(t, eT, eT + 0.9));
    if (o > 0.02) smile(ctx, W * 0.5, H * 0.6, 70 * k, 50 * k, { ghost: true, glowA: 0.2 * o, alpha: o * 0.9 });
  }

  function cam(t) {
    const z = 1.55 + 0.3 * sm(t, 0, ev.sleep) + 0.1 * sm(t, ev.sleep, ev.breath) - 0.35 * (t >= ev.hit ? ease.outQuad(r01(t, ev.hit, ev.hit + 0.25)) : 0);
    return { x: CX, y: GY - 90 * k, z };
  }

  Studio.film({
    draw(ctx, t) {
      const c = cam(t);
      const sh = t >= ev.hit ? 14 * k * Math.exp(-(t - ev.hit) * 7) : 0;
      ctx.save();
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.58 + U.noise1(t * 30, 2) * sh);
      ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
      ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
      const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 10 * k, wy - 10 * k, 20 * k, 20 * k);
      if (on) glow(ctx, wx, wy, 75 * k, '255,180,90', 0.6);
      glow(ctx, W * 0.8, H * 0.13, 230 * k, '150,170,220', 0.2);
      glow(ctx, W * 0.42, HY + 26 * k, 100 * k, '90,200,210', 0.25 + 0.06 * Math.sin(t * 1.3));
      ctx.fillStyle = '#C8F1F1'; ctx.beginPath(); ctx.ellipse(W * 0.42, HY + 26 * k, 9 * k, 4 * k, 0, 0, 7); ctx.fill();
      fireflies(ctx, t);
      // ночь сгущается, когда малыши засыпают
      for (let i = 0; i < S.BABIES; i++) baby(ctx, i, t);
      ctx.restore();
      const dark = 0.18 * sm(t, ev.sleep, ev.sleep + 1.5) + 0.25 * sm(t, ev.gone, ev.breath);
      if (dark > 0) { ctx.fillStyle = `rgba(3,5,14,${dark})`; ctx.fillRect(0, 0, W, H); }
      // улыбки «поверх» затемнения светятся
      if (t >= ev.gone) {
        ctx.save();
        ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.58 + U.noise1(t * 30, 2) * sh);
        ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
        for (let i = 0; i < S.BABIES; i++) ghostOnly(ctx, i, t);
        ctx.restore();
        crowd(ctx, t);
      }
      if (t >= ev.hit && t < ev.hit + 0.2) glow(ctx, W / 2, H * 0.6, W * 0.9, '90,200,210', 0.35 * (1 - (t - ev.hit) / 0.2)); // вспышка на ударе
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });

  function ghostOnly(ctx, i, t) {
    const x = CX + BX[i] * W * 0.9, base = GY - 8 * k + Math.abs(BX[i]) * 30 * k;
    const lean = i % 2 ? 0.25 : -0.25, hy = base - 78 * k * 0.82;
    const a = ease.outQuad(r01(t, ev.gone, ev.gone + 0.5));
    smile(ctx, x + Math.sin(lean) * 40 * k, hy + 14 * k - 4 * k * Math.sin(t * 1.3 + i), 30 * k, 22 * k, { ghost: true, glowA: 0.25 * a + (t >= ev.hit ? 0.15 : 0), alpha: a });
  }
})();
