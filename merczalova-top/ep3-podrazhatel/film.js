// «Мерцалова топь» — эпизод 3 «Подражатель». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev, pairs } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const CX = W * 0.64, GY = H * 0.6;           // подражатель сидит на кочке
  const FX = W * 0.27, FY = H * 0.655;         // лягушка
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  let MOUTH = null; // out/mouth.json из song.js: огибающая голоса по кадрам

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  function scenery(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    for (let i = 0; i < 70; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.8, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    G.ellipse(ctx, W * 0.78, H * 0.14, 66 * k, 66 * k, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 9 } });
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 16; i++) spruce(U.hash(i, 10) * W * 1.1 - W * 0.05, HY, (0.13 + 0.07 * U.hash(i, 11)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 14; i++) spruce(U.hash(i, 12) * W * 1.1 - W * 0.05, HY + 6 * k, (0.09 + 0.06 * U.hash(i, 13)) * H, '#121A35', 60 + i);
    const hx = W * 0.18, hb = HY + 4 * k, q = 1.15 * k;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    for (let i = 0; i < 14; i++) {
      const y = HY + 20 * k + i * 26 * k, w = (80 - i * 4) * k * (0.7 + 0.6 * U.hash(i, 40));
      G.line(ctx, [[W * 0.78 - w, y], [W * 0.78 + w, y]], { color: 'rgba(200,215,240,0.32)', lw: 3, seed: 200 + i });
    }
    for (let i = 0; i < 30; i++) {
      const x = U.hash(i, 50) * W, h = (0.05 + 0.08 * U.hash(i, 51)) * H, lean = (U.hash(i, 52) - 0.5) * 0.25 * h;
      G.line(ctx, [[x, HY + 14 * k], [x + lean * 0.5, HY + 14 * k - h * 0.5], [x + lean, HY + 14 * k - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
    }
    const pads = [[0.27, 0.668, 150, 32], [0.1, 0.76, 130, 28], [0.85, 0.73, 120, 26], [0.45, 0.82, 170, 36]];
    pads.forEach(([px, py, rx, ry], i) => G.ellipse(ctx, px * W, py * H, rx * k, ry * k, { fill: '#1E4A47', lw: 4, seed: 500 + i, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } }));
    // кочка подражателя
    G.ellipse(ctx, CX, GY + 34 * k, 190 * k, 74 * k, { fill: '#2C5A4E', lw: 4, seed: 520, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.4)', gap: 7, angle: -0.6 } });
    // крупные камыши у камеры по краям
    for (let i = 0; i < 9; i++) {
      const left = i % 2 === 0, x = left ? W * (0.02 + 0.03 * i) : W * (1.0 - 0.025 * i), h = (0.32 + 0.14 * U.hash(i, 70)) * H;
      const lean = (left ? 1 : -1) * 0.08 * h;
      G.line(ctx, [[x, H + 20], [x + lean * 0.5, H - h * 0.5], [x + lean, H - h]], { color: '#050916', lw: 10 * k, seed: 600 + i });
      if (U.hash(i, 71) < 0.5) G.ellipse(ctx, x + lean, H - h, 13 * k, 40 * k, { fill: '#1E140E', lw: 3, seed: 620 + i, stroke: '#050508' });
    }
  }

  // ---------- рот: голос + собственные «эхо» ----------
  function mouthOpen(t) {
    let o = 0;
    if (MOUTH && MOUTH.open) {
      const i = Math.floor(t * MOUTH.fps);
      if (i >= 0 && i < MOUTH.open.length) o = MOUTH.open[i];
    } else {
      for (const s of S.subtitles) if (t >= s.t && t < s.end - 0.2 && !s.text.startsWith('Наблюдение')) o = Math.max(o, Math.abs(Math.sin((t - s.t) * 17)) * 0.8);
    }
    if (t >= pairs.frog.echo && t < pairs.frog.echo + 0.45) o = Math.max(o, 0.7);
    if (t >= pairs.buzz.echo && t < pairs.buzz.echo + 0.9) o = Math.max(o, 0.35);
    if (t >= pairs.lull.echo && t < pairs.lull.echo + 2.5) o = Math.max(o, 0.25);
    return clamp(o);
  }

  // ---------- подражатель ----------
  function mimic(ctx, t) {
    const close = t >= ev.turn;
    let look = -0.8, lookY = 0.1; // смотрит на лягушку
    if (t > pairs.buzz.src - 0.5 && t < pairs.buzz.echo + 1) { const fx = fireflyPos(t); if (fx) { look = clamp((fx[0] - CX) / (W * 0.3), -1, 1); lookY = clamp((fx[1] - (GY - 160 * k)) / (H * 0.1), -1, 1); } }
    if (t > pairs.lull.src - 0.3 && t < ev.turn) { look = -0.4; lookY = -0.3; }
    if (close) { look = 0; lookY = 0; }
    const sway = t > pairs.lull.echo && t < pairs.lull.echo + 2.6 ? Math.sin((t - pairs.lull.echo) * 4.4) * 0.12 : 0;
    const buzzJ = t >= pairs.buzz.echo && t < pairs.buzz.echo + 0.9 ? U.noise1(t * 90, 3) * 3 * k : 0;
    const bx = CX + buzzJ, by = GY;
    const fur = '#6B5F76', ink = '#17121D', belly = '#9C8EA6';
    // хвост
    G.line(ctx, [[bx + 30 * k, by + 10 * k], [bx + 110 * k, by + 20 * k], [bx + 150 * k, by - 40 * k + Math.sin(t * 1.3) * 10 * k]], { color: fur, lw: 10 * k, seed: 700 });
    // тело
    G.ellipse(ctx, bx, by - 55 * k, 52 * k, 68 * k, { fill: fur, lw: 4, seed: 701, stroke: ink, hatch: { color: 'rgba(20,10,30,0.3)', gap: 7, angle: 0.8 } });
    G.ellipse(ctx, bx, by - 45 * k, 30 * k, 44 * k, { fill: belly, lw: 2, seed: 702, stroke: ink });
    // длинные пальцы на кочке
    for (const s of [-1, 1]) for (let f = 0; f < 3; f++) G.line(ctx, [[bx + s * 22 * k, by - 6 * k], [bx + s * (30 + f * 9) * k, by + 8 * k]], { color: ink, lw: 3 * k, seed: 710 + f + (s > 0 ? 5 : 0) });
    // голова (покачивается, когда напевает)
    ctx.save();
    const hx = bx, hy = by - 158 * k;
    ctx.translate(hx, hy + 40 * k); ctx.rotate(sway); ctx.translate(-hx, -(hy + 40 * k));
    // уши
    for (const s of [-1, 1]) {
      G.ellipse(ctx, hx + s * 62 * k, hy - 52 * k, 30 * k, 42 * k, { fill: fur, lw: 4, seed: 720 + s, stroke: ink });
      G.ellipse(ctx, hx + s * 62 * k, hy - 50 * k, 17 * k, 28 * k, { fill: '#C98E9E', lw: 2, seed: 722 + s, stroke: ink });
    }
    G.ellipse(ctx, hx, hy, 66 * k, 58 * k, { fill: fur, lw: 4, seed: 724, stroke: ink, hatch: { color: 'rgba(20,10,30,0.25)', gap: 8, angle: 0.6 } });
    // горловой мешок — копирует лягушку
    const sac = t >= pairs.frog.echo && t < pairs.frog.echo + 0.5 ? Math.sin(Math.PI * (t - pairs.frog.echo) / 0.5) : 0;
    if (sac > 0.02) G.ellipse(ctx, hx, hy + 52 * k + 10 * k * sac, 34 * k * sac + 4, 26 * k * sac + 3, { fill: '#B9A6BF', lw: 3, seed: 726, stroke: ink });
    // огромные глаза
    const half = t > pairs.lull.echo && t < pairs.lull.echo + 2.5 ? 0.55 : 1;
    const blinkT = [3.2, 9.0, 13.1, 19.2];
    const blink = blinkT.some((b) => t > b && t < b + 0.13) ? 0.08 : 1;
    for (const s of [-1, 1]) {
      const ex = hx + s * 29 * k, ey = hy - 6 * k, R = 27 * k;
      G.ellipse(ctx, ex, ey, R, R * half * blink, { fill: '#FFC86B', lw: 3, seed: 730 + s, stroke: ink });
      if (half * blink > 0.3) {
        G.ellipse(ctx, ex + look * 7 * k, ey + lookY * 5 * k, 15 * k, 15 * k * half, { fill: '#08060A', lw: 2, seed: 732 + s, stroke: '#08060A' });
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(ex + look * 7 * k - 6 * k, ey - 7 * k * half, 4.5 * k, 0, 7); ctx.fill();
      }
      glow(ctx, ex, ey, 70 * k, '255,190,90', 0.2);
    }
    // рот
    const jaw = t >= ev.jaw ? ease.outBack(r01(t, ev.jaw, ev.jaw + 0.18), 1.4) : 0;
    const o = mouthOpen(t);
    const mw = (9 + 6 * o) * k + jaw * 46 * k, mh = (1.5 + 13 * o) * k + jaw * 78 * k;
    const my = hy + 30 * k + jaw * 30 * k;
    G.ellipse(ctx, hx, my, mw, Math.max(1.5 * k, mh), { fill: '#1A0A12', lw: 2.5, seed: 740, stroke: ink });
    if (jaw > 0.3) { // мелкие зубки по кругу
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2, tx = hx + Math.cos(a) * mw * 0.92, ty = my + Math.sin(a) * mh * 0.92;
        const ix = hx + Math.cos(a) * mw * 0.72, iy = my + Math.sin(a) * mh * 0.72;
        ctx.fillStyle = '#F2EEE4'; ctx.beginPath(); ctx.moveTo(tx + Math.sin(a) * 4 * k, ty - Math.cos(a) * 4 * k); ctx.lineTo(tx - Math.sin(a) * 4 * k, ty + Math.cos(a) * 4 * k); ctx.lineTo(ix, iy); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- лягушка ----------
  function frog(ctx, t) {
    const sac = t >= pairs.frog.src && t < pairs.frog.src + 0.5 ? Math.sin(Math.PI * (t - pairs.frog.src) / 0.5) : 0;
    const ink = '#0A1A10';
    G.ellipse(ctx, FX, FY - 18 * k, 46 * k, 30 * k, { fill: '#4E8A4A', lw: 3, seed: 800, stroke: ink, hatch: { color: 'rgba(10,30,10,0.3)', gap: 7 } });
    if (sac > 0.02) G.ellipse(ctx, FX + 20 * k, FY - 6 * k, 22 * k * sac + 3, 18 * k * sac + 3, { fill: '#D6E3A8', lw: 2, seed: 801, stroke: ink });
    for (const s of [-1, 1]) {
      G.ellipse(ctx, FX + s * 18 * k + 12 * k, FY - 42 * k, 11 * k, 11 * k, { fill: '#4E8A4A', lw: 2.5, seed: 802 + s, stroke: ink });
      ctx.fillStyle = '#0A0A0A'; ctx.beginPath(); ctx.arc(FX + s * 18 * k + 14 * k, FY - 43 * k, 4.5 * k, 0, 7); ctx.fill();
    }
  }
  // ---------- светлячок: пролетает мимо ----------
  function fireflyPos(t) {
    const a = r01(t, pairs.buzz.src - 0.8, pairs.buzz.echo + 1.2);
    if (a <= 0 || a >= 1) return null;
    return [lerp(-0.05 * W, 1.05 * W, a), H * 0.44 + Math.sin(a * 9) * 40 * k];
  }
  function firefly(ctx, t) {
    const p = fireflyPos(t);
    if (!p) return;
    ctx.fillStyle = '#FFE9B0'; ctx.beginPath(); ctx.arc(p[0], p[1], 6 * k, 0, 7); ctx.fill();
    glow(ctx, p[0], p[1], 70 * k, '255,190,90', 0.7);
  }

  function cam(t) {
    if (t < ev.turn) return { x: CX - 40 * k, y: GY - 120 * k, z: 1 + 0.12 * r01(t, 0, ev.turn) };
    return { x: CX, y: GY - 150 * k, z: 2.5 + 0.25 * r01(t, ev.turn, ev.cut) };
  }

  Studio.film({
    async init() { MOUTH = await Studio.loadJSON('out/mouth.json'); },
    draw(ctx, t) {
      const c = cam(t);
      const sh = t >= ev.jaw ? 14 * k * Math.exp(-(t - ev.jaw) * 7) : 0;
      ctx.save();
      // в общем плане точка интереса — в центре кадра; в крупном — лицо чуть ниже центра
      const fy = t < ev.turn ? H * 0.5 : H * 0.52;
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, fy + U.noise1(t * 30, 2) * sh);
      ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
      ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
      // Морзе «ГОЛОСУ»
      const on = S.morseOn(t), wx = W * 0.18, wy = HY + 4 * k - 42 * k;
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 9 * k, wy - 9 * k, 18 * k, 18 * k);
      if (on) glow(ctx, wx, wy, 70 * k, '255,180,90', 0.6);
      glow(ctx, W * 0.78, H * 0.14, 230 * k, '150,170,220', 0.2);
      // далёкая кувшинка из первой серии вспыхивает на нотах колыбельной
      let lp = 0.25;
      for (const n of S.lullSrc) if (t >= n.t) lp = Math.max(lp, 0.25 + 0.6 * Math.exp(-(t - n.t) * 3));
      glow(ctx, W * 0.46, HY + 28 * k, 110 * k, '90,200,210', lp);
      ctx.fillStyle = '#C8F1F1'; ctx.beginPath(); ctx.ellipse(W * 0.46, HY + 28 * k, 9 * k, 4 * k, 0, 0, 7); ctx.fill();
      frog(ctx, t);
      mimic(ctx, t);
      firefly(ctx, t);
      ctx.restore();
      if (t >= ev.breath && t < ev.jaw) { ctx.fillStyle = `rgba(4,6,16,${0.25 * r01(t, ev.breath, ev.breath + 0.3)})`; ctx.fillRect(0, 0, W, H); }
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      Subs.draw(ctx, t, S.subtitles, { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
