// «Мерцалова топь» - эпизод 16 «Тёплышка». Каждый кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.5);
  const BAR = 4 * S.BEAT;
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const bump = (t, a, b, c) => sm(t, a, b) * (1 - sm(t, b, c));
  const WARM = '255,200,116';

  // ---------- тепловая палитра ----------
  const STOPS = [[0, [6, 8, 30]], [0.22, [22, 30, 96]], [0.42, [84, 38, 140]], [0.58, [196, 52, 104]], [0.72, [240, 120, 42]], [0.86, [255, 200, 70]], [1, [255, 250, 226]]];
  function heatRGB(v) {
    v = clamp(v);
    for (let i = 1; i < STOPS.length; i++) {
      const [b, cb] = STOPS[i], [a, ca] = STOPS[i - 1];
      if (v <= b) { const p = (v - a) / (b - a); return ca.map((c, j) => Math.round(lerp(c, cb[j], p))); }
    }
    return STOPS[STOPS.length - 1][1];
  }
  const heat = (v, a = 1) => { const [r, g, b] = heatRGB(v); return a >= 1 ? `rgb(${r},${g},${b})` : `rgba(${r},${g},${b},${a})`; };
  let MODE = 'n';                                   // 'n' - обычный вид, 'h' - тепловое зрение
  const C = (n, h) => (MODE === 'h' ? heat(h) : n);
  const HATCH = () => (MODE === 'h' ? { color: 'rgba(0,0,0,0.16)', gap: 7, angle: 0.5 } : { color: 'rgba(0,0,0,0.22)', gap: 6, angle: 0.5 });

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const hglow = (ctx, x, y, r, v, a) => glow(ctx, x, y, r, heatRGB(v).join(','), a);
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };

  // ---------- мир ----------
  const J = { x: W * 0.47, y: H * 0.40, s: 1.25 * k };          // крючок, на котором висит куртка
  const jw = (lx, ly) => ({ x: J.x + lx * J.s, y: J.y + ly * J.s });
  const FROG_L = { x: 196, y: 372 };                             // лягушка на кувшинке (в координатах куртки)
  const FROG = jw(FROG_L.x, FROG_L.y);
  const FF = { x: W * 0.88, y: H * 0.505 };                     // светлячок-наблюдатель у камыша
  const BOOTH = { x: W * 0.27, b: HY + 4 * k, q: 1.3 * k };

  function spruce(ctx, x, base, h, fill, seed, stroke) {
    const pts = []; const wd = h * 0.3;
    for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
    const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
    G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke });
  }

  function sceneryFor(mode) {
    return (ctx) => {
      const prev = MODE; MODE = mode;
      const h = mode === 'h';
      const g = ctx.createLinearGradient(0, 0, 0, HY);
      g.addColorStop(0, h ? heat(0.0) : '#0B1030'); g.addColorStop(1, h ? heat(0.1) : '#25325C');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
      if (!h) {
        for (let i = 0; i < 80; i++) {
          const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.9, r = (0.8 + U.hash(i, 3) * 1.8) * k;
          ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
        }
        G.ellipse(ctx, W * 0.16, H * 0.31, 44 * k, 44 * k, { fill: '#EFF2E6', lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
      } else {
        G.ellipse(ctx, W * 0.16, H * 0.31, 44 * k, 44 * k, { fill: heat(0.06), lw: 2, seed: 2, stroke: heat(0.14) });
      }
      for (let i = 0; i < 14; i++) spruce(ctx, U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.08 + 0.05 * U.hash(i, 15)) * H, C('#1A2547', 0.17), 30 + i, C('#070B1C', 0.04));
      for (let i = 0; i < 12; i++) spruce(ctx, U.hash(i, 16) * W * 1.1 - W * 0.05, HY + 6 * k, (0.05 + 0.04 * U.hash(i, 17)) * H, C('#121B38', 0.13), 60 + i, C('#05070F', 0.03));
      // будка
      const { x: hx, b: hb, q } = BOOTH;
      G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: C('#0E1428', 0.12), lw: 3, seed: 90, stroke: C('#05070F', 0.03) });
      ctx.fillStyle = C('#1A1610', 0.1); ctx.fillRect(hx - 9 * q, hb - 50 * q, 18 * q, 16 * q);
      if (h) { // в окне кто-то тёплый, с ушками
        ctx.fillStyle = heat(0.44);
        ctx.beginPath(); ctx.ellipse(hx, hb - 39 * q, 4.5 * q, 5 * q, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx - 3.5 * q, hb - 46 * q, 1.4 * q, 3 * q, -0.3, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(hx + 3.5 * q, hb - 46 * q, 1.4 * q, 3 * q, 0.3, 0, 7); ctx.fill();
      }
      const wg = ctx.createLinearGradient(0, HY, 0, H);
      wg.addColorStop(0, h ? heat(0.08) : '#16224A'); wg.addColorStop(1, h ? heat(0.0) : '#060A18');
      ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
      if (!h) for (let i = 0; i < 9; i++) { const y = HY + 20 * k + i * 22 * k, w = (70 - i * 5) * k; ctx.fillStyle = `rgba(230,236,220,${0.16 - i * 0.012})`; ctx.fillRect(W * 0.16 - w / 2 + Math.sin(i * 2.1) * 10 * k, y, w, 3 * k); }
      for (let i = 0; i < 16; i++) { const y = HY + 30 * k + i * 44 * k; ctx.strokeStyle = h ? heat(0.12, 0.5) : 'rgba(120,150,220,0.08)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(W * U.hash(i, 40), y); ctx.lineTo(W * U.hash(i, 40) + 160 * k, y); ctx.stroke(); }
      for (let i = 0; i < 18; i++) {
        const x = U.hash(i, 53) * W, hh = (0.04 + 0.05 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * hh;
        G.line(ctx, [[x, HY + 12 * k], [x + lean * 0.5, HY + 12 * k - hh * 0.5], [x + lean, HY + 12 * k - hh]], { color: C('#0A1124', 0.1), lw: 5 * k, seed: 300 + i });
        if (i % 3 === 0) G.ellipse(ctx, x + lean, HY + 12 * k - hh, 5 * k, 14 * k, { fill: C('#3A2A1E', 0.16), lw: 1.5, seed: 330 + i, stroke: C('#0A0806', 0.05) });
      }
      for (const [x, y, r, sd] of [[0.12, 0.62, 56, 1], [0.86, 0.74, 66, 2], [0.18, 0.86, 70, 3], [0.9, 0.88, 60, 4], [0.4, 0.56, 40, 5]]) {
        G.ellipse(ctx, W * x, H * y, r * k, r * 0.32 * k, { fill: C('#1E4A47', 0.24), lw: 3, seed: 500 + sd, stroke: C('#0A1A16', 0.08), hatch: HATCH() });
      }
      // камыш, на котором сидит светлячок
      G.line(ctx, [[FF.x + 4 * k, FF.y + 120 * k], [FF.x + 2 * k, FF.y + 50 * k], [FF.x - 2 * k, FF.y + 10 * k]], { color: C('#16302C', 0.14), lw: 6 * k, seed: 830 });
      G.ellipse(ctx, FF.x - 3 * k, FF.y + 2 * k, 6 * k, 16 * k, { fill: C('#3A2A1E', 0.16), lw: 1.5, seed: 831, stroke: C('#0A0806', 0.05) });
      // коряга с веткой, на которой висит куртка
      const trunkX = J.x + 280 * J.s;
      G.poly(ctx, [[trunkX - 22 * k, H * 0.66], [trunkX - 14 * k, J.y - 120 * k], [trunkX - 2 * k, J.y - 160 * k], [trunkX + 8 * k, J.y - 110 * k], [trunkX + 24 * k, H * 0.66]], { fill: C('#231B14', 0.18), lw: 3, seed: 700, stroke: C('#0A0705', 0.05), hatch: HATCH() });
      G.line(ctx, [[trunkX - 10 * k, J.y - 30 * k], [J.x + 120 * J.s, J.y - 22 * J.s], [J.x, J.y - 16 * J.s], [J.x - 90 * J.s, J.y - 4 * J.s]], { color: C('#231B14', 0.18), lw: 14 * k, seed: 701 });
      G.line(ctx, [[J.x - 60 * J.s, J.y - 10 * J.s], [J.x - 100 * J.s, J.y - 46 * J.s]], { color: C('#231B14', 0.18), lw: 7 * k, seed: 702 });
      // кувшинка для лягушки
      G.ellipse(ctx, FROG.x, FROG.y + 12 * k, 62 * k, 17 * k, { fill: C('#2A5A48', 0.2), lw: 2.5, seed: 720, stroke: C('#0A1A16', 0.06) });
      ctx.strokeStyle = C('rgba(160,190,240,0.25)', 0.14); ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.ellipse(FROG.x, FROG.y + 24 * k, 90 * k, 9 * k, 0, 0, Math.PI); ctx.stroke();
      MODE = prev;
    };
  }

  // ---------- куртка ----------
  const OLIVE = '#3D4C35', OLIVE_D = '#2C3A2A', LINING = '#07090A', INK = '#0C120B';
  function sleevePath(ctx, a, c, b) { ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(c.x, c.y, b.x, b.y); }
  function sleeve(ctx, a, c, b, h, seed) {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    sleevePath(ctx, a, c, b); ctx.strokeStyle = C(INK, 0.04 + h * 0.3); ctx.lineWidth = 46; ctx.stroke();
    sleevePath(ctx, a, c, b); ctx.strokeStyle = C(OLIVE, h); ctx.lineWidth = 39; ctx.stroke();
    // складки
    ctx.strokeStyle = MODE === 'h' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      const p = i / 5, x = (1 - p) * (1 - p) * a.x + 2 * p * (1 - p) * c.x + p * p * b.x, y = (1 - p) * (1 - p) * a.y + 2 * p * (1 - p) * c.y + p * p * b.y;
      ctx.beginPath(); ctx.moveTo(x - 14, y - 3 + (U.hash(i, seed) - 0.5) * 6); ctx.lineTo(x + 10, y + 4); ctx.stroke();
    }
    // манжета и тёмный вход в рукав
    const tx = b.x - c.x, ty = b.y - c.y, ang = Math.atan2(ty, tx);
    ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = C(OLIVE_D, h * 0.95); ctx.fillRect(-21, -12, 42, 12);
    ctx.fillStyle = C(LINING, 0.03); ctx.beginPath(); ctx.ellipse(0, 1, 17, 7, 0, 0, 7); ctx.fill();
    ctx.restore();
  }

  // o: { b, hood: {dy, rot, open}, ls, rs, h (тепло), pocket, wrap }
  function jacket(ctx, t, o) {
    const h = o.h || 0;
    ctx.save(); ctx.translate(J.x, J.y); ctx.scale(J.s, J.s);
    const b = o.b;
    // левый рукав (с биркой) - позади тела у плеча
    const shL = { x: -96, y: 108 }, shR = { x: 96, y: 108 };
    const ls = o.ls, rs = o.rs;
    sleeve(ctx, shL, ls.c, ls.p, h * 0.97, 11);
    // тело дышит
    ctx.save(); ctx.translate(0, 200); ctx.scale(1 + 0.045 * b, 1 + 0.015 * b); ctx.translate(0, -200);
    G.poly(ctx, [[-62, 84], [62, 84], [104, 104], [98, 302], [-98, 302], [-104, 104]], { fill: C(OLIVE, h), lw: 3.5, seed: 600, stroke: C(INK, 0.04 + h * 0.3), hatch: HATCH() });
    G.poly(ctx, [[-98, 284], [98, 284], [98, 302], [-98, 302]], { fill: C(OLIVE_D, h * 0.95), lw: 2, seed: 601, stroke: C(INK, 0.04 + h * 0.3) });
    G.line(ctx, [[0, 92], [1, 200], [0, 300]], { color: C(INK, 0.04 + h * 0.3), lw: 2.5, seed: 602 });
    // пуговицы (вторая оторвана - торчат нитки)
    for (const by of [140, 230, 272]) {
      G.ellipse(ctx, -8, by, 7.5, 7.5, { fill: C('#33452F', h * 0.9), lw: 1.5, seed: 610 + by, stroke: C(INK, 0.04) });
      for (const [dx, dy] of [[-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [2.4, 2.4]]) dot(ctx, -8 + dx, by + dy, 1, C('#0A0F09', 0.05));
    }
    ctx.strokeStyle = C('#C9C2A8', h * 0.8); ctx.lineWidth = 1.6;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8, 185); ctx.quadraticCurveTo(-4 + i * 3, 190, -6 + i * 4, 197 + i * 2); ctx.stroke(); }
    dot(ctx, -8, 185, 2, C('#C9C2A8', h * 0.8));
    // нагрудный карман с ручкой
    G.poly(ctx, [[30, 126], [84, 126], [82, 176], [32, 176]], { fill: C(OLIVE_D, h * 0.93), lw: 2, seed: 620, stroke: C(INK, 0.04 + h * 0.3) });
    // ручка торчит из кармана
    const lift = o.pocket || 0;
    ctx.fillStyle = C('#1A2A5A', 0.12 + h * 0.2); ctx.fillRect(64, 106 - lift * 6, 9, 26);
    ctx.fillStyle = C('#C8CED8', 0.14 + h * 0.2); ctx.fillRect(71, 109 - lift * 6, 3, 22);
    ctx.save(); ctx.translate(28, 124); ctx.rotate(-0.35 * lift);
    G.poly(ctx, [[0, 0], [58, 0], [56, 16], [2, 16]], { fill: C(OLIVE, h), lw: 2, seed: 621, stroke: C(INK, 0.04 + h * 0.3) });
    dot(ctx, 29, 10, 3, C('#33452F', h * 0.9));
    ctx.restore();
    ctx.restore();
    // правый рукав - тот, что обнимает
    sleeve(ctx, shR, rs.c, rs.p, h * 0.98, 12);
    if (o.wrap > 0.01) { // завиток рукава вокруг лягушки
      const p = o.wrap;
      ctx.strokeStyle = C(INK, 0.04 + h * 0.3); ctx.lineWidth = 46; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(FROG_L.x, FROG_L.y - 12, 34, -Math.PI * 0.15, -Math.PI * 0.15 + Math.PI * 1.1 * p); ctx.stroke();
      ctx.strokeStyle = C(OLIVE, h * 0.98); ctx.lineWidth = 39;
      ctx.beginPath(); ctx.arc(FROG_L.x, FROG_L.y - 12, 34, -Math.PI * 0.15, -Math.PI * 0.15 + Math.PI * 1.1 * p); ctx.stroke();
    }
    // пустой ремешок часов на правой манжете (когда рукав висит)
    if (!o.wrap || o.wrap < 0.01) {
      const ang = Math.atan2(rs.p.y - rs.c.y, rs.p.x - rs.c.x);
      ctx.save(); ctx.translate(rs.p.x - Math.cos(ang) * 30, rs.p.y - Math.sin(ang) * 30); ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = C('#4A3426', h * 0.6); ctx.fillRect(-22, -4, 44, 8);
      ctx.restore();
    }
    // бирка «НАЙДЕНО» на левой манжете
    if (MODE === 'n') {
      const cx = ls.p.x - 6, cy = ls.p.y + 6;
      const sw = Math.sin(t * 1.3) * 0.08;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.12 + sw);
      ctx.strokeStyle = '#B9AE90'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, 18, -2, 34); ctx.stroke();
      G.poly(ctx, [[-44, 34], [36, 34], [44, 50], [36, 66], [-44, 66]], { fill: '#E9DFC6', lw: 2, seed: 640, stroke: '#4A3E2C' });
      dot(ctx, 33, 50, 3.5, '#2A2218');
      G.text(ctx, 'НАЙДЕНО', -4, 59, { size: 21, align: 'center', color: '#2A2018', boil: 0.4 });
      ctx.restore();
    }
    // петля капюшона на ветке
    const hd = o.hood;
    ctx.strokeStyle = C('#2A2A22', 0.1 + h * 0.3); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-5, -16); ctx.quadraticCurveTo(0, -24, 5, -16); ctx.lineTo(0, -4 + hd.dy); ctx.closePath(); ctx.stroke();
    // капюшон
    ctx.save(); ctx.translate(0, 86 + hd.dy); ctx.rotate(hd.rot); ctx.translate(0, -86);
    G.ellipse(ctx, 0, 44, 58, 52, { fill: C(OLIVE, h * 0.96), lw: 3.5, seed: 650, stroke: C(INK, 0.04 + h * 0.3), hatch: HATCH() });
    // дырки на макушке - будто что-то прорвало ушами
    for (const d of [-1, 1]) {
      G.poly(ctx, [[d * 20, -3], [d * 24, -9], [d * 28, -5], [d * 31, -9], [d * 32, -1], [d * 25, 3]], { fill: C(LINING, 0.03), lw: 1.5, seed: 655 + d, stroke: C('#1A2016', 0.06) });
      ctx.strokeStyle = C('#5A6A4E', h * 0.7); ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(d * (22 + i * 4), 2 + i); ctx.lineTo(d * (21 + i * 4), 7 + i); ctx.stroke(); }
    }
    const op = hd.open;
    G.ellipse(ctx, 0, 54 + (1 - op) * 30, 40 * lerp(0.62, 1, op), 36 * lerp(0.2, 1, op), { fill: C(LINING, 0.02), lw: 2.5, seed: 660, stroke: C(OLIVE_D, h * 0.9) });
    ctx.restore();
    ctx.restore();
  }

  function frog(ctx, t, hv, shiver) {
    const jx = shiver > 0 ? Math.sin(t * 60) * 2.2 * k * shiver : 0;
    const x = FROG.x + jx, y = FROG.y, s = 1.1 * k;
    const body = C('#5E8A4A', hv), belly = C('#C9D49A', hv + 0.04), ink = C('#13200E', 0.03);
    G.ellipse(ctx, x, y - 2 * s, 30 * s, 22 * s, { fill: body, lw: 2.5, seed: 730, stroke: ink, hatch: HATCH() });
    G.ellipse(ctx, x, y + 4 * s, 18 * s, 11 * s, { fill: belly, lw: 1.5, seed: 731, stroke: ink });
    for (const d of [-1, 1]) {
      G.ellipse(ctx, x + d * 15 * s, y - 20 * s, 9.5 * s, 9 * s, { fill: body, lw: 2, seed: 732 + d, stroke: ink });
      dot(ctx, x + d * 15 * s, y - 20 * s, 4.2 * s, MODE === 'h' ? heat(Math.max(0, hv - 0.2)) : '#0A0A08');
      if (MODE === 'n') dot(ctx, x + d * 15 * s - 1.4 * s, y - 21.5 * s, 1.4 * s, '#FFFFFF');
      G.ellipse(ctx, x + d * 24 * s, y + 14 * s, 9 * s, 4.5 * s, { fill: body, lw: 1.5, seed: 735 + d, stroke: ink });
    }
    ctx.strokeStyle = ink; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.arc(x, y - 6 * s, 7 * s, 0.4, Math.PI - 0.4); ctx.stroke();
    if (MODE === 'h') hglow(ctx, x, y - 4 * s, 70 * k, hv, 0.35 * clamp((hv - 0.3) * 2));
  }

  function firefly(ctx, t) {
    const x = FF.x + Math.sin(t * 0.9) * 3 * k, y = FF.y - 6 * k + Math.sin(t * 1.4) * 2 * k;
    if (MODE === 'n') {
      glow(ctx, x, y, 30 * k, WARM, 0.55 + 0.15 * Math.sin(t * 2.2));
      dot(ctx, x, y, 3.2 * k, 'rgba(255,236,170,0.95)');
      return;
    }
    const on = t >= S.FLY[0][0] && S.flyOn(t);
    if (on) { hglow(ctx, x, y, 46 * k, 0.95, 0.9); dot(ctx, x, y, 5 * k, heat(1)); }
    else dot(ctx, x, y, 3.2 * k, heat(0.3));
  }

  // ---------- позы ----------
  const mixP = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
  function pose(t) {
    const b = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t - S.clock.OFFSET) / BAR);
    const hood = { dy: 0, rot: 0, open: 0.1 };
    // грустно поникает
    const sad = sm(t, ev.sad, ev.sad + 0.8) * (1 - sm(t, ev.sniff, ev.sniff + 0.8));
    hood.dy += 8 * sad; hood.rot += 0.12 * sad; hood.open -= 0.1 * sad;
    // поднимается и принюхивается
    const sn = sm(t, ev.sniff, ev.sniff + 0.8) * (1 - sm(t, ev.thermal + 1.5, ev.thermal + 3));
    hood.dy -= 12 * sn;
    hood.rot += sn * (0.16 * Math.sin((t - ev.sniff) * 1.4) + 0.05 * Math.sin((t - ev.sniff) * 13) * bump(t, ev.sniff + 1.1, ev.sniff + 1.3, ev.sniff + 2.1));
    hood.open += 0.12 * sn;
    // поворачивается к камере
    const lk = sm(t, ev.look, ev.look + 2.2);
    hood.rot = lerp(hood.rot, 0, lk); hood.dy = lerp(hood.dy, -6, lk); hood.open = lerp(hood.open, 1, lk);
    // рукава
    let ls = { p: { x: -126, y: 300 }, c: { x: -122, y: 200 } };
    let rs = { p: { x: 126, y: 300 }, c: { x: 122, y: 200 } };
    ls.p.x += Math.sin(t * 0.8) * 3; rs.p.x += Math.sin(t * 0.8 + 1) * 3;
    // «Очень добрая» - правый рукав машет
    const wv = bump(t, 2.9, 3.3, 4.2);
    rs = { p: mixP(rs.p, { x: 170 + Math.sin(t * 9) * 12, y: 150 }, wv), c: mixP(rs.c, { x: 170, y: 220 }, wv) };
    // обнимает лягушку
    const reach = sm(t, ev.wrap, ev.wrap + 0.9) * (1 - sm(t, ev.release, ev.release + 0.9));
    const tgt = { p: { x: FROG_L.x - 20, y: FROG_L.y - 40 }, c: { x: 200, y: 200 } };
    rs = { p: mixP(rs.p, tgt.p, reach), c: mixP(rs.c, tgt.c, reach) };
    const wrap = sm(t, ev.wrap + 0.6, ev.wrap + 1.3) * (1 - sm(t, ev.release - 0.2, ev.release + 0.3));
    const pocket = bump(t, ev.pocket - 0.25, ev.pocket, ev.pocket + 0.9);
    return { b, hood, ls, rs, wrap, pocket };
  }

  // тепло
  const jacketHeat = (t) => 0.7 + 0.025 * Math.sin(2 * Math.PI * (t - S.clock.OFFSET) / BAR) + 0.08 * sm(t, ev.drain0, ev.frogOut) + 0.08 * sm(t, ev.good, ev.good + 1.5) + 0.04 * sm(t, ev.gone, ev.whip);
  const frogHeat = (t) => lerp(0.6, 0.1, ease.inOutQuad(r01(t, ev.drain0, ev.frogOut))) + 0.04 * Math.sin(t * 7) * (1 - r01(t, ev.drain0, ev.frogOut));

  function world(ctx, t) {
    MODE = t >= ev.thermal ? 'h' : 'n';
    ctx.drawImage(Studio.cache(MODE === 'h' ? 'scnH' : 'scn', sceneryFor(MODE)), 0, 0, W, H);
    const po = pose(t);
    const hv = MODE === 'h' ? jacketHeat(t) : 0;
    const fv = MODE === 'h' ? frogHeat(t) : 0.5;
    const shiver = bump(t, ev.shiver - 0.2, ev.shiver + 0.3, ev.wrap + 1.2) * (1 - r01(t, ev.drain0, ev.drain0 + 0.4));
    if (MODE === 'h') hglow(ctx, J.x, J.y + 190 * J.s, 330 * k, hv, 0.28 + 0.1 * po.b);
    jacket(ctx, t, { ...po, h: hv });
    frog(ctx, t, fv, shiver);
    if (MODE === 'n' && t > ev.pocket - 0.05 && t < ev.pocket + 0.5) { const p = jw(68, 104); glow(ctx, p.x, p.y, 60 * k, '255,255,240', 0.8 * (1 - r01(t, ev.pocket, ev.pocket + 0.5))); }
    if (MODE === 'h' && t >= ev.frogOut && t < ev.frogOut + 0.4) hglow(ctx, FROG.x, FROG.y - 4 * k, 80 * k, 0.5, 0.4 * (1 - r01(t, ev.frogOut, ev.frogOut + 0.4)));
    firefly(ctx, t);
    // в тишине темнеет всё, кроме куртки
    if (t >= ev.gone) {
      ctx.fillStyle = `rgba(2,3,12,${0.55 * r01(t, ev.gone, ev.gone + 0.9)})`; ctx.fillRect(-W, -H, W * 3, H * 3);
      jacket(ctx, t, { ...po, h: hv });
    }
    MODE = 'n';
  }

  // камера [x, y, зум]
  function cam(t) {
    const A = [J.x + 20 * k, J.y + 170 * J.s, 1.55];
    const A2 = [J.x + 10 * k, J.y + 160 * J.s, 1.75];
    const B = [J.x - 8 * J.s, J.y + 186 * J.s, 3.0];
    const Cc = [J.x + 50 * J.s, J.y + 146 * J.s, 3.0];
    const D = [W * 0.5, H * 0.55, 1.0];
    const E = [J.x, J.y + 90 * J.s, 1.9];
    const F = [J.x + 70 * J.s, J.y + 230 * J.s, 1.3];
    const Gg = [J.x + 190 * J.s, J.y + 300 * J.s, 1.6];
    const Hh = [J.x + 30 * J.s, J.y + 170 * J.s, 1.5];
    const I = [J.x, J.y + 60 * J.s, 3.4];
    const mx = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
    let c = mx(A, A2, sm(t, 0, ev.btn - 0.4));
    c = mx(c, B, sm(t, ev.btn - 0.4, ev.btn + 0.5));
    c = mx(c, Cc, sm(t, ev.pocket - 0.9, ev.pocket - 0.3));
    c = mx(c, D, sm(t, ev.empty - 0.2, ev.empty + 1.2));
    c = mx(c, E, sm(t, ev.sniff - 0.3, ev.sniff + 0.9));
    c = mx(c, F, sm(t, ev.thermal - 0.05, ev.thermal + 0.05));
    c = mx(c, Gg, sm(t, ev.shiver - 0.6, ev.shiver + 0.6));
    c = mx(c, Hh, sm(t, ev.release, ev.good + 0.6));
    c = mx(c, I, ease.inQuad(r01(t, ev.look, ev.whip)));
    return c;
  }

  function drawWorld(ctx, t) {
    const [cx, cy, z] = cam(t);
    ctx.save();
    ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cx, -cy);
    world(ctx, t);
    ctx.restore();
    if (t >= ev.thermal) thermalFx(ctx, t, t < ev.thermal + 0.35 ? 1 - r01(t, ev.thermal, ev.thermal + 0.35) : 0);
  }
  // строки развёртки и вспышка включения
  function thermalFx(ctx, t, flash) {
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    const off = Math.floor(t * 30) % 4;
    for (let y = off * k; y < H; y += 4 * k) ctx.fillRect(0, y, W, 1.4 * k);
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,240,210,${0.7 * flash})`; ctx.fillRect(0, 0, W, H);
      const yy = H * (1 - flash); ctx.fillStyle = `rgba(255,250,230,${flash})`; ctx.fillRect(0, yy, W, 6 * k);
    }
  }

  // ---------- с той стороны экрана ----------
  const PADS = [{ x: W * 0.22, y: H * 0.6, rot: 0.35 }, { x: W * 0.78, y: H * 0.58, rot: -0.35 }];
  // подушечка пальца, прижатая к стеклу снаружи: тёплое пятно с узором отпечатка
  function fingerPad(ctx, x, y, rot, v, seed, blurBody = true) {
    // сам палец за стеклом - не в фокусе, уходит за край экрана
    if (blurBody) {
      ctx.save(); ctx.filter = `blur(${Math.round(8 * k)}px)`; ctx.globalAlpha = 0.85;
      const ex = x < W / 2 ? -80 * k : W + 80 * k;
      ctx.strokeStyle = heat(v - 0.16); ctx.lineCap = 'round';
      ctx.lineWidth = 240 * k; ctx.beginPath(); ctx.moveTo(ex, y + 330 * k); ctx.lineTo(lerp(ex, x, 0.45), lerp(y + 330 * k, y, 0.45)); ctx.stroke();
      ctx.lineWidth = 200 * k; ctx.beginPath(); ctx.moveTo(ex, y + 330 * k); ctx.lineTo(x, y + 10 * k); ctx.stroke();
      ctx.strokeStyle = heat(v - 0.3); ctx.lineWidth = 6 * k; const mx = lerp(ex, x, 0.55), my = lerp(y + 330 * k, y, 0.55); ctx.beginPath(); ctx.moveTo(mx - 70 * k, my - 40 * k); ctx.quadraticCurveTo(mx, my + 10 * k, mx + 70 * k, my + 40 * k); ctx.stroke();
      ctx.restore();
    }
    hglow(ctx, x, y, 260 * k, v, 0.45);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const rx = 100 * k, ry = 122 * k;
    const g = ctx.createRadialGradient(0, -10 * k, 0, 0, 0, ry);
    g.addColorStop(0, heat(v)); g.addColorStop(0.7, heat(v - 0.1)); g.addColorStop(1, heat(v - 0.3, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx * 1.12, ry * 1.12, 0, 0, 7); ctx.fill();
    // узор: завиток из неровных колец
    ctx.strokeStyle = heat(v - 0.2, 0.7); ctx.lineWidth = 3.2 * k;
    for (let r = 1; r <= 9; r++) {
      const f = r / 9;
      ctx.beginPath();
      for (let i = 0; i <= 40; i++) {
        const q = (i / 40) * Math.PI * 2;
        const wob = 1 + 0.06 * Math.sin(q * 3 + r + seed) + 0.04 * Math.sin(q * 5 - r * 0.7);
        const px = Math.cos(q) * rx * f * wob, py = Math.sin(q) * ry * f * wob * (1 - 0.12 * f) - (1 - f) * 14 * k;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      if (r === 9) ctx.stroke(); else { ctx.stroke(); }
    }
    ctx.restore();
  }
  // блики и разводы на стекле
  function glass(ctx) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) {
      const x0 = W * (0.1 + i * 0.32);
      const gr = ctx.createLinearGradient(x0, 0, x0 + 160 * k, 0);
      gr.addColorStop(0, 'rgba(150,170,255,0)'); gr.addColorStop(0.5, 'rgba(150,170,255,0.035)'); gr.addColorStop(1, 'rgba(150,170,255,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + 160 * k, 0); ctx.lineTo(x0 - 240 * k, H); ctx.lineTo(x0 - 400 * k, H); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    for (let i = 0; i < 9; i++) { // старые отпечатки-разводы
      const x = U.hash(i, 61) * W, y = (0.3 + 0.6 * U.hash(i, 62)) * H;
      ctx.strokeStyle = 'rgba(140,150,220,0.05)'; ctx.lineWidth = 2 * k;
      for (let r = 1; r < 5; r++) { ctx.beginPath(); ctx.ellipse(x, y, r * 10 * k, r * 12 * k, U.hash(i, 63), 0, 7); ctx.stroke(); }
    }
  }
  // маленькая холодная лапка, прижатая к стеклу изнутри: подушечки и коготки
  function pawPress(ctx, x, y, s, a) {
    ctx.save(); ctx.globalAlpha = a;
    G.ellipse(ctx, x, y + 20 * s, 34 * s, 28 * s, { fill: heat(0.13), lw: 2.5, seed: 796, stroke: heat(0.3) });
    for (let i = 0; i < 4; i++) {
      const q = -Math.PI / 2 + (i - 1.5) * 0.5, bx = x + Math.cos(q) * 46 * s, by = y + 14 * s + Math.sin(q) * 44 * s;
      G.ellipse(ctx, bx, by, 12 * s, 14 * s, { fill: heat(0.13), lw: 2, seed: 797 + i, stroke: heat(0.3) });
      ctx.strokeStyle = heat(0.36); ctx.lineWidth = 2.5 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(bx + Math.cos(q) * 12 * s, by + Math.sin(q) * 14 * s); ctx.lineTo(bx + Math.cos(q) * 22 * s, by + Math.sin(q) * 24 * s); ctx.stroke();
    }
    ctx.restore();
  }
  // интерфейс ролика - зеркально, как видно с той стороны экрана; фронтальная камера сверху
  function mirroredUI(ctx, t) {
    const ui = 'rgba(205,215,255,0.26)';
    ctx.save(); ctx.translate(W, 0); ctx.scale(-1, 1);       // всё рисуем как обычно и отражаем
    ctx.strokeStyle = ui; ctx.fillStyle = ui; ctx.lineWidth = 5 * k; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const x = W * 0.9;
    // сердечко
    let y = H * 0.32;
    ctx.beginPath(); ctx.moveTo(x, y + 26 * k); ctx.bezierCurveTo(x - 46 * k, y - 4 * k, x - 24 * k, y - 34 * k, x, y - 12 * k); ctx.bezierCurveTo(x + 24 * k, y - 34 * k, x + 46 * k, y - 4 * k, x, y + 26 * k); ctx.fill();
    // комментарий
    y = H * 0.39;
    ctx.beginPath(); ctx.ellipse(x, y, 34 * k, 28 * k, 0, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 14 * k, y + 24 * k); ctx.lineTo(x - 22 * k, y + 40 * k); ctx.lineTo(x - 2 * k, y + 27 * k); ctx.stroke();
    for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.arc(x + d * 13 * k, y, 3.5 * k, 0, 7); ctx.fill(); }
    // поделиться
    y = H * 0.46;
    ctx.beginPath(); ctx.moveTo(x - 30 * k, y + 22 * k); ctx.quadraticCurveTo(x - 26 * k, y - 8 * k, x + 6 * k, y - 8 * k); ctx.lineTo(x + 6 * k, y - 26 * k); ctx.lineTo(x + 34 * k, y); ctx.lineTo(x + 6 * k, y + 26 * k); ctx.lineTo(x + 6 * k, y + 10 * k); ctx.quadraticCurveTo(x - 16 * k, y + 8 * k, x - 30 * k, y + 22 * k); ctx.stroke();
    // ник и полоса прогресса
    G.text(ctx, '@mercalova_top', W * 0.06, H * 0.865, { size: Math.round(40 * k), fam: 'Inter', weight: 700, color: ui, boil: 0 });
    ctx.fillStyle = 'rgba(205,215,255,0.12)'; ctx.fillRect(W * 0.04, H * 0.9, W * 0.92, 6 * k);
    const prog = clamp(t / S.DURATION);
    ctx.fillStyle = ui; ctx.fillRect(W * 0.04, H * 0.9, W * 0.92 * prog, 6 * k);
    ctx.restore();
    // фронтальная камера
    dot(ctx, W / 2, 46 * k, 20 * k, '#020208');
    ctx.strokeStyle = 'rgba(160,170,230,0.3)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(W / 2, 46 * k, 20 * k, 0, 7); ctx.stroke();
    dot(ctx, W / 2 - 6 * k, 40 * k, 5 * k, 'rgba(120,140,255,0.35)');
  }
  function viewer(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, heat(0.04)); g.addColorStop(1, heat(0.015));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    glass(ctx);
    const v = 0.92 + 0.07 * sm(t, ev.hands, ev.hands + 0.6) + 0.01 * Math.sin(t * 3);
    PADS.forEach((p, i) => fingerPad(ctx, p.x, p.y, p.rot, v, i * 3));
    // рукав куртки выползает снизу, из него - маленькая лапка к правому пальцу
    const creep = ev.come - 1.3;
    if (t >= creep) {
      const p = ease.inOutQuad(r01(t, creep, ev.come + 0.3));
      const pad = PADS[1];
      const a = { x: W * 0.5, y: H * 1.16 }, c0 = { x: W * 0.5, y: H * 0.95 };
      const end = { x: pad.x - 70 * k, y: pad.y + 380 * k };
      const bx = lerp(a.x, end.x, p), by = lerp(a.y, end.y, p);
      const cx = lerp(a.x, c0.x, p), cy = lerp(a.y, c0.y, p);
      const Z = 4.6 * k, sc = 1 / Z;
      const prev = MODE; MODE = 'h';
      ctx.save(); ctx.scale(Z, Z);
      sleeve(ctx, { x: a.x * sc, y: a.y * sc }, { x: cx * sc, y: cy * sc }, { x: bx * sc, y: by * sc }, 0.8, 21);
      ctx.restore();
      MODE = prev;
      hglow(ctx, bx, by + 80 * k, 280 * k, 0.8, 0.22);
      // лапка тянется к стеклу и прижимается напротив пальца
      const pe = ease.inOutQuad(r01(t, ev.come + 0.1, ev.grab - 0.12));
      if (pe > 0) {
        const tx = pad.x - 18 * k, ty = pad.y + 10 * k;
        const px = lerp(bx, tx, pe), py = lerp(by - 20 * k, ty, pe), s = lerp(0.6, 1.5, pe) * k;
        ctx.strokeStyle = heat(0.12); ctx.lineCap = 'round'; ctx.lineWidth = 46 * s;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(px, py + 30 * s); ctx.stroke();
        ctx.save(); if (pe < 1) ctx.filter = `blur(${Math.round((1 - pe) * 10 * k)}px)`;
        pawPress(ctx, px, py, s, clamp(pe * 3));
        ctx.restore();
      }
    }
    mirroredUI(ctx, t);
    // рамка экрана со скруглёнными углами
    ctx.strokeStyle = '#020208'; ctx.lineWidth = 30 * k;
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, 90 * k); ctx.stroke();
    ctx.strokeStyle = 'rgba(160,170,230,0.18)'; ctx.lineWidth = 3 * k;
    ctx.beginPath(); ctx.roundRect(15 * k, 15 * k, W - 30 * k, H - 30 * k, 80 * k); ctx.stroke();
    thermalFx(ctx, t, 0);
  }

  // разворот: болото уезжает влево, «вы» въезжаете справа
  function whip(ctx, t) {
    const p = r01(t, ev.whip, ev.hit);
    const off = ease.inCubic(p) * W * 1.6;
    ctx.save(); ctx.translate(-off, 0); drawWorld(ctx, ev.whip); ctx.restore();
    ctx.save(); ctx.translate(W * 1.6 - off, 0); viewer(ctx, ev.hit); ctx.restore();
    // смаз
    for (let i = 0; i < 26; i++) {
      const y = U.hash(i, 901) * H, len = (200 + 500 * U.hash(i, 902)) * k * p;
      ctx.fillStyle = heat(0.2 + 0.6 * U.hash(i, 903), 0.35 * p);
      ctx.fillRect(U.hash(i, 904) * W, y, len, (3 + 8 * U.hash(i, 905)) * k);
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
    // в темноте остаются тёплые следы пальцев - и остывают
    if (t >= ev.cool) {
      const p = r01(t, ev.cool, ev.cool + 1.8);
      const v = lerp(0.82, 0.08, ease.inOutQuad(p));
      const a = sm(t, ev.cool, ev.cool + 0.3) * (1 - r01(t, S.DURATION - 0.4, S.DURATION));
      ctx.save(); ctx.globalAlpha = a * (0.25 + 0.75 * (1 - p * 0.6));
      PADS.forEach((pd, i) => fingerPad(ctx, pd.x, pd.y + H * 0.1, pd.rot, v, i * 3, false));
      ctx.restore();
    }
    const a = r01(t, ev.title + 0.3, ev.title + 0.6) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const sc = Math.round(4 * k), y = H * 0.42 + 210 * k;
    if (t < ev.endCut) {
      const secs = String(4 + Math.floor(t - ev.title)).padStart(2, '0');
      pixelText(ctx, `● REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
    } else if (Math.floor(t * 6) % 7 !== 0) {
      pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
    }
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      if (t < ev.whip) drawWorld(ctx, t);
      else if (t < ev.hit) whip(ctx, t);
      else if (t < ev.dark) {
        viewer(ctx, t);
        const fl = 1 - r01(t, ev.hit, ev.hit + 0.25);
        if (fl > 0) { ctx.fillStyle = `rgba(255,248,225,${0.8 * fl})`; ctx.fillRect(0, 0, W, H); }
      } else { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.2, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.dark) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
