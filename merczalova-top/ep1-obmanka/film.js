// «Мерцалова топь» — эпизод 1 «Обманка». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev, clock, BEAT } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H;
  const HY = Math.round(H * 0.47);          // линия горизонта / кромка воды
  const LX = W * 0.5, LY = H * 0.63;        // кувшинка
  const k = W / 1080;
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));

  // ---------- свечение ----------
  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  // ---------- статичный фон (кэшируется, линии всё равно «дышат» в 3 вариантах) ----------
  function scenery(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    // звёзды
    for (let i = 0; i < 70; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.8, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    // луна
    G.ellipse(ctx, W * 0.24, H * 0.16, 78 * k, 78 * k, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 9 } });
    G.ellipse(ctx, W * 0.26, H * 0.15, 15 * k, 12 * k, { fill: '#D7DCCF', lw: 2, seed: 3, stroke: '#9AA3B8' });
    G.ellipse(ctx, W * 0.215, H * 0.175, 10 * k, 9 * k, { fill: '#D7DCCF', lw: 2, seed: 4, stroke: '#9AA3B8' });
    // ели в два слоя
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 16; i++) spruce(U.hash(i, 10) * W * 1.1 - W * 0.05, HY, (0.13 + 0.07 * U.hash(i, 11)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 14; i++) spruce(U.hash(i, 12) * W * 1.1 - W * 0.05, HY + 6 * k, (0.09 + 0.06 * U.hash(i, 13)) * H, '#121A35', 60 + i);
    // будка наблюдателя
    const hx = W * 0.7, hb = HY + 2 * k;
    G.poly(ctx, [[hx - 34 * k, hb], [hx - 34 * k, hb - 44 * k], [hx, hb - 72 * k], [hx + 34 * k, hb - 44 * k], [hx + 34 * k, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    G.line(ctx, [[hx - 22 * k, hb], [hx - 26 * k, hb + 26 * k]], { color: '#05070F', lw: 4, seed: 91 });
    G.line(ctx, [[hx + 22 * k, hb], [hx + 26 * k, hb + 26 * k]], { color: '#05070F', lw: 4, seed: 92 });
    // вода
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    // отражения елей (мягкие тёмные клинья)
    ctx.save(); ctx.globalAlpha = 0.35;
    for (let i = 0; i < 16; i++) {
      const x = U.hash(i, 10) * W * 1.1 - W * 0.05, h = (0.13 + 0.07 * U.hash(i, 11)) * H * 0.6;
      ctx.fillStyle = '#0B1330'; ctx.beginPath(); ctx.moveTo(x - h * 0.3, HY); ctx.lineTo(x + h * 0.3, HY); ctx.lineTo(x, HY + h); ctx.fill();
    }
    ctx.restore();
    // лунная дорожка
    for (let i = 0; i < 14; i++) {
      const y = HY + 20 * k + i * 26 * k, w = (90 - i * 4) * k * (0.7 + 0.6 * U.hash(i, 40));
      G.line(ctx, [[W * 0.24 - w, y], [W * 0.24 + w, y]], { color: 'rgba(200,215,240,0.35)', lw: 3, seed: 200 + i });
    }
    // камыши по берегу
    for (let i = 0; i < 34; i++) {
      const x = U.hash(i, 50) * W, h = (0.05 + 0.08 * U.hash(i, 51)) * H, lean = (U.hash(i, 52) - 0.5) * 0.25 * h;
      if (Math.abs(x - LX) < W * 0.18) continue;
      G.line(ctx, [[x, HY + 14 * k], [x + lean * 0.5, HY + 14 * k - h * 0.5], [x + lean, HY + 14 * k - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
      if (U.hash(i, 53) < 0.4) G.ellipse(ctx, x + lean * 0.95, HY + 14 * k - h * 0.95, 7 * k, 22 * k, { fill: '#2A1C14', lw: 2, seed: 400 + i, stroke: '#0A0A10' });
    }
    // листья кувшинок
    const pads = [[0.15, 0.56, 120, 26], [0.86, 0.6, 140, 30], [0.3, 0.74, 170, 36], [0.78, 0.71, 110, 24], [0.5, 0.648, 300, 64]];
    pads.forEach(([px, py, rx, ry], i) => {
      G.ellipse(ctx, px * W, py * H, rx * k, ry * k, { fill: '#1E4A47', lw: 4, seed: 500 + i, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
      ctx.fillStyle = '#0B1530';
      ctx.beginPath(); ctx.moveTo(px * W, py * H); ctx.lineTo(px * W + rx * k * 1.05, py * H - ry * k * 0.28); ctx.lineTo(px * W + rx * k * 1.05, py * H + ry * k * 0.28); ctx.fill();
    });
  }

  // ---------- кувшинка ----------
  function lily(ctx, x, y, s, open, dim, seed) {
    const rings = [[10, 150, 0.0, '#9BDDE3', 12], [8, 112, 0.2, '#C8F1F1', 38], [6, 76, 0.45, '#F0FFFD', 62]];
    const petals = [];
    rings.forEach(([n, L, off, col, eo], r) => {
      const e = ((eo + (86 - eo) * (1 - open)) * Math.PI) / 180;
      const Ls = L * k * s * (0.75 + 0.25 * open);
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * (i + off)) / n;
        const X = Math.cos(a) * Math.cos(e), Y = Math.sin(a) * Math.cos(e), Z = Math.sin(e);
        const base = [x, y - 10 * k * s * r];
        const tip = [x + X * Ls, y - 16 * k * s * r * open - Z * Ls * 0.85 + Y * Ls * 0.33];
        petals.push({ Y, r, base, tip, col, i });
      }
    });
    petals.sort((a, b) => b.Y - a.Y || a.r - b.r);
    for (const p of petals) {
      const dx = p.tip[0] - p.base[0], dy = p.tip[1] - p.base[1], ln = Math.hypot(dx, dy) + 1e-6;
      const nx = -dy / ln, ny = dx / ln, wd = ln * 0.3, pts = [];
      for (let j = 0; j <= 10; j++) { const u = j / 10, w = Math.pow(Math.sin(Math.PI * u), 0.8) * wd; pts.push([p.base[0] + dx * u + nx * w, p.base[1] + dy * u + ny * w]); }
      for (let j = 10; j >= 0; j--) { const u = j / 10, w = Math.pow(Math.sin(Math.PI * u), 0.8) * wd; pts.push([p.base[0] + dx * u - nx * w, p.base[1] + dy * u - ny * w]); }
      const shade = 0.75 + 0.25 * (0.5 - p.Y * 0.5);
      G.shape(ctx, pts, { fill: G.tint(p.col, (shade - 1) * 1.2 - (1 - dim) * 0.6), lw: 2.5, seed: seed + p.r * 20 + p.i, stroke: '#3E8C93', amp: 1.2 });
    }
    G.ellipse(ctx, x, y - 22 * k * s, (6 + 14 * open) * k * s, (4 + 8 * open) * k * s, { fill: G.tint('#FFD27A', -(1 - dim) * 0.5), lw: 2, seed: seed + 99, stroke: '#B07A2A' });
  }

  // ---------- состояние кувшинки во времени ----------
  const openness = (t) => Math.max(1 - sm(t, ev.closeStart, ev.closeEnd), sm(t, ev.rise + 0.4, ev.rise + 1.6));
  const sinkPx = (t) => { // резкий рывок вниз на ev.snap, плавное всплытие на ev.rise
    if (t < ev.snap) return 0;
    if (t < ev.rise) return 260 * k * ease.outCubic(r01(t, ev.snap, ev.snap + 0.12));
    return 260 * k * (1 - ease.outCubic(r01(t, ev.rise, ev.rise + 1.0)));
  };

  // ---------- существо под водой ----------
  function creature(ctx, t) {
    const a = r01(t, ev.snap, ev.snap + 0.35) * (1 - r01(t, ev.eyesClose + 0.3, ev.rise));
    if (a <= 0.01) return;
    const bx = LX, by = LY + 210 * k;
    ctx.save();
    ctx.beginPath(); ctx.rect(0, LY + 18 * k, W, H); ctx.clip();
    ctx.globalAlpha = a;
    const breathe = 1 + 0.02 * Math.sin(t * 2.2);
    G.ellipse(ctx, bx, by + 40 * k, 470 * k * breathe, 190 * k, { fill: '#050915', lw: 4, seed: 700, stroke: '#020308', hatch: { color: 'rgba(30,50,80,0.25)', gap: 10, angle: -0.6 } });
    G.ellipse(ctx, bx, by - 30 * k, 330 * k * breathe, 120 * k, { fill: '#070D1D', lw: 3, seed: 701, stroke: '#020308' });
    // глаза
    const eo = ease.outBack(r01(t, ev.eyes, ev.eyes + 0.35), 1.6) * (1 - ease.inQuad(r01(t, ev.eyesClose, ev.eyesClose + 0.3)));
    const blink = t > T45 && t < T45 + 0.16 ? 0.1 : 1;
    for (const dx of [-150, 150]) {
      const ex = bx + dx * k, ey = by - 50 * k, ry = Math.max(2, 46 * k * eo * blink);
      G.ellipse(ctx, ex, ey, 58 * k, ry, { fill: '#D9F2E4', lw: 4, seed: 710 + dx, stroke: '#0A1A16' });
      if (eo > 0.15) {
        G.ellipse(ctx, ex + 6 * k * Math.sin(t * 0.7), ey, 9 * k, ry * 0.85, { fill: '#05080C', lw: 2, seed: 720 + dx, stroke: '#05080C' });
        ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ex - 20 * k, ey - ry * 0.4, 6 * k * eo, 0, 7); ctx.fill();
      }
      glow(ctx, ex, ey, 150 * k, '120,200,180', 0.18 * eo);
    }
    // «стебель» — это язык, он втягивается в пасть
    const tl = 1 - ease.inOutQuad(r01(t, ev.eyes + 0.3, ev.eyesClose));
    const mouthY = by - 6 * k;
    const tipY = lerp(mouthY, LY + 40 * k, tl);
    if (tl > 0.02) {
      G.line(ctx, [[LX, mouthY], [LX + 10 * k * Math.sin(t * 3), (mouthY + tipY) / 2], [LX, tipY]], { color: '#6E3A52', lw: 16 * k, seed: 730 });
      G.ellipse(ctx, LX, tipY, 46 * k, 18 * k, { fill: '#4D8E92', lw: 2, seed: 731, stroke: '#2A5558' });
      glow(ctx, LX, tipY, 120 * k, '90,190,200', 0.35 * tl);
    }
    G.ellipse(ctx, bx, mouthY + 4 * k, 70 * k, 10 * k, { fill: '#020306', lw: 2, seed: 740, stroke: '#020306' });
    ctx.restore();
    // толща воды поверх
    ctx.save(); ctx.globalAlpha = 0.38 * a; ctx.fillStyle = '#0B1A36';
    ctx.fillRect(0, LY + 18 * k, W, H); ctx.restore();
  }
  const T45 = S.T(6, 1); // одно моргание

  // ---------- светлячки ----------
  function attraction(t) {
    let a = 0.65 * sm(t, S.T(2, 0), ev.land);
    a *= 1 - sm(t, ev.snap, ev.snap + 0.5);
    a += 0.55 * sm(t, ev.rise + 0.6, ev.second - 0.2);
    return Math.min(a, 0.65);
  }
  function fireflies(ctx, t) {
    const A = attraction(t);
    const hush = t >= ev.breath && t < ev.snap ? 0.35 : 1;
    for (const f of S.fireflies) {
      if (t < f.t) continue;
      const age = t - f.t;
      const pop = ease.outBack(clamp(age / 0.3), 3);
      let x, y;
      if (f.i === S.HERO) {
        if (t >= ev.closeEnd + 0.5) continue; // остался внутри цветка
        const u = sm(t, S.T(2, 0), ev.land);
        const wx = f.x + Math.sin(t * 1.1 + f.ph) * 40 * k, wy = f.y + Math.cos(t * 0.9 + f.ph) * 30 * k;
        const tx = LX + 4 * k, ty = LY - 150 * k + 50 * k * (1 - openness(t));
        x = lerp(wx, tx, u); y = lerp(wy, ty, u);
        const inside = 1 - r01(t, ev.closeStart + 0.3, ev.closeEnd + 0.5);
        const r = 6 * k * pop;
        if (inside > 0.5) { ctx.fillStyle = '#FFF3C4'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
        glow(ctx, x, y, 70 * k, '255,200,110', 0.75 * Math.max(inside, 0.3) * hush);
        if (age < 0.5) glow(ctx, x, y, 160 * k, '255,220,150', 0.6 * (1 - age / 0.5));
        continue;
      }
      const wx = f.x + Math.sin(t * 0.6 + f.ph) * 60 * k, wy = f.y + Math.cos(t * 0.5 + f.ph * 1.3) * 40 * k;
      const ang = f.ph + t * f.w;
      const ox = LX + Math.cos(ang) * f.orb, oy = LY - 120 * k + Math.sin(ang) * f.orb * 0.45;
      x = lerp(wx, ox, A); y = lerp(wy, oy, A);
      const fl = 0.65 + 0.35 * Math.sin(t * 3 + f.ph * 2);
      const r = 5 * k * pop;
      ctx.fillStyle = '#FFE9B0'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
      glow(ctx, x, y, 55 * k, '255,190,90', 0.55 * fl * hush);
      if (age < 0.45) glow(ctx, x, y, 150 * k, '255,220,150', 0.65 * (1 - age / 0.45)); // вспышка на ноте
    }
  }

  // ---------- брызги на рывке ----------
  function splash(ctx, t) {
    const a = t - ev.snap;
    if (a < 0 || a > 0.9) return;
    for (let i = 0; i < 18; i++) {
      const ang = Math.PI * (0.15 + 0.7 * U.hash(i, 80)), sp = (300 + 500 * U.hash(i, 81)) * k;
      const x = LX + Math.cos(ang) * sp * a * (U.hash(i, 82) < 0.5 ? -1 : 1);
      const y = LY - Math.sin(ang) * sp * a + 900 * k * a * a;
      const r = (4 + 6 * U.hash(i, 83)) * k * (1 - a);
      ctx.fillStyle = 'rgba(190,240,240,0.9)'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
  }
  function ripples(ctx, t) {
    for (const t0 of [ev.snap, ev.rise]) {
      const a = (t - t0) / 2.6;
      if (a <= 0 || a >= 1) continue;
      for (let j = 0; j < 3; j++) {
        const kk = a - j * 0.14; if (kk <= 0) continue;
        const rx = (50 + 380 * kk) * k;
        G.ellipse(ctx, LX, LY + 8 * k, rx, rx * 0.22, { fill: 'rgba(0,0,0,0)', stroke: `rgba(150,220,225,${0.7 * (1 - kk)})`, lw: 3, seed: 800 + j });
      }
    }
  }

  // ---------- камера ----------
  function cam(t) {
    let z = 1 + 0.14 * sm(t, S.T(1, 2), ev.land);
    z += 0.06 * sm(t, ev.breath, ev.snap); // медленный наезд в тишине
    z -= 0.2 * sm(t, S.T(8, 0), ev.second - 0.15); // отъезд перед финалом
    const sh = t >= ev.snap ? 22 * k * Math.exp(-(t - ev.snap) * 6) : 0;
    return { z, sx: U.noise1(t * 30, 1) * sh, sy: U.noise1(t * 30, 2) * sh };
  }

  Studio.film({
    draw(ctx, t) {
      const c = cam(t);
      ctx.save();
      ctx.translate(LX + c.sx, LY - 40 * k + c.sy); ctx.scale(c.z, c.z); ctx.translate(-LX, -(LY - 40 * k));
      const bg = Studio.cache('scenery', scenery);
      ctx.drawImage(bg, 0, 0, W, H);
      // окно будки: Морзе «НЕ»
      const on = S.morseOn(t);
      const wx = W * 0.7, wy = HY - 36 * k;
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 9 * k, wy - 9 * k, 18 * k, 18 * k);
      if (on) glow(ctx, wx, wy, 70 * k, '255,180,90', 0.6);
      glow(ctx, W * 0.24, H * 0.16, 260 * k, '150,170,220', 0.22); // ореол луны
      // бледные пятна глаз в воде — до разоблачения
      const pe = 0.16 * (1 - r01(t, ev.breath, ev.snap)) * (0.7 + 0.3 * Math.sin(t * 1.3));
      if (pe > 0.01) for (const dx of [-26, 26]) { ctx.fillStyle = `rgba(200,235,220,${pe})`; ctx.beginPath(); ctx.ellipse(LX + dx * k, LY + 120 * k, 11 * k, 6 * k, 0, 0, 7); ctx.fill(); }
      creature(ctx, t);
      ripples(ctx, t);
      // кувшинка: срезана по воде, пока под водой
      const sp = sinkPx(t);
      if (sp < 250 * k) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, LY + 10 * k); ctx.clip();
        const op = openness(t);
        lily(ctx, LX, LY + sp, 1.3, op, 1, 1000);
        ctx.restore();
        const lg = (1 - sp / (260 * k)) * (0.5 + 0.5 * op);
        glow(ctx, LX, LY - 40 * k + sp, 330 * k, '90,200,210', 0.55 * lg);
        glow(ctx, LX, LY - 30 * k + sp, 90 * k, '255,200,110', 0.5 * lg);
        glow(ctx, LX, LY + 120 * k, 160 * k, '60,140,150', 0.3 * lg); // отражение
      }
      splash(ctx, t);
      fireflies(ctx, t);
      // вторая кувшинка у самой камеры — вспыхивает разом
      if (t >= ev.second) {
        const u = r01(t, ev.second, ev.second + 0.6);
        lily(ctx, W * 0.22, H * 0.79, 2.0, 0.35 + 0.65 * ease.outCubic(u), 1, 2000);
        glow(ctx, W * 0.22, H * 0.79 - 60 * k, 520 * k, '90,200,210', 0.8 - 0.25 * u);
      }
      ctx.restore();
      // тишина: мир затаил дыхание
      if (t >= ev.breath && t < ev.snap) { ctx.fillStyle = `rgba(4,6,16,${0.3 * r01(t, ev.breath, ev.breath + 0.3)})`; ctx.fillRect(0, 0, W, H); }
      const fl = t >= ev.snap ? 0.55 * Math.exp(-(t - ev.snap) * 14) : 0;
      if (fl > 0.01) { ctx.fillStyle = `rgba(200,245,245,${fl})`; ctx.fillRect(0, 0, W, H); }
      const f2 = t >= ev.second ? 0.45 * Math.exp(-(t - ev.second) * 12) : 0;
      if (f2 > 0.01) { ctx.fillStyle = `rgba(180,240,240,${f2})`; ctx.fillRect(0, 0, W, H); }
      Subs.draw(ctx, t, S.subtitles, { style: 'clean', size: Math.round(62 * k), y: H * 0.36, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
