// «Мерцалова топь» - эпизод 12 «Луноед». Каждый кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.72);              // горизонт низко: кадр снизу вверх, на луну
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#120F18', FUR = '#CFC8DC', FUR_D = '#A69EB8';
  const MX = W * 0.4, MY = H * 0.34, MR = 210 * k;   // луна
  const LX = W * 0.66, LY = H * 0.53;                 // Луноед на верхушке ели
  const BOOTH = { x: W * 0.22, b: HY + 4 * k, q: 1.5 * k };
  const WIN = { x: BOOTH.x, y: BOOTH.b - 42 * BOOTH.q, r: 11 * k };

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  // сколько луны осталось (1 -> 0)
  const BITES = [...ev.bites, ev.lastBite];
  const bitesDone = (t) => BITES.filter((b) => t >= b).length;
  const moonLeft = (t) => [1, 0.72, 0.48, 0.26, 0][bitesDone(t)];

  function scenery(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    for (let i = 0; i < 90; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.95, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 16; i++) spruce(U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.07 + 0.05 * U.hash(i, 15)) * H, '#1A2547', 30 + i);
    const { x: hx, b: hb, q } = BOOTH;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    for (let i = 0; i < 22; i++) {
      const x = U.hash(i, 53) * W, h = (0.03 + 0.05 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * h;
      G.line(ctx, [[x, HY + 10 * k], [x + lean * 0.5, HY + 10 * k - h * 0.5], [x + lean, HY + 10 * k - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
    }
    // большая ель справа, верхушка - насест Луноеда
    const ex = W * 0.72;
    const pts = [[ex - 8 * k, LY + 30 * k]];
    for (let s = 1; s <= 7; s++) { const yy = LY + 30 * k + s * 120 * k, ww = s * 48 * k; pts.push([ex - ww, yy - 20 * k], [ex - ww * 0.55, yy]); }
    const right = pts.map(([px, py]) => [2 * ex - px, py]).reverse();
    G.poly(ctx, [...pts, [ex - 7 * 48 * k, H + 20 * k], [ex + 7 * 48 * k, H + 20 * k], ...right], { fill: '#0C1226', lw: 3, seed: 400, stroke: '#04060E' });
  }

  // ---------- луна с откусами ----------
  let moonCv = null;
  function moon(ctx, t) {
    const n = bitesDone(t);
    if (n >= 4) return;
    if (!moonCv) { moonCv = document.createElement('canvas'); moonCv.width = W; moonCv.height = H; }
    const c = moonCv.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H);
    G.ellipse(c, MX, MY, MR, MR, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 9 } });
    for (const [cx, cy, cr] of [[-0.3, -0.2, 0.18], [0.25, 0.3, 0.12], [-0.1, 0.4, 0.09]]) G.ellipse(c, MX + cx * MR, MY + cy * MR, cr * MR, cr * MR, { fill: 'rgba(170,180,200,0.35)', lw: 1.5, seed: 3 + cx * 10, stroke: 'rgba(126,138,168,0.5)' });
    // откусы - справа налево, каждый «зубчиками»
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < n; i++) {
      const e = MX + MR * (1 - 0.55 * (i + 1));   // край откуса
      c.fillRect(e + MR * 0.2, MY - MR * 1.2, MR * 3, MR * 2.4);
      for (let j = -3; j <= 3; j++) { c.beginPath(); c.arc(e + MR * 0.2, MY + j * MR * 0.38, MR * 0.27, 0, 7); c.fill(); }
    }
    c.globalCompositeOperation = 'source-over';
    glow(ctx, MX, MY, MR * 2.2, '150,170,220', 0.28 * moonLeft(t));
    ctx.drawImage(moonCv, 0, 0);
  }
  // светящиеся крошки после каждого укуса
  function crumbs(ctx, t) {
    BITES.forEach((b, i) => {
      const age = t - b; if (age < 0 || age > 2.2) return;
      const bx = MX + MR * (1 - 0.55 * (i + 1)), by = MY + MR * 0.1;
      for (let j = 0; j < 10; j++) {
        const vx = (U.hash(j, 50 + i) - 0.3) * 160 * k, vy = (U.hash(j, 60 + i) - 0.8) * 120 * k;
        const x = bx + vx * age, y = by + vy * age + 260 * k * age * age;
        const a = Math.exp(-age * 1.4);
        ctx.fillStyle = `rgba(245,248,230,${a})`; ctx.beginPath(); ctx.arc(x, y, (2 + 2 * U.hash(j, 70)) * k, 0, 7); ctx.fill();
        glow(ctx, x, y, 14 * k, '230,236,200', 0.4 * a);
      }
    });
  }

  // ---------- Луноед ----------
  // o: { reach (лапки к луне 0..1), chew (0..1), look (-1 луна .. 1 будка), puff }
  function lunoed(ctx, x, y, sc, t, o) {
    const s = k * sc;
    // хвост свисает с верхушки, пушистый, с кольцами
    const tw = Math.sin(t * 1.1) * 10 * s;
    for (let i = 0; i < 6; i++) {
      const p = i / 5, tx = x + 40 * s + Math.sin(p * 2.4) * 34 * s + tw * p, ty = y + 20 * s + p * 190 * s;
      G.ellipse(ctx, tx, ty, (30 - 10 * p) * s, 30 * s, { fill: i % 2 ? FUR : '#BDB5CC', lw: 2, seed: 600 + i, stroke: INK, hatch: { color: 'rgba(70,60,90,0.14)', gap: 6, angle: 1 } });
    }
    // тело
    G.ellipse(ctx, x, y, 46 * s, 54 * s, { fill: FUR, lw: 3, seed: 610, stroke: INK, hatch: { color: 'rgba(70,60,90,0.16)', gap: 7, angle: 0.6 } });
    G.ellipse(ctx, x - 6 * s, y + 10 * s, 26 * s, 34 * s, { fill: '#E6E1EE', lw: 0, seed: 611 });
    // голова
    const hx = x - 8 * s + o.look * 10 * s, hy = y - 70 * s;
    for (const d of [-1, 1]) G.ellipse(ctx, hx + d * 38 * s, hy - 34 * s, 16 * s, 18 * s, { fill: FUR, lw: 2.5, seed: 620 + d, stroke: INK });
    const cheek = 1 + 0.12 * o.chew;
    G.ellipse(ctx, hx, hy, 52 * s * cheek, 44 * s, { fill: FUR, lw: 3.5, seed: 630, stroke: INK, hatch: { color: 'rgba(70,60,90,0.12)', gap: 8, angle: 0.6 } });
    // глаза - большие, в них отражается луна (пока она есть)
    const ml = o.moon;
    for (const d of [-1, 1]) {
      const ex = hx + d * 22 * s + o.look * 6 * s, ey = hy - 4 * s;
      ctx.fillStyle = '#06050A'; ctx.beginPath(); ctx.ellipse(ex, ey, 16 * s, 18 * s, 0, 0, 7); ctx.fill();
      if (ml > 0) {
        ctx.fillStyle = `rgba(240,244,230,${0.4 + 0.5 * ml})`; ctx.beginPath(); ctx.arc(ex - 4 * s, ey - 5 * s, 6 * s, 0, 7); ctx.fill();
        ctx.fillStyle = '#06050A'; ctx.beginPath(); ctx.arc(ex - 4 * s + 6 * s * (1 - ml), ey - 5 * s, 6 * s, 0, 7); ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.arc(ex + 5 * s, ey + 6 * s, 2 * s, 0, 7); ctx.fill();
      if (o.red) { ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(ex + 1 * s, ey + 3 * s, 3 * s, 0, 7); ctx.fill(); }
    }
    // носик и ротик
    ctx.fillStyle = '#B07A90'; ctx.beginPath(); ctx.ellipse(hx + o.look * 6 * s, hy + 14 * s, 5 * s, 3.5 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = INK; ctx.lineWidth = 2 * s; ctx.beginPath();
    const mo = o.chew > 0.1 ? 3 * s * Math.abs(Math.sin(t * 14)) : 0;
    ctx.ellipse(hx + o.look * 6 * s, hy + 23 * s, 6 * s, 2 * s + mo, 0, 0, Math.PI); ctx.stroke();
    // лапки: к луне или сложены
    for (const d of [-1, 1]) {
      const sx = x + d * 20 * s, sy = y - 26 * s;
      const rx = lerp(x + d * 14 * s, MX + MR * 0.6 + d * 14 * s, o.reach * 0.25), ry = lerp(y - 6 * s, y - 110 * s, o.reach);
      G.line(ctx, [[sx, sy], [rx, ry]], { color: FUR_D, lw: 9 * s, seed: 640 + d });
      G.ellipse(ctx, rx, ry, 8 * s, 7 * s, { fill: FUR, lw: 2, seed: 642 + d, stroke: INK });
    }
  }
  function chewAt(t) { let c = 0; for (const b of BITES) { const a = t - b; if (a > 0 && a < 1.0) c = Math.max(c, 1 - a); } return c; }
  function reachAt(t) { let r = 0; for (const b of BITES) r = Math.max(r, Math.max(0, 1 - Math.abs(t - b) / 0.35)); return r; }

  // ---------- окно будки (Морзе, потом откушено) ----------
  function boothWindow(ctx, t) {
    const { x, y, r } = WIN;
    const bitten = t >= ev.windowBite;
    if (!bitten) {
      const on = S.morseOn(t);
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      if (on) glow(ctx, x, y, 80 * k, '255,180,90', 0.7);
    } else {
      ctx.fillStyle = '#16120C'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = '#0E1428';
      for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(x + r, y + j * r * 0.6, r * 0.55, 0, 7); ctx.fill(); }
      const fl = r01(t, ev.windowBite, ev.windowBite + 0.25);
      if (fl < 1) glow(ctx, x, y, 80 * k, '255,180,90', 0.7 * (1 - fl));
    }
  }
  // силуэт за крышей: только глаза-луны
  function riser(ctx, t) {
    if (t < ev.rise || t >= ev.hit) return;
    const p = ease.outCubic(r01(t, ev.rise, ev.rise + 0.8));
    const bx = BOOTH.x + 30 * k, by = BOOTH.b - 72 * BOOTH.q - 20 * k * p;
    const eyes = t < ev.gone + 0.9 ? 1 : 0;
    ctx.fillStyle = '#05070F';
    ctx.beginPath(); ctx.ellipse(bx, by - 10 * k * p, 46 * k, 40 * k * p, 0, Math.PI, 0); ctx.fill();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(bx + d * 34 * k, by - 44 * k * p, 10 * k, 12 * k * p, 0, 0, 7); ctx.fill(); }
    if (eyes && p > 0.5) for (const d of [-1, 1]) {
      const ex = bx + d * 18 * k, ey = by - 20 * k * p;
      ctx.fillStyle = 'rgba(240,244,230,0.95)'; ctx.beginPath(); ctx.arc(ex, ey, 5 * k, 0, 7); ctx.fill();
      glow(ctx, ex, ey, 22 * k, '230,236,200', 0.5);
    }
  }

  // ---------- удар: точка REC в лапках ----------
  function closeUp(ctx, t) {
    ctx.fillStyle = '#05060C'; ctx.fillRect(0, 0, W, H);
    const p = ease.outCubic(r01(t, ev.hit, ev.hit + 0.1));
    const sc = lerp(5.4, 6.2, p), s = sc * k;
    const hy = H * 0.4, y = hy + 70 * s, x = W * 0.5 + 8 * s;
    const rx = W * 0.5, ry = hy + 62 * s, rr = 22 * s;
    glow(ctx, rx, ry, 360 * k, '255,60,50', 0.5);
    lunoed(ctx, x, y, sc, t, { reach: 0, chew: 1, look: 0, moon: 0, red: true });
    // красная точка REC у рта, с откушенным краем
    ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(rx, ry, rr, 0, 7); ctx.fill();
    glow(ctx, rx, ry, rr * 2, '255,80,60', 0.5);
    ctx.fillStyle = FUR;
    for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(rx + rr * 0.15 + j * rr * 0.42, ry - rr * 0.95, rr * 0.3, 0, 7); ctx.fill(); }
    for (const d of [-1, 1]) G.ellipse(ctx, rx + d * rr * 1.05, ry + rr * 0.2, 9 * s, 8 * s, { fill: FUR, lw: 3, seed: 700 + d, stroke: INK });
    for (let j = 0; j < 8; j++) {
      const age = t - ev.hit, x2 = rx + (U.hash(j, 80) - 0.5) * 300 * k * age, y2 = ry - rr + (U.hash(j, 81) - 0.9) * 200 * k * age + 600 * k * age * age;
      ctx.fillStyle = 'rgba(255,80,60,0.9)'; ctx.beginPath(); ctx.arc(x2, y2, 6 * k, 0, 7); ctx.fill();
    }
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
    return w * scale;
  }
  function endCard(ctx, t) {
    const a = r01(t, ev.title + 0.3, ev.title + 0.6) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const sc = Math.round(4 * k), y = H * 0.42 + 210 * k;
    if (t < ev.endCut) {
      const secs = String(2 + Math.floor(t - ev.title)).padStart(2, '0');
      const w = pixelText(ctx, `   REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
      // точка REC рисуется отдельно: с ev.endBite у неё откушен край
      const dx = W / 2 - w / 2 + 16 * k, r = 12 * k;
      ctx.fillStyle = '#FF3B30'; ctx.beginPath(); ctx.arc(dx, y, r, 0, 7); ctx.fill();
      if (t >= ev.endBite) { ctx.fillStyle = '#030408'; for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.arc(dx + r * 0.95, y + j * r * 0.4, r * 0.35, 0, 7); ctx.fill(); } }
    } else if (Math.floor(t * 6) % 7 !== 0) {
      pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
    }
    ctx.restore();
  }

  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    moon(ctx, t);
    // темнеет вместе с луной
    ctx.fillStyle = `rgba(3,4,12,${0.55 * (1 - moonLeft(t))})`; ctx.fillRect(0, 0, W, H);
    boothWindow(ctx, t);
    riser(ctx, t);
    crumbs(ctx, t);
    if (t < ev.toBooth + 1.0) {
      const look = -1 + 2 * sm(t, ev.lastBite + 0.3, ev.toBooth + 0.6);
      lunoed(ctx, LX, LY, 1.9, t, { reach: reachAt(t), chew: chewAt(t), look: look * 0.8, moon: moonLeft(t) });
    }
  }

  Studio.film({
    draw(ctx, t) {
      // камера: луна и Луноед, потом спуск к будке
      const p = ease.inOutCubic(r01(t, ev.toBooth, ev.toBooth + 1.0));
      const z = lerp(1.0 + 0.05 * r01(t, 0, ev.lastBite), 2.6, p);
      const cx = lerp(W * 0.52, WIN.x + 10 * k, p), cy = lerp(H * 0.5, WIN.y - 20 * k, p);
      const sh = t >= ev.lastBite && t < ev.lastBite + 0.4 ? 8 * k * Math.exp(-(t - ev.lastBite) * 9) : 0;
      ctx.save();
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.5 + U.noise1(t * 30, 2) * sh); ctx.scale(z, z); ctx.translate(-cx, -cy);
      world(ctx, t);
      ctx.restore();
      // в тишине - почти полная темнота
      if (t >= ev.gone && t < ev.hit) { ctx.fillStyle = `rgba(2,3,8,${0.4 + 0.5 * r01(t, ev.gone, ev.gone + 1.2)})`; ctx.fillRect(0, 0, W, H); }
      if (t >= ev.hit && t < ev.cut) closeUp(ctx, t);
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.15, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
