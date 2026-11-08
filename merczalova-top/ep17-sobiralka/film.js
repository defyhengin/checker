// «Мерцалова топь» - эпизод 17 «Собиралка». Каждый кадр - чистая функция от t.
// Обычная запись с камеры: болото с земли, будка на горизонте. В конце Собиралка забирает камеру.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.5);
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const bump = (t, a, b, c) => sm(t, a, b) * (1 - sm(t, b, c));
  const WARM = '255,200,116', COLD = '90,200,210';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const P = (fx, fy) => ({ x: fx * W, y: fy * H });

  // ---------- вещи ----------
  function glasses(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#C9C2A8'; ctx.lineWidth = 3;
    for (const d of [-1, 1]) { ctx.fillStyle = 'rgba(150,190,230,0.25)'; ctx.beginPath(); ctx.arc(d * 13, 0, 10, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-3, -2); ctx.quadraticCurveTo(0, -6, 3, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-23, -2); ctx.lineTo(-32, -6); ctx.moveTo(23, -2); ctx.lineTo(32, -6); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(14, 1); ctx.lineTo(11, 7); ctx.moveTo(14, 1); ctx.lineTo(20, 3); ctx.stroke(); // трещина
    ctx.restore();
  }
  function key(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.4);
    ctx.strokeStyle = '#C8B27A'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-14, 0, 8, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(20, 0); ctx.moveTo(14, 0); ctx.lineTo(14, 6); ctx.moveTo(19, 0); ctx.lineTo(19, 5); ctx.stroke();
    ctx.strokeStyle = '#B9AE90'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-20, -4); ctx.quadraticCurveTo(-34, -14, -28, -24); ctx.stroke(); // верёвочка
    ctx.restore();
  }
  function button(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    dot(ctx, 0, 0, 9, '#33452F'); ctx.strokeStyle = '#0C120B'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.stroke();
    for (const [dx, dy] of [[-2.8, -2.8], [2.8, -2.8], [-2.8, 2.8], [2.8, 2.8]]) dot(ctx, dx, dy, 1.3, '#0A0F09');
    ctx.strokeStyle = '#C9C2A8'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(2.8, 2.8); ctx.quadraticCurveTo(10, 8, 7, 15); ctx.stroke();
    ctx.restore();
  }
  function cassette(ctx, x, y, s = 1, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    G.poly(ctx, [[-45, -28], [45, -28], [45, 28], [-45, 28]], { fill: '#1C1C22', lw: 2.5, seed: 70, stroke: '#050507', step: 12 });
    ctx.fillStyle = '#E9DFC6'; ctx.fillRect(-39, -23, 78, 24);
    G.text(ctx, 'Наблюдение №4', 0, -7, { size: 12, align: 'center', color: '#2A2018', boil: 0.3 });
    ctx.fillStyle = '#0B0B0E'; ctx.fillRect(-26, 6, 52, 15);
    for (const d of [-1, 1]) { dot(ctx, d * 15, 13.5, 6, '#E9DFC6'); dot(ctx, d * 15, 13.5, 2.5, '#0B0B0E'); }
    ctx.restore();
  }
  // o: { face, walk (фаза), moving, look (0..1 - подняла глаза к нам), hop, items, lid, carry }
  const SOBS = 1.9;
  function sobiralka(ctx, x, y, t, o, z = 1) {
    const s = SOBS * z;
    const step = o.moving * Math.abs(Math.sin(o.walk * Math.PI));
    const lift = 4 * step + 22 * o.hop;
    const OUT = '#1A1626', FUR = '#B8B0C8', PINK = '#E7A9B8';
    const HATCH = { color: 'rgba(40,30,60,0.22)', gap: 6, angle: 0.6 };
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 26 - 4 * o.hop, 7, 0, 0, 7); ctx.fill();
    // лапки
    for (const d of [-1, 1]) {
      const up = o.moving * Math.max(0, Math.sin(o.walk * Math.PI + (d > 0 ? Math.PI : 0))) * 5;
      G.ellipse(ctx, d * 10, -3 - up - 22 * o.hop, 8, 5, { fill: FUR, lw: 2.2, seed: 85 + d, stroke: OUT, step: 6 });
    }
    ctx.translate(0, -lift);
    ctx.rotate(o.moving * Math.sin(o.walk * Math.PI) * 0.06);
    // корзинка за спиной, выглядывает над головой
    const open = o.lid || 0;
    G.poly(ctx, [[-27, -84], [27, -84], [21, -44], [-21, -44]], { fill: '#8C6A3A', lw: 2.5, seed: 80, stroke: '#2A1C0E', step: 8, hatch: { color: 'rgba(40,24,10,0.45)', gap: 5, angle: -0.6 } });
    ctx.strokeStyle = 'rgba(40,24,10,0.5)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(-25 + i, -74 + i * 10); ctx.lineTo(25 - i, -74 + i * 10); ctx.stroke(); }
    if (o.items >= 1) { ctx.strokeStyle = '#C9C2A8'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-12, -84); ctx.lineTo(-18, -98); ctx.stroke(); ctx.beginPath(); ctx.arc(-19, -100, 4, 0, 7); ctx.stroke(); }
    if (o.items >= 2) { ctx.strokeStyle = '#C8B27A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(12, -94, 6, 0, 7); ctx.moveTo(12, -88); ctx.lineTo(10, -84); ctx.stroke(); }
    if (o.items >= 3) dot(ctx, 1, -89, 5, '#33452F');
    for (let i = 0; i < 7; i++) dot(ctx, -24 + i * 8, -84 + Math.sin(i * 2.3) * 2, 4.5, '#3E6B4A');
    if (open > 0.01) {
      ctx.fillStyle = '#050507'; ctx.beginPath(); ctx.ellipse(0, -84, 25, 7 * open, 0, 0, 7); ctx.fill();
      ctx.save(); ctx.translate(26, -84); ctx.rotate(-1.3 * open);
      G.poly(ctx, [[-52, -5], [0, -5], [0, 4], [-52, 4]], { fill: '#3E6B4A', lw: 2, seed: 81, stroke: '#0A1A16', step: 8 });
      ctx.restore();
    }
    // тельце
    G.ellipse(ctx, 0, -24, 22, 20, { fill: FUR, lw: 3, seed: 82, stroke: OUT, step: 7, hatch: HATCH });
    // лямки
    ctx.strokeStyle = '#5A3E22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 14, -40); ctx.quadraticCurveTo(d * 17, -28, d * 12, -14); ctx.stroke(); }
    // ручки
    const carry = o.carry;
    ctx.strokeStyle = OUT; ctx.lineWidth = 3;
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(d * 18, -30);
      if (carry) ctx.quadraticCurveTo(d * 30, -60, d * 16, -84 + (carry.dy || 0));
      else ctx.quadraticCurveTo(d * 28, -22 + o.moving * Math.sin(o.walk * Math.PI + d) * 4, d * 26, -12);
      ctx.stroke();
    }
    // ушки
    for (const d of [-1, 1]) {
      G.ellipse(ctx, d * 19, -64, 9, 10, { fill: FUR, lw: 2.5, seed: 87 + d, stroke: OUT, step: 6 });
      G.ellipse(ctx, d * 19, -63, 5, 6, { fill: PINK, lw: 0, seed: 89 + d, stroke: 'rgba(0,0,0,0)', step: 6 });
    }
    // голова
    G.ellipse(ctx, 0, -48, 24, 20, { fill: FUR, lw: 3, seed: 83, stroke: OUT, step: 7, hatch: HATCH });
    const lk = o.look || 0, fx = (1 - lk) * o.face * 3;
    const er = lerp(5.5, 7.4, lk);
    for (const d of [-1, 1]) {
      const ex = d * 9 + fx, ey = -50 - 2 * lk;
      dot(ctx, ex, ey, er, '#08070C');
      if (lk > 0.3) { ctx.fillStyle = `rgba(200,240,250,${0.95 * lk})`; ctx.fillRect(ex - 2.6, ey - 5, 3.6, 6.4); } // в глазах - экран
      else { dot(ctx, ex - 1.8, ey - 2, 1.8, '#FFFFFF'); dot(ctx, ex + 1.6, ey + 1.6, 0.8, '#FFFFFF'); }
      ctx.fillStyle = 'rgba(231,169,184,0.45)'; ctx.beginPath(); ctx.ellipse(d * 16 + fx, -42, 4, 2.5, 0, 0, 7); ctx.fill();
    }
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.arc(fx, -43, 3.5, 0.3, Math.PI - 0.3); ctx.stroke();
    if (carry) cassette(ctx, 0, -92 + (carry.dy || 0), 0.5, Math.sin(t * 5) * 0.04);
    ctx.restore();
  }

  // ---------- мир (в пикселях кадра при зуме 1) ----------
  const BOOTH = { x: W * 0.27, b: HY + 4 * k, q: 1.3 * k };
  const FF = { x: W * 0.36, y: HY + 2 * k };                   // светлячок у будки
  const persp = (y) => clamp(0.1 + 0.9 * (y - HY) / (H * 0.7 - HY), 0.1, 2.6);
  const NEST = P(0.12, 0.75);
  const R1 = [NEST, P(0.2, 0.725), P(0.27, 0.708), P(0.37, 0.68), P(0.48, 0.672), P(0.6, 0.7), P(0.68, 0.716), P(0.77, 0.692), P(0.81, 0.678)];
  const R2 = [P(0.81, 0.678), P(0.74, 0.625), P(0.6, 0.58), P(0.45, 0.548), P(0.34, 0.518), P(BOOTH.x / W, BOOTH.b / H)];
  const R3 = [P(BOOTH.x / W, BOOTH.b / H), P(0.36, 0.528), P(0.48, 0.565), P(0.55, 0.62), P(0.53, 0.72), P(0.5, 0.86), P(0.5, 1.05)];
  const GLS = P(0.30, 0.716), KEY = P(0.51, 0.68), BTN = P(0.705, 0.726), CAS = P(0.885, 0.668);

  function catmull(pts, u) {
    const n = pts.length - 1;
    u = clamp(u, 0, n);
    const i = Math.min(n - 1, Math.floor(u)), f = u - i;
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const c = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * f + (2 * a - 5 * b + 4 * cc - d) * f * f + (-a + 3 * b - 3 * cc + d) * f * f * f);
    return { x: c(p0.x, p1.x, p2.x, p3.x), y: c(p0.y, p1.y, p2.y, p3.y) };
  }
  // светящиеся следы: точки через равные (с учётом перспективы) промежутки
  function prints(pts) {
    const out = []; let prev = catmull(pts, 0), acc = 0, side = 1;
    const N = (pts.length - 1) * 120;
    for (let j = 1; j <= N; j++) {
      const u = j / 120, p = catmull(pts, u);
      acc += Math.hypot(p.x - prev.x, p.y - prev.y) / persp(p.y);
      if (acc >= 30 * k) { acc = 0; side = -side; out.push({ u, x: p.x, y: p.y, side }); }
      prev = p;
    }
    return out;
  }
  const PR1 = prints(R1), PR2 = prints(R2), PR3 = prints(R3);
  function track(keys, t) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, u1] = keys[i], [t0, u0] = keys[i - 1];
      if (t <= t1) return lerp(u0, u1, sm(t, t0, t1));
    }
    return keys[keys.length - 1][1];
  }
  const K1 = [[0, 0], [ev.go, 0], [ev.glasses - 0.3, 2], [ev.key - 0.3, 4], [ev.button - 0.3, 6], [ev.special - 0.2, 8]];
  const K2 = [[ev.toBooth, 0], [ev.atBooth, 5]];
  const K3 = [[ev.turn, 0], [ev.crawl, 1.6], [ev.hit - 0.15, 6]];
  const leg = (t) => (t < ev.toBooth ? 1 : t < ev.turn ? 2 : 3);
  function sobPos(t) {
    const l = leg(t);
    if (l === 1) return catmull(R1, track(K1, t));
    if (l === 2) return catmull(R2, track(K2, t));
    return catmull(R3, ease.inQuad(track(K3, t) / 6) * 6);
  }

  // ---------- декорации ----------
  function spruce(ctx, x, base, h, fill, seed, stroke) {
    const pts = []; const wd = h * 0.3;
    for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
    const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
    G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke });
  }
  function mossBlob(ctx, cx, cy, rx, ry, seed) {
    G.ellipse(ctx, cx, cy, rx, ry, { fill: '#1E4A47', lw: 3, seed, stroke: '#0A1A16', hatch: { color: 'rgba(0,0,0,0.22)', gap: 6, angle: 0.5 } });
    for (let i = 0; i < Math.round(rx / (6 * k)); i++) {
      const a = U.hash(seed, i) * 7, rr = Math.sqrt(U.hash(seed, i + 50));
      const px = cx + Math.cos(a) * rx * 0.85 * rr, py = cy + Math.sin(a) * ry * 0.75 * rr;
      const v = U.hash(seed, i + 99);
      if (v < 0.9) dot(ctx, px, py, (1.5 + 2 * U.hash(seed, i + 7)) * k * (ry / (30 * k)) ** 0.5, v < 0.5 ? 'rgba(70,130,105,0.6)' : 'rgba(6,22,20,0.5)');
      else dot(ctx, px, py, 3.2 * k, '#B23A48');
    }
  }
  function scenery(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    for (let i = 0; i < 80; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.9, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    G.ellipse(ctx, W * 0.8, H * 0.29, 44 * k, 44 * k, { fill: '#EFF2E6', lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
    for (let i = 0; i < 14; i++) spruce(ctx, U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.08 + 0.05 * U.hash(i, 15)) * H, '#1A2547', 30 + i, '#070B1C');
    for (let i = 0; i < 12; i++) spruce(ctx, U.hash(i, 16) * W * 1.1 - W * 0.05, HY + 6 * k, (0.05 + 0.04 * U.hash(i, 17)) * H, '#121B38', 60 + i, '#05070F');
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    for (let i = 0; i < 9; i++) { const y = HY + 20 * k + i * 22 * k, w = (70 - i * 5) * k; ctx.fillStyle = `rgba(230,236,220,${0.16 - i * 0.012})`; ctx.fillRect(W * 0.8 - w / 2 + Math.sin(i * 2.1) * 10 * k, y, w, 3 * k); }
    for (let i = 0; i < 16; i++) { const y = HY + 30 * k + i * 44 * k; ctx.strokeStyle = 'rgba(120,150,220,0.08)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(W * U.hash(i, 40), y); ctx.lineTo(W * U.hash(i, 40) + 160 * k, y); ctx.stroke(); }
    // камыши у горизонта
    for (let i = 0; i < 14; i++) {
      const x = U.hash(i, 53) * W, hh = (0.03 + 0.04 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * hh;
      G.line(ctx, [[x, HY + 12 * k], [x + lean * 0.5, HY + 12 * k - hh * 0.5], [x + lean, HY + 12 * k - hh]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
      if (i % 3 === 0) G.ellipse(ctx, x + lean, HY + 12 * k - hh, 5 * k, 14 * k, { fill: '#3A2A1E', lw: 1.5, seed: 330 + i, stroke: '#0A0806' });
    }
    // кочки к будке (дальние - мельче)
    for (const [pts, n, sd] of [[R2, 10, 400]]) {
      for (let j = 0; j <= n; j++) {
        const p = catmull(pts, (j / n) * (pts.length - 1)), sc = persp(p.y);
        mossBlob(ctx, p.x + (U.hash(j, sd) - 0.5) * 30 * k * sc, p.y + 6 * k * sc, (70 + 30 * U.hash(j, sd + 1)) * k * sc, (22 + 8 * U.hash(j, sd + 2)) * k * sc, sd + j);
      }
    }
    // передний берег, по которому она идёт
    mossBlob(ctx, W * 0.5, H * 0.73, W * 0.62, H * 0.06, 700);
    mossBlob(ctx, W * 0.1, H * 0.77, W * 0.22, H * 0.04, 701);
    mossBlob(ctx, W * 0.88, H * 0.69, W * 0.2, H * 0.035, 702);
    // гнездо
    G.ellipse(ctx, NEST.x, NEST.y + 6 * k, 66 * k, 22 * k, { fill: '#4A3424', lw: 2.5, seed: 60, stroke: '#1A120A' });
    G.ellipse(ctx, NEST.x, NEST.y + 2 * k, 44 * k, 12 * k, { fill: '#2A1C12', lw: 2, seed: 61, stroke: '#1A120A' });
    // ил у кассеты
    G.ellipse(ctx, CAS.x, CAS.y + 8 * k, 70 * k, 20 * k, { fill: '#2A2418', lw: 2, seed: 62, stroke: '#120E08' });
    // ближние кувшинки и камыш
    for (const [x, y, r, sd] of [[0.2, 0.86, 54, 1], [0.78, 0.84, 62, 2], [0.42, 0.92, 48, 3]]) {
      G.ellipse(ctx, W * x, H * y, r * k, r * 0.3 * k, { fill: '#2A5A48', lw: 2.5, seed: 720 + sd, stroke: '#0A1A16' });
    }
    for (let i = 0; i < 6; i++) {
      const x = W * (i < 3 ? 0.02 + i * 0.05 : 0.86 + (i - 3) * 0.05), hh = (0.12 + 0.06 * U.hash(i, 64)) * H;
      G.line(ctx, [[x, H * 0.98], [x + 6 * k, H * 0.98 - hh * 0.5], [x + 14 * k * (i % 2 ? 1 : -1), H * 0.98 - hh]], { color: '#0A1A1C', lw: 7 * k, seed: 610 + i });
    }
  }

  // будка: окошко открывается, лапка забирает кассету
  function boothWindow(ctx, t) {
    const { x: hx, b: hb, q } = BOOTH;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    ctx.fillStyle = '#05070F'; ctx.fillRect(hx - 6 * q, hb - 20 * q, 12 * q, 20 * q);
    const wy = hb - 34 * q, ww = 16 * q, wh = 13 * q;
    const open = sm(t, ev.window, ev.window + 0.35) * (1 - sm(t, ev.shut, ev.shut + 0.12));
    ctx.fillStyle = open > 0.02 ? '#020306' : '#1A1610'; ctx.fillRect(hx - ww / 2, wy - wh / 2, ww, wh);
    if (open > 0.02) {
      ctx.fillStyle = '#0E0E14';
      ctx.beginPath(); ctx.ellipse(hx - 3.2 * q, wy - 4 * q, 1.3 * q, 3 * q, -0.3, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(hx + 3.2 * q, wy - 4 * q, 1.3 * q, 3 * q, 0.3, 0, 7); ctx.fill();
      for (const d of [-1, 1]) { dot(ctx, hx + d * 2.3 * q, wy + 0.6 * q, 0.9 * q, `rgba(255,214,90,${open})`); glow(ctx, hx + d * 2.3 * q, wy + 0.6 * q, 4 * q, '255,214,90', 0.4 * open); }
    }
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(hx + d * ww / 2, wy); ctx.scale(lerp(1, -0.35, open), 1);
      ctx.fillStyle = '#1A2440'; ctx.fillRect(d > 0 ? -ww / 2 : 0, -wh / 2, ww / 2, wh);
      ctx.strokeStyle = '#04060C'; ctx.lineWidth = 0.8 * q; ctx.strokeRect(d > 0 ? -ww / 2 : 0, -wh / 2, ww / 2, wh);
      ctx.restore();
    }
    return { x: hx, y: wy };
  }
  function paw(ctx, t, from, tip) {
    const p = sm(t, ev.take - 0.5, ev.take) * (1 - sm(t, ev.take + 0.15, ev.shut - 0.02));
    if (p <= 0.01) return;
    const q = BOOTH.q;
    const ex = lerp(from.x, tip.x, p), ey = lerp(from.y, tip.y, p);
    ctx.strokeStyle = '#8E88A0'; ctx.lineWidth = 2.6 * q; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.quadraticCurveTo(from.x + 5 * q, (from.y + ey) / 2, ex, ey); ctx.stroke();
    ctx.lineWidth = 1 * q;
    for (const d of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex + d * 2.6 * q, ey + 4.5 * q); ctx.stroke(); }
  }
  function firefly(ctx, t) {
    const x = FF.x + Math.sin(t * 0.9) * 2 * k, y = FF.y - 22 * k + Math.sin(t * 1.4) * 1.5 * k;
    G.line(ctx, [[FF.x + 2 * k, FF.y + 6 * k], [FF.x, FF.y - 18 * k]], { color: '#0A1124', lw: 3 * k, seed: 840 });
    const live = t >= S.FLY[0][0] && t < S.FLY[S.FLY.length - 1][1] + 0.1;
    if (live && S.flyOn(t)) { glow(ctx, x, y, 34 * k, WARM, 0.95); dot(ctx, x, y, 3.6 * k, 'rgba(255,246,210,1)'); }
    else if (live) dot(ctx, x, y, 2 * k, 'rgba(255,200,116,0.35)');
    else { glow(ctx, x, y, 20 * k, WARM, 0.45 + 0.12 * Math.sin(t * 2.2)); dot(ctx, x, y, 2.4 * k, 'rgba(255,236,170,0.9)'); }
  }
  function fireflies(ctx, t) {
    for (let i = 0; i < 10; i++) {
      const bx = U.hash(i, 71) * W, by = HY + U.hash(i, 72) * H * 0.3;
      const x = bx + Math.sin(t * (0.3 + 0.2 * U.hash(i, 73)) + i) * 30 * k, y = by + Math.cos(t * (0.25 + 0.2 * U.hash(i, 74)) + i) * 16 * k;
      const a = 0.5 + 0.5 * Math.sin(t * (1 + U.hash(i, 75)) + i * 2);
      glow(ctx, x, y, 16 * k, WARM, 0.35 * a); dot(ctx, x, y, 1.8 * k, `rgba(255,236,170,${0.6 * a})`);
    }
  }
  function drawPrints(ctx, list, upTo) {
    for (const d of list) {
      if (d.u > upTo) break;
      const sc = persp(d.y), r = 4.2 * k * sc;
      const x = d.x + d.side * 7 * k * sc, y = d.y + 4 * k * sc;
      glow(ctx, x, y, r * 4, WARM, 0.22);
      ctx.fillStyle = 'rgba(255,214,140,0.8)'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, 7); ctx.fill();
    }
  }
  // отражение экрана в ближней воде - еле видно, проступает к концу
  function screenInWater(ctx, t) {
    const a = 0.04 + 0.08 * r01(t, 10, ev.crawl) + 0.1 * sm(t, ev.crawl, ev.hit);
    const x = W * 0.62, y = H * 0.9, w = 120 * k, h = 70 * k;
    ctx.save(); ctx.globalAlpha = a;
    for (let i = 0; i < 8; i++) {
      const yy = y - h / 2 + i * h / 8, off = Math.sin(t * 2 + i * 1.3) * 8 * k;
      ctx.fillStyle = `rgba(${COLD},0.8)`; ctx.fillRect(x - w / 2 + off, yy, w, h / 8 - 3 * k);
    }
    ctx.restore();
  }

  const ITEMS = [
    { draw: glasses, at: GLS, t: ev.glasses },
    { draw: key, at: KEY, t: ev.key },
    { draw: button, at: BTN, t: ev.button },
  ];

  function sobState(t) {
    const p = sobPos(t), pa = sobPos(t - 0.12), pb = sobPos(t + 0.12);
    const sc = persp(p.y);
    const dx = pb.x - pa.x, sp = Math.hypot(pb.x - pa.x, pb.y - pa.y) / sc;
    const moving = clamp(sp / (8 * k));
    let face = dx > 1 ? 1 : dx < -1 ? -1 : 0;
    const l = leg(t);
    const walk = l === 1 ? track(K1, t) * 4 : l === 2 ? track(K2, t) * 5 : track(K3, t) * 4;
    const hop = bump(t, ev.hello - 0.15, ev.hello + 0.1, ev.hello + 0.45) + bump(t, ev.raise - 0.2, ev.raise, ev.raise + 0.3) * 0.6;
    const items = (t >= ev.glasses + 0.35) + (t >= ev.key + 0.35) + (t >= ev.button + 0.35);
    let carry = null;
    if (t >= ev.raise - 0.25 && t < ev.take + 0.05) carry = { dy: 0 };
    const look = l === 3 ? sm(t, ev.crawl, ev.hit - 0.3) : 0;
    return { p, sc, face, moving, walk, hop, items, look, lid: 0, carry };
  }

  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scn', scenery), 0, 0, W, H);
    fireflies(ctx, t);
    const l = leg(t);
    drawPrints(ctx, PR1, t < ev.go ? -1 : l === 1 ? track(K1, t) - 0.08 : 99);
    drawPrints(ctx, PR2, l < 2 ? -1 : l === 2 ? track(K2, t) - 0.08 : 99);
    if (l === 3) drawPrints(ctx, PR3, ease.inQuad(track(K3, t) / 6) * 6 - 0.1);
    const win = boothWindow(ctx, t);
    firefly(ctx, t);
    screenInWater(ctx, t);
    const st = sobState(t);
    for (const it of ITEMS) if (t < it.t) { it.draw(ctx, it.at.x, it.at.y, 1.5 * k); glow(ctx, it.at.x, it.at.y, 30 * k, '255,255,240', 0.12 + 0.06 * Math.sin(t * 3 + it.at.x)); }
    if (t < ev.raise - 0.25) { cassette(ctx, CAS.x, CAS.y, 0.9 * k, -0.2); glow(ctx, CAS.x, CAS.y, 50 * k, '255,255,240', 0.1 + 0.05 * Math.sin(t * 3)); }
    const z = st.sc * k;
    sobiralka(ctx, st.p.x, st.p.y, t, st, z);
    for (const it of ITEMS) {
      const p = r01(t, it.t, it.t + 0.38);
      if (p > 0 && p < 1) {
        const tgt = { x: st.p.x, y: st.p.y - 86 * SOBS * z };
        it.draw(ctx, lerp(it.at.x, tgt.x, p), lerp(it.at.y, tgt.y, p) - Math.sin(p * Math.PI) * 50 * k, lerp(1.5, 0.8, p) * k);
      }
    }
    const tip = { x: st.p.x, y: st.p.y - 100 * SOBS * z };
    paw(ctx, t, win, tip);
    if (t >= ev.take + 0.05 && t < ev.shut) {
      const p = sm(t, ev.take + 0.05, ev.shut - 0.05);
      cassette(ctx, lerp(tip.x, win.x, p), lerp(tip.y + 8 * z * SOBS, win.y, p), lerp(0.5 * SOBS * z, 0.12 * z * SOBS, p), 0);
    }
  }

  // камера [x, y, зум] - ведёт оператор наблюдателя
  const mx = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
  function clampCam(c) {
    const z = c[2], hw = W / (2 * z), top = H * 0.55 / z, bot = H * 0.45 / z;
    return [clamp(c[0], hw, W - hw), clamp(c[1], top, H - bot), z];
  }
  function cam(t) {
    const WIDE = [W / 2, H * 0.55, 1];
    const p = sobPos(t);
    let c = clampCam([p.x, p.y - 60 * k, 1.35]);
    c = mx(WIDE, c, sm(t, 0, 0.01));
    c = mx(c, clampCam([CAS.x - 40 * k, CAS.y - 60 * k, 2.1]), sm(t, ev.special - 0.2, ev.special + 0.9) * (1 - sm(t, ev.toBooth - 0.1, ev.toBooth + 1.2)));
    c = mx(c, clampCam([BOOTH.x + 10 * k, BOOTH.b - 30 * k, 5.2]), sm(t, ev.toBooth + 1.2, ev.atBooth + 0.4));
    c = mx(c, WIDE, sm(t, ev.zoomOut, ev.zoomOut + 2.0));
    return c;
  }
  function drawWorld(ctx, t) {
    const [cx, cy, z] = cam(t);
    ctx.save();
    ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cx, -cy);
    world(ctx, t);
    ctx.restore();
  }

  // ---------- вплотную к объективу ----------
  function pawPad(ctx, x, y, s, a, rot = 0) {
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    G.ellipse(ctx, 0, 0, 60, 54, { fill: '#B8B0C8', lw: 4, seed: 980, stroke: '#1A1626', hatch: { color: 'rgba(40,30,60,0.2)', gap: 7, angle: 0.6 } });
    G.ellipse(ctx, 0, 10, 26, 20, { fill: '#E7A9B8', lw: 0, seed: 981, stroke: 'rgba(0,0,0,0)' });
    for (const [dx, dy] of [[-30, -26], [-10, -38], [12, -38], [32, -26]]) G.ellipse(ctx, dx, dy, 10, 11, { fill: '#E7A9B8', lw: 0, seed: 982 + dx, stroke: 'rgba(0,0,0,0)' });
    ctx.restore();
  }
  function smudge(ctx, x, y, s, rot) { // мутный след лапки на стекле
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(215,222,240,0.13)';
    ctx.beginPath(); ctx.ellipse(0, 10, 28, 22, 0, 0, 7); ctx.fill();
    for (const [dx, dy] of [[-30, -26], [-10, -38], [12, -38], [32, -26]]) { ctx.beginPath(); ctx.ellipse(dx, dy, 11, 12, 0, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function eyeScreen(ctx, cx, cy, r, t) {
    // в глазу отражается экран телефона и ваши большие пальцы
    const w = r * 0.62, h = r * 1.02;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.98, 0, 7); ctx.clip();
    const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2);
    g.addColorStop(0, `rgba(${COLD},0.85)`); g.addColorStop(1, `rgba(${COLD},0.45)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, w * 0.14); ctx.fill();
    ctx.fillStyle = '#05040A';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.roundRect(d > 0 ? cx + w / 2 - w * 0.3 : cx - w / 2 - w * 0.5, cy + h * 0.08, w * 0.8, w * 0.26, w * 0.13); ctx.fill(); }
    dot(ctx, cx, cy - h / 2 + w * 0.1, w * 0.04, '#05040A');
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.5, cy - r * 0.55, r * 0.16, r * 0.1, -0.6, 0, 7); ctx.fill();
  }
  function closeUp(ctx, t) {
    // фон: размытое болото
    ctx.save(); ctx.filter = `blur(${Math.round(18 * k)}px)`; drawWorldAt(ctx, ev.hit - 0.4); ctx.restore();
    const lift = sm(t, ev.lift, ev.arrive);
    const rot = lift * (0.22 + 0.06 * Math.sin(t * 9)) + 0.03 * Math.sin(t * 3) * (t > ev.steps ? 1 : 0);
    const shake = (1 - r01(t, ev.hit, ev.hit + 0.4)) * 14 * k + lift * 6 * k + [ev.tap1, ev.tap2].reduce((m, tt) => m + (t >= tt ? (1 - r01(t, tt, tt + 0.15)) * 10 * k : 0), 0);
    ctx.save();
    ctx.translate(W / 2 + Math.sin(t * 61) * shake, H * 0.5 + Math.cos(t * 53) * shake);
    ctx.rotate(rot); ctx.translate(0, -lift * 260 * k);
    ctx.translate(-W / 2, -H * 0.5);
    const Z = 17 * k, Sx = SOBS * Z;
    const breathe = 1 + 0.01 * Math.sin(t * 2.5);
    const cx = W / 2, cy = H * 0.54 + 48 * Sx * breathe;
    sobiralka(ctx, cx, cy, t, { face: 0, moving: 0, walk: 0, hop: 0, items: 3, look: 1, lid: 0, carry: null }, Z * breathe);
    for (const d of [-1, 1]) eyeScreen(ctx, cx + d * 9 * Sx * breathe, cy - 52 * Sx * breathe, 7.4 * Sx * breathe, t);
    ctx.restore();
    // отпечатки лапки на стекле после «тук-тук»
    for (const [tt, x, y, r] of [[ev.tap1, 0.66, 0.7, -0.3], [ev.tap2, 0.42, 0.66, 0.2]]) {
      if (t < tt) continue;
      const away = r01(t, tt + 0.08, tt + 0.24);
      if (away < 1) pawPad(ctx, W * x, H * y + away * 200 * k, lerp(3.8, 4.6, away) * k, 1 - away, r);
      if (t >= tt) smudge(ctx, W * x, H * y, 3.8 * k, r);
    }
    // затемнение сверху, чтобы читались субтитры
    { const g = ctx.createLinearGradient(0, 0, 0, H * 0.42); g.addColorStop(0, 'rgba(3,4,12,0.75)'); g.addColorStop(1, 'rgba(3,4,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.42); }
    // лапки обхватывают камеру с боков
    const grab = sm(t, ev.steps, ev.steps + 0.6);
    if (grab > 0) for (const d of [-1, 1]) pawPad(ctx, W / 2 + d * (W * 0.62 - grab * W * 0.16), H * 0.56 + d * 40 * k, 3.2 * k, 1, d * 1.4);
    // снизу поднимается тёмный край корзинки
    const bk = ease.inQuad(r01(t, ev.lift + 0.4, ev.arrive));
    if (bk > 0) {
      const top = H * (1.05 - 0.75 * bk);
      ctx.fillStyle = '#050507'; ctx.beginPath(); ctx.moveTo(-10, H + 10); ctx.lineTo(-10, top + 80 * k); ctx.quadraticCurveTo(W / 2, top - 120 * k, W + 10, top + 80 * k); ctx.lineTo(W + 10, H + 10); ctx.fill();
      ctx.strokeStyle = '#8C6A3A'; ctx.lineWidth = 26 * k; ctx.beginPath(); ctx.moveTo(-10, top + 80 * k); ctx.quadraticCurveTo(W / 2, top - 120 * k, W + 10, top + 80 * k); ctx.stroke();
      ctx.strokeStyle = 'rgba(40,24,10,0.6)'; ctx.lineWidth = 3 * k;
      for (let i = 0; i < 14; i++) { const x = i * W / 13; ctx.beginPath(); ctx.moveTo(x, top + 60 * k); ctx.lineTo(x + 20 * k, top + 100 * k); ctx.stroke(); }
      for (let i = 0; i < 12; i++) dot(ctx, i * W / 11, top - 30 * k + Math.abs(i - 5.5) * 10 * k, 14 * k, '#3E6B4A');
    }
  }
  let BG = null;
  function drawWorldAt(ctx, t) {
    if (!BG) { BG = G.makeCanvas(W, H); const x = BG.getContext('2d'); drawWorldRaw(x, t); }
    ctx.drawImage(BG, 0, 0);
  }
  function drawWorldRaw(ctx, t) {
    ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(2.2, 2.2); ctx.translate(-W * 0.52, -H * 0.62);
    ctx.drawImage(Studio.cache('scn', scenery), 0, 0, W, H);
    ctx.restore();
  }

  // ---------- последний экран: внутри корзинки ----------
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
    if (t >= ev.near) {
      // сквозь плетёнку пробивается лунный свет; в темноте блестят очки и ключик
      const a = sm(t, ev.near, ev.near + 1.2) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
      ctx.save(); ctx.globalAlpha = a * 0.5;
      for (let r = 0; r < 14; r++) for (let c = 0; c < 9; c++) {
        const x = (c + (r % 2) * 0.5) * W / 8, y = H * 0.62 + r * 34 * k;
        if (U.hash(r * 9 + c, 991) < 0.55) continue;
        ctx.fillStyle = 'rgba(190,200,235,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, 10 * k, 3 * k, 0.4, 0, 7); ctx.fill();
      }
      ctx.restore();
      const g1 = 0.5 + 0.5 * Math.sin(t * 3);
      glow(ctx, W * 0.3, H * 0.86, 30 * k, '220,235,255', 0.5 * a * g1);
      glow(ctx, W * 0.72, H * 0.9, 24 * k, '255,220,150', 0.5 * a * (1 - g1));
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
      if (t < ev.hit) drawWorld(ctx, t);
      else if (t < ev.dark) {
        closeUp(ctx, t);
        const fl = 1 - r01(t, ev.hit, ev.hit + 0.22);
        if (fl > 0) { ctx.fillStyle = `rgba(210,245,250,${0.7 * fl})`; ctx.fillRect(0, 0, W, H); }
        for (const tt of [ev.tap1, ev.tap2]) if (t >= tt && t < tt + 0.1) { ctx.fillStyle = `rgba(225,232,250,${0.32 * (1 - r01(t, tt, tt + 0.1))})`; ctx.fillRect(0, 0, W, H); } // стекло дрогнуло
      } else { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.2, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.dark) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
