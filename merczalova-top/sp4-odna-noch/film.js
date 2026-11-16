// «Одна ночь на Мерцаловой топи» - картинка. Каждый кадр - чистая функция от t.
// Мир - одна длинная панорама болота (x 0..8800). Камера за ночь проходит её слева направо.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs, CR = globalThis.CR;
  const { ev, A, Aend, EIGHTH } = S;
  const { clamp, lerp, ease } = U;
  const { glow, dot, orb, r01, sm } = CR;
  const W = G.W, H = G.H;
  const HY = 540;                                   // горизонт в мире
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
    [ev.e1, ev.c2 - 0.8, 2300, 610, 1.22],
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
    [ev.e2 + 0.3, ev.c3 - 0.6, 5200, 650, 1.05],
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
    [ev.e3 + 0.2, ev.c4 - 0.6, 6440, 600, 1.0],
    [A(4, 3) - 0.6, A(4, 3) + 0.8, 6350, 690, 1.4],
    [A(4, 4) - 0.6, A(4, 4) + 0.8, 6800, 690, 1.5],
    [A(4, 5) - 0.6, A(4, 5) + 0.8, 7200, 680, 1.48],
    [ev.jars[3] - 0.5, ev.jars[3] + 1.4, 7300, 690, 1.9],
    [A(4, 9) - 0.8, A(4, 9) + 0.6, 6800, 620, 0.95],
    [A(4, 12) - 1.4, ev.hush, 7330, 610, 1.28],
    [ev.hush, ev.e4, 7380, 610, 1.36],
    // переход 4 -> глава 5
    [ev.e4 + 0.2, ev.c5 - 0.6, 8150, 600, 0.95],
    [ev.ice - 0.4, ev.ice + 1.5, 8150, 620, 1.0],
    [A(5, 7) - 0.4, A(5, 7) + 1.0, 8180, 660, 1.5],
    [A(5, 8) - 0.6, A(5, 8) + 1.2, 8150, 760, 1.18],
    [A(5, 10) - 1.4, A(5, 10) + 0.4, 8150, 600, 0.95],
    [ev.down, ev.eye - 0.6, 8150, 930, 1.45],
    [ev.eye - 0.6, ev.dark, 8150, 940, 1.5],
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
  const moonCv = document.createElement('canvas'); moonCv.width = 260; moonCv.height = 260;
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
    // луна с укусами
    const left = S.moonLeft(t), mx = MX - (c.x - 4000) * 0.012, my = MY + (c.y - 560) * 0.1;
    const m = moonCv.getContext('2d'), C0 = 130;
    m.setTransform(1, 0, 0, 1, 0, 0); m.clearRect(0, 0, 260, 260);
    G.ellipse(m, C0, C0, MR, MR, { fill: mixHex('#EFF2E6', '#F4E6E0', w), lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
    for (const [cx, cy, cr] of [[-0.3, -0.2, 0.18], [0.25, 0.3, 0.12], [-0.1, 0.4, 0.09]]) G.ellipse(m, C0 + cx * MR, C0 + cy * MR, cr * MR, cr * MR, { fill: 'rgba(170,180,200,0.35)', lw: 1.2, seed: 3 + cx * 10, stroke: 'rgba(126,138,168,0.5)' });
    m.globalCompositeOperation = 'destination-out';
    const e = C0 + MR * (2 * left - 1);
    m.fillRect(e + MR * 0.2, 0, 260, 260);
    for (let j = -4; j <= 4; j++) { m.beginPath(); m.arc(e + MR * 0.2, C0 + j * MR * 0.36, MR * 0.24, 0, 7); m.fill(); }
    m.globalCompositeOperation = 'source-over';
    glow(ctx, mx, my, MR * 2.4, '150,170,220', 0.25 * (0.4 + 0.6 * left) * (1 - 0.6 * d));
    ctx.save(); ctx.globalAlpha = 1 - 0.35 * w; ctx.drawImage(moonCv, mx - C0, my - C0); ctx.restore();
    // крошки после укуса
    ev.bites.forEach((b, i) => {
      const age = t - b; if (age < 0 || age > 2.4) return;
      const bx = mx + MR * (2 * S.moonLeft(b + 0.01) - 1) + MR * 0.2, by = my + MR * 0.1;
      for (let j = 0; j < 12; j++) {
        const vx = (U.hash(j, 50 + i) - 0.3) * 120, vy = (U.hash(j, 60 + i) - 0.8) * 90;
        const x = bx + vx * age, y = by + vy * age + 200 * age * age, a = Math.exp(-age * 1.3);
        dot(ctx, x, y, 1.6 + 1.8 * U.hash(j, 70), `rgba(245,248,230,${a})`); glow(ctx, x, y, 12, '230,236,200', 0.4 * a);
      }
    });
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
  function ground(ctx, t, L, R) {
    // камыши по дальнему берегу
    for (let i = Math.floor(L / 70); i <= Math.ceil(R / 70); i++) {
      const x = i * 70 + U.hash(i, 50) * 60, h = 50 + 80 * U.hash(i, 51), lean = (U.hash(i, 52) - 0.5) * 0.25 * h;
      reed(ctx, x, HY + 14, h, lean, i & 255, t);
    }
    // листья кувшинок в воде
    for (let i = Math.floor(L / 260); i <= Math.ceil(R / 260); i++) {
      const x = i * 260 + U.hash(i, 60) * 200, y = 640 + U.hash(i, 61) * 380;
      if (busy(x) && y < 900) continue;
      pad(ctx, x, y, 60 + 80 * U.hash(i, 62), 16 + 18 * U.hash(i, 63), 500 + (i & 255), t);
    }
  }
  function fgReeds(ctx, t, L, R) {
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
    // стрелки «кто кого ест», потом - все к Подражателю
    const fade = 1 - sm(t, ev.e2 - 1, ev.e2 + 0.5);
    if (t > ev.chainStart - 0.1 && fade > 0) {
      ctx.save(); ctx.globalAlpha = fade;
      const CH = [[[PZ.x + 20, 700], [TS.x - 20, 640], -90], [[3150, 540], [3170, 640], -20], [[3260, 650], [NEST.x - 30, 640], -70], [[MOKH.x - 40, 640], [MOKH.x + 30, 600], -60]];
      CH.forEach(([a, b, bend], i) => arrow(ctx, a, b, r01(t, S.arrows[i], S.arrows[i] + 0.45), bend, 'rgba(232,238,255,0.75)', 900 + i * 7));
      const FROM = [[TS.x, 640], [PZ.x, 720], [3170, 650], [NEST.x, 640], [MOKH.x, 620], [FR.x, 740]];
      FROM.forEach((a, i) => arrow(ctx, a, [MIM.x - 30, 600], r01(t, S.arrowsToMimic[i], S.arrowsToMimic[i] + 0.35), -140 - i * 25, 'rgba(255,210,140,0.85)', 960 + i * 7));
      ctx.restore();
    }
  }

  // ---------- глава 3: Праздник ----------
  const TB = { x: 5200, y: 705 };
  const GUEST = { babies: [5070, 5135, 5200, 5265, 5330].map((x) => [x, 686]), sob: [4990, 812], puz: [5480, 812], bay: [5625, 805], chair: [5345, 915], mokh: [4865, 790] };
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
    mossBlob(ctx, 5200, 800, 560, 92, 71, t);
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
    G.ellipse(ctx, BURROW.x + 10, BURROW.y - 8, 34, 22, { fill: '#05070A', lw: 3, seed: 1630, stroke: '#0A1A16' });
    const sobX = lerp(6745, 6600, sm(t, A(4, 9), A(4, 9) + 2.5)), sobMoving = t > A(4, 9) && t < A(4, 9) + 2.5 ? 1 : 0;
    CR.sobiralka(ctx, sobX, 790, 0.8, t, { face: 1, walk: t * 2.2, moving: sobMoving, reach: ev.mittens.some((m) => t > m - 0.4 && t < m + 0.1) ? 1 : 0, items: t < ev.mittens[2] ? 1 : 0 });
    ev.mittens.forEach((m, i) => {
      if (t < m - 0.45 || t > m + 0.05) return;
      const p = ease.inQuad(r01(t, m - 0.45, m)), x = lerp(6745 - 10, BURROW.x + 10, p), y = lerp(790 - 180, BURROW.y - 8, p) - Math.sin(p * Math.PI) * 60;
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
  const EYE = { x: 8150, y: 985 };
  function eyeOpen(t) { return sm(t, ev.eye - 0.02, ev.eye + 0.32) * (1 - sm(t, ev.eyeShut - 0.9, ev.eyeShut)); }
  function underIce(ctx, t) {
    // спящие огоньки подо льдом
    for (let i = 0; i < 9; i++) {
      const x = 7760 + i * 95 + U.hash(i, 300) * 50, y = 780 + U.hash(i, 301) * 200, a = 0.25 + 0.1 * Math.sin(t * 0.8 + i * 1.7);
      const flick = i === 5 ? (U.noise1(t * 2.6, 9) > 0.3 ? 1.6 : 0.4) : 1;
      glow(ctx, x, y, 60, COLD, a * flick); dot(ctx, x, y, 3, `rgba(230,255,215,${0.5 * a * flick})`);
    }
    // глаз
    const o = eyeOpen(t);
    if (o > 0.005) {
      const rx = 270, ry = 150 * o;
      glow(ctx, EYE.x, EYE.y, 420, '90,200,210', 0.35 * o);
      ctx.save(); ctx.beginPath(); ctx.ellipse(EYE.x, EYE.y, rx, Math.max(1, ry), 0, 0, 7); ctx.clip();
      const sg = ctx.createRadialGradient(EYE.x, EYE.y, 40, EYE.x, EYE.y, rx); sg.addColorStop(0, '#B4C6C4'); sg.addColorStop(1, '#5E7478'); ctx.fillStyle = sg; ctx.fillRect(EYE.x - rx, EYE.y - 150, rx * 2, 300);
      const look = U.noise1(t * 0.7, 4) * 10, irisR = 105;
      const ig = ctx.createRadialGradient(EYE.x + look, EYE.y, 10, EYE.x + look, EYE.y, irisR);
      ig.addColorStop(0, '#9FF0EA'); ig.addColorStop(0.6, '#3AA9A8'); ig.addColorStop(1, '#0E3A44');
      ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(EYE.x + look, EYE.y, irisR, 0, 7); ctx.fill();
      const pw = lerp(26, 9, sm(t, ev.eye + 0.4, ev.eye + 1.2));
      ctx.fillStyle = '#020406'; ctx.beginPath(); ctx.ellipse(EYE.x + look, EYE.y, pw, 92, 0, 0, 7); ctx.fill();
      dot(ctx, EYE.x + look - 40, EYE.y - 46, 14, 'rgba(255,255,255,0.85)');
      ctx.restore();
      ctx.strokeStyle = '#0A1418'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(EYE.x, EYE.y, rx, Math.max(1, ry), 0, 0, 7); ctx.stroke();
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
    // берег со спящими
    mossBlob(ctx, 8150, 690, 520, 40, 91, t);
    [7840, 7905, 7970].forEach((x, i) => CR.baby(ctx, x, 690, 0.5, t, { sleep: 1 }, i));
    CR.mossMound(ctx, 8070, 702, 0.45, t);
    for (let i = 0; i < 4; i++) CR.mush(ctx, 8200 + i * 22, 690, 1.4, t, { grow: 0.8, awake: 0, seed: 60 + i });
    CR.sobiralka(ctx, 8390, 700, 0.5, t, { sleep: 1, face: 0 });
    // Баюнок - единственный не спит
    CR.bayunok(ctx, 8545, 700, 0.75, t, { sway: Math.sin(t * 0.8) * 0.2, turn: 0.2, gx: 0.3, gy: 0.4 });
    cracks(ctx, t);
  }

  // ---------- титры ----------
  function cardText(ctx, t, t0, dur, small, big) {
    const a = sm(t, t0, t0 + 0.8) * (1 - sm(t, t0 + dur - 0.8, t0 + dur));
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    const bg = ctx.createRadialGradient(W / 2, H * 0.43, 20, W / 2, H * 0.43, 620); bg.addColorStop(0, 'rgba(3,5,14,0.55)'); bg.addColorStop(1, 'rgba(3,5,14,0)');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    G.text(ctx, small, W / 2, H * 0.4, { size: 34, fam: 'Inter', weight: 700, color: '#C9D2E8', align: 'center', boil: 0 });
    G.text(ctx, big, W / 2, H * 0.4 + 82, { size: 70, fam: 'Inter', weight: 800, color: '#EEF1F8', align: 'center', boil: 0 });
    ctx.strokeStyle = 'rgba(201,210,232,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2 - 90, H * 0.4 + 18); ctx.lineTo(W / 2 + 90, H * 0.4 + 18); ctx.stroke();
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

  // ---------- кадр ----------
  const SETS = [[0, 1900, set1], [1950, 4450, set2], [4600, 5800, set3], [5950, 7600, set4], [7650, 8700, set5over]];
  function world(ctx, t) {
    const c = cam(t);
    const moon = sky(ctx, t, c);
    far(ctx, t, c);
    water(ctx, t, c, moon);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    const L = c.x - W / (2 * c.z) - 300, R = c.x + W / (2 * c.z) + 300;
    // подо льдом (глава 5) - до наложения льда
    if (R > 7650) underIce(ctx, t);
    ctx.restore();
    iceOverlay(ctx, t, c);
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
    ground(ctx, t, L, R);
    for (const [a, b, fn] of SETS) if (b > L && a < R) fn(ctx, t);
    fgReeds(ctx, t, L, R);
    ctx.restore();
    snow(ctx, t);
    firstFlake(ctx, t);
  }

  Studio.film({
    draw(ctx, t) {
      ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H);
      if (t < ev.dark) world(ctx, t);
      // из темноты - в начале, в темноту - после глаза
      const black = Math.max(1 - sm(t, 0, 1.8), sm(t, ev.eyeShut - 0.3, ev.dark));
      if (black > 0.001) { ctx.fillStyle = `rgba(3,4,8,${black})`; ctx.fillRect(0, 0, W, H); }
      // заголовок и титры глав
      cardText(ctx, t, ev.title, 5.6, 'I', 'Одна ночь на Мерцаловой топи');
      const ROMAN = ['II', 'III', 'IV', 'V'];
      ev.cards.forEach((c0, i) => cardText(ctx, t, c0, 3.4, ROMAN[i], S.CH[i + 1].name));
      Subs.draw(ctx, t, S.subtitles, { style: 'clean', size: 46, y: H * 0.86, fam: 'Inter', maxW: W * 0.7, x: W * 0.5 });
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
