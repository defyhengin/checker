// «Мерцалова топь» — эпизод 8 «Фонарница». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const GY = H * 0.63;                           // где Фонарница стоит в воде
  const FX = W * 0.6;
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const BARK = '#141A2C', INK = '#05070F', WARM = '255,200,116', COLD = '170,255,150';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function orb(ctx, x, y, s, a = 1) {
    glow(ctx, x, y, 90 * k * s, WARM, 0.55 * a);
    ctx.fillStyle = `rgba(255,236,190,${a})`; ctx.beginPath(); ctx.arc(x, y, 7 * k * s, 0, 7); ctx.fill();
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



  // ---------- туман: мягкие полосы, плывут ----------
  function fog(ctx, t, a) {
    if (a <= 0.01) return;
    for (let i = 0; i < 9; i++) {
      const y = H * (0.3 + 0.05 * i), x = ((U.hash(i, 700) * W * 1.6 + t * (14 + 8 * U.hash(i, 701)) * k) % (W * 1.6)) - W * 0.3;
      const rx = (360 + 200 * U.hash(i, 702)) * k, ry = (50 + 30 * U.hash(i, 703)) * k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
      g.addColorStop(0, `rgba(170,185,215,${0.16 * a})`); g.addColorStop(1, 'rgba(170,185,215,0)');
      ctx.save(); ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.translate(-x, -y);
      ctx.fillStyle = g; ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2); ctx.restore();
    }
  }

  // ---------- огоньки в тумане: с пальцами, которые видно только когда туман уходит ----------
  function lightPos(L, t) {
    return [L.x * W + Math.sin(t * 0.7 + L.ph) * 10 * k, L.y * H + Math.sin(t * 0.9 + L.ph * 1.3) * 12 * k];
  }
  function lights(ctx, t, fingersA, dim) {
    S.LIGHTS.forEach((L, i) => {
      const [x, y] = lightPos(L, t);
      if (fingersA > 0.01) {
        // длинный суставчатый палец уходит вниз, к воде и дальше — к ней
        const bx = x + (L.x < 0.5 ? -1 : 1) * 160 * k, by = H * 1.05;
        const mx = lerp(x, bx, 0.45) + (L.x < 0.5 ? -60 : 60) * k, my = lerp(y, by, 0.35);
        ctx.save(); ctx.globalAlpha = fingersA;
        G.line(ctx, [[x, y + 6 * k], [mx, my], [bx, by]], { color: '#070A14', lw: 11 * k * L.r, seed: 800 + i });
        G.line(ctx, [[x + 2 * k, y + 8 * k], [mx + 3 * k, my], [bx + 3 * k, by]], { color: 'rgba(150,170,210,0.55)', lw: 2.5 * k, seed: 850 + i });
        for (const f of [0.45, 1]) { const qx = lerp(x, mx, f), qy = lerp(y, my, f); ctx.fillStyle = '#0B1020'; ctx.beginPath(); ctx.arc(qx, qy, 8 * k * L.r, 0, 7); ctx.fill(); }
        ctx.restore();
      }
      orb(ctx, x, y, L.r * 0.8, dim);
      // отражение в воде
      if (y < HY) glow(ctx, x, 2 * HY - y + 40 * k, 50 * k, WARM, 0.12 * dim);
    });
  }

  // ---------- Фонарница ----------
  const SHY = H * 0.37;                           // плечи
  function hand(ctx, wx, wy, dir, curl, t, seedBase, lit) {
    // dir — угол «вверх» ладони; 4 длинных пальца веером, огонёк на кончике каждого
    const tips = [];
    for (let i = 0; i < 4; i++) {
      const spread = (i - 1.5) * 0.32 * (1 - curl * 0.8);
      const ang = dir + spread + Math.sin(t * 1.3 + i) * 0.04;
      const len = 95 * k * (1 - curl * 0.55);
      const jx = wx + Math.cos(ang) * len * 0.55, jy = wy + Math.sin(ang) * len * 0.55;
      const a2 = ang + curl * 1.6 * (i < 2 ? 1 : -1) * 0.6;
      const tx = jx + Math.cos(a2) * len * 0.5, ty = jy + Math.sin(a2) * len * 0.5;
      G.line(ctx, [[wx, wy], [jx, jy], [tx, ty]], { color: BARK, lw: 4.5 * k, seed: seedBase + i });
      tips.push([tx, ty]);
    }
    tips.forEach(([x, y]) => orb(ctx, x, y, 0.9, lit));
    return tips;
  }
  function fonarnitsa(ctx, t, L) {
    const sway = Math.sin(t * 0.6) * 6 * k;
    // тело — как коряга, тонкое, с наростами
    G.poly(ctx, [[FX - 26 * k, GY], [FX - 14 * k + sway * 0.5, SHY + 40 * k], [FX - 30 * k + sway, SHY], [FX + sway, SHY - 20 * k], [FX + 30 * k + sway, SHY],
      [FX + 16 * k + sway * 0.5, SHY + 40 * k], [FX + 24 * k, GY]], { fill: BARK, lw: 3, seed: 900, stroke: INK, hatch: { color: 'rgba(0,0,0,0.35)', gap: 7, angle: 1.2 } });
    G.line(ctx, [[FX + 10 * k, GY - 120 * k], [FX + 44 * k, GY - 170 * k]], { color: BARK, lw: 6 * k, seed: 901 });
    // голова — сучок, склонена
    const hx = FX + sway + 18 * k + L.nod * 20 * k, hy = SHY - 70 * k + L.nod * 14 * k;
    G.line(ctx, [[FX + sway, SHY - 20 * k], [hx, hy + 30 * k]], { color: BARK, lw: 12 * k, seed: 902 });
    G.ellipse(ctx, hx, hy, 30 * k, 40 * k, { fill: BARK, lw: 3, seed: 903, stroke: INK, hatch: { color: 'rgba(0,0,0,0.35)', gap: 6, angle: 0.4 } });
    // два бледных глаза-щёлки, почти не видны
    for (const s of [-1, 1]) { ctx.fillStyle = `rgba(200,215,230,${0.35 + 0.5 * L.eyes})`; ctx.beginPath(); ctx.ellipse(hx + s * 11 * k, hy - 4 * k, 6 * k, 1.8 * k + 3 * k * L.eyes, 0, 0, 7); ctx.fill(); }
    // руки: плечо → локоть → запястье
    const arm = (sx, wx, wy, seed) => {
      const ex = lerp(sx, wx, 0.5) + (wx > sx ? 30 : -30) * k, ey = lerp(SHY, wy, 0.5) - 40 * k;
      G.line(ctx, [[sx, SHY + 4 * k], [ex, ey], [wx, wy]], { color: BARK, lw: 7 * k, seed });
    };
    arm(FX - 26 * k + sway, L.lx, L.ly, 910);
    arm(FX + 26 * k + sway, L.rx, L.ry, 911);
    hand(ctx, L.rx, L.ry, -1.4, 0, t, 930, 1);
    return hand(ctx, L.lx, L.ly, L.ldir, L.curl, t, 920, L.lit);
  }
  // поза по времени
  function pose(t) {
    const reach = sm(t, ev.reach, ev.land), lead = sm(t, ev.lead, ev.close);
    const rest = [FX - 170 * k, SHY + 10 * k];
    const low = [W * 0.34, GY - 150 * k];
    const back = [FX - 60 * k, SHY - 60 * k];
    const lx = lerp(lerp(rest[0], low[0], reach), back[0], lead);
    const ly = lerp(lerp(rest[1], low[1], reach), back[1], lead);
    return {
      lx, ly, ldir: lerp(lerp(-1.9, -1.2, reach), -1.7, lead),
      rx: FX + 160 * k + Math.sin(t * 0.8) * 8 * k, ry: SHY - 40 * k,
      curl: sm(t, ev.close, ev.close + 0.5), lit: 1,
      nod: reach * (1 - lead) - 0.3 * lead,
      eyes: sm(t, ev.breath - 1, ev.breath),
    };
  }

  // ---------- заблудившийся светлячок ----------
  function firefly(ctx, t, tips) {
    if (t < ev.lost - 0.5) return;
    const a = r01(t, ev.lost - 0.5, ev.lost) * (1 - r01(t, ev.close, ev.close + 0.45));
    if (a <= 0) return;
    let x = W * 0.3 + U.noise1(t * 1.4, 11) * 110 * k, y = GY - 90 * k + U.noise1(t * 1.7, 12) * 70 * k;
    const tip = tips[1];
    const p = sm(t, ev.reach + 0.6, ev.land);
    x = lerp(x, tip[0] + 14 * k, p); y = lerp(y, tip[1] - 6 * k, p);
    const flick = 0.75 + 0.25 * Math.sin(t * 9);
    glow(ctx, x, y, 110 * k, COLD, 0.7 * a * flick);
    ctx.fillStyle = `rgba(230,255,215,${a})`; ctx.beginPath(); ctx.arc(x, y, 8 * k, 0, 7); ctx.fill();
  }

  function reeds(ctx, t) {
    for (let i = 0; i < 16; i++) {
      const x = W * 0.16 + i * 16 * k + U.hash(i, 950) * 10 * k, h = (120 + 110 * U.hash(i, 951)) * k, lean = Math.sin(t * 1.1 + i) * 5 * k;
      G.line(ctx, [[x, GY + 10 * k], [x + lean * 0.5, GY + 10 * k - h * 0.5], [x + lean, GY + 10 * k - h]], { color: '#08101F', lw: 5 * k, seed: 960 + i });
      if (i % 4 === 1) G.ellipse(ctx, x + lean, GY + 10 * k - h, 6 * k, 18 * k, { fill: '#2A1F18', lw: 2, seed: 980 + i, stroke: '#08101F' });
    }
  }

  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
    ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 10 * k, wy - 10 * k, 20 * k, 20 * k);
    if (on) glow(ctx, wx, wy, 75 * k, '255,180,90', 0.6);
    glow(ctx, W * 0.8, H * 0.13, 230 * k, '150,170,220', 0.2);
    // кувшинка из 1-й серии вдали
    glow(ctx, W * 0.86, HY + 24 * k, 90 * k, '90,200,210', 0.22 + 0.06 * Math.sin(t * 1.3));
    ctx.fillStyle = '#C8F1F1'; ctx.beginPath(); ctx.ellipse(W * 0.86, HY + 24 * k, 8 * k, 3.5 * k, 0, 0, 7); ctx.fill();
    const rev = sm(t, ev.reveal, ev.breath);
    const dim = t >= ev.breath && t < ev.hit ? 0.35 + 0.65 * (1 - r01(t, ev.breath, ev.breath + 0.4)) : 1;
    lights(ctx, t, rev * 0.9, dim);
    fog(ctx, t, 1 - 0.8 * rev);
    // круги на воде у её ног
    for (let i = 0; i < 2; i++) {
      const age = ((t + i * 2) % 4) / 4;
      ctx.strokeStyle = `rgba(190,210,240,${0.25 * (1 - age)})`; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.ellipse(FX, GY + 4 * k, 40 * k + age * 120 * k, (10 + age * 30) * k, 0, 0, 7); ctx.stroke();
    }
    const tips = fonarnitsa(ctx, t, pose(t));
    reeds(ctx, t);
    firefly(ctx, t, tips);
    fog(ctx, t + 40, 0.6 * (1 - 0.8 * rev));
  }

  // ---------- удар: пальцы с огоньками вплотную ----------
  function closeUp(ctx, t) {
    const p = ease.outCubic(r01(t, ev.hit, ev.hit + 0.12));
    const F = [[0.6, 0.42, 1.2, 1.0], [0.78, 0.34, 1.3, 0.75], [0.42, 0.53, 1.05, 1.2], [0.93, 0.52, 1.35, 1.05]];
    F.forEach(([x, y, bx, by], i) => {
      const tx = lerp(bx, x, p) * W, ty = lerp(by, y, p) * H + Math.sin(t * 2 + i) * 6 * k;
      const P0 = [bx * W, by * H + 260 * k], P1 = [lerp(tx, bx * W, 0.62) + 50 * k, lerp(ty, by * H, 0.6)], P2 = [lerp(tx, bx * W, 0.28) + 20 * k, lerp(ty, by * H, 0.25)], P3 = [tx, ty + 30 * k];
      const segs = [[P0, P1, 44], [P1, P2, 34], [P2, P3, 26]];
      for (const [A, B, w] of segs) G.line(ctx, [A, B], { color: '#090C17', lw: w * k, seed: 990 + i * 3 + w });
      for (const [A, B, w] of segs) G.line(ctx, [[A[0] + w * 0.3 * k, A[1]], [B[0] + w * 0.3 * k, B[1]]], { color: 'rgba(150,170,210,0.45)', lw: 3 * k, seed: 1010 + i * 3 + w });
      for (const [Q, w] of [[P1, 26], [P2, 20]]) G.ellipse(ctx, Q[0], Q[1], w * k, w * 0.8 * k, { fill: '#0C1020', lw: 2, seed: 1030 + i + w, stroke: '#04060C' });
      glow(ctx, tx, ty, 340 * k, WARM, 0.65);
      ctx.fillStyle = '#FFF0CC'; ctx.beginPath(); ctx.arc(tx, ty, 34 * k, 0, 7); ctx.fill();
    });
  }

  // ---------- последний экран: журнал + пять огоньков ладони ----------
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
    // ладонь в темноте: пальцы загораются по одному
    const P = [[-150, 60], [-75, -40], [0, -70], [75, -40], [140, 40]];
    S.PALM.forEach((pt, i) => {
      if (t < pt) return;
      const b = r01(t, pt, pt + 0.08) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
      const x = W / 2 + P[i][0] * k, yy = H * 0.68 + P[i][1] * k;
      ctx.save(); ctx.globalAlpha = 0.5 * b;
      G.line(ctx, [[x, yy + 8 * k], [lerp(x, W / 2, 0.5), yy + 120 * k], [W / 2, H * 0.84]], { color: '#1A2036', lw: 4 * k, seed: 1100 + i });
      ctx.restore();
      orb(ctx, x, yy, 0.8, b);
    });
  }

  Studio.film({
    draw(ctx, t) {
      // камера: подплываем, к «пути» смотрим на камыши, на раскрытии отъезжаем
      const z = 1.5 + 0.15 * sm(t, 0, ev.lost) - 0.15 * sm(t, ev.lead, ev.close) - 0.4 * sm(t, ev.reveal, ev.breath) + (t >= ev.hit ? 0.06 : 0);
      const cx = lerp(lerp(lerp(FX - 30 * k, W * 0.5, sm(t, ev.lost, ev.reach)), W * 0.55, sm(t, ev.lead, ev.close)), W * 0.5, 1);
      const cy = lerp(H * 0.45, H * 0.44, sm(t, ev.reveal, ev.breath));
      const sh = t >= ev.hit ? 14 * k * Math.exp(-(t - ev.hit) * 7) : 0;
      ctx.save();
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.56 + U.noise1(t * 30, 2) * sh); ctx.scale(z, z); ctx.translate(-cx, -cy);
      world(ctx, t);
      ctx.restore();
      if (t >= ev.hit && t < ev.cut) closeUp(ctx, t);
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
