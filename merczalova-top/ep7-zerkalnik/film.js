// «Мерцалова топь» — эпизод 7 «Зеркальник». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const CX = W * 0.55, GY = H * 0.6;            // кочка (линия воды у её подножия)
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#120F18', PALE = '#D9D5E6', PALE_D = '#A9A3BD';

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


  // ---------- зеркальник (рисуется прямо; в отражение попадает перевёрнутым) ----------
  function zerk(ctx, x, footY, sc, t, lean = 0, eyes = 1) {
    const legH = 230 * k * sc, bodyY = footY - legH;
    const sway = Math.sin(t * 0.9) * 4 * k * sc;
    for (const s of [-1, 1]) G.line(ctx, [[x + s * 16 * k * sc, footY], [x + s * 12 * k * sc + sway * 0.3, footY - legH * 0.5], [x + s * 10 * k * sc + sway, bodyY]], { color: PALE_D, lw: 6 * k * sc, seed: 1900 + s });
    G.ellipse(ctx, x + sway, bodyY - 30 * k * sc, 34 * k * sc, 46 * k * sc, { fill: PALE, lw: 3, seed: 1910, stroke: INK, hatch: { color: 'rgba(60,50,80,0.18)', gap: 8, angle: 0.6 } });
    // длинные руки до колен
    for (const s of [-1, 1]) G.line(ctx, [[x + sway + s * 28 * k * sc, bodyY - 56 * k * sc], [x + sway + s * 44 * k * sc, bodyY + 20 * k * sc], [x + sway + s * 40 * k * sc, bodyY + 90 * k * sc]], { color: PALE_D, lw: 5 * k * sc, seed: 1920 + s });
    // шея и голова (наклон к камере — lean)
    const nx = x + sway + lean * 70 * k * sc, ny = bodyY - 130 * k * sc + lean * 40 * k * sc;
    G.line(ctx, [[x + sway, bodyY - 70 * k * sc], [nx, ny + 30 * k * sc]], { color: PALE_D, lw: 9 * k * sc, seed: 1930 });
    G.ellipse(ctx, nx, ny, 40 * k * sc, 38 * k * sc, { fill: PALE, lw: 3.5, seed: 1940, stroke: INK });
    for (const s of [-1, 1]) {
      const ex = nx + s * 15 * k * sc, ey = ny - 2 * k * sc;
      ctx.fillStyle = '#07060B'; ctx.beginPath(); ctx.ellipse(ex, ey, 11 * k * sc, 13 * k * sc * eyes, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ex - 3 * k * sc, ey - 4 * k * sc, 3 * k * sc, 0, 7); ctx.fill();
    }
  }
  function hummock(ctx, t) {
    G.ellipse(ctx, CX, GY - 10 * k, 160 * k, 46 * k, { fill: '#2A4A3C', lw: 4, seed: 520, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.4)', gap: 7, angle: -0.6 } });
    for (let i = 0; i < 7; i++) {
      const x = CX - 130 * k + i * 42 * k, h = (60 + 50 * U.hash(i, 1950)) * k, lean = Math.sin(t * 1.2 + i) * 4 * k;
      G.line(ctx, [[x, GY - 20 * k], [x + lean, GY - 20 * k - h]], { color: '#0E1C18', lw: 5 * k, seed: 1960 + i });
    }
  }

  // ---------- отражение: слой рисуется отдельно и кладётся полосами с рябью ----------
  let layer = null;
  function reflect(ctx, t, waterY, height, drawLayer, ripples) {
    if (!layer) { layer = document.createElement('canvas'); layer.width = W; layer.height = H; }
    const lc = layer.getContext('2d');
    lc.setTransform(1, 0, 0, 1, 0, 0); lc.clearRect(0, 0, W, H);
    drawLayer(lc);
    const strip = Math.max(2, Math.round(4 * k));
    for (let y = 0; y < height; y += strip) {
      let off = Math.sin(y * 0.045 + t * 2.0) * 1.5 * k;
      for (const r of ripples) {
        if (t < r.t) continue;
        const age = t - r.t, amp = r.amp * k * Math.exp(-age * r.decay);
        off += Math.sin(y * 0.09 - age * 14) * amp;
      }
      const srcY = waterY - y - strip;
      if (srcY < 0) break;
      ctx.drawImage(layer, 0, srcY, W, strip, off, waterY + y, W, strip);
    }
  }
  function waterTint(ctx, y0, y1, a) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, `rgba(10,18,44,${a * 0.55})`); g.addColorStop(1, `rgba(4,7,18,${a})`);
    ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0);
  }

  // ---------- кадр 1: кочка пустая, в отражении — он ----------
  function shot1(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
    ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 10 * k, wy - 10 * k, 20 * k, 20 * k);
    if (on) glow(ctx, wx, wy, 75 * k, '255,180,90', 0.6);
    glow(ctx, W * 0.8, H * 0.13, 230 * k, '150,170,220', 0.2);
    glow(ctx, W * 0.42, HY + 26 * k, 100 * k, '90,200,210', 0.25 + 0.06 * Math.sin(t * 1.3));
    ctx.fillStyle = '#C8F1F1'; ctx.beginPath(); ctx.ellipse(W * 0.42, HY + 26 * k, 9 * k, 4 * k, 0, 0, 7); ctx.fill();
    // зеркальная гладь под кочкой
    ctx.fillStyle = '#0A1230'; ctx.fillRect(0, GY, W, H - GY);
    reflect(ctx, t, GY, H - GY, (lc) => { hummock(lc, t); zerk(lc, CX + 10 * k, GY - 30 * k, 1.35, t); }, [{ t: ev.drop, amp: 14, decay: 1.6 }]);
    waterTint(ctx, GY, H, 0.38);
    hummock(ctx, t);
    // капля с кувшинки рядом
    const dx = CX + 230 * k;
    G.ellipse(ctx, dx, GY + 30 * k, 70 * k, 18 * k, { fill: '#1E4A47', lw: 3, seed: 1970, stroke: '#081615' });
    if (t > ev.drop - 0.5 && t < ev.drop) { const p = r01(t, ev.drop - 0.5, ev.drop); ctx.fillStyle = '#CFE8F0'; ctx.beginPath(); ctx.ellipse(dx - 40 * k, lerp(GY + 20 * k, GY + 70 * k, p * p), 4 * k, 6 * k, 0, 0, 7); ctx.fill(); }
    if (t >= ev.drop) for (let i = 0; i < 3; i++) {
      const age = t - ev.drop - i * 0.25; if (age < 0) continue;
      const r = age * 160 * k, a = 0.5 * Math.exp(-age * 1.2);
      ctx.strokeStyle = `rgba(200,225,240,${a})`; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.ellipse(dx - 40 * k, GY + 70 * k, r, r * 0.28, 0, 0, 7); ctx.stroke();
    }
  }

  // ---------- кадр 2: берег, штатив; в воде — штатив, камера и он за ней ----------
  const WL2 = H * 0.46, TPX = W * 0.46;
  function tripod(ctx, base, camY, flip) {
    // ноги от земли вверх к камере
    for (const s of [-1, 0, 1]) G.line(ctx, [[TPX + s * 120 * k, base], [TPX + s * 14 * k, camY + 40 * k]], { color: '#1B1A22', lw: 7 * k, seed: 2000 + s });
    if (camY > -200) {
      G.poly(ctx, [[TPX - 70 * k, camY - 40 * k], [TPX + 60 * k, camY - 40 * k], [TPX + 60 * k, camY + 40 * k], [TPX - 70 * k, camY + 40 * k]], { fill: '#24232C', lw: 3, seed: 2010, stroke: '#08080C' });
      G.ellipse(ctx, TPX + 76 * k, camY, 22 * k, 30 * k, { fill: '#121118', lw: 3, seed: 2011, stroke: '#08080C' });
      ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(TPX - 50 * k, camY - 22 * k, 6 * k, 0, 7); ctx.fill();
      glow(ctx, TPX - 50 * k, camY - 22 * k, 30 * k, '255,60,50', 0.5);
    }
  }
  function shot2(ctx, t) {
    // небо и камыши за берегом
    const g = ctx.createLinearGradient(0, 0, 0, WL2);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#1D2850');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, WL2);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.4 * U.hash(i, 2020)})`; ctx.beginPath(); ctx.arc(U.hash(i, 2021) * W, U.hash(i, 2022) * WL2 * 0.6, 1.5 * k, 0, 7); ctx.fill(); }
    // берег
    G.poly(ctx, [[0, WL2 - 70 * k], [W * 0.4, WL2 - 50 * k], [W, WL2 - 80 * k], [W, WL2], [0, WL2]], { fill: '#1F3A30', lw: 3, seed: 2030, stroke: '#081410' });
    for (let i = 0; i < 26; i++) { const x = U.hash(i, 2031) * W, h = (40 + 80 * U.hash(i, 2032)) * k; G.line(ctx, [[x, WL2 - 40 * k], [x + Math.sin(t + i) * 3 * k, WL2 - 40 * k - h]], { color: '#0B1712', lw: 4 * k, seed: 2040 + i }); }
    // над водой: только ноги штатива, уходящие за верх кадра. Никаких других ног.
    tripod(ctx, WL2 - 20 * k, -600 * k, false);
    // вода
    ctx.fillStyle = '#0A1230'; ctx.fillRect(0, WL2, W, H - WL2);
    const close = t >= ev.hit + 0.35 ? 1 : 0;   // после ряби лицо вплотную
    reflect(ctx, t, WL2, H - WL2, (lc) => {
      // отражение «смотрит» вверх: всё, что над берегом, но выше кадра
      const g2 = lc.createLinearGradient(0, 0, 0, WL2); g2.addColorStop(0, '#060A1E'); g2.addColorStop(1, '#1D2850');
      lc.fillStyle = g2; lc.fillRect(0, 0, W, WL2);
      G.poly(lc, [[0, WL2 - 70 * k], [W * 0.4, WL2 - 50 * k], [W, WL2 - 80 * k], [W, WL2], [0, WL2]], { fill: '#1F3A30', lw: 3, seed: 2030, stroke: '#081410' });
      if (!close) zerk(lc, TPX + 150 * k, WL2 - 40 * k, 1.25, t, -0.9 * sm(t, ev.shot2, ev.breath));
      tripod(lc, WL2 - 20 * k, WL2 - 380 * k, true);
      if (close) {
        // голова у самой камеры
        const nx = TPX + 40 * k, ny = WL2 - 470 * k;
        G.line(lc, [[TPX + 260 * k, -40 * k], [nx + 30 * k, ny - 20 * k]], { color: PALE_D, lw: 16 * k, seed: 2050 });
        G.ellipse(lc, nx, ny, 88 * k, 82 * k, { fill: PALE, lw: 4, seed: 2051, stroke: INK });
        for (const s of [-1, 1]) {
          lc.fillStyle = '#07060B'; lc.beginPath(); lc.ellipse(nx + s * 34 * k, ny + 4 * k, 24 * k, 28 * k, 0, 0, 7); lc.fill();
          lc.fillStyle = 'rgba(255,255,255,0.85)'; lc.beginPath(); lc.arc(nx + s * 34 * k - 7 * k, ny - 6 * k, 6 * k, 0, 7); lc.fill();
        }
      }
    }, [{ t: ev.hit, amp: 26, decay: 2.2 }]);
    waterTint(ctx, WL2, H, 0.32);
  }

  // ---------- последний экран: журнал + отражение титра «Наблюдение №4» ----------
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
  const tcv = document.createElement('canvas');
  function endCard(ctx, t) {
    const a = r01(t, ev.title + 0.3, ev.title + 0.6) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    // «вода» под титром и отражение с другим номером
    const size = Math.round(62 * k), ty = H * 0.42, wl = ty + size * 0.3;
    tcv.width = W; tcv.height = size * 2;
    const tc = tcv.getContext('2d'); tc.clearRect(0, 0, W, size * 2);
    tc.save(); tc.shadowColor = 'rgba(0,0,0,0.7)'; tc.shadowBlur = size * 0.25;
    G.text(tc, 'Наблюдение №4', W / 2, size * 1.3, { size, fam: 'Inter', weight: 800, color: '#9FB7C9', align: 'center', boil: 0 });
    tc.restore();
    const strip = Math.max(2, Math.round(3 * k)), ra = 0.6 * r01(t, ev.title + 0.8, ev.title + 1.6);
    ctx.globalAlpha = a * ra;
    for (let y = 0; y < size * 1.4; y += strip) {
      const off = Math.sin(y * 0.12 + t * 3) * 3 * k;
      ctx.drawImage(tcv, 0, size * 1.45 - y - strip, W, strip, off, wl + y, W, strip);
    }
    ctx.globalAlpha = a;
    const sc = Math.round(4 * k), y = ty + 210 * k;
    if (t < ev.title + 1.4) {
      const secs = String(2 + Math.floor(t - ev.title)).padStart(2, '0');
      const dot = Math.floor((t - ev.title) * 2) % 2 === 0 ? '●' : ' ';
      pixelText(ctx, `${dot} REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
    } else if (Math.floor(t * 6) % 7 !== 0) {
      pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
    }
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      if (t < ev.shot2) {
        // кадр 1, к концу камера опускается к воде
        const z = 1.35 + 0.15 * sm(t, 0, ev.drop) + 0.25 * sm(t, ev.tilt, ev.shot2);
        const cy = GY + 60 * k + 260 * k * sm(t, ev.tilt, ev.shot2);
        ctx.save(); ctx.translate(W / 2, H * 0.56); ctx.scale(z, z); ctx.translate(-CX, -cy);
        shot1(ctx, t);
        ctx.restore();
        const fade = r01(t, ev.shot2 - 0.25, ev.shot2);
        if (fade > 0) { ctx.fillStyle = `rgba(3,4,10,${fade})`; ctx.fillRect(0, 0, W, H); }
      } else {
        const push = sm(t, ev.shot2, ev.breath) * 0.12 + (t >= ev.hit ? 0.08 : 0);
        const sh = t >= ev.hit ? 12 * k * Math.exp(-(t - ev.hit) * 7) : 0;
        ctx.save();
        ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.5 + U.noise1(t * 30, 2) * sh); ctx.scale(1.45 + push, 1.45 + push); ctx.translate(-W / 2, -H * 0.6);
        shot2(ctx, t);
        ctx.restore();
        const fadeIn = 1 - r01(t, ev.shot2, ev.shot2 + 0.3);
        if (fadeIn > 0) { ctx.fillStyle = `rgba(3,4,10,${fadeIn})`; ctx.fillRect(0, 0, W, H); }
      }
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
