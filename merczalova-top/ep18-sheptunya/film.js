// «Мерцалова топь» - эпизод 18 «Шептунья». Каждый кадр - чистая функция от t.
// АСМР-запись с камеры: Шептунья шепчет в камышинку-микрофон. В тишине шёпот звучит справа,
// хотя она сидит перед нами с закрытым ртом. В конце смотрит мимо нас - на того, кто справа.
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

  // ---------- Шептунья ----------
  // Пушистая «пушинка-одуванчик» с огромными ушами-раковинами вбок и рогозом-микрофоном.
  const OUT = '#26202E', FUR = '#F2E8DA', FUR2 = '#D9CBB8', PINK = '#E7A9B8';
  const HATCH = { color: 'rgba(90,70,50,0.14)', gap: 6, angle: 0.6 };
  const SH = P(0.5, 0.75), SHZ = 3.2 * k;
  function fluff(ctx, cx, cy, rx, ry, n, seed, fill) {
    // пушистый край: много мелких кружков по контуру
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2, r = 4.5 + 2 * U.hash(seed, i);
      G.ellipse(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r, r, { fill, lw: 2, seed: seed + i, stroke: OUT, step: 5 });
    }
    G.ellipse(ctx, cx, cy, rx + 1, ry + 1, { fill, lw: 0, seed: seed + 99, stroke: 'rgba(0,0,0,0)', step: 8, hatch: HATCH });
  }
  // o: { mic 0..1 (у рта), mouth 0..1 (открыт), lids 0..1 (прикрыты), gx, gy (взгляд), earL, earR (повороты), blink }
  function sheptunya(ctx, x, y, t, o, z) {
    ctx.save(); ctx.translate(x, y); ctx.scale(z, z);
    const br = 1 + 0.012 * Math.sin(t * 1.8);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 3, 34, 8, 0, 0, 7); ctx.fill();
    // сложенные крылья плащиком за спиной
    for (const d of [-1, 1]) {
      const flap = 0.04 * Math.sin(t * 1.3 + d);
      ctx.save(); ctx.translate(d * 10, -58); ctx.rotate(d * (0.15 + flap));
      G.poly(ctx, [[0, 0], [d * 40, -40], [d * 64, -26], [d * 60, 12], [d * 34, 36], [d * 6, 30]], { fill: '#C9C0D6', lw: 3, seed: 205 + d, stroke: OUT, step: 7, hatch: { color: 'rgba(70,60,100,0.2)', gap: 5, angle: d * 0.7 } });
      G.ellipse(ctx, d * 42, -8, 8, 9, { fill: '#E9DCC0', lw: 1.6, seed: 207 + d, stroke: 'rgba(60,50,80,0.6)', step: 5 });
      ctx.restore();
    }
    // перистые усики вверх - ими она слушает
    for (const d of [-1, 1]) {
      const turn = d < 0 ? o.earL : o.earR;
      const sway = Math.sin(t * 1.5 + d) * 0.04;
      ctx.save(); ctx.translate(d * 6, -84); ctx.rotate(d * (0.85 - 0.35 * turn) + sway);
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(d * 2, -30, d * 16, -54); ctx.stroke();
      for (let i = 0; i < 9; i++) {
        const u = (i + 1) / 10, cx0 = d * (2 * 2 * u * (1 - u) + 16 * u * u), cy0 = -30 * 2 * u * (1 - u) - 54 * u * u;
        const L = 7 * Math.sin(Math.PI * u) + 1.5;
        ctx.strokeStyle = '#D9BC98'; ctx.lineWidth = 1.4;
        for (const s2 of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + s2 * L, cy0 - L * 0.5); ctx.stroke(); }
      }
      ctx.restore();
    }
    // тельце-пушинка
    fluff(ctx, 0, -32 * br, 24, 26 * br, 18, 220, FUR);
    for (const d of [-1, 1]) G.ellipse(ctx, d * 11, -3, 8, 5, { fill: FUR, lw: 2.2, seed: 240 + d, stroke: OUT, step: 6 });
    // голова
    fluff(ctx, 0, -66, 23, 21, 20, 250, FUR);
    for (const d of [-1, 1]) G.ellipse(ctx, d * 14, -36, 6, 4, { fill: FUR2, lw: 1.6, seed: 248 + d, stroke: OUT, step: 5 }); // пушистый воротничок
    // глаза: большие, сонно прикрыты веками
    const lid = o.lids;
    for (const d of [-1, 1]) {
      const ex = d * 10, ey = -66;
      ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, 8.4, 9, 0, 0, 7); ctx.clip();
      dot(ctx, ex, ey, 9.2, '#F4F7FB');
      const px = ex + o.gx * 4.4, py = ey + o.gy * 3.4;
      dot(ctx, px, py, 5.8, '#08070C');
      dot(ctx, px - 2.2, py - 2.6, 2.2, '#FFFFFF'); dot(ctx, px + 2, py + 2, 0.9, '#FFFFFF');
      if (o.refl > 0) { // в зрачке - силуэт с ушками справа от камеры
        ctx.fillStyle = `rgba(210,232,245,${0.95 * o.refl})`;
        const rx = px + 1.6, ry = py + 0.8;
        ctx.beginPath(); ctx.ellipse(rx, ry + 1.4, 1.9, 2.6, 0, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(rx, ry - 1.6, 1.4, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(rx - 1.1, ry - 3.4, 0.5, 1.4, -0.3, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(rx + 1.1, ry - 3.4, 0.5, 1.4, 0.3, 0, 7); ctx.fill();
      }
      ctx.fillStyle = FUR; ctx.fillRect(ex - 10, ey - 10, 20, 19 * lid);
      ctx.restore();
      ctx.strokeStyle = OUT; ctx.lineWidth = 2.2;
      if (lid < 0.85) { ctx.beginPath(); ctx.ellipse(ex, ey, 8.4, 9, 0, 0, 7); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(ex, ey + 2, 7, 0.25, Math.PI - 0.25); ctx.stroke(); }
      if (lid > 0.05 && lid < 0.85) { ctx.beginPath(); ctx.moveTo(ex - 8.2, ey - 9 + 18 * lid); ctx.quadraticCurveTo(ex, ey - 7 + 18 * lid, ex + 8.2, ey - 9 + 18 * lid); ctx.stroke(); }
      ctx.fillStyle = 'rgba(231,169,184,0.5)'; ctx.beginPath(); ctx.ellipse(d * 18, -55, 4, 2.4, 0, 0, 7); ctx.fill();
    }
    // ротик: маленькое «о» или сжатая чёрточка
    ctx.strokeStyle = OUT; ctx.lineWidth = 1.8;
    if (o.mouth > 0.05) { ctx.fillStyle = '#5A2A36'; ctx.beginPath(); ctx.ellipse(0, -52, 2.2 * o.mouth + 0.8, 2.8 * o.mouth + 0.6, 0, 0, 7); ctx.fill(); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(-2.6, -52); ctx.lineTo(2.6, -52); ctx.stroke(); }
    // рогоз-микрофон в лапках
    const mx = lerp(16, 9, o.mic), my = lerp(-14, -40, o.mic), tilt = lerp(0.5, -0.15, o.mic);
    ctx.save(); ctx.translate(mx, my); ctx.rotate(tilt);
    ctx.strokeStyle = '#2E4A2A'; ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, -4); ctx.stroke();
    G.ellipse(ctx, 0, -12, 6.5, 11, { fill: '#7A5236', lw: 2, seed: 260, stroke: '#2A1A10', step: 5, hatch: { color: 'rgba(30,16,8,0.35)', gap: 3, angle: 0.3 } });
    for (let i = 0; i < 9; i++) dot(ctx, -5 + U.hash(i, 261) * 10, -22 + U.hash(i, 262) * 20, 1.4, 'rgba(240,230,210,0.7)'); // пух
    ctx.restore();
    for (const d of [-1, 1]) G.ellipse(ctx, mx + d * 5 - 2, my + 10, 5, 4.5, { fill: FUR, lw: 2, seed: 270 + d, stroke: OUT, step: 5 });
    ctx.restore();
  }
  function shState(t) {
    const whisp = [[ev.hello, ev.collect - 0.2], [ev.w1 - 0.2, ev.you + 1.2]];
    const micUp = sm(t, ev.phones + 0.6, ev.phones + 1.4) * (1 - sm(t, ev.you, ev.you + 1.0));
    // ротик шевелится только пока она шепчет звуки болота (w1-w3)
    let mouth = 0;
    for (const [a, b] of [[ev.w1, ev.w1 + 1.1], [ev.w2, ev.w2 + 0.85], [ev.w3, ev.w3 + 1.1]]) if (t >= a && t < b) mouth = 0.35 + 0.5 * Math.abs(Math.sin((t - a) * 11));
    let lids = 0.45, gx = 0, gy = 0.1;
    lids = lerp(lids, 0.62, sm(t, ev.near, ev.near + 2));
    lids = lerp(lids, 0.95, sm(t, ev.you + 0.6, ev.hush));                // закрывает глаза
    lids = lerp(lids, 0.0, sm(t, ev.look - 0.4, ev.look + 0.5));          // распахивает
    gx = lerp(0, 0.95, sm(t, ev.look, ev.look + 0.8)); gy = lerp(gy, -0.25, sm(t, ev.look, ev.look + 0.8)); // мимо нас, вправо
    const blink = [3.4, 8.1, 13.2, 18.6].some((b) => t > b && t < b + 0.14) && t < ev.you;
    if (blink) lids = 1;
    const earR = sm(t, ev.wX - 0.1, ev.wX + 0.5);                          // правое ухо поворачивается на шёпот
    const earL = bump(t, ev.w1, ev.w1 + 0.3, ev.w1 + 1.2) * 0.6;
    return { mic: micUp, mouth, lids, gx, gy, earL, earR: Math.max(earR, bump(t, ev.w2, ev.w2 + 0.3, ev.w2 + 1.2) * 0.6), refl: 0 };
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
  const REED = P(0.16, 0.72), DROP = P(0.82, 0.73), FROG = P(0.5, 0.84);
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
    ctx.fillStyle = '#1A1610'; ctx.fillRect(hx - 8 * q, hb - 40 * q, 16 * q, 13 * q);
    ctx.fillStyle = '#05070F'; ctx.fillRect(hx - 6 * q, hb - 20 * q, 12 * q, 20 * q);
    G.line(ctx, [[FF.x + 2 * k, FF.y + 28 * k], [FF.x, FF.y + 4 * k]], { color: '#0A1124', lw: 3 * k, seed: 840 });
    mossBlob(ctx, W * 0.62, H * 0.57, 80 * k, 18 * k, 402);
    mossBlob(ctx, SH.x, SH.y + 12 * k, 230 * k, 50 * k, 700);
    G.ellipse(ctx, DROP.x, DROP.y + 6 * k, 74 * k, 22 * k, { fill: '#2A5A48', lw: 2.5, seed: 721, stroke: '#0A1A16' });
    G.ellipse(ctx, FROG.x, FROG.y + 4 * k, 80 * k, 24 * k, { fill: '#2A5A48', lw: 2.5, seed: 722, stroke: '#0A1A16' });
    for (let i = 0; i < 6; i++) { const x = W * (i < 3 ? 0.02 + i * 0.05 : 0.86 + (i - 3) * 0.05), hh = (0.12 + 0.06 * U.hash(i, 64)) * H; G.line(ctx, [[x, H * 0.98], [x + 6 * k, H * 0.98 - hh * 0.5], [x + 14 * k * (i % 2 ? 1 : -1), H * 0.98 - hh]], { color: '#0A1A1C', lw: 7 * k, seed: 610 + i }); }
  }
  // камыш слева шуршит на «шорох»
  function reed(ctx, t) {
    const sway = bump(t, ev.w1 - 0.1, ev.w1 + 0.4, ev.w1 + 1.4) * Math.sin((t - ev.w1) * 18) * 14 * k;
    for (let i = 0; i < 4; i++) {
      const x = REED.x + (i - 1.5) * 18 * k, hh = (180 + 30 * U.hash(i, 81)) * k, s = sway * (0.6 + 0.4 * U.hash(i, 82));
      G.line(ctx, [[x, REED.y], [x + s * 0.4, REED.y - hh * 0.5], [x + s, REED.y - hh]], { color: '#0E2224', lw: 6 * k, seed: 800 + i });
      if (i % 2 === 0) { ctx.save(); ctx.translate(x + s, REED.y - hh); ctx.rotate(s / (80 * k)); G.ellipse(ctx, 0, 0, 7 * k, 20 * k, { fill: '#3A2A1E', lw: 1.5, seed: 810 + i, stroke: '#0A0806' }); ctx.restore(); }
    }
  }
  // капля росы справа: падает с листа камыша на кувшинку, круги
  function drop(ctx, t) {
    const lx = DROP.x + 20 * k, ly = DROP.y - 150 * k;
    G.line(ctx, [[lx + 30 * k, DROP.y + 30 * k], [lx + 10 * k, ly + 40 * k], [lx - 30 * k, ly]], { color: '#0E2224', lw: 5 * k, seed: 830 });
    const f = r01(t, ev.w2 - 0.25, ev.w2 + 0.1);
    if (t < ev.w2 + 0.1) {
      const y = lerp(ly + 4 * k, DROP.y - 4 * k, ease.inQuad(f)), r = 5 * k;
      dot(ctx, lx - 22 * k, y, r, 'rgba(190,235,245,0.95)'); glow(ctx, lx - 22 * k, y, 18 * k, COLD, 0.5);
    }
    const rp = r01(t, ev.w2 + 0.1, ev.w2 + 1.8);
    if (rp > 0 && rp < 1) for (let i = 0; i < 3; i++) {
      const q = clamp(rp * 1.4 - i * 0.2); if (q <= 0) continue;
      ctx.strokeStyle = `rgba(190,235,245,${0.6 * (1 - q)})`; ctx.lineWidth = 2 * k;
      ctx.beginPath(); ctx.ellipse(lx - 22 * k, DROP.y, 60 * k * q, 16 * k * q, 0, 0, 7); ctx.stroke();
    }
  }
  // лягушка в центре зевает
  function frog(ctx, t) {
    const yawn = bump(t, ev.w3, ev.w3 + 0.5, ev.w3 + 1.3);
    ctx.save(); ctx.translate(FROG.x - 120 * k, FROG.y - 8 * k); ctx.scale(k * 1.5, k * 1.5);
    G.ellipse(ctx, 0, 0, 18, 12, { fill: '#3E7A4A', lw: 2.2, seed: 780, stroke: '#0A1A0E' });
    for (const d of [-1, 1]) {
      G.ellipse(ctx, d * 9, -11, 6, 6, { fill: '#3E7A4A', lw: 2, seed: 781 + d, stroke: '#0A1A0E' });
      if (yawn > 0.3) { ctx.strokeStyle = '#0A1A0E'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(d * 9, -11, 3, 0.2, Math.PI - 0.2); ctx.stroke(); }
      else { dot(ctx, d * 9, -11, 3, '#08070C'); dot(ctx, d * 9 - 1, -12, 1, '#fff'); }
    }
    ctx.fillStyle = '#5A1A22'; ctx.beginPath(); ctx.ellipse(0, 2, 9 * (0.3 + yawn), 1 + 6 * yawn, 0, 0, 7); ctx.fill();
    ctx.restore();
  }
  function firefly(ctx, t) {
    const x = FF.x + Math.sin(t * 0.9) * 2 * k, y = FF.y + Math.sin(t * 1.4) * 1.5 * k;
    const live = t >= S.FLY[0][0] - 0.2 && t < S.FLY[S.FLY.length - 1][1] + 0.2;
    if (live && S.flyOn(t)) { glow(ctx, x, y, 34 * k, WARM, 0.95); dot(ctx, x, y, 3.6 * k, 'rgba(255,246,210,1)'); }
    else if (live) dot(ctx, x, y, 2 * k, 'rgba(255,200,116,0.35)');
    else { glow(ctx, x, y, 20 * k, WARM, 0.45 + 0.12 * Math.sin(t * 2.2)); dot(ctx, x, y, 2.4 * k, 'rgba(255,236,170,0.9)'); }
  }
  function fireflies(ctx, t) {
    for (let i = 0; i < 8; i++) {
      const bx = U.hash(i, 71) * W, by = HY + U.hash(i, 72) * H * 0.25;
      const x = bx + Math.sin(t * (0.3 + 0.2 * U.hash(i, 73)) + i) * 30 * k, y = by + Math.cos(t * (0.25 + 0.2 * U.hash(i, 74)) + i) * 16 * k;
      const a = (0.5 + 0.5 * Math.sin(t * (1 + U.hash(i, 75)) + i * 2)) * (1 - 0.8 * sm(t, ev.you, ev.hush));
      glow(ctx, x, y, 16 * k, WARM, 0.35 * a); dot(ctx, x, y, 1.8 * k, `rgba(255,236,170,${0.6 * a})`);
    }
  }
  // мокрая страница «Запись № 14» плывёт по воде на заднем плане
  function page14(ctx, t) {
    const p = r01(t, ev.collect, ev.alone + 1); if (p <= 0 || p >= 1) return;
    const x = lerp(1.05, 0.4, p) * W, y = H * 0.6 + Math.sin(t * 1.3) * 3 * k;
    ctx.save(); ctx.translate(x, y); ctx.rotate(0.1 + Math.sin(t * 0.8) * 0.05); ctx.scale(1, 0.42);
    ctx.globalAlpha = Math.min(1, p * 8, (1 - p) * 8) * 0.85;
    ctx.fillStyle = '#B9B6A6'; ctx.fillRect(-34 * k, -24 * k, 68 * k, 48 * k);
    ctx.strokeStyle = 'rgba(70,90,110,0.35)'; ctx.lineWidth = 1 * k;
    for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-34 * k, -24 * k + i * 8 * k); ctx.lineTo(34 * k, -24 * k + i * 8 * k); ctx.stroke(); }
    G.text(ctx, 'Запись № 14', -2 * k, -12 * k, { size: Math.round(11 * k), align: 'center', color: 'rgba(30,40,80,0.8)', boil: 0.3 });
    ctx.fillStyle = 'rgba(30,40,80,0.35)'; for (let i = 0; i < 3; i++) ctx.fillRect(-26 * k, 2 * k + i * 8 * k, (40 - i * 9) * k, 3 * k);
    ctx.restore();
  }
  // звуковые «волны» шёпота у её рта / в стороне звука
  function whisperRings(ctx, t, st) {
    for (const [a, side] of [[ev.w1, -1], [ev.w2, 1], [ev.w3, 0]]) {
      const p = r01(t, a, a + 1.4); if (p <= 0 || p >= 1) continue;
      const x = SH.x + side * W * 0.18 * p, y = SH.y - 105 * SHZ * 0.5;
      for (let i = 0; i < 3; i++) { const q = clamp(p * 1.6 - i * 0.25); if (q <= 0 || q >= 1) continue; ctx.strokeStyle = `rgba(200,225,240,${0.35 * (1 - q)})`; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(x, y, (20 + 60 * q) * k, side < 0 ? 2 : side > 0 ? -1.1 : -2.4, side < 0 ? 4.2 : side > 0 ? 1.1 : -0.7); ctx.stroke(); }
    }
  }
  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scn', scenery), 0, 0, W, H);
    page14(ctx, t);
    fireflies(ctx, t);
    firefly(ctx, t);
    reed(ctx, t); drop(ctx, t); frog(ctx, t);
    const st = shState(t);
    sheptunya(ctx, SH.x, SH.y, t, st, SHZ);
    whisperRings(ctx, t, st);
  }
  // камера: чуть ведёт за звуком, затем медленно наезжает
  const mx = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
  function clampCam(c) { const z = c[2], hw = W / (2 * z), top = H * 0.55 / z, bot = H * 0.45 / z; return [clamp(c[0], hw, W - hw), clamp(c[1], top, H - bot), z]; }
  function cam(t) {
    let c = clampCam([W / 2, H * 0.62, 1.25]);
    c = mx(c, clampCam([W * 0.42, H * 0.64, 1.3]), bump(t, ev.w1 - 0.2, ev.w1 + 0.5, ev.w2 - 0.1));
    c = mx(c, clampCam([W * 0.58, H * 0.64, 1.3]), bump(t, ev.w2 - 0.2, ev.w2 + 0.5, ev.w3 - 0.1));
    c = mx(c, clampCam([SH.x, SH.y - 150 * k, 2.1]), sm(t, ev.near, ev.hush));
    c = mx(c, clampCam([SH.x, SH.y - 160 * k, 2.6]), sm(t, ev.calm, ev.look + 0.8));
    return c;
  }
  function drawWorld(ctx, t) {
    const [cx, cy, z] = cam(t);
    ctx.save(); ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cx, -cy);
    world(ctx, t);
    ctx.restore();
  }
  // удар: вплотную к глазам, в зрачках - силуэт с ушками справа от камеры
  function closeUp(ctx, t) {
    ctx.save(); ctx.filter = `blur(${Math.round(18 * k)}px)`; ctx.drawImage(Studio.cache('scn', scenery), 0, 0, W, H); ctx.restore();
    ctx.fillStyle = 'rgba(3,4,12,0.55)'; ctx.fillRect(0, 0, W, H);
    const shake = (1 - r01(t, ev.hit, ev.hit + 0.4)) * 14 * k;
    const push = 1 + 0.06 * r01(t, ev.hit, ev.cut);
    const Z = 9.5 * k * push;
    const st = shState(t); st.lids = 0; st.gx = 0.95; st.gy = -0.25; st.mouth = 0; st.mic = 0; st.refl = 1; st.earR = 1;
    sheptunya(ctx, W / 2 + Math.sin(t * 61) * shake, H * 0.42 + 66 * Z + Math.cos(t * 53) * shake, t, st, Z);
    { const g = ctx.createLinearGradient(0, 0, 0, H * 0.4); g.addColorStop(0, 'rgba(3,4,12,0.7)'); g.addColorStop(1, 'rgba(3,4,12,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.4); }
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
      if (t < ev.endCut) pixelText(ctx, `● REC  ${S.LOG}:${String(4 + Math.floor(t - ev.title)).padStart(2, '0')}`, W / 2, y, sc, '#C9D2E8');
      else if (Math.floor(t * 6) % 7 !== 0) pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
      ctx.restore();
    }
    // шёпот в темноте: справа на миг проступает перистый усик
    const e = bump(t, ev.tail, ev.tail + 0.5, ev.tail + 1.3) * fade;
    if (e > 0) { ctx.save(); ctx.globalAlpha = e * 0.5; for (let i = 0; i < 8; i++) { ctx.strokeStyle = '#4A3A30'; ctx.lineWidth = 4 * k; ctx.beginPath(); ctx.moveTo(W * 0.97, H * (0.56 + i * 0.012)); ctx.lineTo(W * 0.92, H * (0.55 + i * 0.012)); ctx.stroke(); } ctx.restore(); }
    if (t >= ev.egg && t < ev.egg + 4 / S.FPS) pixelText(ctx, 'журнал: mercalova_top', W / 2, H * 0.76, Math.round(3 * k), '#8FA0C8');
  }

  Studio.film({
    draw(ctx, t) {
      if (t < ev.hit) drawWorld(ctx, t);
      else if (t < ev.dark) {
        closeUp(ctx, t);
        const fl = 1 - r01(t, ev.hit, ev.hit + 0.22);
        if (fl > 0) { ctx.fillStyle = `rgba(210,240,250,${0.6 * fl})`; ctx.fillRect(0, 0, W, H); }
      } else { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      const main = S.subtitles.filter((x) => !isTitle(x) && !x.right);
      Subs.draw(ctx, t, main, { style: 'clean', size: Math.round(62 * k), y: H * 0.22, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      // шёпот справа - мелко, у правого края
      Subs.draw(ctx, t, S.subtitles.filter((x) => x.right), { style: 'clean', size: Math.round(46 * k), y: H * 0.44, fam: 'Inter', maxW: W * 0.4, x: W * 0.8 });
      if (t >= ev.dark) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
