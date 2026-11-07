// «Мерцалова топь» - эпизод 11 «Моховички». Каждый кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#120F18';

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

  // ---------- раскладка мха ----------
  const BANK = H * 0.585;                       // верх моховой кромки
  const HX = W * 0.5, HYm = H * 0.645;          // кочка с моховичками
  const SX = W * 0.22, SY = H * 0.655;          // пень
  const FX = W * 0.78, FY = H * 0.675;          // лягушка
  const MOSS = '#2E5240', MOSS_D = '#1C3A2D', MOSS_L = '#3E6A50';

  function bank(ctx) {
    const pts = [[0, BANK + 20 * k]];
    for (let i = 0; i <= 14; i++) pts.push([(i / 14) * W, BANK + Math.sin(i * 1.9) * 14 * k + (i % 3) * 6 * k]);
    pts.push([W, H * 1.4], [0, H * 1.4]);
    G.poly(ctx, pts, { fill: MOSS_D, lw: 4, seed: 700, stroke: '#0A1A14', hatch: { color: 'rgba(5,20,15,0.35)', gap: 9, angle: -0.5 } });
    for (let i = 0; i < 40; i++) {
      const x = U.hash(i, 710) * W, y = BANK + 40 * k + U.hash(i, 711) * (H * 1.3 - BANK);
      G.ellipse(ctx, x, y, (18 + 30 * U.hash(i, 712)) * k, (8 + 10 * U.hash(i, 713)) * k, { fill: i % 2 ? MOSS : '#25463A', lw: 0, seed: 720 + i });
    }
  }

  // ---------- моховичок ----------
  // o: { grow 0..1 (может перелетать за 1), awake 0..1, yawn 0..1, seed }
  function mush(ctx, x, y, s, t, o) {
    const g = o.grow; if (g <= 0.01) return;
    s *= k;
    const sd = o.seed || 0, sway = Math.sin(t * 1.3 + sd) * 3 * s * (1 - o.awake * 0.8);
    const h = 30 * s * g, tx = x + sway, ty = y - h;
    // ножка
    G.poly(ctx, [[x - 7 * s * g, y], [tx - 6 * s * g, ty + 4 * s], [tx + 6 * s * g, ty + 4 * s], [x + 7 * s * g, y]], { fill: '#E9E0CB', lw: 2.2, seed: 800 + sd, stroke: INK });
    // шляпка
    const cw = 22 * s * g, chh = 14 * s * Math.min(1, g);
    glow(ctx, tx, ty + 4 * s, 30 * s, '90,200,210', 0.08);
    G.ellipse(ctx, tx, ty, cw, chh, { fill: '#C98A6E', lw: 2.5, seed: 810 + sd, stroke: INK, hatch: { color: 'rgba(80,30,20,0.18)', gap: 6, angle: 0.6 } });
    ctx.fillStyle = '#F2D9C6';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(tx + (i - 1) * cw * 0.5, ty - chh * (i === 1 ? 0.45 : 0.15), 2.6 * s * g, 0, 7); ctx.fill(); }
    if (g < 0.4) return;
    // личико на ножке
    const fy = ty + 13 * s, aw = o.awake;
    for (const d of [-1, 1]) {
      const ex = tx + d * 3.6 * s, ey = fy;
      if (aw > 0.5) {
        ctx.fillStyle = '#07060B'; ctx.beginPath(); ctx.ellipse(ex, ey, 2.4 * s, 2.9 * s, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(ex - 0.8 * s, ey - 1 * s, 0.9 * s, 0, 7); ctx.fill();
      } else {
        ctx.strokeStyle = INK; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(ex, ey - 0.6 * s, 2 * s, 0.3, Math.PI - 0.3); ctx.stroke();
      }
    }
    ctx.strokeStyle = INK; ctx.lineWidth = 1.1 * s;
    if (o.yawn > 0.1) { ctx.fillStyle = '#3A1F22'; ctx.beginPath(); ctx.ellipse(tx, fy + 5 * s, 1.8 * s, 2.6 * s * o.yawn, 0, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(tx, fy + 3.5 * s, 2 * s, 0.4, Math.PI - 0.4); ctx.stroke(); }
    // румянец
    ctx.fillStyle = 'rgba(230,140,140,0.35)';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(tx + d * 6.5 * s, fy + 2.5 * s, 2 * s, 1.2 * s, 0, 0, 7); ctx.fill(); }
  }
  const awakeAt = (t) => (t >= ev.hit ? 1 : 0);
  const growPop = (t, t0) => { const p = r01(t, t0 - 0.03, t0 + 0.28); return p <= 0 ? 0 : p >= 1 ? 1 : ease.outBack(p); };

  // ---------- кочка ----------
  const HUM = [[-110, -18, 1.25], [-60, -40, 1.5], [0, -46, 1.7], [58, -38, 1.45], [108, -20, 1.2], [-25, -10, 1.0], [34, -8, 1.05]];
  function hummock(ctx, t) {
    G.ellipse(ctx, HX, HYm, 175 * k, 50 * k, { fill: MOSS, lw: 4, seed: 900, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.4)', gap: 7, angle: -0.6 } });
    HUM.forEach(([dx, dy, s], i) => {
      const yawn = i === 2 ? Math.max(0, Math.sin((t - 3.2) * 2.2)) * (t > 3.2 && t < 4.6 ? 1 : 0) : (i === 4 ? Math.max(0, Math.sin((t - 7.5) * 2.2)) * (t > 7.5 && t < 8.9 ? 1 : 0) : 0);
      mush(ctx, HX + dx * k, HYm + dy * k, s, t, { grow: 1, awake: awakeAt(t), yawn, seed: i });
    });
  }
  // ---------- пень ----------
  const STUMP_M = [[-40, -6, 1.2], [6, -10, 1.45], [44, -4, 1.15]];
  function stump(ctx, t) {
    G.poly(ctx, [[SX - 80 * k, SY], [SX - 74 * k, SY + 90 * k], [SX + 76 * k, SY + 92 * k], [SX + 80 * k, SY]], { fill: '#4A3628', lw: 3.5, seed: 920, stroke: '#140D08', hatch: { color: 'rgba(20,10,5,0.35)', gap: 8, angle: 1.4 } });
    G.ellipse(ctx, SX, SY, 80 * k, 24 * k, { fill: '#8B6A4C', lw: 3, seed: 921, stroke: '#140D08' });
    for (let r = 1; r <= 3; r++) G.ellipse(ctx, SX, SY, 80 * k * r / 4, 24 * k * r / 4, { fill: null, lw: 1.5, seed: 922 + r, stroke: 'rgba(40,25,15,0.6)' });
    S.SPROUT.filter((x) => x.on === 'stump').forEach((sp, i) => {
      const [dx, dy, s] = STUMP_M[i];
      mush(ctx, SX + dx * k, SY + dy * k, s, t, { grow: growPop(t, sp.t), awake: awakeAt(t), yawn: 0, seed: 20 + i });
    });
  }
  // ---------- лягушка (спит) ----------
  const FROG_M = [[-34, -50, 1.0], [0, -60, 1.2], [32, -48, 0.95]];
  function frog(ctx, t) {
    const br = 1 + 0.03 * Math.sin(t * 2.2);
    G.ellipse(ctx, FX, FY + 30 * k, 120 * k, 26 * k, { fill: MOSS, lw: 3, seed: 940, stroke: '#0A1A16' });
    G.ellipse(ctx, FX, FY - 10 * k, 72 * k * br, 48 * k * br, { fill: '#5C8A5A', lw: 3.5, seed: 941, stroke: '#16261A', hatch: { color: 'rgba(20,40,20,0.25)', gap: 8, angle: 0.4 } });
    G.ellipse(ctx, FX - 50 * k, FY + 4 * k, 40 * k, 30 * k, { fill: '#6A9A64', lw: 3, seed: 942, stroke: '#16261A' });
    for (const d of [-1, 1]) {
      const ex = FX - 50 * k + d * 20 * k, ey = FY - 22 * k;
      G.ellipse(ctx, ex, ey, 13 * k, 11 * k, { fill: '#6A9A64', lw: 2.5, seed: 943 + d, stroke: '#16261A' });
      ctx.strokeStyle = '#16261A'; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.arc(ex, ey, 7 * k, 0.3, Math.PI - 0.3); ctx.stroke();
    }
    ctx.strokeStyle = '#16261A'; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.arc(FX - 50 * k, FY + 4 * k, 16 * k, 0.4, Math.PI - 0.4); ctx.stroke();
    S.SPROUT.filter((x) => x.on === 'frog').forEach((sp, i) => {
      const [dx, dy, s] = FROG_M[i];
      mush(ctx, FX + dx * k, FY + dy * k * br, s, t, { grow: growPop(t, sp.t), awake: awakeAt(t), yawn: 0, seed: 40 + i });
    });
  }

  // ---------- холм мха: лежащий человек с вытянутой рукой, рядом штатив ----------
  const MOUND = [];
  {
    const add = (x, y, n, rx, ry, seed) => { for (let i = 0; i < n; i++) { const a = U.hash(i, seed) * 6.28, r = Math.sqrt(U.hash(i, seed + 1)); MOUND.push([x + Math.cos(a) * rx * r, y + Math.sin(a) * ry * r * 0.5 - ry * 0.5, 0.75 + 0.5 * U.hash(i, seed + 2)]); } };
    add(W * 0.17, H * 0.795, 5, 60 * k, 40 * k, 1000);          // голова
    add(W * 0.42, H * 0.815, 14, 190 * k, 44 * k, 1010);        // спина
    add(W * 0.74, H * 0.83, 8, 140 * k, 34 * k, 1020);          // ноги
    add(W * 0.36, H * 0.9, 5, 70 * k, 30 * k, 1030);            // рука
    add(W * 0.6, H * 0.86, 3, 40 * k, 20 * k, 1040);            // камера на штативе
  }
  function mound(ctx, t) {
    // штатив, заросший мхом, чуть завален
    ctx.save(); ctx.translate(0, H * 0.05);
    // штатив упал рядом, заросший мхом
    const cx = W * 0.6, cy = H * 0.875;
    for (const s of [-1, 0, 1]) G.line(ctx, [[cx + 60 * k, cy + 6 * k], [cx + 330 * k, cy + s * 34 * k + 20 * k]], { color: '#1D1C24', lw: 7 * k, seed: 1100 + s });
    G.poly(ctx, [[cx - 60 * k, cy - 30 * k], [cx + 50 * k, cy - 40 * k], [cx + 56 * k, cy + 30 * k], [cx - 56 * k, cy + 36 * k]], { fill: '#26252D', lw: 3, seed: 1110, stroke: '#08080C' });
    G.ellipse(ctx, cx + 66 * k, cy - 4 * k, 18 * k, 26 * k, { fill: '#121118', lw: 3, seed: 1111, stroke: '#08080C' });
    G.ellipse(ctx, cx - 6 * k, cy - 34 * k, 62 * k, 18 * k, { fill: MOSS_L, lw: 2.5, seed: 1112, stroke: '#0A1A14' });
    // тело под мхом
    G.ellipse(ctx, W * 0.17, H * 0.79, 66 * k, 52 * k, { fill: MOSS, lw: 4, seed: 1120, stroke: '#0A1A14', hatch: { color: 'rgba(5,20,15,0.35)', gap: 7, angle: 0.8 } });
    G.poly(ctx, [[W * 0.22, H * 0.83], [W * 0.24, H * 0.785], [W * 0.42, H * 0.77], [W * 0.62, H * 0.785], [W * 0.66, H * 0.835]], { fill: MOSS, lw: 4, seed: 1121, stroke: '#0A1A14', hatch: { color: 'rgba(5,20,15,0.35)', gap: 7, angle: -0.6 } });
    G.poly(ctx, [[W * 0.62, H * 0.835], [W * 0.64, H * 0.8], [W * 0.86, H * 0.81], [W * 0.88, H * 0.845]], { fill: MOSS, lw: 4, seed: 1122, stroke: '#0A1A14', hatch: { color: 'rgba(5,20,15,0.35)', gap: 7, angle: 0.5 } });
    // сапог торчит из мха
    G.poly(ctx, [[W * 0.86, H * 0.82], [W * 0.875, H * 0.775], [W * 0.905, H * 0.77], [W * 0.915, H * 0.79], [W * 0.9, H * 0.83]], { fill: '#2A1E17', lw: 3, seed: 1123, stroke: '#0A0604' });
    G.ellipse(ctx, W * 0.875, H * 0.815, 26 * k, 12 * k, { fill: MOSS_L, lw: 2, seed: 1124, stroke: '#0A1A14' });
    // рука тянется вперёд, к камере
    G.line(ctx, [[W * 0.27, H * 0.8], [W * 0.33, H * 0.86], [W * 0.4, H * 0.915]], { color: MOSS, lw: 46 * k, seed: 1125 });
    G.ellipse(ctx, W * 0.42, H * 0.925, 36 * k, 24 * k, { fill: MOSS, lw: 3, seed: 1126, stroke: '#0A1A14' });
    for (let f = 0; f < 4; f++) G.ellipse(ctx, W * 0.445 + f * 14 * k, H * 0.935 + Math.abs(f - 1.5) * 4 * k, 9 * k, 14 * k, { fill: MOSS_L, lw: 2, seed: 1127 + f, stroke: '#0A1A14' });
    MOUND.forEach(([x, y, s], i) => mush(ctx, x, y, s, t, { grow: 1, awake: awakeAt(t), yawn: 0, seed: 60 + i }));
    ctx.restore();
  }

  // ---------- камера ----------
  function cam(t) {
    const A = [HX, H * 0.585, 2.4 - 0.15 * r01(t, 0, ev.toStump)];
    const B = [SX + 30 * k, H * 0.6, 2.1], C = [FX - 20 * k, H * 0.61, 2.1], D = [W * 0.5, H * 0.72, 1.0];
    const mix = (a, b, p) => a.map((v, i) => lerp(v, b[i], p));
    let c = mix(A, B, sm(t, ev.toStump, ev.toStump + 1.3));
    c = mix(c, C, sm(t, ev.toFrog, ev.toFrog + 1.3));
    c = mix(c, D, ease.inOutCubic(r01(t, ev.reveal, ev.wide)));
    c[2] *= 1 + 0.08 * sm(t, ev.wide, ev.hit);
    return c;
  }

  // ---------- нити грибницы по краям объектива ----------
  function hyphae(ctx, t, p) {
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = 0.7;
    const corners = [[0, H, -0.7], [W, H * 0.12, 2.5], [0, H * 0.3, 0.2], [W, H * 0.92, -2.4]];
    corners.forEach(([x0, y0, a0], c) => {
      for (let b = 0; b < 4; b++) {
        const pts = [[x0, y0]]; let x = x0, y = y0, a = a0 + (b - 1.5) * 0.35;
        const n = Math.floor(2 + 14 * p);
        for (let i = 0; i < n; i++) { a += (U.hash(i, c * 10 + b) - 0.5) * 0.7; x += Math.cos(a) * 22 * k; y += Math.sin(a) * 22 * k; pts.push([x, y]); }
        G.line(ctx, pts, { color: 'rgba(235,232,220,0.75)', lw: 2 * k, seed: 1200 + c * 10 + b });
      }
    });
    ctx.restore();
  }
  // ---------- удар: грибочек на объективе ----------
  function lens(ctx, t) {
    const p = growPop(t, ev.hit);
    ctx.save(); ctx.translate(W * 0.2, H * 1.0); ctx.rotate(0.45);
    mush(ctx, 0, 0, 16, t, { grow: p * 1.05, awake: 1, yawn: 0, seed: 99 });
    ctx.restore();
    ctx.save(); ctx.translate(W * 1.02, H * 0.22); ctx.rotate(-2.2);
    mush(ctx, 0, 0, 7, t, { grow: growPop(t, ev.hit + 0.12), awake: 1, yawn: 0, seed: 98 });
    ctx.restore();
  }

  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
    ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 10 * k, wy - 10 * k, 20 * k, 20 * k);
    if (on) glow(ctx, wx, wy, 75 * k, '255,180,90', 0.6);
    glow(ctx, W * 0.8, H * 0.13, 230 * k, '150,170,220', 0.2);
    for (let i = 0; i < 8; i++) {
      const x = (0.1 + 0.8 * U.hash(i, 3200)) * W + Math.sin(t * 0.8 + i) * 30 * k, y = (0.48 + 0.12 * U.hash(i, 3201)) * H + Math.sin(t * 1.1 + i * 2) * 16 * k;
      const a = (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)) * (t >= ev.gone && t < ev.hit ? 0 : 1);
      glow(ctx, x, y, 36 * k, '255,210,120', 0.4 * a);
    }
    bank(ctx);
    stump(ctx, t); frog(ctx, t); hummock(ctx, t);
    mound(ctx, t);
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
  const END_POS = [[-250, -30, 2.2], [240, -24, 2.0], [0, 110, 2.4]];
  function endCard(ctx, t) {
    const a = r01(t, ev.title + 0.3, ev.title + 0.6) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const sc = Math.round(4 * k), y = H * 0.42 + 210 * k;
    if (t < ev.endCut) {
      const secs = String(2 + Math.floor(t - ev.title)).padStart(2, '0');
      const dot = Math.floor((t - ev.title) * 2) % 2 === 0 ? '●' : ' ';
      pixelText(ctx, `${dot} REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
    } else if (Math.floor(t * 6) % 7 !== 0) {
      pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
    }
    S.END_SPROUT.forEach((t0, i) => {
      const [dx, dy, s] = END_POS[i];
      mush(ctx, W / 2 + dx * k, y + dy * k + 20 * k, s, t, { grow: growPop(t, t0), awake: t >= ev.endCut ? 1 : 0, yawn: 0, seed: 120 + i });
    });
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      const [cx, cy, z] = cam(t);
      const sh = t >= ev.hit ? 14 * k * Math.exp(-(t - ev.hit) * 7) : 0;
      ctx.save();
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.56 + U.noise1(t * 30, 2) * sh); ctx.scale(z, z); ctx.translate(-cx, -cy);
      world(ctx, t);
      ctx.restore();
      if (t < ev.cut) hyphae(ctx, t, t < ev.hit ? r01(t, ev.gone, ev.hit) : 1);
      if (t >= ev.hit && t < ev.cut) lens(ctx, t);
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
