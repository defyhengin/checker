// «Мерцалова топь» — эпизод 6 «Тишка». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const CX = W * 0.56, GY = H * 0.66;            // тишка на кувшинке
  const FX = W * 0.31, FY = H * 0.7;            // лягушки
  const F2X = W * 0.79, F2Y = H * 0.73;
  const LX = W * 0.42, LY = HY + 26 * k;         // далёкая кувшинка — оттуда шкатулка
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));

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
    // кувшинки лягушек
    G.ellipse(ctx, FX, FY + 4 * k, 120 * k, 30 * k, { fill: '#1E4A47', lw: 4, seed: 530, stroke: '#081615' });
    G.ellipse(ctx, F2X, F2Y + 4 * k, 100 * k, 26 * k, { fill: '#1E4A47', lw: 4, seed: 531, stroke: '#081615' });
    // кувшинка тишки
    G.ellipse(ctx, CX, GY + 10 * k, 190 * k, 50 * k, { fill: '#1E4A47', lw: 4, seed: 520, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
    G.line(ctx, [[CX, GY + 10 * k], [CX + 170 * k, GY + 24 * k]], { color: '#081615', lw: 4, seed: 521 });
    G.ellipse(ctx, CX + 140 * k, GY - 2 * k, 18 * k, 10 * k, { fill: '#E8D9F0', lw: 2.5, seed: 522, stroke: '#2A2030' });
  }


  // ---------- тишка ----------
  const TX = CX, TY = GY - 6 * k, SZ = 1.7;
  function mouthWorld(t) {
    const look = sm(t, ev.turn, ev.turn + 1.2);
    return [TX - lerp(48, 0, look) * k * SZ, TY + (-92 * k + look * 14 * k) * SZ];
  }
  function mouthOpen(t) {
    let o = 0.15;
    for (const e of [ev.frogsOff, ev.windOff, ev.musicOff, ev.voiceCut]) o = Math.max(o, Math.sin(Math.PI * r01(t, e - 0.6, e + 0.15)) * 0.9);
    return o;
  }
  function tishka(ctx, t) {
    const look = sm(t, ev.turn, ev.turn + 1.2);   // 0 — боком (смотрит влево), 1 — в камеру
    const ink = '#04050B', rim = 'rgba(140,200,220,0.55)';
    ctx.save(); ctx.translate(TX, TY); ctx.scale(SZ, SZ); ctx.translate(-TX, -TY);
    const breathe = 1 + 0.02 * Math.sin(t * 2.3);
    const ear = Math.sin(t * 1.7) * 0.05;
    // тень-тельце
    G.ellipse(ctx, TX + 10 * k * (1 - look), TY - 36 * k, 46 * k, 40 * k * breathe, { fill: ink, lw: 3, seed: 1700, stroke: rim });
    if (look < 0.6) G.ellipse(ctx, TX + 52 * k * (1 - look), TY - 26 * k, 12 * k, 11 * k, { fill: ink, lw: 2, seed: 1701, stroke: rim }); // хвостик
    // голова
    const hx = TX - 30 * k * (1 - look), hy = TY - 90 * k;
    for (const s of [-1, 1]) {
      const ex = hx + s * 16 * k * (0.4 + 0.6 * look) + 6 * k * (1 - look);
      G.poly(ctx, [[ex - 10 * k, hy - 20 * k], [ex + s * 8 * k + ear * 60 * k, hy - 104 * k], [ex + 12 * k, hy - 22 * k]], { fill: ink, lw: 3, seed: 1710 + s, stroke: rim });
    }
    G.ellipse(ctx, hx, hy, 40 * k, 36 * k, { fill: ink, lw: 3, seed: 1720, stroke: rim });
    // глазки: две бледные точки
    for (const s of look > 0.5 ? [-1, 1] : [-1]) {
      const ex = hx + (look > 0.5 ? s * 15 * k : -18 * k), ey = hy - 10 * k;
      ctx.fillStyle = '#DDE8F0'; ctx.beginPath(); ctx.arc(ex, ey, 4 * k, 0, 7); ctx.fill();
    }
    // круглый рот
    ctx.restore();
    const [mx, my] = mouthWorld(t), o = mouthOpen(t);
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(mx, my, (5 + 16 * o) * k, (5 + 19 * o) * k, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(160,215,230,0.8)'; ctx.lineWidth = 2.5 * k; ctx.stroke();
  }

  // ---------- звуковые кольца: рождаются у источника, съедаются ртом ----------
  function ring(ctx, t, t0, x, y, eatT, { speed = 160, life = 1.6, rgb = '200,225,240', lw = 3 } = {}) {
    if (t < t0) return;
    const age = t - t0;
    let r = age * speed * k, a = 0.55 * (1 - age / life), cx = x, cy = y;
    if (t >= eatT && t0 < eatT) {
      const p = ease.inQuad(r01(t, eatT - 0.55, eatT + 0.05));
      const [mx, my] = mouthWorld(t);
      const ageAtEat = Math.max(0, eatT - 0.55 - t0);
      r = lerp(Math.min(r, ageAtEat * speed * k + 20 * k), 2 * k, p); a = Math.max(a, 0.5) * (1 - p * 0.6);
      cx = lerp(x, mx, p); cy = lerp(y, my, p);
      if (p >= 1) return;
    } else if (t > eatT - 0.55 && t0 < eatT) {
      const p = ease.inQuad(r01(t, eatT - 0.55, eatT + 0.05));
      const [mx, my] = mouthWorld(t);
      cx = lerp(x, mx, p); cy = lerp(y, my, p); r = lerp(r, 2 * k, p); a = Math.max(0.15, a) * (1 - p * 0.5) + 0.25 * p;
    }
    if (a <= 0.01 || age > life && t < eatT - 0.55) return;
    ctx.strokeStyle = `rgba(${rgb},${clamp(a)})`; ctx.lineWidth = lw * k;
    ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.55, 0, 0, 7); ctx.stroke();
  }
  function rings(ctx, t) {
    for (const c of S.croaks) ring(ctx, t, c.t, c.who ? F2X : FX, (c.who ? F2Y : FY) - 30 * k, ev.frogsOff, { speed: 180, life: 1.3 });
    for (const g of S.gusts) ring(ctx, t, g.t, W * 0.08, HY + 40 * k, ev.windOff, { speed: 260, life: 2.0, rgb: '170,190,230', lw: 2 });
    for (const n of S.box) ring(ctx, t, n.t, LX, LY, ev.musicOff, { speed: 120, life: 1.8, rgb: '120,215,220', lw: 2.5 });
  }

  // ---------- лягушки ----------
  function frog(ctx, t, x, y, who, seed) {
    let sac = 0;
    if (t < ev.frogsOff) for (const c of S.croaks) if (c.who === who && t >= c.t && t < c.t + 0.5) sac = Math.sin(Math.PI * (t - c.t) / 0.5);
    const ink = '#0A1A10', s = who ? 0.85 : 1;
    G.ellipse(ctx, x, y - 18 * k * s, 46 * k * s, 30 * k * s, { fill: '#4E8A4A', lw: 3, seed, stroke: ink, hatch: { color: 'rgba(10,30,10,0.3)', gap: 7 } });
    if (sac > 0.02) G.ellipse(ctx, x + 20 * k * s, y - 6 * k * s, (22 * sac + 3) * k * s, (18 * sac + 3) * k * s, { fill: '#D6E3A8', lw: 2, seed: seed + 1, stroke: ink });
    for (const e of [-1, 1]) {
      G.ellipse(ctx, x + e * 18 * k * s + 12 * k * s, y - 42 * k * s, 11 * k * s, 11 * k * s, { fill: '#4E8A4A', lw: 2.5, seed: seed + 2 + e, stroke: ink });
      ctx.fillStyle = '#0A0A0A'; ctx.beginPath(); ctx.arc(x + e * 18 * k * s + 14 * k * s, y - 43 * k * s, 4.5 * k * s, 0, 7); ctx.fill();
    }
  }

  // камыши у камеры качаются, пока есть ветер
  function reeds(ctx, t) {
    const wind = 1 - r01(t, ev.windOff - 0.4, ev.windOff + 0.2);
    for (let i = 0; i < 9; i++) {
      const left = i % 2 === 0, x = left ? W * (0.02 + 0.03 * i) : W * (1.0 - 0.025 * i), h = (0.32 + 0.14 * U.hash(i, 72)) * H;
      const lean = (left ? 1 : -1) * 0.08 * h + Math.sin(t * 1.6 + i) * 0.04 * h * wind;
      G.line(ctx, [[x, H + 20], [x + lean * 0.5, H - h * 0.5], [x + lean, H - h]], { color: '#050916', lw: 10 * k, seed: 600 + i });
      if (U.hash(i, 73) < 0.5) G.ellipse(ctx, x + lean, H - h, 13 * k, 40 * k, { fill: '#1E140E', lw: 3, seed: 620 + i, stroke: '#050508' });
    }
  }

  // ---------- последняя фраза: буквы улетают в рот ----------
  function lastLine(ctx, t, toScreen) {
    if (t < S.LAST.t || t >= ev.click) return;
    const size = Math.round(62 * k), lh = size * 1.22, fam = 'Inter';
    const y0 = H * 0.24 - lh;
    const chars = [];
    S.LAST.lines.forEach((ln, li) => {
      const total = G.measure(ctx, ln, size, fam, 800);
      let x = W / 2 - total / 2;
      for (let i = 0; i < ln.length; i++) {
        const w = G.measure(ctx, ln.slice(0, i + 1), size, fam, 800) - G.measure(ctx, ln.slice(0, i), size, fam, 800);
        chars.push({ c: ln[i], x, y: y0 + li * lh, w });
        x += w;
      }
    });
    const [mx, my] = toScreen(mouthWorld(t));
    const n = chars.length;
    chars.forEach((ch, i) => {
      if (ch.c === ' ') return;
      // съедаются с конца фразы, быстро, одна за другой
      const st = ev.voiceCut + (n - 1 - i) * 0.018, p = ease.inQuad(r01(t, st, st + 0.45));
      if (p >= 1) return;
      const x = lerp(ch.x, mx, p), y = lerp(ch.y, my, p), sc = 1 - 0.85 * p;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.rotate(p * (i % 2 ? 2 : -2));
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = size * 0.25;
      G.text(ctx, ch.c, 0, 0, { size, fam, weight: 800, color: '#FFFFFF', boil: 0 });
      ctx.restore();
    });
  }

  // ---------- последний экран: журнал камеры, надпись съедается по буквам ----------
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
    const a = r01(t, ev.title + 0.3, ev.title + 0.6);
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const sc = Math.round(4 * k), y = H * 0.42 + 95 * k;
    if (t < ev.title + 1.2) {
      const secs = String(31 + Math.floor(t - ev.title)).padStart(2, '0');
      const dot = Math.floor((t - ev.title) * 2) % 2 === 0 ? '●' : ' ';
      pixelText(ctx, `${dot} REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
    } else {
      // «ЗАПИСЬ ПРЕРВАНА» исчезает с конца по букве; пробелы сохраняют ширину
      const full = 'ЗАПИСЬ ПРЕРВАНА', gone = Math.floor((t - ev.title - 1.7) / 0.07);
      const keep = gone <= 0 ? full.length : Math.max(0, full.length - gone);
      if (keep > 0) pixelText(ctx, full.slice(0, keep) + ' '.repeat(full.length - keep), W / 2, y, sc, '#C9D2E8');
    }
    ctx.restore();
  }

  function cam(t) {
    const z = 1.6 + 0.3 * sm(t, 0, ev.musicOff) + 0.6 * sm(t, ev.voiceCut, ev.click);
    const fx = lerp(W * 0.52, TX, sm(t, ev.musicOff, ev.click));
    return { x: fx, y: GY - 130 * k - 20 * k * sm(t, ev.voiceCut, ev.click), z };
  }

  Studio.film({
    draw(ctx, t) {
      const c = cam(t);
      const ox = W / 2, oy = H * 0.58;
      const toScreen = ([x, y]) => [ox + (x - c.x) * c.z, oy + (y - c.y) * c.z];
      ctx.save();
      ctx.translate(ox, oy); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
      ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
      const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 10 * k, wy - 10 * k, 20 * k, 20 * k);
      if (on) glow(ctx, wx, wy, 75 * k, '255,180,90', 0.6);
      glow(ctx, W * 0.8, H * 0.13, 230 * k, '150,170,220', 0.2);
      // далёкая кувшинка гаснет, когда съедена музыка
      const lily = 1 - 0.7 * r01(t, ev.musicOff - 0.2, ev.musicOff + 0.3);
      glow(ctx, LX, LY, 100 * k, '90,200,210', (0.25 + 0.06 * Math.sin(t * 1.3)) * lily);
      ctx.fillStyle = '#C8F1F1'; ctx.globalAlpha = 0.4 + 0.6 * lily; ctx.beginPath(); ctx.ellipse(LX, LY, 9 * k, 4 * k, 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      frog(ctx, t, FX, FY, 0, 1800);
      frog(ctx, t, F2X, F2Y, 1, 1810);
      tishka(ctx, t);
      rings(ctx, t);
      reeds(ctx, t);
      ctx.restore();
      // в тишине мир чуть темнеет
      const dark = 0.2 * sm(t, ev.voiceCut, ev.click);
      if (dark > 0) { ctx.fillStyle = `rgba(3,5,14,${dark})`; ctx.fillRect(0, 0, W, H); }
      if (t >= ev.click) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      lastLine(ctx, t, toScreen);
      if (t >= ev.click) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
