// «Мерцалова топь» - эпизод 19 «Баюнок». Каждый кадр - чистая функция от t.
// Форма «Камера засыпает»: шторка объектива смыкается, как веки. После каждого моргания кто-то укрыт.
// После последнего - мир лежит на боку: камеру уложили спать. Баюнок не моргает ни разу.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.5);
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const bump = (t, a, b, c) => sm(t, a, b) * (1 - sm(t, b, c));
  const WARM = '255,200,116';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const P = (fx, fy) => ({ x: fx * W, y: fy * H });

  // ---------- Баюнок ----------
  // Пушистый птенец выпи: тельце-груша, длинная шея, хохолок, огромные глаза, которые не моргают.
  const OUT = '#26202E', FUR = '#EBD8A8', FUR2 = '#CDB27A', BEAK = '#C7A64A', LEG = '#7F8C4E';
  const HATCH = { color: 'rgba(110,80,40,0.16)', gap: 6, angle: 0.6 };
  function fluff(ctx, cx, cy, rx, ry, n, seed, fill) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = 4.5 + 2 * U.hash(seed, i);
      G.ellipse(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r, r, { fill, lw: 2, seed: seed + i, stroke: OUT, step: 5 });
    }
    G.ellipse(ctx, cx, cy, rx + 1, ry + 1, { fill, lw: 0, seed: seed + 99, stroke: 'rgba(0,0,0,0)', step: 8, hatch: HATCH });
  }
  const HEADY = 112;
  // o: { sway -1..1, turn -1..1 (куда повёрнута голова), gx, gy, sing 0..1, back, step (фаза шага), pat 0..1 }
  function bayunok(ctx, x, y, t, o, z) {
    ctx.save(); ctx.translate(x, y); ctx.scale(z, z);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 3, 30, 7, 0, 0, 7); ctx.fill();
    // ножки
    const st = o.step || 0;
    for (const d of [-1, 1]) {
      const lift = Math.max(0, Math.sin(st + (d > 0 ? Math.PI : 0))) * 5;
      ctx.strokeStyle = LEG; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(d * 7, -20); ctx.lineTo(d * 8, -lift); ctx.stroke();
      ctx.lineWidth = 2.2;
      for (const a of [-0.7, 0, 0.7]) { ctx.beginPath(); ctx.moveTo(d * 8, -lift); ctx.lineTo(d * 8 + Math.sin(a + d * 0.2) * 9, -lift + 3 * Math.cos(a)); ctx.stroke(); }
    }
    ctx.rotate(o.sway * 0.1);
    const br = 1 + 0.015 * Math.sin(t * 1.8);
    // крылышки
    for (const d of [-1, 1]) {
      const pat = d < 0 ? (o.pat || 0) : 0;
      ctx.save(); ctx.translate(d * 20, -44); ctx.rotate(d * (0.25 + 0.9 * pat * (0.6 + 0.4 * Math.sin(t * 7))));
      G.ellipse(ctx, d * 2, 8, 6.5, 14, { fill: FUR2, lw: 2.2, seed: 205 + d, stroke: OUT, step: 5, hatch: { color: 'rgba(90,60,30,0.25)', gap: 4, angle: d * 0.6 } });
      ctx.restore();
    }
    fluff(ctx, 0, -40 * br, 21, 23 * br, 18, 220, FUR);
    // пестринки на грудке / спинке
    ctx.strokeStyle = 'rgba(120,85,45,0.55)'; ctx.lineWidth = 1.8;
    for (let i = 0; i < 7; i++) { const sx = -12 + U.hash(i, 231) * 24, sy = -52 + U.hash(i, 232) * 26; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (U.hash(i, 233) - 0.5) * 2, sy + 5); ctx.stroke(); }
    // шея: гнётся против качания, как камыш
    const hx = o.turn * 5 + o.sway * 9, hy = -HEADY + Math.abs(o.sway) * 3 + (o.bow || 0) * 14;
    const nx = -o.sway * 7;
    const throb = o.sing * (1 + Math.sin(t * 9)) * 1.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = OUT; ctx.lineWidth = 18 + throb; ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(nx, -86, hx, hy + 8); ctx.stroke();
    ctx.strokeStyle = FUR; ctx.lineWidth = 14 + throb; ctx.beginPath(); ctx.moveTo(0, -56); ctx.quadraticCurveTo(nx, -86, hx, hy + 8); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,85,45,0.5)'; ctx.lineWidth = 1.8;
    for (let i = 0; i < 4; i++) { const u = 0.2 + i * 0.2, qx = 2 * u * (1 - u) * nx + u * u * hx, qy = (1 - u) * (1 - u) * -56 + 2 * u * (1 - u) * -86 + u * u * (hy + 8); ctx.beginPath(); ctx.moveTo(qx + (i % 2 ? 3 : -3), qy - 3); ctx.lineTo(qx + (i % 2 ? 3 : -3), qy + 3); ctx.stroke(); }
    // голова
    fluff(ctx, hx, hy, 16, 15, 16, 250, FUR);
    // хохолок - растрёпанный пух
    ctx.strokeStyle = '#8A6A3A'; ctx.lineWidth = 2.4;
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + (i - 2.5) * 0.34 + Math.sin(t * 1.6 + i) * 0.06 - o.sway * 0.25, L = 6 + 5 * U.hash(i, 255);
      ctx.beginPath(); ctx.moveTo(hx + (i - 2.5) * 3, hy - 14); ctx.quadraticCurveTo(hx + (i - 2.5) * 3 + Math.cos(a) * L * 0.5, hy - 14 + Math.sin(a) * L * 0.7, hx + (i - 2.5) * 3 + Math.cos(a) * L, hy - 14 + Math.sin(a) * L); ctx.stroke();
    }
    if (!o.back) {
      const tr = o.turn;
      // глаза: огромные, тёмные, всегда открыты
      for (const d of [-1, 1]) {
        const ex = hx + tr * 4 + d * 8.2 * (1 - 0.25 * Math.abs(tr)), ey = hy - 1;
        dot(ctx, ex, ey, 7.4, '#F6F1DE');
        const px = ex + o.gx * 1.4, py = ey + o.gy * 1.4;
        dot(ctx, px, py, 6.2, '#0A0810');
        dot(ctx, px - 2.3, py - 2.6, 2.1, '#FFFFFF'); dot(ctx, px + 2.2, py + 2.2, 0.9, 'rgba(255,255,255,0.9)');
        ctx.strokeStyle = OUT; ctx.lineWidth = 1.9; ctx.beginPath(); ctx.arc(ex, ey, 7.4, 0, 7); ctx.stroke();
        ctx.fillStyle = 'rgba(231,150,150,0.45)'; ctx.beginPath(); ctx.ellipse(hx + tr * 3 + d * 13.5, hy + 8, 3.6, 2.2, 0, 0, 7); ctx.fill();
      }
      // клюв
      const bx = hx + tr * 9, by = hy + 6, tx = hx + tr * 30, ty = hy + 10 + (1 - Math.abs(tr)) * 12;
      const nxx = -(ty - by), nyy = tx - bx, nl = Math.hypot(nxx, nyy) || 1, wv = 4.6;
      if (o.sing > 0.05) { ctx.fillStyle = '#5A2A36'; ctx.beginPath(); ctx.ellipse(lerp(bx, tx, 0.45), lerp(by, ty, 0.45) + 3, 3.2, 1.2 + 2.6 * o.sing * (0.6 + 0.4 * Math.sin(t * 9)), 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = BEAK; ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx + (nxx / nl) * wv, by + (nyy / nl) * wv); ctx.lineTo(tx, ty); ctx.lineTo(bx - (nxx / nl) * wv, by - (nyy / nl) * wv); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(120,85,45,0.55)'; ctx.lineWidth = 1.8;
      for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(hx - 6 + i * 4, hy - 3 + (i % 2) * 4); ctx.lineTo(hx - 6 + i * 4, hy + 2 + (i % 2) * 4); ctx.stroke(); }
    }
    ctx.restore();
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
      dot(ctx, px, py, (1.5 + 2 * U.hash(seed, i + 7)) * k * (ry / (30 * k)) ** 0.5, U.hash(seed, i + 99) < 0.5 ? 'rgba(70,130,105,0.6)' : 'rgba(6,22,20,0.5)');
    }
  }
  const BOOTH = { x: W * 0.24, b: HY + 4 * k, q: 1.3 * k };
  const FF = { x: W * 0.33, y: HY - 22 * k };
  const SH = P(0.52, 0.72), FROG = P(0.2, 0.83), MUSH = P(0.82, 0.79), ISLE = P(0.62, 0.57);
  function scenery(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    for (let i = 0; i < 80; i++) { const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.9, r = (0.8 + U.hash(i, 3) * 1.8) * k; ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
    G.ellipse(ctx, W * 0.78, H * 0.3, 40 * k, 40 * k, { fill: '#EFF2E6', lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
    for (let i = 0; i < 14; i++) spruce(ctx, U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.08 + 0.05 * U.hash(i, 15)) * H, '#1A2547', 30 + i, '#070B1C');
    for (let i = 0; i < 12; i++) spruce(ctx, U.hash(i, 16) * W * 1.1 - W * 0.05, HY + 6 * k, (0.05 + 0.04 * U.hash(i, 17)) * H, '#121B38', 60 + i, '#05070F');
    const wg = ctx.createLinearGradient(0, HY, 0, H); wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    for (let i = 0; i < 9; i++) { const y = HY + 20 * k + i * 22 * k, w = (70 - i * 5) * k; ctx.fillStyle = `rgba(230,236,220,${0.16 - i * 0.012})`; ctx.fillRect(W * 0.78 - w / 2 + Math.sin(i * 2.1) * 10 * k, y, w, 3 * k); }
    for (let i = 0; i < 16; i++) { const y = HY + 30 * k + i * 44 * k; ctx.strokeStyle = 'rgba(120,150,220,0.08)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(W * U.hash(i, 40), y); ctx.lineTo(W * U.hash(i, 40) + 160 * k, y); ctx.stroke(); }
    for (let i = 0; i < 14; i++) { const x = U.hash(i, 53) * W, hh = (0.03 + 0.04 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * hh; G.line(ctx, [[x, HY + 12 * k], [x + lean * 0.5, HY + 12 * k - hh * 0.5], [x + lean, HY + 12 * k - hh]], { color: '#0A1124', lw: 5 * k, seed: 300 + i }); }
    const { x: hx, b: hb, q } = BOOTH;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    ctx.fillStyle = '#05070F'; ctx.fillRect(hx - 6 * q, hb - 20 * q, 12 * q, 20 * q);
    G.line(ctx, [[FF.x + 2 * k, FF.y + 28 * k], [FF.x, FF.y + 4 * k]], { color: '#0A1124', lw: 3 * k, seed: 840 });
    mossBlob(ctx, ISLE.x, ISLE.y, 80 * k, 18 * k, 402);
    mossBlob(ctx, SH.x, SH.y + 12 * k, 210 * k, 46 * k, 700);
    G.ellipse(ctx, FROG.x, FROG.y + 6 * k, 96 * k, 26 * k, { fill: '#2A5A48', lw: 2.5, seed: 722, stroke: '#0A1A16' });
    mossBlob(ctx, MUSH.x, MUSH.y + 8 * k, 110 * k, 26 * k, 731);
    for (let i = 0; i < 6; i++) { const x = W * (i < 3 ? 0.02 + i * 0.05 : 0.86 + (i - 3) * 0.05), hh = (0.12 + 0.06 * U.hash(i, 64)) * H; G.line(ctx, [[x, H * 0.98], [x + 6 * k, H * 0.98 - hh * 0.5], [x + 14 * k * (i % 2 ? 1 : -1), H * 0.98 - hh]], { color: '#0A1A1C', lw: 7 * k, seed: 610 + i }); }
  }
  // моховое одеяльце: купол со стёжкой и заплаткой
  const QUILT = '#2F6B52', QUILT2 = '#3F8A66';
  function quilt(ctx, cx, cy, rx, ry, seed, t) {
    const b = 1 + 0.035 * Math.sin(t * 1.5 + seed);
    const pts = []; const n = 14;
    for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry * b]); }
    for (let i = 0; i < 7; i++) { const u = 1 - (i + 0.5) / 7; pts.push([cx - rx + 2 * rx * u, cy + (i % 2 ? 7 : 2) * k]); }   // фестончатый край
    G.poly(ctx, pts, { fill: QUILT, lw: 3, seed, stroke: '#0A1A16', step: 7, hatch: { color: 'rgba(0,0,0,0.18)', gap: 6, angle: 0.5 } });
    ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.93, ry * b * 0.93, 0, Math.PI, 2 * Math.PI); ctx.clip();
    ctx.strokeStyle = 'rgba(190,230,200,0.4)'; ctx.lineWidth = 1.6 * k; ctx.setLineDash([5 * k, 5 * k]);
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(cx + i * rx * 0.3 - ry * 0.5, cy); ctx.lineTo(cx + i * rx * 0.3 + ry * 0.5, cy - ry * 1.1); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + i * rx * 0.3 + ry * 0.5, cy); ctx.lineTo(cx + i * rx * 0.3 - ry * 0.5, cy - ry * 1.1); ctx.stroke(); }
    ctx.setLineDash([]);
    ctx.fillStyle = QUILT2; ctx.fillRect(cx + rx * 0.2, cy - ry * 0.55, rx * 0.3, ry * 0.3);
    ctx.restore();
  }
  function frog(ctx, t, covered) {
    const x = FROG.x, y = FROG.y - 6 * k;
    if (covered) {
      for (const d of [-1, 1]) G.ellipse(ctx, x + d * 14 * k, y - 26 * k, 10 * k, 9 * k, { fill: QUILT, lw: 2.5, seed: 790 + d, stroke: '#0A1A16' }); // под одеяльцем угадываются глаза
      quilt(ctx, x, y + 6 * k, 46 * k, 30 * k, 795, t); return;
    }
    const yawn = bump(t, ev.yawn, ev.yawn + 0.6, ev.yawn + 1.7), sleepy = sm(t, ev.sing, ev.yawn);
    ctx.save(); ctx.translate(x, y); ctx.scale(k * 1.7, k * 1.7);
    G.ellipse(ctx, 0, 0, 18, 12, { fill: '#3E7A4A', lw: 2.2, seed: 780, stroke: '#0A1A0E' });
    for (const d of [-1, 1]) {
      G.ellipse(ctx, d * 9, -11, 6, 6, { fill: '#3E7A4A', lw: 2, seed: 781 + d, stroke: '#0A1A0E' });
      if (yawn > 0.3 || t > ev.yawn + 1.4) { ctx.strokeStyle = '#0A1A0E'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d * 9, -11, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
      else { dot(ctx, d * 9, -11, 3, '#08070C'); dot(ctx, d * 9 - 1, -12, 1, '#fff'); ctx.fillStyle = '#3E7A4A'; ctx.fillRect(d * 9 - 4, -15.5, 8, 4.5 * sleepy); }
    }
    ctx.fillStyle = '#5A1A22'; ctx.beginPath(); ctx.ellipse(0, 2, 9 * (0.3 + yawn), 1 + 6 * yawn, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function mushrooms(ctx, t, covered) {
    const x = MUSH.x, y = MUSH.y;
    if (covered) { quilt(ctx, x, y + 6 * k, 56 * k, 50 * k, 760, t); return; }
    for (const [dx, hh, s] of [[-20, 44, 1], [22, 30, 0.8]]) {
      const cx = x + dx * k, top = y - hh * k, nod = Math.sin(t * 1.2 + dx) * 2 * k;
      ctx.fillStyle = '#E4D9C0'; ctx.strokeStyle = '#1A1410'; ctx.lineWidth = 2.2 * k;
      ctx.beginPath(); ctx.rect(cx - 7 * k * s, top, 14 * k * s, hh * k + 4 * k); ctx.fill(); ctx.stroke();
      G.ellipse(ctx, cx + nod, top, 24 * k * s, 13 * k * s, { fill: '#A9503E', lw: 2.4, seed: 770 + dx, stroke: '#1A1410' });
      for (const d of [-1, 1]) dot(ctx, cx + d * 4 * k * s, top + 14 * k * s, 2.2 * k * s, '#08070C');
      for (let i = 0; i < 3; i++) dot(ctx, cx + nod + (i - 1) * 10 * k * s, top - 3 * k * s, 2.6 * k * s, 'rgba(250,240,220,0.8)');
    }
  }
  function boothWindow(ctx, t, covered) {
    const { x: hx, b: hb, q } = BOOTH;
    if (covered) { ctx.fillStyle = QUILT; ctx.fillRect(hx - 10 * q, hb - 42 * q, 20 * q, 17 * q); ctx.strokeStyle = '#0A1A16'; ctx.lineWidth = 1.5 * k; ctx.strokeRect(hx - 10 * q, hb - 42 * q, 20 * q, 17 * q); ctx.fillStyle = QUILT2; ctx.fillRect(hx + 1 * q, hb - 38 * q, 6 * q, 6 * q); return; }
    ctx.fillStyle = '#6A5630'; ctx.fillRect(hx - 8 * q, hb - 40 * q, 16 * q, 13 * q);
    glow(ctx, hx, hb - 34 * q, 40 * k, WARM, 0.22);
  }
  function firefly(ctx, t, asleep) {
    const x = FF.x + Math.sin(t * 0.9) * 2 * k, y = FF.y + Math.sin(t * 1.4) * 1.5 * k;
    if (asleep) { dot(ctx, FF.x, FF.y + 2 * k, 2 * k, 'rgba(255,200,116,0.22)'); return; }
    const live = t >= S.FLY[0][0] - 0.2;
    if (live && S.flyOn(t)) { glow(ctx, x, y, 34 * k, WARM, 0.95); dot(ctx, x, y, 3.6 * k, 'rgba(255,246,210,1)'); }
    else if (live) dot(ctx, x, y, 2 * k, 'rgba(255,200,116,0.35)');
    else { glow(ctx, x, y, 20 * k, WARM, 0.45 + 0.12 * Math.sin(t * 2.2)); dot(ctx, x, y, 2.4 * k, 'rgba(255,236,170,0.9)'); }
  }
  function fireflies(ctx, t, n) {
    for (let i = 0; i < n; i++) {
      const bx = U.hash(i, 71) * W, by = HY + U.hash(i, 72) * H * 0.25;
      const x = bx + Math.sin(t * (0.3 + 0.2 * U.hash(i, 73)) + i) * 30 * k, y = by + Math.cos(t * (0.25 + 0.2 * U.hash(i, 74)) + i) * 16 * k;
      const a = 0.5 + 0.5 * Math.sin(t * (1 + U.hash(i, 75)) + i * 2);
      glow(ctx, x, y, 16 * k, WARM, 0.35 * a); dot(ctx, x, y, 1.8 * k, `rgba(255,236,170,${0.6 * a})`);
    }
  }
  // ---------- где Баюнок и что он делает ----------
  function bState(t) {
    const stg = S.stage(t);
    const beat = (t - S.clock.OFFSET) / (S.BEAT * 2);
    const amp = lerp(0.35, 1, sm(t, ev.sway - 0.3, ev.sway + 0.8));
    const sway = Math.sin(beat * Math.PI * 2) * amp;
    const sing = t >= ev.sing && t < ev.shut ? 1 : 0;
    if (t >= ev.hit) { // уходит вдаль, потом оглядывается
      const p = sm(t, ev.hit, ev.close);
      const look = t >= ev.night + 0.25;
      return { x: lerp(ISLE.x - 230 * k, ISLE.x - 40 * k, look ? sm(ev.night + 0.25, ev.hit, ev.close) : p), y: ISLE.y + 22 * k, z: 1.7 * k, o: { sway: look ? sway * 0.4 : sway * 0.5, turn: 0, gx: 0, gy: 0, sing: 0, back: !look, step: look ? 0 : t * 7 } };
    }
    if (stg === 0) return { x: SH.x, y: SH.y, z: 3.0 * k, o: { sway, turn: lerp(0, -0.5, sm(t, ev.yawn - 0.3, ev.yawn + 0.5)), gx: lerp(0, -0.8, sm(t, ev.yawn - 0.3, ev.yawn + 0.5)), gy: 0.2, sing } };
    if (stg === 1) { // стоит у укрытой лягушки, подтыкает одеяльце; потом смотрит, кто ещё не спит
      const nxt = sm(t, ev.tuck + 2.2, ev.tuck + 3.0);
      return { x: FROG.x + 150 * k, y: FROG.y + 4 * k, z: 3.2 * k, o: { sway: sway * 0.6, turn: lerp(-0.95, 0.9, nxt), gx: lerp(-0.9, 0.9, nxt), gy: lerp(0.7, 0.1, nxt), sing, bow: 1 - nxt, pat: (1 - sm(t, ev.tuck + 1.2, ev.tuck + 1.9)) } };
    }
    // стадия 2: у укрытых грибочков, замечает камеру, идёт к нам
    const turn = lerp(0.95, 0, sm(t, ev.notice + 0.2, ev.notice + 0.7));
    const w = sm(t, ev.someone, ev.noblink), w2 = sm(t, ev.noblink, ev.shut);
    const z = lerp(lerp(3.2, 8.2, w), 11.5, w2) * k;
    const hxp = lerp(MUSH.x - 150 * k, W * 0.5, w), hyp = lerp(lerp(MUSH.y - HEADY * 3.2 * k, H * 0.5, w), H * 0.53, w2);
    const walking = w > 0 && w < 1;
    return { x: hxp, y: hyp + HEADY * z + (walking ? Math.abs(Math.sin(t * 7)) * 5 * k : 0), z, o: { sway: sway * lerp(0.6, 0.45, w), turn, gx: turn * 0.9, gy: 0.05, sing, bow: 0.5 * (1 - sm(t, ev.notice, ev.notice + 0.5)), step: walking ? t * 7 : 0 } };
  }
  function world(ctx, t, side) {
    const stg = S.stage(t);
    if (side) scenery(ctx); else ctx.drawImage(Studio.cache('scn', scenery), 0, 0, W, H);
    boothWindow(ctx, t, stg >= 2);
    if (stg < 2) fireflies(ctx, t, stg === 0 ? 8 : 4);
    firefly(ctx, t, stg >= 2);
    frog(ctx, t, stg >= 1);
    mushrooms(ctx, t, stg >= 2);
    if (side) quilt(ctx, ISLE.x + 30 * k, ISLE.y + 2 * k, 20 * k, 14 * k, 745, t);
    const b = bState(t);
    bayunok(ctx, b.x, b.y, t, b.o, b.z);
  }
  // ---------- шторка-веки ----------
  function lids(ctx, v) {
    if (v <= 0.002) return;
    ctx.fillStyle = `rgba(3,4,8,${0.4 * v})`; ctx.fillRect(0, 0, W, H);
    if (v >= 0.995) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); return; }
    const h = (1 - v) * H * 0.72, yc = H * 0.5, mg = W * 0.8;
    ctx.save(); ctx.fillStyle = '#030408'; ctx.shadowColor = '#030408'; ctx.shadowBlur = 70 * k;
    ctx.beginPath(); ctx.rect(-mg, -200, W + 2 * mg, H + 400);
    ctx.moveTo(-mg, yc); ctx.quadraticCurveTo(W / 2, yc - 2 * h, W + mg, yc); ctx.quadraticCurveTo(W / 2, yc + 2 * h, -mg, yc); ctx.closePath();
    ctx.fill('evenodd'); ctx.fill('evenodd');
    ctx.restore();
  }
  const off = document.createElement('canvas'); off.width = W; off.height = H;
  function drawWorld(ctx, t) {
    const o = off.getContext('2d');
    const z = lerp(1.22, 1.3, sm(t, 0, ev.shut)), cx = W / 2, cy = H * 0.635;
    o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.translate(W / 2, H * 0.55); o.scale(z, z); o.translate(-cx, -cy);
    world(o, t, false);
    o.restore();
    const v = S.lid(t), bl = Math.round(v * 16 * k);
    ctx.save(); if (bl >= 1) ctx.filter = `blur(${bl}px)`; ctx.drawImage(off, 0, 0); ctx.restore();
  }
  // мир на боку: камера лежит на левом боку, «низ» мира - слева
  function drawSide(ctx, t) {
    const o = off.getContext('2d');
    const settle = (1 - r01(t, ev.hit, ev.hit + 0.9)), wob = Math.sin((t - ev.hit) * 16) * 0.035 * settle * settle;
    const z = H / W + 0.02;
    o.save(); o.setTransform(1, 0, 0, 1, 0, 0); o.fillStyle = '#060A18'; o.fillRect(0, 0, W, H);
    o.translate(W / 2, H / 2); o.rotate(Math.PI / 2 + wob); o.scale(z, z); o.translate(-W / 2, -(HY - 70 * k));
    world(o, t, true);
    o.restore();
    ctx.drawImage(off, 0, 0);
    // мох у самого объектива (земля слева) и край одеяльца сверху
    ctx.save(); ctx.filter = `blur(${Math.round(10 * k)}px)`;
    const g = ctx.createLinearGradient(0, 0, W * 0.2, 0); g.addColorStop(0, 'rgba(8,26,22,1)'); g.addColorStop(0.7, 'rgba(12,36,30,0.95)'); g.addColorStop(1, 'rgba(12,36,30,0)');
    ctx.fillStyle = g; ctx.fillRect(-20, -20, W * 0.2 + 20, H + 40);
    ctx.strokeStyle = 'rgba(20,60,48,0.95)'; ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const y = H * (0.18 + 0.07 * i + 0.03 * U.hash(i, 901)), L = W * (0.12 + 0.14 * U.hash(i, 902)); ctx.lineWidth = (10 + 14 * U.hash(i, 903)) * k; ctx.beginPath(); ctx.moveTo(W * 0.04, y); ctx.quadraticCurveTo(W * 0.1 + L * 0.5, y + (U.hash(i, 904) - 0.5) * 90 * k, W * 0.08 + L, y + (U.hash(i, 905) - 0.5) * 140 * k); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.filter = `blur(${Math.round(3 * k)}px)`;
    const br = Math.sin(t * 1.5) * 6 * k, eh = H * 0.17 + br;
    const pts = [[-30, -30], [W + 30, -30], [W + 30, eh - 60 * k]];
    for (let i = 0; i <= 8; i++) { const u = 1 - i / 8; pts.push([W * u, eh - 60 * k * u + (i % 2 ? 26 : 0) * k + 40 * k * Math.sin(u * 3)]); }
    G.poly(ctx, pts, { fill: QUILT, lw: 5, seed: 950, stroke: '#0A1A16', step: 12, hatch: { color: 'rgba(0,0,0,0.2)', gap: 9, angle: 0.5 } });
    ctx.strokeStyle = 'rgba(190,230,200,0.35)'; ctx.lineWidth = 3 * k; ctx.setLineDash([12 * k, 12 * k]);
    for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(W * (i * 0.14 - 0.1), 0); ctx.lineTo(W * (i * 0.14 + 0.05), eh - 50 * k); ctx.stroke(); }
    ctx.setLineDash([]); ctx.fillStyle = QUILT2; ctx.fillRect(W * 0.6, H * 0.03, W * 0.16, H * 0.06);
    ctx.restore();
    ctx.fillStyle = 'rgba(3,4,12,0.18)'; ctx.fillRect(0, 0, W, H);
  }
  // ---------- последний экран ----------
  const pix = document.createElement('canvas');
  function pixelText(ctx, text, cx, cy, scale, color) {
    const fs = 11, px = pix.getContext('2d'); px.font = `bold ${fs}px monospace`;
    const w = Math.ceil(px.measureText(text).width) + 4; pix.width = w; pix.height = fs + 6;
    px.font = `bold ${fs}px monospace`; px.textBaseline = 'top'; px.fillStyle = color; px.fillText(text, 2, 2);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pix, Math.round(cx - (w * scale) / 2), Math.round(cy - (pix.height * scale) / 2), w * scale, pix.height * scale);
    ctx.restore();
  }
  function endCard(ctx, t) {
    const fade = 1 - r01(t, S.DURATION - 0.5, S.DURATION);
    const a = r01(t, ev.title + 0.3, ev.title + 0.6) * fade;
    if (a > 0) {
      ctx.save(); ctx.globalAlpha = a;
      const sc = Math.round(4 * k), y = H * 0.42 + 210 * k;
      if (t < ev.endCut) pixelText(ctx, `● REC  ${S.LOG}:${String(11 + Math.floor(t - ev.title)).padStart(2, '0')}`, W / 2, y, sc, '#C9D2E8');
      else pixelText(ctx, 'ЗАПИСЬ УСНУЛА', W / 2, y, sc, '#C9D2E8');
      ctx.restore();
    }
    // в темноте - два глаза, которые не моргают
    const e = sm(t, ev.tail, ev.tail + 0.8) * fade;
    if (e > 0) {
      ctx.save(); ctx.globalAlpha = e * 0.85;
      for (const d of [-1, 1]) {
        const ex = W / 2 + d * 104 * k, ey = H * 0.64;
        dot(ctx, ex, ey, 92 * k, '#4A4650'); dot(ctx, ex, ey, 80 * k, '#050408');
        dot(ctx, ex - 28 * k, ey - 32 * k, 24 * k, '#E4E8F0'); dot(ctx, ex + 28 * k, ey + 28 * k, 9 * k, 'rgba(228,232,240,0.85)');
      }
      ctx.restore();
    }
  }

  Studio.film({
    draw(ctx, t) {
      ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H);
      if (t < ev.shut) drawWorld(ctx, t);
      else if (t >= ev.hit && t < ev.dark) drawSide(ctx, t);
      lids(ctx, S.lid(t));
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.22, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.dark) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
