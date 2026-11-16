// «Одна ночь на Мерцаловой топи» - картинка. Каждый кадр - чистая функция от t.
// Мир - одна длинная панорама болота (x 0..8800). Камера за ночь проходит её слева направо.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs, CR = globalThis.CR;
  const { ev, A, Aend, EIGHTH } = S;
  const { clamp, lerp, ease } = U;
  const { glow, dot, orb, r01, sm } = CR;
  const W = G.W, H = G.H;
  const HY = 540;                                   // горизонт в мире
  const PORTRAIT = H > W;                           // Shorts 9:16: те же сцены, крупнее, без неба-перехода
  const bump = (t, a, b, c) => sm(t, a, b) * (1 - sm(t, b, c));
  const pop = (t, t0, d = 0.3) => { const p = r01(t, t0 - 0.03, t0 + d); return p <= 0 ? 0 : p >= 1 ? 1 : ease.outBack(p); };
  const WARM = '255,200,116', COLD = '170,255,150';

  // ---------- камера ----------
  // [начало, конец, x, y, z]; t1 === t0 - склейка
  const MOVES = [
    [0, 0, 900, 560, 1.0],
    [5.2, A(1, 3) - 0.4, 980, 560, 1.06],
    [A(1, 3) - 0.6, A(1, 3) + 1.4, 780, 640, 1.55],
    [A(1, 4) - 0.3, A(1, 4) + 1.4, 1170, 560, 1.22],
    [A(1, 5) - 1.2, A(1, 5) + 0.6, 1540, 470, 1.32],
    [A(1, 8) - 1.4, A(1, 8) + 1.6, 1020, 560, 1.0],
    [A(1, 9), ev.e1, 1100, 560, 1.04],
    // переход 1 -> глава 2
    [ev.c2 - 1.5, ev.c2 - 1.5, 2300, 620, 1.22],
    [ev.blow - 0.6, ev.blow + 1.2, 2240, 640, 1.45],
    [A(2, 5), A(2, 6) + 0.6, 2330, 620, 1.35],
    [ev.mute - 0.6, ev.mute + 1.0, 2560, 640, 1.42],
    [A(2, 9) - 1.2, A(2, 9) + 0.5, 3170, 600, 1.38],
    [ev.zubIn + 0.2, ev.zubIn + 2.0, 3360, 610, 1.32],
    [ev.zubNest - 0.6, ev.zubNest + 0.8, 3470, 620, 1.36],
    [ev.mokhSleep - 1.4, ev.mokhSleep + 0.2, 3880, 640, 1.5],
    [A(2, 19), A(2, 19) + 1.6, 3880, 650, 1.62],
    [ev.chainStart - 1.4, ev.chainStart + 0.2, 3170, 620, 0.78],
    [ev.toMimic - 0.2, ev.mimicEyes - 0.1, 3420, 620, 0.84],
    [ev.mimicEyes, ev.mimicEyes, 4180, 560, 2.3],
    [ev.mimicEyes, ev.e2, 4180, 560, 2.45],
    // переход 2 -> глава 3
    [ev.c3 - 1.5, ev.c3 - 1.5, 5200, 680, 1.12],
    [A(3, 2) - 0.5, A(3, 2) + 0.8, 5000, 680, 1.35],
    [A(3, 4) - 0.6, A(3, 4) + 0.8, 5110, 690, 1.6],
    [A(3, 7) - 0.6, A(3, 7) + 0.8, 5380, 650, 1.35],
    [ev.laughPop - 0.4, ev.laughPop + 0.6, 5300, 640, 1.38],
    [ev.sing - 0.4, ev.sing + 0.8, 5470, 660, 1.35],
    [A(3, 10) - 0.2, A(3, 10) + 1.0, 5200, 640, 1.38],
    [ev.candles - 0.8, ev.candles + 0.6, 5200, 630, 2.2],
    [ev.empty - 1.6, ev.empty + 0.4, 5330, 770, 1.85],
    [ev.empty + 0.4, ev.land, 5320, 760, 2.15],
    [ev.land + 0.2, ev.e3, 5320, 750, 2.25],
    // переход 3 -> глава 4
    [ev.c4 - 1.5, ev.c4 - 1.5, 6420, 640, 1.08],
    [A(4, 3) - 0.6, A(4, 3) + 0.8, 6350, 690, 1.4],
    [A(4, 4) - 0.6, A(4, 4) + 0.8, 6800, 690, 1.5],
    [A(4, 5) - 0.6, A(4, 5) + 0.8, 7200, 680, 1.48],
    [ev.jars[3] - 0.5, ev.jars[3] + 1.4, 7300, 690, 1.9],
    [A(4, 9) - 0.8, A(4, 9) + 0.6, 6800, 620, 0.95],
    [A(4, 12) - 1.4, ev.hush, 7330, 610, 1.28],
    [ev.hush, ev.e4, 7380, 610, 1.36],
    // переход 4 -> глава 5
    [ev.c5 - 1.5, ev.c5 - 1.5, 8150, 640, 1.0],
    [ev.ice - 0.4, ev.ice + 1.5, 8150, 620, 1.0],
    [A(5, 7) - 0.4, A(5, 7) + 1.0, 8180, 660, 1.5],
    [A(5, 8) - 0.6, A(5, 8) + 1.2, 8150, 760, 1.18],
    [A(5, 10) - 1.4, A(5, 10) + 0.4, 8150, 600, 0.95],
    [ev.down, ev.eye - 0.6, 8150, 850, 1.42],
    [ev.eye - 0.6, ev.dark, 8150, 855, 1.46],
  ];
  function cam(t) {
    let c = { x: MOVES[0][2], y: MOVES[0][3], z: MOVES[0][4] };
    for (const [t0, t1, x, y, z0] of MOVES) {
      if (t < t0) break;
      const z = z0 > 1.15 ? Math.min(2.7, 1 + (z0 - 1) * 1.7) : z0;
      const p = t1 <= t0 ? 1 : ease.inOutQuad(r01(t, t0, t1));
      c = { x: lerp(c.x, x, p), y: lerp(c.y, y, p), z: lerp(c.z, z, p) };
    }
    // чуть «дышит», как камера на штативе в болоте
    c.x += U.noise1(t * 0.15, 3) * 6; c.y += U.noise1(t * 0.12, 4) * 4;
    if (PORTRAIT) { c.z = Math.min(2.4, c.z * 1.55); c.y += 70; if (t > ev.empty - 1.6 && t < ev.e3 + 1) c.x += 30 * sm(t, ev.empty - 1.6, ev.empty); }
    return c;
  }
  const hyOf = (c) => H / 2 + (HY - c.y) * c.z;

  // ---------- время суток ----------
  const dusk = (t) => 1 - sm(t, ev.c1 + 4, A(1, 8));
  const dawn = (t) => sm(t, ev.c5 - 6, ev.c5 + 8);
  const snowAmt = (t) => sm(t, ev.snow + 1.5, ev.snow + 12) * (1 - 0.7 * sm(t, ev.c5 - 4, ev.c5 + 4));
  const whiteAmt = (t) => sm(t, ev.snow + 2, ev.e4 - 4);
  const iceAmt = (t) => 0.35 * sm(t, A(4, 9), ev.e4) + 0.65 * sm(t, ev.c5 - 2, ev.ice + 2);

  const toArr = (a) => (Array.isArray(a) ? a : [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)));
  const mixC = (a, b, p) => { const pa = toArr(a), pb = toArr(b); return pa.map((v, i) => lerp(v, pb[i], p)); };
  const rgb = (c) => `rgb(${c.map((v) => Math.round(v)).join(',')})`;
  const mixHex = (a, b, p) => rgb(mixC(a, b, p));

  // ---------- небо (экран) ----------
  const MX = W * 0.8, MY = H * 0.15, MR = 58;
  const moonCv = document.createElement('canvas'); moonCv.width = 520; moonCv.height = 520;
  // луна с укусами и крошками (R - радиус)
  function drawMoon(ctx, t, mx, my, R, alpha, glowA) {
    const left = S.moonLeft(t), w = dawn(t), m = moonCv.getContext('2d'), C0 = 260;
    m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, 520, 520);
    G.ellipse(m, C0, C0, R, R, { fill: mixHex('#EFF2E6', '#F4E6E0', w), lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
    for (const [cx, cy, cr] of [[-0.3, -0.2, 0.18], [0.25, 0.3, 0.12], [-0.1, 0.4, 0.09]]) G.ellipse(m, C0 + cx * R, C0 + cy * R, cr * R, cr * R, { fill: 'rgba(170,180,200,0.35)', lw: 1.2, seed: 3 + cx * 10, stroke: 'rgba(126,138,168,0.5)' });
    m.globalCompositeOperation = 'destination-out';
    const e = C0 + R * (2 * left - 1);
    m.fillRect(e + R * 0.2, 0, 520, 520);
    for (let j = -4; j <= 4; j++) { m.beginPath(); m.arc(e + R * 0.2, C0 + j * R * 0.36, R * 0.24, 0, 7); m.fill(); }
    m.globalCompositeOperation = 'source-over';
    glow(ctx, mx, my, R * 2.4, '150,170,220', glowA);
    ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(moonCv, mx - C0, my - C0); ctx.restore();
    ev.bites.forEach((b, i) => {
      const age = t - b; if (age < 0 || age > 2.4) return;
      const bx = mx + R * (2 * S.moonLeft(b + 0.01) - 1) + R * 0.2, by = my + R * 0.1, q = R / 58;
      for (let j = 0; j < 14; j++) {
        const vx = (U.hash(j, 50 + i) - 0.3) * 120 * q, vy = (U.hash(j, 60 + i) - 0.8) * 90 * q;
        const x = bx + vx * age, y = by + vy * age + 200 * q * age * age, a = Math.exp(-age * 1.3);
        dot(ctx, x, y, (1.6 + 1.8 * U.hash(j, 70)) * Math.sqrt(q), `rgba(245,248,230,${a})`); glow(ctx, x, y, 12 * q, '230,236,200', 0.4 * a);
      }
    });
  }
  function sky(ctx, t, c) {
    const hy = hyOf(c), d = dusk(t), w = dawn(t);
    const g = ctx.createLinearGradient(0, 0, 0, hy);
    g.addColorStop(0, mixHex('#0B1030', '#1A2350', w));
    g.addColorStop(0.7, mixHex(mixC('#1C2650', '#2A2F5E', d), '#4A4C7C', w));
    g.addColorStop(1, mixHex(mixC('#25325C', '#6A4E5E', d), '#8A7898', w));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, hy + 4);
    if (d > 0.01) { const wg = ctx.createLinearGradient(0, hy - 160, 0, hy); wg.addColorStop(0, 'rgba(255,170,110,0)'); wg.addColorStop(1, `rgba(255,170,110,${0.28 * d})`); ctx.fillStyle = wg; ctx.fillRect(0, hy - 160, W, 164); }
    const sa = (1 - 0.7 * d) * (1 - 0.85 * w);
    for (let i = 0; i < 120; i++) {
      const x = ((U.hash(i, 1) * W * 1.6 - c.x * 0.03) % W + W) % W, y = U.hash(i, 2) * hy * 0.85, r = 0.8 + U.hash(i, 3) * 1.6;
      ctx.fillStyle = `rgba(230,236,255,${(0.3 + 0.5 * U.hash(i, 4)) * sa * (0.75 + 0.25 * Math.sin(t * 1.3 + i))})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    const left = S.moonLeft(t), mx = MX - (c.x - 4000) * 0.012, my = MY + (c.y - 560) * 0.1;
    drawMoon(ctx, t, mx, my, MR, (1 - 0.35 * w), 0.25 * (0.4 + 0.6 * left) * (1 - 0.6 * d));
    return { mx, my };
  }

  // ---------- дальний план (параллакс) ----------
  const PF = 0.45;
  function spruce(ctx, x, base, h, fill, seed, stroke = '#070B1C') {
    const pts = []; const wd = h * 0.3;
    for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6]); }
    const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
    G.poly(ctx, [[x, base - h - 6], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke });
  }
  function snowCap(ctx, x, base, h, a) {
    if (a <= 0.02) return;
    ctx.fillStyle = `rgba(226,234,246,${0.75 * a})`;
    for (let s = 1; s <= 5; s++) { const yy = base - h + (h * s) / 5, ww = h * 0.3 * s / 5; ctx.beginPath(); ctx.ellipse(x, yy - 3, ww * 0.85, 4 + s, 0, Math.PI, 0); ctx.fill(); }
  }
  function far(ctx, t, c) {
    const zf = 1 + (c.z - 1) * 0.35, hy = hyOf(c);
    ctx.save(); ctx.translate(W / 2, hy); ctx.scale(zf, zf); ctx.translate(-c.x * PF, -HY);
    const L = c.x * PF - W / (2 * zf) - 200, R = c.x * PF + W / (2 * zf) + 200, wa = whiteAmt(t), w = dawn(t);
    const back = mixHex('#1A2547', '#2E3560', w), front = mixHex('#121A35', '#232A50', w);
    for (let i = Math.floor(L / 110); i <= Math.ceil(R / 110); i++) {
      const x = i * 110 + U.hash(i, 10) * 90, h = 120 + 80 * U.hash(i, 11);
      spruce(ctx, x, HY, h, back, 30 + (i & 63)); snowCap(ctx, x, HY, h, wa * 0.8);
    }
    // будка наблюдателя - окно тёмное
    const bx = 1150, bb = HY + 2;
    if (bx > L && bx < R) {
      G.poly(ctx, [[bx - 34, bb], [bx - 34, bb - 44], [bx, bb - 72], [bx + 34, bb - 44], [bx + 34, bb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
      ctx.fillStyle = '#05070F'; ctx.fillRect(bx - 9, bb - 40, 18, 16);
      G.line(ctx, [[bx - 22, bb], [bx - 26, bb + 26]], { color: '#05070F', lw: 4, seed: 91 });
      G.line(ctx, [[bx + 22, bb], [bx + 26, bb + 26]], { color: '#05070F', lw: 4, seed: 92 });
    }
    for (let i = Math.floor(L / 140); i <= Math.ceil(R / 140); i++) {
      const x = i * 140 + U.hash(i, 12) * 120, h = 85 + 60 * U.hash(i, 13);
      if (Math.abs(x - bx) < 60) continue;
      spruce(ctx, x, HY + 6, h, front, 60 + (i & 63)); snowCap(ctx, x, HY + 6, h, wa);
    }
    ctx.restore();
  }

  // ---------- вода (экран) ----------
  function water(ctx, t, c, moon) {
    const hy = hyOf(c), w = dawn(t);
    const wg = ctx.createLinearGradient(0, hy, 0, H);
    wg.addColorStop(0, mixHex('#16224A', '#3A4470', w)); wg.addColorStop(1, mixHex('#060A18', '#141A34', w));
    ctx.fillStyle = wg; ctx.fillRect(0, hy, W, H - hy + 2);
    for (let i = 0; i < 12; i++) {
      const y = hy + 16 + i * 22 * c.z, ww = (70 - i * 4) * (0.7 + 0.6 * U.hash(i, 40)) * c.z;
      if (y > H) break;
      G.line(ctx, [[moon.mx - ww, y], [moon.mx + ww, y]], { color: `rgba(200,215,240,${0.3 * S.moonLeft(t) + 0.05})`, lw: 2.5, seed: 200 + i });
    }
  }
  function iceOverlay(ctx, t, c) {
    const a = iceAmt(t); if (a <= 0.01) return;
    const hy = hyOf(c);
    ctx.save();
    const g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, `rgba(190,212,236,${0.3 * a})`); g.addColorStop(1, `rgba(150,180,215,${0.36 * a})`);
    ctx.fillStyle = g; ctx.fillRect(0, hy, W, H - hy + 2);
    ctx.restore();
  }

  // ---------- ближний план (мир) ----------
  function mossBlob(ctx, cx, cy, rx, ry, seed, t) {
    G.ellipse(ctx, cx, cy, rx, ry, { fill: '#1E4A47', lw: 3, seed, stroke: '#0A1A16', hatch: { color: 'rgba(0,0,0,0.22)', gap: 6, angle: 0.5 } });
    for (let i = 0; i < Math.round(rx / 8); i++) {
      const a = U.hash(seed, i) * 7, rr = Math.sqrt(U.hash(seed, i + 50));
      dot(ctx, cx + Math.cos(a) * rx * 0.85 * rr, cy + Math.sin(a) * ry * 0.75 * rr, (1.5 + 2 * U.hash(seed, i + 7)), U.hash(seed, i + 99) < 0.5 ? 'rgba(70,130,105,0.6)' : 'rgba(6,22,20,0.5)');
    }
    const wa = whiteAmt(t);
    if (wa > 0.02) { ctx.fillStyle = `rgba(228,236,248,${0.8 * wa})`; ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.35, rx * 0.86, ry * 0.55, 0, Math.PI, 0); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx, cy - ry * 0.35, rx * 0.86, ry * 0.18, 0, 0, Math.PI); ctx.fill(); }
  }
  function pad(ctx, x, y, rx, ry, seed, t) {
    G.ellipse(ctx, x, y, rx, ry, { fill: '#1E4A47', lw: 3.5, seed, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
    ctx.fillStyle = '#0B1530'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + rx * 1.05, y - ry * 0.28); ctx.lineTo(x + rx * 1.05, y + ry * 0.28); ctx.fill();
    const wa = whiteAmt(t);
    if (wa > 0.02) { ctx.fillStyle = `rgba(228,236,248,${0.7 * wa})`; ctx.beginPath(); ctx.ellipse(x - rx * 0.15, y - ry * 0.1, rx * 0.6, ry * 0.5, 0, 0, 7); ctx.fill(); }
  }
  function reed(ctx, x, base, h, lean, seed, t) {
    const sw = Math.sin(t * 0.9 + seed) * 4 * (1 - 0.6 * snowAmt(t));
    G.line(ctx, [[x, base], [x + lean * 0.5 + sw * 0.5, base - h * 0.5], [x + lean + sw, base - h]], { color: '#0A1124', lw: 5, seed: 300 + seed });
    if (U.hash(seed, 53) < 0.4) G.ellipse(ctx, x + lean * 0.95 + sw, base - h * 0.95, 7, 22, { fill: '#2A1C14', lw: 2, seed: 400 + seed, stroke: '#0A0A10' });
  }
  // пустые зоны, где стоят существа (там не сажаем случайные листья)
  const BUSY = [[600, 1450], [2050, 2850], [2950, 4300], [4650, 5750], [6050, 7400], [7700, 8650]];
  const busy = (x) => BUSY.some(([a, b]) => x > a && x < b);
  function ground(ctx, t, L, R, ci) {
    // камыши по дальнему берегу
    for (let i = Math.floor(L / 70); i <= Math.ceil(R / 70); i++) {
      const x = i * 70 + U.hash(i, 50) * 60, h = 50 + 80 * U.hash(i, 51), lean = (U.hash(i, 52) - 0.5) * 0.25 * h;
      reed(ctx, x, HY + 14, h, lean, i & 255, t);
    }
    // листья кувшинок в воде
    for (let i = Math.floor(L / 260); i <= Math.ceil(R / 260); i++) {
      const x = i * 260 + U.hash(i, 60) * 200, y = 640 + U.hash(i, 61) * 380;
      if ((busy(x) && y < 900) || (ci === 4 && x > 7550 && x < 8750 && y > 720)) continue;
      pad(ctx, x, y, 60 + 80 * U.hash(i, 62), 16 + 18 * U.hash(i, 63), 500 + (i & 255), t);
    }
  }
  function fgReeds(ctx, t, L, R, ci) {
    if (ci === 4) return;
    for (let i = Math.floor(L / 330); i <= Math.ceil(R / 330); i++) {
      if (U.hash(i, 80) < 0.45) continue;
      const x = i * 330 + U.hash(i, 81) * 200;
      for (let j = 0; j < 5; j++) reed(ctx, x + j * 14, 1180, 220 + 90 * U.hash(i, 82 + j), (U.hash(i, 90 + j) - 0.5) * 60, (i * 7 + j) & 255, t);
    }
  }

  // ---------- глава 1: Сумерки ----------
  const FON = { x: 1230, y: 790, s: 0.72 };
  function set1(ctx, t) {
    // Обманка вдали, рядом изредка сбивчиво мигает новый огонёк
    pad(ctx, 330, 668, 110, 24, 21, t);
    CR.lily(ctx, 330, 664, 0.42, 1, 0.85, 11);
    const fl = U.noise1(t * 3.1, 5) > 0.25 && Math.sin(t * 11) > -0.2 ? 1 : 0.15;
    glow(ctx, 392, 612, 46, COLD, 0.5 * fl); dot(ctx, 392, 612, 3.5, `rgba(230,255,215,${0.3 + 0.6 * fl})`);
    // кочка с Моховичками
    mossBlob(ctx, 765, 712, 175, 44, 31, t);
    const MP = [[650, 0.95], [690, 1.15], [728, 1.0], [770, 1.3], [812, 1.05], [850, 1.2], [888, 0.9]];
    MP.forEach(([x, s], i) => {
      const ct = S.caps[i];
      const g = t < ev.c1 ? 0.5 : lerp(0.5, 1, pop(t, ct, 0.35));
      CR.mush(ctx, x, 700 + (i % 2) * 6, 1.7 * s, t, { grow: g, awake: t > ct + 0.15 ? 1 : 0, seed: i * 3, yawn: bump(t, ct + 0.3, ct + 0.6, ct + 1.1) });
    });
    // лягушка
    pad(ctx, 1000, 790, 100, 24, 41, t);
    CR.frog(ctx, 1000, 788, 0.85, t, { sac: croakSac(t) });
    // Фонарница: огоньки на кончиках пальцев зажигаются один за другим
    CR.fonarnitsa(ctx, FON.x, FON.y, FON.s, t, {
      lit: (n) => (t < ev.c1 ? 0 : pop(t, S.lightsOn[n] || 0, 0.25) * (0.85 + 0.15 * Math.sin(t * 3 + n))),
      eyes: sm(t, S.lightsOn[8], S.lightsOn[8] + 1.5), nod: 0.1 * Math.sin(t * 0.4),
    });
    // Луноед на верхушке ели
    spruce(ctx, 1650, 735, 500, '#0C1430', 77, '#050815');
    const reach = bump(t, ev.bite1 - 0.8, ev.bite1 - 0.05, ev.bite1 + 0.5), chew = t > ev.bite1 && t < ev.bite1 + 1.6 ? 1 - (t - ev.bite1) / 1.6 : 0;
    CR.lunoed(ctx, 1652, 252, 0.5, t, { reach, chew, look: -0.2 + 0.4 * reach, moon: S.moonLeft(t) });
  }

  // кваканье: горловой мешок лягушки (звук - в song.js, тот же список)
  function croakSac(t) {
    let s = 0;
    for (const c of S.croaks) if (t >= c.t && t < c.t + 0.5) s = Math.max(s, Math.sin(Math.PI * (t - c.t) / 0.5));
    for (const c of S.muteCroaks) if (t >= c && t < c + 0.5) s = Math.max(s, Math.sin(Math.PI * (t - c) / 0.5));
    return s;
  }

  // ---------- глава 2: Кто кого ест ----------
  const PZ = { x: 2160, y: 800, s: 0.7 }, TS = { x: 2440, y: 772, s: 0.75 }, FR = { x: 2700, y: 800 };
  const BABY_X = [3030, 3100, 3170, 3240, 3310], BABY_Y = 742;
  const NEST = { x: 3560, y: 712 }, MOKH = { x: 3880, y: 792, s: 0.62 }, MIM = { x: 4180, y: 712, s: 0.38 };
  const ORBS = [[3060, 585, 0], [3150, 560, 1], [3240, 590, 2], [3330, 565, -1], [2990, 610, -1]];
  function tishkaLook(t) { return 0.15 * sm(t, ev.eat + 0.4, ev.eat + 1.2) + 0.85 * sm(t, ev.toMimic, ev.toMimic + 1); }
  function waterOver(ctx, x, y, rx, ry, a = 0.62) {
    ctx.save(); ctx.beginPath(); ctx.ellipse(x, y + ry, rx, ry, 0, 0, 7); ctx.clip();
    ctx.fillStyle = `rgba(14,24,56,${a})`; ctx.fillRect(x - rx, y, rx * 2, ry * 2); ctx.restore();
    ctx.strokeStyle = 'rgba(190,215,240,0.45)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 2, rx * 0.8, 6, 0, 0, 7); ctx.stroke();
  }
  function soundRings(ctx, t, x0, y0, t0, tEat, mouth) {
    // кольца звука летят ко рту Тишки и исчезают в нём
    const p = ease.inQuad(r01(t, t0, tEat));
    if (t < t0 || p >= 1) return;
    for (let j = 0; j < 3; j++) {
      const q = clamp(p * 1.1 - j * 0.06), x = lerp(x0, mouth[0], q), y = lerp(y0, mouth[1], q) - Math.sin(q * Math.PI) * 40;
      const r = lerp(16 + j * 9, 2, q);
      ctx.strokeStyle = `rgba(200,225,240,${0.6 * (1 - q * 0.5)})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.6, 0, 0, 7); ctx.stroke();
    }
  }
  function babyHop(i, t) {
    let h = 0;
    const ci = [1, 2, 3].indexOf(i);
    if (ci >= 0) { const c = ev.catch[ci]; if (t > c - 0.42 && t < c + 0.15) h = Math.max(h, Math.sin(Math.PI * r01(t, c - 0.42, c + 0.15)) * 60); }
    for (let k = 0; k < 3; k++) { const a = ev.laugh + k * 0.36 + i * 0.05; if (t > a && t < a + 0.3) h = Math.max(h, Math.sin(Math.PI * (t - a) / 0.3) * 22); }
    return h;
  }
  const TEETH = [0, 1, 2, 3, 4].map((i) => ({ i, t: ev.laugh + 0.2 + i * 0.17, x: BABY_X[i] + 6 }));
  function zubPos(t) {
    const P = [[ev.zubIn, 2900, 520], [ev.zubIn + 1.2, 3060, 690], [ev.zubIn + 2.0, 3200, 690], [ev.zubIn + 2.8, 3320, 690], [ev.zubNest, NEST.x - 20, NEST.y - 60]];
    if (t < P[0][0]) return null;
    for (let i = 1; i < P.length; i++) if (t < P[i][0]) { const p = ease.inOutQuad(r01(t, P[i - 1][0], P[i][0])); return [lerp(P[i - 1][1], P[i][1], p), lerp(P[i - 1][2], P[i][2], p) + Math.sin(t * 6) * 6]; }
    const L = P[P.length - 1]; return [L[1] + Math.sin(t * 0.9) * 14, L[2] + Math.sin(t * 2.1) * 6];
  }
  function arrow(ctx, a, b, p, bend = -80, col = 'rgba(232,238,255,0.8)', seed = 1) {
    if (p <= 0) return;
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + bend, N = 16, pts = [];
    for (let i = 0; i <= N * p; i++) { const u = i / N; pts.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1]]); }
    if (pts.length < 2) return;
    ctx.save(); ctx.setLineDash([14, 10]);
    G.line(ctx, pts, { color: col, lw: 3.5, seed });
    ctx.setLineDash([]);
    if (p >= 0.98) {
      const [x2, y2] = pts[pts.length - 1], [x1, y1] = pts[pts.length - 3] || pts[0], an = Math.atan2(y2 - y1, x2 - x1);
      G.line(ctx, [[x2 - Math.cos(an - 0.5) * 22, y2 - Math.sin(an - 0.5) * 22], [x2, y2], [x2 - Math.cos(an + 0.5) * 22, y2 - Math.sin(an + 0.5) * 22]], { color: col, lw: 3.5, seed: seed + 50 });
    }
    ctx.restore();
  }
  function set2(ctx, t) {
    // Пузырёк выглядывает из воды
    const puff = bump(t, ev.blow, ev.blow + 0.8, A(2, 4)) * 0.9;
    CR.puz(ctx, PZ.x, PZ.y, PZ.s, t, { puff, look: 0.6 });
    waterOver(ctx, PZ.x, PZ.y + 18, 70, 40);
    // пузырь с кваканьем
    const [bmx, bmy] = CR.puzMouth(PZ.x, PZ.y, PZ.s);
    if (t > ev.blow && t < ev.pop) {
      const g = sm(t, ev.blow, A(2, 3) + 0.4), fly = sm(t, A(2, 3) + 0.2, ev.pop);
      const x = lerp(bmx, 2320, fly), y = lerp(bmy - 30 * g, 600, fly) + Math.sin(t * 2) * 6;
      CR.bubble(ctx, x, y, 8 + 36 * g, 1, (c, cx, cy, r) => {
        for (let j = 0; j < 3; j++) { const q = ((t * 0.8 + j / 3) % 1); c.strokeStyle = `rgba(200,240,190,${0.7 * (1 - q)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy + r * 0.1, r * q * 0.8, r * q * 0.5, 0, 0, 7); c.stroke(); }
        CR.frog(c, cx, cy + r * 0.45, r / 110, t, { sac: 0.6 + 0.4 * Math.sin(t * 6) });
      });
    }
    if (t >= ev.pop && t < ev.pop + 0.5) { const a = 1 - r01(t, ev.pop, ev.pop + 0.5); for (let j = 0; j < 10; j++) { const an = j / 10 * 7, r = 40 + 70 * (t - ev.pop); dot(ctx, 2320 + Math.cos(an) * r, 600 + Math.sin(an) * r, 3, `rgba(210,235,250,${a})`); } }
    const tl = tishkaLook(t), tm = CR.tishkaMouth(TS.x, TS.y, TS.s, tl);
    soundRings(ctx, t, 2320, 600, ev.pop, ev.eat, tm);
    // Тишка на листе
    pad(ctx, TS.x + 10, TS.y + 4, 105, 24, 51, t);
    let mo = 0.12 + 0.85 * bump(t, ev.eat - 0.6, ev.eat, ev.eat + 0.25);
    for (const c of S.muteCroaks) mo = Math.max(mo, 0.7 * bump(t, c + 0.7, c + 1.05, c + 1.2));
    CR.tishka(ctx, TS.x, TS.y, TS.s, t, { look: tl, mouth: mo });
    // лягушка: после «без звука» - беззвучные кольца уходят Тишке
    pad(ctx, FR.x, FR.y + 2, 100, 24, 52, t);
    CR.frog(ctx, FR.x, FR.y, 1, t, { sac: croakSac(t), look: -0.5 });
    for (const c of S.muteCroaks) soundRings(ctx, t, FR.x + 20, FR.y - 20, c, c + 1.05, tm);
    // Улыбыши и огоньки-пальцы
    mossBlob(ctx, 3170, 752, 220, 46, 61, t);
    const fingersA = sm(t, ev.fingers - 0.3, ev.fingers + 0.4) * (1 - sm(t, A(2, 13), A(2, 13) + 1.2));
    ORBS.forEach(([ox, oy, ci], i) => {
      let x = ox + Math.sin(t * 0.7 + i) * 10, y = oy + Math.sin(t * 0.9 + i * 1.3) * 12;
      const caught = ci >= 0 && t >= ev.catch[ci];
      if (ci >= 0 && t > ev.catch[ci] - 0.4 && !caught) { const p = ease.inQuad(r01(t, ev.catch[ci] - 0.4, ev.catch[ci])); x = lerp(x, BABY_X[ci + 1], p); y = lerp(y, BABY_Y - 70 - babyHop(ci + 1, t), p); }
      if (fingersA > 0.01) {
        const bx = x - 520, by = 1150, mx = lerp(x, bx, 0.45) - 80, my = lerp(y, by, 0.3);
        ctx.save(); ctx.globalAlpha = fingersA;
        G.line(ctx, [[x, y + 6], [mx, my], [bx, by]], { color: '#070A14', lw: 9, seed: 800 + i });
        G.line(ctx, [[x + 2, y + 8], [mx + 3, my], [bx + 3, by]], { color: 'rgba(150,170,210,0.5)', lw: 2, seed: 850 + i });
        for (const f of [0.45, 1]) dot(ctx, lerp(x, mx, f), lerp(y, my, f), 7, '#0B1020');
        ctx.restore();
      }
      const regrow = caught ? pop(t, ev.regrow + i * 0.25, 0.4) : 1;
      if (!caught || t > ev.regrow) orb(ctx, x, y, 0.8 * regrow, regrow);
    });
    BABY_X.forEach((x, i) => CR.baby(ctx, x, BABY_Y, 0.72, t, { hop: babyHop(i, t), look: Math.sin(t * 0.5 + i) * 0.5 }, i));
    // зубки падают и лежат, пока их не подберут
    const zp = zubPos(t);
    TEETH.forEach((th) => {
      if (t < th.t) return;
      const fall = r01(t, th.t, th.t + 0.45), y0 = BABY_Y - 60, y1 = BABY_Y - 8;
      const picked = zp && t > ev.zubIn + 1.2 + (th.i / 4) * 1.6;
      if (picked) return;
      const y = lerp(y0, y1, fall * fall);
      CR.tiny(ctx, th.x, y, 2.2, fall * 3); glow(ctx, th.x, y, 18, '255,255,240', 0.35);
    });
    // гнездо и Зубочка
    CR.nest(ctx, NEST.x, NEST.y, 0.95, t, { extra: t > ev.zubNest + 0.3 ? 5 : 0 });
    if (zp) CR.zub(ctx, zp[0], zp[1], 0.95, t, { flap: true, tooth: t > ev.zubIn + 1.2 && t < ev.zubNest + 0.3 ? 1 : 0, look: 0.3 });
    // Мохнач спит спиной к нам; на глазах прорастают Моховички
    CR.mokhnachBack(ctx, MOKH.x, MOKH.y, MOKH.s, t, {
      open: (i) => 1 - sm(t, S.eyesOff[i] - 0.05, S.eyesOff[i] + 0.12),
      sprout: (i) => pop(t, S.eyesOff[i] - 0.08, 0.3),
      gaze: (i) => [U.noise1(t * 0.4 + i * 3, 7) * 0.5, U.noise1(t * 0.3 + i, 9) * 0.3],
    });
    // Подражатель в камышах
    const glowE = t >= ev.mimicEyes ? Math.max(0.35, 1 - (t - ev.mimicEyes) * 0.5) : 0;
    CR.mimic(ctx, MIM.x, MIM.y, MIM.s, t, { look: -0.6, lookY: 0.2, half: t >= ev.mimicEyes ? 1 : 0.55, glowEyes: glowE, mouth: 0 });
    for (let j = 0; j < 9; j++) reed(ctx, MIM.x - 70 + j * 18, MIM.y + 18, 120 + 60 * U.hash(j, 701), (U.hash(j, 702) - 0.5) * 30, 600 + j, t);
  }

  // ---------- глава 3: Праздник ----------
  const TB = { x: 5200, y: 705 };
  const GUEST = { babies: [5070, 5135, 5200, 5265, 5330].map((x) => [x, 686]), sob: [4990, 812], puz: [5480, 812], bay: [5625, 805], chair: [5380, 868], mokh: [4865, 790] };
  const PLATE = [5330, 730];
  function candles(ctx, t) {
    const twitch = t >= ev.twitch ? Math.exp(-(t - ev.twitch) * 1.6) : 0;
    for (let i = 0; i < 5; i++) {
      const bx = TB.x - 44 + i * 22, by = TB.y - 40 - Math.sin(i / 4 * Math.PI) * 8, L = 46 + (i % 2) * 6;
      const bend = twitch * (0.9 + 0.2 * i) * (i < 2 ? -1 : 1) * 0.6 + Math.sin(t * 1.3 + i) * 0.03;
      const jx = bx + Math.sin(bend * 0.5) * L * 0.55, jy = by - Math.cos(bend * 0.5) * L * 0.55;
      const tx = jx + Math.sin(bend * 1.6) * L * 0.45, ty = jy - Math.cos(bend * 1.6) * L * 0.45;
      G.line(ctx, [[bx, by], [jx, jy], [tx, ty]], { color: '#141A2C', lw: 5, seed: 1400 + i });
      dot(ctx, jx, jy, 3.6, '#0B1020');
      orb(ctx, tx, ty - 4, 0.75, 0.9 + 0.1 * Math.sin(t * 5 + i));
    }
  }
  function table(ctx, t) {
    G.poly(ctx, [[TB.x - 210, TB.y], [TB.x - 190, TB.y + 80], [TB.x + 190, TB.y + 80], [TB.x + 210, TB.y]], { fill: '#3A2A1E', lw: 3, seed: 1300, stroke: '#140D08', hatch: { color: 'rgba(0,0,0,0.3)', gap: 8, angle: 1.4 } });
    G.ellipse(ctx, TB.x, TB.y, 230, 46, { fill: '#5A4430', lw: 3.5, seed: 1301, stroke: '#140D08' });
    for (let r = 1; r < 4; r++) { ctx.strokeStyle = 'rgba(30,18,10,0.45)'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(TB.x + 10, TB.y + 2, 60 * r, 12 * r, 0, 0, 7); ctx.stroke(); }
    // торт из мха с ягодами
    G.ellipse(ctx, TB.x, TB.y - 14, 74, 22, { fill: '#173A37', lw: 3, seed: 1310, stroke: '#081615' });
    G.poly(ctx, [[TB.x - 70, TB.y - 14], [TB.x - 62, TB.y - 52], [TB.x + 62, TB.y - 52], [TB.x + 70, TB.y - 14]], { fill: '#1E4A47', lw: 3, seed: 1311, stroke: '#081615', hatch: { color: 'rgba(0,0,0,0.25)', gap: 6, angle: 0.5 } });
    G.ellipse(ctx, TB.x, TB.y - 52, 62, 16, { fill: '#2A6058', lw: 3, seed: 1312, stroke: '#081615' });
    for (let i = 0; i < 8; i++) dot(ctx, TB.x - 54 + i * 15, TB.y - 30 + (i % 2) * 8, 4.5, i % 3 ? '#B8344A' : '#E8C26A');
    candles(ctx, t);
    // подарки
    const items = [[CR.mitten, 5065, TB.y - 4, 1.0], [CR.key, 5122, TB.y + 6, 0.9], [CR.glasses, 5160, TB.y + 16, 0.85]];
    items.forEach(([fn, x, y, s], i) => {
      const g0 = ev.gift[i]; if (t < g0 - 0.35) return;
      const p = ease.outQuad(r01(t, g0 - 0.35, g0)), sx = GUEST.sob[0] + 10, sy = GUEST.sob[1] - 170;
      const xx = lerp(sx, x, p), yy = lerp(sy, y, p) - Math.sin(p * Math.PI) * 50;
      fn(ctx, xx, yy, s, fn === CR.mitten ? -0.3 : undefined);
    });
    // тарелка и кружка у пустого места
    G.ellipse(ctx, PLATE[0], PLATE[1], 34, 9, { fill: '#D9D2C0', lw: 2, seed: 1320, stroke: '#6A6050' });
    G.ellipse(ctx, PLATE[0], PLATE[1] - 1, 22, 5, { fill: '#C9C0AC', lw: 1, seed: 1321, stroke: '#8A8070' });
    G.poly(ctx, [[5370, 724], [5372, 696], [5394, 696], [5396, 724]], { fill: '#6A7A8C', lw: 2, seed: 1322, stroke: '#1A2028' });
    ctx.strokeStyle = '#1A2028'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(5399, 709, 7, -1.3, 1.3); ctx.stroke();
  }
  function fireflyToPlate(t) {
    if (t < ev.fly - 2) return null;
    const p = ease.inOutQuad(r01(t, ev.fly, ev.land));
    const x = lerp(4980, PLATE[0], p) + Math.sin(t * 2.3) * 40 * (1 - p), y = lerp(470, PLATE[1] - 8, p) + Math.sin(t * 3.1) * 26 * (1 - p);
    return [x, y];
  }
  function set3(ctx, t) {
    mossBlob(ctx, 5200, 805, 600, 125, 71, t);
    // Мохнач спиной: каждый глаз смотрит на своего гостя
    const targets = [...GUEST.babies, GUEST.sob, GUEST.puz, GUEST.bay, GUEST.chair];
    CR.mokhnachBack(ctx, GUEST.mokh[0], GUEST.mokh[1], 0.55, t, {
      gaze: (i) => {
        const e = CR.EYES[i], ex = GUEST.mokh[0] + e.x * 150 * 0.82 * 0.55, tg = targets[i % targets.length];
        return [clamp((tg[0] - ex) / 260, -0.6, 0.6) + U.noise1(t + i, 3) * 0.05, clamp((tg[1] - 700) / 200, -0.4, 0.4)];
      },
    });
    GUEST.babies.forEach(([x, y], i) => CR.baby(ctx, x, y, 0.62, t, { hop: Math.max(0, Math.sin(t * 2.2 + i)) * 4, look: 0 }, i + 2));
    table(ctx, t);
    // Собиралка с корзинкой
    CR.sobiralka(ctx, GUEST.sob[0], GUEST.sob[1], 0.75, t, { face: 1, reach: ev.gift.some((g) => t > g - 0.5 && t < g + 0.2) ? 1 : 0, items: t < ev.gift[0] ? 1 : 0 });
    // Пузырёк в лужице дарит пузырь со смехом
    G.ellipse(ctx, GUEST.puz[0], GUEST.puz[1] + 20, 95, 22, { fill: '#101C40', lw: 2.5, seed: 1330, stroke: '#060A18' });
    CR.puz(ctx, GUEST.puz[0], GUEST.puz[1], 0.55, t, { puff: bump(t, ev.laughBub - 0.8, ev.laughBub - 0.2, ev.laughBub + 0.4), look: -0.6 });
    waterOver(ctx, GUEST.puz[0], GUEST.puz[1] + 14, 60, 30, 0.55);
    if (t > ev.laughBub - 0.6 && t < ev.laughPop) {
      const g = sm(t, ev.laughBub - 0.6, ev.laughBub + 0.3), fly = sm(t, ev.laughBub + 0.2, ev.laughPop);
      const [mx, my] = CR.puzMouth(GUEST.puz[0], GUEST.puz[1], 0.55);
      const x = lerp(mx, 5250, fly), y = lerp(my - 26 * g, 590, fly) + Math.sin(t * 2.4) * 5, r = 8 + 32 * g;
      CR.bubble(ctx, x, y, r, 1, (c, cx, cy, rr) => {
        const j = Math.abs(Math.sin(t * 9)) * 2;
        c.strokeStyle = 'rgba(255,240,220,0.9)'; c.lineWidth = 2.2;
        for (const d of [-1, 1]) { c.beginPath(); c.arc(cx + d * rr * 0.3, cy - rr * 0.15, rr * 0.14, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
        c.fillStyle = 'rgba(60,20,30,0.9)'; c.beginPath(); c.ellipse(cx, cy + rr * 0.22, rr * 0.28, rr * (0.12 + 0.05 * j), 0, 0, 7); c.fill();
      });
    }
    if (t >= ev.laughPop && t < ev.laughPop + 0.5) { const a = 1 - r01(t, ev.laughPop, ev.laughPop + 0.5); for (let j = 0; j < 10; j++) { const an = j / 10 * 7, r = 30 + 70 * (t - ev.laughPop); dot(ctx, 5250 + Math.cos(an) * r, 590 + Math.sin(an) * r, 3, `rgba(210,235,250,${a})`); } }
    // Баюнок поёт
    const singing = t > ev.sing && t < ev.candles + 1 ? 1 : 0;
    CR.bayunok(ctx, GUEST.bay[0], GUEST.bay[1], 1.05, t, { sway: Math.sin(2 * Math.PI * (t - S.clock.OFFSET) / (S.BEAT * 4)) * (0.4 + 0.6 * singing), turn: -0.4, sing: singing, gx: -0.5 });
    // пустой стул с курткой (передний план)
    CR.jacketOnChair(ctx, GUEST.chair[0], GUEST.chair[1], 0.62, t);
    // огонёк садится на тарелку
    const ff = fireflyToPlate(t);
    if (ff) {
      const landed = t >= ev.land, pulse = landed ? 0.7 + 0.3 * Math.sin((t - ev.land) * 2.4) : 0.8 + 0.2 * Math.sin(t * 9);
      glow(ctx, ff[0], ff[1], landed ? 70 : 50, COLD, 0.6 * pulse); dot(ctx, ff[0], ff[1], 4.5, `rgba(230,255,215,${pulse})`);
      if (landed) glow(ctx, PLATE[0], PLATE[1], 60, COLD, 0.2 * pulse);
    }
  }

  // ---------- глава 4: Сборы к зиме ----------
  const LUMPS = [[6130, 770, 60, 26], [6280, 778, 52, 24], [6440, 774, 96, 28], [6580, 782, 44, 20]];
  const BURROW = { x: 6850, y: 765 }, PZ4 = { x: 7060, y: 818 }, JARS = [[7160, 736, 24], [7216, 732, 24], [7272, 736, 24], [7336, 730, 32]];
  const TS4 = { x: 7470, y: 660, s: 0.6 };
  const QCOL = ['#3E6B4A', '#5A7A4A', '#2F5A5A', '#6A8A5A'];
  function quilt(ctx, x, y, rx, ry, p, seed) {
    if (p <= 0) return;
    const yy = y - (1 - p) * 70, h = ry * 2.1;
    const pts = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14, a = Math.PI * u; pts.push([x - Math.cos(a) * rx * 1.18, yy + 4 - Math.sin(a) * h + (i % 2 ? 3 : 0)]); }
    pts.push([x + rx * 1.2, yy + 8]); pts.push([x - rx * 1.2, yy + 8]);
    G.poly(ctx, pts, { fill: QCOL[seed % 4], lw: 3, seed, stroke: '#0A1A16', hatch: { color: 'rgba(0,0,0,0.18)', gap: 8, angle: 0.5 } });
    // лоскуты и стёжка
    ctx.save(); ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.closePath(); ctx.clip();
    ctx.fillStyle = 'rgba(190,150,90,0.35)'; ctx.fillRect(x - rx * 0.2, yy - h, rx * 0.5, h);
    ctx.fillStyle = 'rgba(120,60,60,0.3)'; ctx.fillRect(x - rx * 1.2, yy - h * 0.45, rx * 0.7, h * 0.5);
    ctx.setLineDash([7, 6]); ctx.strokeStyle = 'rgba(230,240,220,0.6)'; ctx.lineWidth = 2;
    for (let j = -1; j <= 1; j++) { ctx.beginPath(); ctx.moveTo(x + j * rx * 0.5, yy - h * 1.1); ctx.lineTo(x + j * rx * 0.55, yy + 6); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - rx * 1.2, yy - h * 0.4); ctx.lineTo(x + rx * 1.2, yy - h * 0.4); ctx.stroke();
    ctx.setLineDash([]); ctx.restore();
  }
  function set4(ctx, t) {
    mossBlob(ctx, 6360, 790, 360, 60, 81, t);
    // то, что не успело уйти: лягушка, камень, что-то длинное (носок сапога торчит), кочка
    LUMPS.forEach(([x, y, rx, ry], i) => {
      const p = sm(t, ev.quilt[i] - 0.25, ev.quilt[i] + 0.05);
      if (p < 1) {
        if (i === 0) CR.frog(ctx, x, y, 0.75, t, { sleep: 1 });
        else if (i === 2) G.ellipse(ctx, x, y - ry * 0.4, rx, ry, { fill: '#141822', lw: 3, seed: 1601, stroke: '#05070C' });
        else G.ellipse(ctx, x, y - ry * 0.4, rx, ry, { fill: i === 1 ? '#4A4E5A' : '#1E4A47', lw: 3, seed: 1600 + i, stroke: '#101218' });
      }
      quilt(ctx, x, y, rx, ry, p, 1610 + i);
      if (i === 2) { // носок сапога всё равно торчит
        G.poly(ctx, [[x + rx * 1.02, y - 12], [x + rx * 1.3, y - 16], [x + rx * 1.38, y - 6], [x + rx * 1.02, y - 2]], { fill: '#2A2420', lw: 2.5, seed: 1620, stroke: '#0A0806' });
        if (whiteAmt(t) > 0.1) { ctx.fillStyle = `rgba(228,236,248,${0.7 * whiteAmt(t)})`; ctx.beginPath(); ctx.ellipse(x + rx * 1.2, y - 15, 16, 4, 0, 0, 7); ctx.fill(); }
      }
    });
    // Моховички тянут одеяльца
    for (let i = 0; i < 6; i++) {
      const L = LUMPS[i % 4], run = t > A(4, 3) - 0.5 && t < A(4, 9) + 3 ? Math.sin(t * 4 + i) * 22 : 0;
      const sleep = sm(t, A(4, 10), A(4, 11));
      CR.mush(ctx, L[0] - L[2] * 1.2 - 14 + (i >> 2) * L[2] * 2.6 + run, L[1] + 4, 1.5, t, { grow: 1, awake: sleep > 0.5 ? 0 : 1, seed: 40 + i, yawn: bump(t, A(4, 10) + i * 0.1, A(4, 10) + 0.4 + i * 0.1, A(4, 11)) });
    }
    // норка Собиралки
    mossBlob(ctx, BURROW.x, BURROW.y + 10, 120, 44, 85, t);
    G.ellipse(ctx, BURROW.x + 46, BURROW.y + 16, 24, 15, { fill: '#05070A', lw: 3, seed: 1630, stroke: '#0A1A16' });
    const sobX = lerp(6745, 6600, sm(t, A(4, 9), A(4, 9) + 2.5)), sobMoving = t > A(4, 9) && t < A(4, 9) + 2.5 ? 1 : 0;
    CR.sobiralka(ctx, sobX, 790, 0.8, t, { face: 1, walk: t * 2.2, moving: sobMoving, reach: ev.mittens.some((m) => t > m - 0.4 && t < m + 0.1) ? 1 : 0, items: t < ev.mittens[2] ? 1 : 0 });
    ev.mittens.forEach((m, i) => {
      if (t < m - 0.45 || t > m + 0.05) return;
      const p = ease.inQuad(r01(t, m - 0.45, m)), x = lerp(6745 - 10, BURROW.x + 46, p), y = lerp(790 - 180, BURROW.y + 16, p) - Math.sin(p * Math.PI) * 60;
      CR.mitten(ctx, x, y, 1.1, p * 4, ['#9A3E3A', '#3E5A9A', '#9A8A3A'][i]);
    });
    // Пузырёк закатывает звуки лета в пузыри
    G.ellipse(ctx, PZ4.x, PZ4.y + 20, 95, 22, { fill: '#101C40', lw: 2.5, seed: 1640, stroke: '#060A18' });
    CR.puz(ctx, PZ4.x, PZ4.y, 0.55, t, { puff: ev.jars.some((j) => t > j - 0.7 && t < j) ? 0.8 : 0, look: 0.7 });
    waterOver(ctx, PZ4.x, PZ4.y + 14, 60, 30, 0.55);
    mossBlob(ctx, 7250, 748, 140, 26, 89, t);
    JARS.forEach(([x, y, r], i) => {
      const g = pop(t, ev.jars[i], 0.4); if (g <= 0) return;
      CR.bubble(ctx, x, y - r * g, r * g, 1, (c, cx, cy, rr) => {
        if (i === 0) { for (let j = 0; j < 3; j++) { c.strokeStyle = 'rgba(255,230,160,0.8)'; c.lineWidth = 1.8; c.beginPath(); for (let k = 0; k <= 10; k++) { const xx = cx - rr * 0.6 + k * rr * 0.12, yy = cy - rr * 0.3 + j * rr * 0.3 + Math.sin(k * 2 + t * 8 + j) * 3; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); } }
        else if (i === 1) { for (let j = 0; j < 7; j++) { const yy = cy - rr + ((t * 60 + j * 23) % (rr * 2)); c.strokeStyle = 'rgba(170,210,255,0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - rr * 0.6 + j * rr * 0.2, yy); c.lineTo(cx - rr * 0.6 + j * rr * 0.2 - 2, yy + 7); c.stroke(); } }
        else if (i === 2) { for (let j = 0; j < 3; j++) { const q = ((t * 0.9 + j / 3) % 1); c.strokeStyle = `rgba(200,240,190,${0.8 * (1 - q)})`; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, cy, rr * q * 0.85, rr * q * 0.5, 0, 0, 7); c.stroke(); } }
        else { glow(c, cx, cy, rr * 1.4, WARM, 0.45); c.strokeStyle = 'rgba(255,220,170,0.95)'; c.lineWidth = 2.2; c.beginPath(); for (let k = 0; k <= 24; k++) { const xx = cx - rr * 0.7 + k * rr * 0.058, amp = Math.sin(k / 24 * Math.PI) * rr * 0.4 * (0.5 + 0.5 * Math.abs(Math.sin(t * 5 + k * 0.7))); k ? c.lineTo(xx, cy + (k % 2 ? amp : -amp)) : c.moveTo(xx, cy); } c.stroke(); }
      });
    });
    // Тишка на дальней кочке: «кто не уснёт, того услышат»
    const tsA = sm(t, A(4, 12) - 1.2, A(4, 12));
    if (tsA > 0) {
      ctx.save(); ctx.globalAlpha = tsA;
      mossBlob(ctx, TS4.x, TS4.y + 8, 60, 16, 87, t);
      const look = sm(t, ev.hush - 0.9, ev.hush - 0.3), mo = bump(t, ev.hush - 0.55, ev.hush, ev.hush + 0.4) * 0.9 + 0.1;
      CR.tishka(ctx, TS4.x, TS4.y, TS4.s, t, { look, mouth: mo, ear: -0.08 * look });
      ctx.restore();
    }
  }

  // ---------- глава 5: Рассвет ----------
  function eyeOpen(t) { return sm(t, ev.eye - 0.02, ev.eye + 0.14) * (1 - sm(t, ev.eyeShut - 0.7, ev.eyeShut)); }
  const EYE = { x: 8150, y: 785, rx: 480, ry: 225 };
  function underIce(ctx, t) {
    // спящие огоньки подо льдом; в тишине перед глазом гаснут по одному
    for (let i = 0; i < 11; i++) {
      const x = 7720 + i * 85 + U.hash(i, 300) * 50, y = 780 + U.hash(i, 301) * 260;
      const off = sm(t, ev.eye - 2.3 + i * 0.17, ev.eye - 2.15 + i * 0.17);
      const a = (0.25 + 0.1 * Math.sin(t * 0.8 + i * 1.7)) * (1 - off), flick = i === 5 ? (U.noise1(t * 2.6, 9) > 0.3 ? 1.6 : 0.4) : 1;
      glow(ctx, x, y, 60, COLD, a * flick); dot(ctx, x, y, 3, `rgba(230,255,215,${0.5 * a * flick})`);
    }
    const o = eyeOpen(t);
    if (o <= 0.005) return;
    const { x: ex, y: ey, rx } = EYE, ry = EYE.ry * o;
    // складки кожи вокруг глаза подо льдом
    ctx.strokeStyle = `rgba(20,22,16,${0.55 * o})`; ctx.lineWidth = 5;
    for (let j = 1; j <= 3; j++) { ctx.beginPath(); ctx.ellipse(ex, ey + 10 * j, rx + 40 * j, EYE.ry * o + 26 * j, 0, 0.12, Math.PI - 0.12); ctx.stroke(); }
    glow(ctx, ex, ey, 620, '200,180,110', 0.16 * o);
    ctx.save(); ctx.beginPath(); ctx.ellipse(ex, ey, rx, Math.max(1, ry), 0, 0, 7); ctx.clip();
    const sg = ctx.createRadialGradient(ex, ey, 60, ex, ey, rx); sg.addColorStop(0, '#A9A07C'); sg.addColorStop(0.6, '#7E7654'); sg.addColorStop(1, '#2E2A1C');
    ctx.fillStyle = sg; ctx.fillRect(ex - rx, ey - EYE.ry, rx * 2, EYE.ry * 2);
    // прожилки
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1, y0 = ey + (U.hash(i, 330) - 0.5) * EYE.ry * 1.4;
      let px = ex + side * rx, py = y0;
      ctx.strokeStyle = `rgba(140,40,30,${0.35 + 0.3 * U.hash(i, 331)})`; ctx.lineWidth = 2 + 2 * U.hash(i, 332);
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let j = 0; j < 6; j++) { px -= side * (30 + 25 * U.hash(i * 7 + j, 333)); py += (U.hash(i * 7 + j, 334) - 0.5) * 30 + (ey - py) * 0.12; ctx.lineTo(px, py); }
      ctx.stroke();
    }
    // радужка: мутная, болотная; зрачок круглый и сжимается, когда видит
    const lk = U.noise1(t * 1.3, 4) * 6, ix = ex + lk, iy = ey + 6, IR = 140;
    const ig = ctx.createRadialGradient(ix, iy, 10, ix, iy, IR);
    ig.addColorStop(0, '#1A1A0E'); ig.addColorStop(0.35, '#6E5A26'); ig.addColorStop(0.7, '#3E4A26'); ig.addColorStop(1, '#141810');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(ix, iy, IR, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(200,170,90,0.35)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 46; i++) { const an = i / 46 * 7 + U.hash(i, 340) * 0.1, r0 = 45 + 10 * U.hash(i, 341), r1 = IR * (0.8 + 0.18 * U.hash(i, 342)); ctx.beginPath(); ctx.moveTo(ix + Math.cos(an) * r0, iy + Math.sin(an) * r0); ctx.lineTo(ix + Math.cos(an) * r1, iy + Math.sin(an) * r1); ctx.stroke(); }
    const pr = lerp(52, 17, sm(t, ev.eye + 0.45, ev.eye + 1.1));
    dot(ctx, ix, iy, pr, '#020302');
    dot(ctx, ix - 48, iy - 52, 11, 'rgba(255,255,240,0.55)'); dot(ctx, ix - 30, iy - 60, 4, 'rgba(255,255,240,0.5)');
    // тень верхнего века-берега
    ctx.fillStyle = 'rgba(150,180,215,0.12)'; ctx.fillRect(ex - rx, ey - EYE.ry, rx * 2, EYE.ry * 2);
    const sh = ctx.createLinearGradient(0, ey - ry, 0, ey - ry + 120); sh.addColorStop(0, 'rgba(10,12,8,0.75)'); sh.addColorStop(1, 'rgba(10,12,8,0)');
    ctx.fillStyle = sh; ctx.fillRect(ex - rx, ey - ry, rx * 2, 120);
    ctx.restore();
    ctx.strokeStyle = '#141208'; ctx.lineWidth = 9; ctx.beginPath(); ctx.ellipse(ex, ey, rx, Math.max(1, ry), 0, 0, Math.PI); ctx.stroke();
    // лёд трескается от глаза
    const cr = r01(t, ev.eye, ev.eye + 0.9);
    ctx.strokeStyle = `rgba(240,248,255,${0.7 * o})`; ctx.lineWidth = 2.5;
    for (let i = 0; i < 9; i++) {
      const an = Math.PI * (0.1 + 0.8 * (i / 8)), L = (260 + 160 * U.hash(i, 350)) * cr;
      let px = ex + Math.cos(an) * rx * 0.8, py = ey + Math.sin(an) * EYE.ry * 0.6;
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let j = 1; j <= 4; j++) { px += Math.cos(an + (U.hash(i * 5 + j, 351) - 0.5)) * L / 4; py += Math.sin(an + (U.hash(i * 5 + j, 352) - 0.5)) * L / 4; ctx.lineTo(px, py); }
      ctx.stroke();
    }
  }
  function cracks(ctx, t) {
    const a = iceAmt(t); if (a < 0.05) return;
    ctx.strokeStyle = `rgba(235,245,255,${0.45 * a})`; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      let x = 7700 + i * 130 + U.hash(i, 310) * 80, y = 700 + U.hash(i, 311) * 300;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let j = 0; j < 5; j++) { x += (U.hash(i * 9 + j, 312) - 0.5) * 120; y += (U.hash(i * 9 + j, 313) - 0.3) * 50; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  function set5over(ctx, t) {
    // берег со спящими - это верхнее веко: поднимается, когда глаз открывается
    const lid = eyeOpen(t);
    ctx.save(); ctx.translate(8150, 700); ctx.rotate(-0.015 * lid); ctx.translate(-8150, -700 + -70 * lid + Math.sin(t * 40) * 3 * lid * (1 - r01(t, ev.eye, ev.eye + 0.6)));
    mossBlob(ctx, 8150, 690, 520, 40, 91, t);
    [7840, 7905, 7970].forEach((x, i) => CR.baby(ctx, x, 690, 0.5, t, { sleep: 1 }, i));
    CR.mossMound(ctx, 8070, 702, 0.45, t);
    for (let i = 0; i < 4; i++) CR.mush(ctx, 8200 + i * 22, 690, 1.4, t, { grow: 0.8, awake: 0, seed: 60 + i });
    CR.sobiralka(ctx, 8390, 700, 0.5, t, { sleep: 1, face: 0 });
    // Баюнок - единственный не спит
    CR.bayunok(ctx, 8545, 700, 0.75, t, { sway: Math.sin(t * 0.8) * 0.2, turn: 0.2, gx: 0.3, gy: 0.4 });
    // тёмная кромка века под берегом
    if (lid > 0.01) { ctx.fillStyle = `rgba(20,20,12,${0.9 * lid})`; ctx.beginPath(); ctx.ellipse(8150, 735, 500, 26 * lid, 0, 0, Math.PI); ctx.fill(); }
    ctx.restore();
    cracks(ctx, t);
  }


  // ---------- страница журнала «кто кого ест» ----------
  const INKC = '#24356A';
  function pen(ctx, pts, p, seed, lw = 3) {
    if (p <= 0) return;
    const n = Math.max(2, Math.ceil(pts.length * p));
    G.line(ctx, pts.slice(0, n), { color: INKC, lw, seed });
  }
  function penArrow(ctx, a, b, p, bend, seed) {
    if (p <= 0) return;
    const mx = (a[0] + b[0]) / 2 + bend[0], my = (a[1] + b[1]) / 2 + bend[1], N = 18, pts = [];
    for (let i = 0; i <= N; i++) { const u = i / N; pts.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1]]); }
    pen(ctx, pts, p, seed);
    if (p >= 0.98) { const [x2, y2] = pts[N], [x1, y1] = pts[N - 2], an = Math.atan2(y2 - y1, x2 - x1); G.line(ctx, [[x2 - Math.cos(an - 0.45) * 22, y2 - Math.sin(an - 0.45) * 22], [x2, y2], [x2 - Math.cos(an + 0.45) * 22, y2 - Math.sin(an + 0.45) * 22]], { color: INKC, lw: 3, seed: seed + 50 }); }
  }
  function word(ctx, text, x, y, a, size = 44, rot = 0) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
    G.text(ctx, text, 0, 0, { size, fam: 'Caveat', weight: 700, color: INKC, align: 'center', boil: 0.5 });
    ctx.restore();
  }
  function journalPage(ctx, t) {
    const t0 = ev.chainStart - 0.9;
    if (t < t0 || t >= ev.mimicEyes) return;
    const sl = ease.outQuad(r01(t, t0, t0 + 0.7));
    ctx.save(); ctx.fillStyle = `rgba(3,4,10,${0.45 * sl})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    const PW = 1180, PH = 720, cx = W / 2, cy = H * (PORTRAIT ? 0.5 : 0.455) + (1 - sl) * H * 0.7;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.018); if (PORTRAIT) ctx.scale((W - 70) / PW, (W - 70) / PW);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-PW / 2 + 12, -PH / 2 + 16, PW, PH);
    ctx.fillStyle = '#E9DFC6'; ctx.fillRect(-PW / 2, -PH / 2, PW, PH);
    ctx.strokeStyle = 'rgba(120,140,180,0.25)'; ctx.lineWidth = 1.5;
    for (let y = -PH / 2 + 110; y < PH / 2 - 20; y += 44) { ctx.beginPath(); ctx.moveTo(-PW / 2 + 30, y); ctx.lineTo(PW / 2 - 30, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(190,80,80,0.35)'; ctx.beginPath(); ctx.moveTo(-PW / 2 + 90, -PH / 2); ctx.lineTo(-PW / 2 + 90, PH / 2); ctx.stroke();
    for (const [x, y, r] of [[-PW / 2 + 40, -PH / 2 + 10, -0.5], [PW / 2 - 40, -PH / 2 + 10, 0.5]]) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = 'rgba(230,220,170,0.75)'; ctx.fillRect(-55, -16, 110, 32); ctx.restore(); }
    ctx.fillStyle = '#2A2018'; ctx.font = 'bold 30px monospace'; ctx.textAlign = 'left'; ctx.fillText('Кто кого ест (ночные наблюдения)', -PW / 2 + 120, -PH / 2 + 78);
    // кто -> кого: стрелка от того, кто ест, к тому, что он ест
    const A_ = S.arrows, pr = (i) => r01(t, A_[i] - 0.25, A_[i] + 0.35), nm = (i) => sm(t, A_[i] - 0.5, A_[i] - 0.2);
    const ROWS = [
      ['Тишка', 'звук Пузырька', -170],
      ['Улыбыши', 'пальцы Фонарницы', -60],
      ['Зубочка', 'зубки Улыбышей', 50],
      ['Моховички', 'Мохнач', 160],
    ];
    ROWS.forEach(([who, what, y], i) => {
      word(ctx, who, -330, y + 14, nm(i), 50, -0.02);
      penArrow(ctx, [-200, y], [40, y], pr(i), [0, -18], 1700 + i * 7);
      word(ctx, what, 210, y + 14, sm(t, A_[i] + 0.2, A_[i] + 0.5), 44, 0.01);
    });
    // Подражатель - в углу, ни одна стрелка к нему не ведёт
    const M = S.arrowsToMimic, mx = 380, my = 270;
    word(ctx, 'Подражатель', mx, my + 12, sm(t, ev.toMimic - 0.5, ev.toMimic), 50, -0.04);
    const loops = r01(t, M[0], M[5] + 0.3);
    if (loops > 0) {
      const pts = []; for (let i = 0; i <= 90; i++) { const u = i / 90, an = -2.4 + u * Math.PI * 2 * 2.6; pts.push([mx + Math.cos(an) * (150 + 10 * Math.sin(u * 13)), my + Math.sin(an) * (52 + 6 * Math.cos(u * 11))]); }
      pen(ctx, pts, loops, 1790, 3.2);
    }
    word(ctx, 'а его?..', mx - 290, my + 16, sm(t, M[5] + 0.2, M[5] + 0.6), 50, -0.06);
    ctx.restore();
  }


  // ---------- концовка Shorts: вместо неба - журнал записи и название главы ----------
  const SHORT_LOG = ['21:06', '23:14', '00:31', '04:48', '06:12'];
  function shortEnd(ctx, t) {
    for (let i = 0; i < 4; i++) {
      const e = S.CH[i].end, c = S.CH[i + 1].start;
      if (t < e + 0.9 || t >= c) continue;
      const a = r01(t, e + 0.9, e + 1.2);
      ctx.save(); ctx.globalAlpha = a;
      const blink = Math.floor((t - e) * 2) % 2 === 0;
      pixelText(ctx, `${blink ? '●' : ' '} REC  ${SHORT_LOG[i]}:${String(7 + Math.floor(t - e)).padStart(2, '0')}`, W / 2, H * 0.44, 4, '#C9D2E8');
      ctx.globalAlpha = a * sm(t, e + 1.3, e + 1.8);
      G.text(ctx, 'Одна ночь на Мерцаловой топи', W / 2, H * 0.53, { size: 50, fam: 'Inter', weight: 800, color: '#EEF1F8', align: 'center', boil: 0 });
      G.text(ctx, `глава ${['I', 'II', 'III', 'IV', 'V'][i]} · ${S.CH[i].name}`, W / 2, H * 0.53 + 64, { size: 38, fam: 'Inter', weight: 600, color: '#AEB8D2', align: 'center', boil: 0 });
      ctx.restore();
    }
  }

  // ---------- титры ----------
  function cardText(ctx, t, t0, dur, small, big) {
    const a = sm(t, t0, t0 + 0.8) * (1 - sm(t, t0 + dur - 0.8, t0 + dur));
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const bcx = small === 'I' ? W / 2 : W * 0.28, bg = ctx.createRadialGradient(bcx, H * 0.43, 20, bcx, H * 0.43, 620); bg.addColorStop(0, 'rgba(3,5,14,0.55)'); bg.addColorStop(1, 'rgba(3,5,14,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    const cx = small === 'I' ? W / 2 : W * 0.28;
    G.text(ctx, small, cx, H * 0.4, { size: 34, fam: 'Inter', weight: 700, color: '#C9D2E8', align: 'center', boil: 0 });
    G.text(ctx, big, cx, H * 0.4 + 82, { size: 70, fam: 'Inter', weight: 800, color: '#EEF1F8', align: 'center', boil: 0 });
    ctx.strokeStyle = 'rgba(201,210,232,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 90, H * 0.4 + 18); ctx.lineTo(cx + 90, H * 0.4 + 18); ctx.stroke();
    ctx.restore();
  }
  const pix = document.createElement('canvas');
  function pixelText(ctx, text, cx, cy, scale, color) {
    const fs = 11, px = pix.getContext('2d'); px.font = `bold ${fs}px monospace`;
    const w = Math.ceil(px.measureText(text).width) + 4; pix.width = w; pix.height = fs + 6;
    px.font = `bold ${fs}px monospace`; px.textBaseline = 'top'; px.fillStyle = color; px.fillText(text, 2, 2);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pix, Math.round(cx - (w * scale) / 2), Math.round(cy - (pix.height * scale) / 2), w * scale, pix.height * scale);
    ctx.restore();
  }

  // ---------- снег (экран) ----------
  function snow(ctx, t) {
    const a = snowAmt(t); if (a <= 0.01) return;
    const n = Math.round(160 * a);
    for (let i = 0; i < n; i++) {
      const sp = 40 + 50 * U.hash(i, 401), r = 1.5 + 2.8 * U.hash(i, 402);
      const y = ((U.hash(i, 403) * (H + 60) + t * sp) % (H + 60)) - 30, x = ((U.hash(i, 404) * W + Math.sin(t * 0.6 + i) * 30 - t * 8) % W + W) % W;
      dot(ctx, x, y, r * 1.5, `rgba(235,240,250,${0.8 * a * (0.5 + 0.5 * U.hash(i, 405))})`);
    }
  }
  // первая снежинка - одна, крупная, медленно падает в центр кадра
  function firstFlake(ctx, t) {
    const t0 = A(4, 2) - 0.3, t1 = t0 + 5.5;
    if (t < t0 || t > t1) return;
    const p = r01(t, t0, t1), x = W * 0.52 + Math.sin(p * 9) * 60, y = lerp(-20, H * 0.72, p), a = 1 - sm(t, t1 - 0.8, t1);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 0.6); ctx.strokeStyle = `rgba(240,245,255,${0.95 * a})`; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -16); ctx.moveTo(0, -9); ctx.lineTo(-5, -14); ctx.moveTo(0, -9); ctx.lineTo(5, -14); ctx.stroke(); }
    ctx.restore(); glow(ctx, x, y, 40, '230,240,255', 0.3 * a);
  }

  // ---------- густота: туман, кочки, коряги, ряска, светлячки, рамка ----------
  function fog(ctx, t, c) {
    const hy = hyOf(c), w = dawn(t);
    for (let i = 0; i < 16; i++) {
      const x = ((i * 190 + U.hash(i, 600) * 120 - c.x * 0.3 + t * (6 + 4 * U.hash(i, 601))) % (W + 600) + W + 600) % (W + 600) - 300;
      const y = hy + (U.hash(i, 602) - 0.4) * 50 * c.z, r = (150 + 120 * U.hash(i, 603)) * c.z;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      const col = w > 0.5 ? '200,190,215' : '140,160,205';
      g.addColorStop(0, `rgba(${col},${0.13 + 0.05 * w})`); g.addColorStop(1, `rgba(${col},0)`);
      ctx.fillStyle = g; ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.32); ctx.translate(-x, -y); ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
    }
  }
  function tufts(ctx, cx, cy, rx, seed, t) {
    const n = Math.round(rx / 9);
    for (let i = 0; i < n; i++) {
      const x = cx + (U.hash(seed, i + 200) - 0.5) * rx * 1.7, h = 10 + 16 * U.hash(seed, i + 201), lean = (U.hash(seed, i + 202) - 0.5) * 10 + Math.sin(t * 1.1 + i) * 1.5;
      ctx.strokeStyle = U.hash(seed, i + 203) < 0.5 ? '#2E5A3E' : '#18342C'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x, cy); ctx.quadraticCurveTo(x + lean * 0.3, cy - h * 0.6, x + lean, cy - h); ctx.stroke();
    }
  }
  function snag(ctx, x, base, h, seed) {
    G.line(ctx, [[x, base], [x + 6, base - h * 0.5], [x - 4, base - h]], { color: '#0A0F20', lw: 9, seed });
    G.line(ctx, [[x + 3, base - h * 0.55], [x + 38, base - h * 0.75], [x + 52, base - h * 0.72]], { color: '#0A0F20', lw: 5, seed: seed + 1 });
    G.line(ctx, [[x - 2, base - h * 0.78], [x - 34, base - h * 0.95]], { color: '#0A0F20', lw: 4, seed: seed + 2 });
  }
  function details(ctx, t, L, R, ci) {
    // кочки с травой вдоль дальнего берега, коряги
    for (let i = Math.floor(L / 170); i <= Math.ceil(R / 170); i++) {
      const x = i * 170 + U.hash(i, 610) * 120, y = 588 + U.hash(i, 611) * 30, rx = 40 + 50 * U.hash(i, 612);
      G.ellipse(ctx, x, y, rx, rx * 0.22, { fill: '#13302E', lw: 2.5, seed: 620 + (i & 127), stroke: '#081615' });
      tufts(ctx, x, y - rx * 0.1, rx, 630 + (i & 127), t);
      if (U.hash(i, 613) < 0.18) snag(ctx, x + 20, y - 2, 120 + 90 * U.hash(i, 614), 650 + (i & 63));
    }
    // ряска и рябь
    for (let i = Math.floor(L / 120); i <= Math.ceil(R / 120); i++) {
      const x = i * 120 + U.hash(i, 640) * 100, y = 650 + U.hash(i, 641) * 420;
      if ((busy(x) && y < 880) || ci === 4) continue;
      for (let j = 0; j < 7; j++) dot(ctx, x + (U.hash(i * 9 + j, 642) - 0.5) * 60, y + (U.hash(i * 9 + j, 643) - 0.5) * 14, 2 + 2 * U.hash(i * 9 + j, 644), 'rgba(60,110,80,0.7)');
      ctx.strokeStyle = 'rgba(170,195,230,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x + 40, y + 20, 30 + 10 * Math.sin(t + i), 5, 0, 0, 7); ctx.stroke();
    }
    // камыши в середине воды (там, где нет существ) и кочки на переднем плане
    for (let i = Math.floor(L / 260); i <= Math.ceil(R / 260); i++) {
      const x = i * 260 + U.hash(i, 660) * 160, y = 720 + U.hash(i, 661) * 200;
      if (busy(x) || ci === 4) continue;
      mossBlob(ctx, x, y + 6, 60, 16, 670 + (i & 63), t); tufts(ctx, x, y, 60, 680 + (i & 63), t);
      for (let j = 0; j < 5; j++) reed(ctx, x - 30 + j * 14, y, 90 + 70 * U.hash(i * 5 + j, 662), (U.hash(i * 5 + j, 663) - 0.5) * 30, (i * 5 + j + 40) & 255, t);
    }
    for (let i = Math.floor(L / 420); i <= Math.ceil(R / 420); i++) {
      const x = i * 420 + U.hash(i, 690) * 240, y = 1050 + U.hash(i, 691) * 60;
      if (ci === 4) continue;
      mossBlob(ctx, x, y, 140, 34, 700 + (i & 63), t); tufts(ctx, x, y - 10, 140, 710 + (i & 63), t);
    }
    // летающие светлячки (зимой их нет)
    const fa = [1, 1, 0.9, 0.3, 0][ci];
    if (fa > 0) for (let i = Math.floor(L / 150); i <= Math.ceil(R / 150); i++) {
      if (U.hash(i, 720) < 0.35) continue;
      const x = i * 150 + U.hash(i, 721) * 120 + U.noise1(t * 0.25 + i, 3) * 60, y = 560 + U.hash(i, 722) * 300 + U.noise1(t * 0.3 + i, 4) * 40;
      const tw = 0.5 + 0.5 * Math.sin(t * (1.5 + U.hash(i, 723)) + i);
      glow(ctx, x, y, 26, U.hash(i, 724) < 0.3 ? COLD : WARM, 0.35 * tw * fa); dot(ctx, x, y, 2.2, `rgba(255,240,200,${0.8 * tw * fa})`);
    }
  }
  // рамка кадра: тёмные ветви сверху по углам и трава снизу (экран)
  function frame(ctx, t, c) {
    const wa = whiteAmt(t), sway = Math.sin(t * 0.5) * 6;
    // тяжёлые еловые лапы свисают сверху по углам
    const bough = (x0, y0, dir, len, droop, seed) => {
      const N = 22, up = [], low = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N, x = x0 + dir * len * u, y = y0 + droop * u * u + Math.sin(t * 0.5 + seed) * 4 * u;
        const th = 14 * (1 - u) + 4, hang = (46 * (1 - u * 0.7) + 10) * (i % 2 ? 1 : 0.55);
        up.push([x, y - th]); low.push([x + dir * 6, y + hang]);
      }
      G.poly(ctx, [...up, ...low.reverse()], { fill: '#02040A', lw: 2, seed, stroke: '#02040A' });
      if (wa > 0.05) { ctx.fillStyle = `rgba(226,234,246,${0.8 * wa})`; for (let i = 1; i < N; i += 2) { const u = i / N; ctx.beginPath(); ctx.ellipse(x0 + dir * len * u, y0 + droop * u * u - 12 * (1 - u) - 4, 14, 4, 0, 0, 7); ctx.fill(); } }
    };
    const px = -c.x * 0.01 % 30;
    bough(-40 + px, 30, 1, 480, 120, 1100); bough(-40 + px, -20, 1, 340, 150, 1101); bough(-20 + px, 110, 1, 260, 90, 1102);
    bough(W + 40 + px, 10, -1, 420, 140, 1200); bough(W + 30 + px, -30, -1, 300, 110, 1201);
    // трава у объектива
    for (let i = 0; i < 16; i++) {
      const side = i < 8 ? 0 : 1, j = i % 8, x = side ? W - j * 22 - 8 : j * 22 + 8, h = 40 + 60 * U.hash(i, 1300) * (1 - j / 10);
      const lean = (side ? -1 : 1) * (8 + 14 * U.hash(i, 1301)) + Math.sin(t * 0.8 + i) * 3;
      ctx.strokeStyle = '#02040A'; ctx.lineWidth = 4 + 3 * U.hash(i, 1302); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, H + 10); ctx.quadraticCurveTo(x + lean * 0.2, H - h * 0.6, x + lean, H - h); ctx.stroke();
      if (wa > 0.05) dot(ctx, x + lean, H - h, 5, `rgba(226,234,246,${0.7 * wa})`);
    }
  }

  // ---------- кадр: главы - отдельные сцены, между ними небо и Луноед ----------
  const SETS = [set1, set2, set3, set4, set5over];
  const activeCh = (t) => { for (let i = 0; i < 4; i++) if (t < (S.CH[i].end + S.CH[i + 1].start) / 2) return i; return 4; };
  function worldAlpha(t) {
    for (let i = 0; i < 4; i++) { const e = S.CH[i].end, c = S.CH[i + 1].start; if (t >= e && t < c) return 1 - sm(t, e, e + 0.9) + sm(t, c - 1.5, c - 0.5); }
    return 1;
  }
  function moonAlpha(t) {
    for (let i = 0; i < 4; i++) { const e = S.CH[i].end, c = S.CH[i + 1].start; if (t >= e && t < c) return sm(t, e + 0.6, e + 1.5) * (1 - sm(t, c - 2.3, c - 1.5)); }
    return 0;
  }
  // общий план неба между главами: луна крупно, Луноед на верхушке ели откусывает
  function moonShot(ctx, t, a) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const d = dusk(t), w = dawn(t), i = activeCh(t);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, mixHex('#0B1030', '#1A2350', w)); g.addColorStop(1, mixHex('#25325C', '#5A5884', w));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 160; k++) { const x = U.hash(k, 11) * W, y = U.hash(k, 12) * H, r = 0.8 + U.hash(k, 13) * 1.6; dot(ctx, x, y, r, `rgba(230,236,255,${(0.3 + 0.5 * U.hash(k, 14)) * (1 - 0.8 * w) * (0.75 + 0.25 * Math.sin(t * 1.3 + k))})`); }
    const drift = (t % 100) * 3;
    drawMoon(ctx, t, W * 0.6 - drift * 0.2, H * 0.4, 150, 1 - 0.3 * w, 0.35);
    // ели снизу и Луноед на самой высокой
    for (let k = 0; k < 14; k++) { const x = k * 150 + U.hash(k, 15) * 80 - 40, h = 220 + 160 * U.hash(k, 16); spruce(ctx, x, H + 30, h, '#070C1E', 1000 + k, '#03050C'); snowCap(ctx, x, H + 30, h, whiteAmt(t)); }
    spruce(ctx, W * 0.83, H + 30, 520, '#060A1A', 1020, '#03050C'); snowCap(ctx, W * 0.83, H + 30, 520, whiteAmt(t));
    const b = ev.bites.find((x) => Math.abs(x - t) < 4) || ev.bites[1];
    const reach = bump(t, b - 0.8, b - 0.05, b + 0.5), chew = t > b && t < b + 1.6 ? 1 - (t - b) / 1.6 : 0;
    CR.lunoed(ctx, W * 0.832, H + 30 - 520 + 4, 0.75, t, { reach, chew, look: -0.5, moon: S.moonLeft(t) });
    if (i >= 3 || t > ev.snow) snow(ctx, t);
    ctx.restore();
  }
  function world(ctx, t) {
    const c = cam(t), ci = activeCh(t);
    const moon = sky(ctx, t, c);
    far(ctx, t, c);
    water(ctx, t, c, moon);
    fog(ctx, t, c);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    const L = c.x - W / (2 * c.z) - 300, R = c.x + W / (2 * c.z) + 300;
    if (ci === 4) underIce(ctx, t);
    ctx.restore();
    iceOverlay(ctx, t, c);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    ground(ctx, t, L, R, ci);
    details(ctx, t, L, R, ci);
    SETS[ci](ctx, t);
    fgReeds(ctx, t, L, R, ci);
    ctx.restore();
    frame(ctx, t, c);
    snow(ctx, t);
    firstFlake(ctx, t);
  }

  Studio.film({
    draw(ctx, t) {
      ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H);
      const wA = worldAlpha(t);
      if (t < ev.dark && wA > 0.001) world(ctx, t);
      // из темноты - в начале, в темноту - после глаза и между главами
      const black = Math.max(1 - sm(t, 0, 1.8), sm(t, ev.eyeShut - 0.3, ev.dark), 1 - wA);
      if (black > 0.001) { ctx.fillStyle = `rgba(3,4,8,${black})`; ctx.fillRect(0, 0, W, H); }
      if (PORTRAIT) shortEnd(ctx, t); else moonShot(ctx, t, moonAlpha(t));
      journalPage(ctx, t);
      // заголовок и титры глав
      cardText(ctx, t, ev.title, 5.6, 'I', 'Одна ночь на Мерцаловой топи');
      const ROMAN = ['II', 'III', 'IV', 'V'];
      ev.cards.forEach((c0, i) => cardText(ctx, t, c0, 3.6, ROMAN[i], S.CH[i + 1].name));
      if (PORTRAIT) Subs.draw(ctx, t, S.subtitles, { style: 'clean', size: 52, y: H * 0.25, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      else Subs.draw(ctx, t, S.subtitles, { style: 'clean', size: 46, y: H * 0.86, fam: 'Inter', maxW: W * 0.7, x: W * 0.5 });
      // финал: журнал записи
      if (t >= ev.rec) {
        const fade = 1 - r01(t, S.DURATION - 0.6, S.DURATION), a = r01(t, ev.rec, ev.rec + 0.3) * fade;
        ctx.save(); ctx.globalAlpha = a;
        if (t < ev.endCut) pixelText(ctx, `● REC  ${S.LOG}:${String(11 + Math.floor(t - ev.rec)).padStart(2, '0')}`, W / 2, H * 0.5, 4, '#C9D2E8');
        else pixelText(ctx, 'ЗАПИСЬ ЗАМЁРЗЛА', W / 2, H * 0.5, 4, '#C9D2E8');
        ctx.restore();
        // в темноте - иней по краям кадра
        const fr = sm(t, ev.endCut, ev.endCut + 2) * fade;
        if (fr > 0) {
          ctx.save(); ctx.globalAlpha = fr * 0.5; ctx.strokeStyle = '#B9CCE0'; ctx.lineWidth = 1.5;
          for (let i = 0; i < 40; i++) {
            const side = i % 4, u = U.hash(i, 500), x0 = side === 0 ? 0 : side === 1 ? W : u * W, y0 = side === 2 ? 0 : side === 3 ? H : u * H;
            const an = Math.atan2(H / 2 - y0, W / 2 - x0) + (U.hash(i, 501) - 0.5) * 0.8, L = 60 + 140 * U.hash(i, 502);
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + Math.cos(an) * L, y0 + Math.sin(an) * L); ctx.stroke();
            for (let j = 1; j < 4; j++) { const bx = x0 + Math.cos(an) * L * j / 4, by = y0 + Math.sin(an) * L * j / 4; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(an + 0.7) * 18, by + Math.sin(an + 0.7) * 18); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(an - 0.7) * 18, by + Math.sin(an - 0.7) * 18); ctx.stroke(); }
          }
          ctx.restore();
        }
      }
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
