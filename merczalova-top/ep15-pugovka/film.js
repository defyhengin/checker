// «Мерцалова топь» - эпизод 15 «Пуговка». Каждый кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.5);
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const bump = (t, a, b, c) => sm(t, a, b) * (1 - sm(t, b, c));   // туда и обратно
  const INK = '#1C1612', FAB = '#CDBB9C', FAB_D = '#A8946F', PATCH = '#E6D6B6', THREAD = '#B8344A', MOSS = '#1E4A47';
  const WARM = '255,200,116';

  // мир
  const P = { x: W * 0.5, y: H * 0.64 };              // где сидит Пуговка (низ)
  const MOUND = { x: P.x, y: P.y + 20 * k, rx: 175 * k, ry: 46 * k };
  const BASKET = { x: P.x + 108 * k, y: P.y + 4 * k };
  const NAPKIN = { x: P.x - 92 * k, y: P.y + 16 * k };
  const DEW0 = { x: P.x - 92 * k, y: P.y - 104 * k };
  const COIN0 = { x: P.x + 46 * k, y: P.y + 74 * k };
  const SLEEVE = { x: P.x - 215 * k, y: P.y + 96 * k };
  const FLY0 = { x: P.x + 58 * k, y: P.y - 168 * k };
  const FLYS = { x: P.x - 108 * k, y: P.y - 156 * k };
  const BOOTH = { x: W * 0.27, b: HY + 4 * k, q: 1.3 * k };

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  // крестик-стежок
  function xst(ctx, x, y, r, c = THREAD, lw = 1.6) {
    ctx.strokeStyle = c; ctx.lineWidth = lw; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r, y - r); ctx.lineTo(x + r, y + r); ctx.moveTo(x + r, y - r); ctx.lineTo(x - r, y + r); ctx.stroke();
  }

  // ---------- фон ----------
  function scenery(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    for (let i = 0; i < 80; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.9, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    G.ellipse(ctx, W * 0.66, H * 0.36, 52 * k, 52 * k, { fill: '#EFF2E6', lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 14; i++) spruce(U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.08 + 0.05 * U.hash(i, 15)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 12; i++) spruce(U.hash(i, 16) * W * 1.1 - W * 0.05, HY + 6 * k, (0.05 + 0.04 * U.hash(i, 17)) * H, '#121B38', 60 + i);
    // будка: окно тёмное
    const { x: hx, b: hb, q } = BOOTH;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    ctx.fillStyle = '#1A1610'; ctx.fillRect(hx - 9 * q, hb - 50 * q, 18 * q, 16 * q);
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    // лунная дорожка
    for (let i = 0; i < 9; i++) { const y = HY + 20 * k + i * 22 * k, w = (70 - i * 5) * k; ctx.fillStyle = `rgba(230,236,220,${0.16 - i * 0.012})`; ctx.fillRect(W * 0.66 - w / 2 + Math.sin(i * 2.1) * 10 * k, y, w, 3 * k); }
    for (let i = 0; i < 16; i++) { const y = HY + 30 * k + i * 44 * k; ctx.strokeStyle = 'rgba(120,150,220,0.08)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(W * U.hash(i, 40), y); ctx.lineTo(W * U.hash(i, 40) + 160 * k, y); ctx.stroke(); }
    for (let i = 0; i < 18; i++) {
      const x = U.hash(i, 53) * W, h = (0.04 + 0.05 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * h;
      G.line(ctx, [[x, HY + 12 * k], [x + lean * 0.5, HY + 12 * k - h * 0.5], [x + lean, HY + 12 * k - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
      if (i % 3 === 0) G.ellipse(ctx, x + lean, HY + 12 * k - h, 5 * k, 14 * k, { fill: '#3A2A1E', lw: 1.5, seed: 330 + i, stroke: '#0A0806' });
    }
    for (const [x, y, r, sd] of [[0.14, 0.6, 50, 1], [0.8, 0.72, 66, 2], [0.2, 0.86, 70, 3], [0.88, 0.84, 60, 4], [0.36, 0.58, 40, 5]]) {
      G.ellipse(ctx, W * x, H * y, r * k, r * 0.32 * k, { fill: MOSS, lw: 3, seed: 500 + sd, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.35)', gap: 7, angle: -0.5 } });
    }
    // рукав куртки в воде: манжета без пуговицы, ремешок часов без часов
    const { x: sx, y: sy } = SLEEVE;
    G.poly(ctx, [[sx - 70 * k, sy - 8 * k], [sx + 30 * k, sy - 26 * k], [sx + 44 * k, sy + 4 * k], [sx - 60 * k, sy + 18 * k]], { fill: '#2C3A2A', lw: 3, seed: 810, stroke: '#0C120B', hatch: { color: 'rgba(0,0,0,0.25)', gap: 6, angle: 0.3 } });
    G.poly(ctx, [[sx + 30 * k, sy - 26 * k], [sx + 52 * k, sy - 30 * k], [sx + 64 * k, sy + 2 * k], [sx + 44 * k, sy + 4 * k]], { fill: '#243022', lw: 3, seed: 811, stroke: '#0C120B' });
    // нитки там, где была пуговица
    ctx.strokeStyle = '#C9C2A8'; ctx.lineWidth = 1.5 * k;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(sx + 52 * k, sy - 12 * k); ctx.quadraticCurveTo(sx + 60 * k + i * 4 * k, sy - 4 * k, sx + 56 * k + i * 6 * k, sy + 6 * k + i * 3 * k); ctx.stroke(); }
    // ремешок
    G.poly(ctx, [[sx + 66 * k, sy - 8 * k], [sx + 96 * k, sy - 14 * k], [sx + 98 * k, sy - 6 * k], [sx + 68 * k, sy]], { fill: '#4A3426', lw: 2, seed: 812, stroke: '#140D08' });
    ctx.strokeStyle = 'rgba(160,190,240,0.25)'; ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.ellipse(sx, sy + 20 * k, 110 * k, 10 * k, 0, 0, Math.PI); ctx.stroke();
    // камыш с листом (на кончике была росинка)
    G.line(ctx, [[P.x - 150 * k, P.y + 50 * k], [P.x - 146 * k, P.y - 60 * k], [P.x - 140 * k, P.y - 170 * k]], { color: '#16302C', lw: 6 * k, seed: 830 });
    G.ellipse(ctx, P.x - 140 * k, P.y - 180 * k, 7 * k, 20 * k, { fill: '#3A2A1E', lw: 1.5, seed: 831, stroke: '#0A0806' });
    G.poly(ctx, [[P.x - 146 * k, P.y - 50 * k], [P.x - 120 * k, P.y - 110 * k], [DEW0.x, DEW0.y + 4 * k], [P.x - 118 * k, P.y - 98 * k], [P.x - 142 * k, P.y - 40 * k]], { fill: '#24524A', lw: 2.5, seed: 832, stroke: '#0A1A16' });
    // кочка
    G.ellipse(ctx, MOUND.x, MOUND.y, MOUND.rx, MOUND.ry, { fill: '#2A5248', lw: 3.5, seed: 840, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.35)', gap: 7, angle: -0.6 } });
    for (let i = 0; i < 22; i++) {
      const a = U.hash(i, 841) * Math.PI, x = MOUND.x + Math.cos(a) * MOUND.rx * 0.95, y = MOUND.y - Math.sin(a) * MOUND.ry * 0.9;
      G.line(ctx, [[x, y], [x + (U.hash(i, 842) - 0.5) * 10 * k, y - (8 + 10 * U.hash(i, 843)) * k]], { color: '#3E7262', lw: 2.5 * k, seed: 850 + i });
    }
    // салфетка в клетку
    const { x: nx, y: ny } = NAPKIN;
    G.poly(ctx, [[nx - 50 * k, ny - 12 * k], [nx + 40 * k, ny - 16 * k], [nx + 52 * k, ny + 14 * k], [nx - 46 * k, ny + 18 * k]], { fill: '#E7DCC6', lw: 2.5, seed: 860, stroke: '#3A3024' });
    ctx.strokeStyle = 'rgba(184,52,74,0.45)'; ctx.lineWidth = 2.5 * k;
    for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(nx + i * 18 * k, ny - 14 * k); ctx.lineTo(nx + i * 19 * k + 4 * k, ny + 16 * k); ctx.stroke(); }
    for (let j = 0; j < 2; j++) { ctx.beginPath(); ctx.moveTo(nx - 48 * k, ny - 3 * k + j * 11 * k); ctx.lineTo(nx + 48 * k, ny - 6 * k + j * 11 * k); ctx.stroke(); }
  }

  // корзинка с катушками (перед ней игла и нитка - живые, рисуются отдельно)
  function basket(ctx) {
    const { x, y } = BASKET;
    G.ellipse(ctx, x - 14 * k, y - 26 * k, 13 * k, 15 * k, { fill: '#B8344A', lw: 2, seed: 870, stroke: INK });
    G.ellipse(ctx, x + 12 * k, y - 24 * k, 12 * k, 14 * k, { fill: '#5A7FA8', lw: 2, seed: 871, stroke: INK });
    G.ellipse(ctx, x + 1 * k, y - 30 * k, 10 * k, 12 * k, { fill: '#E2C25C', lw: 2, seed: 872, stroke: INK });
    G.poly(ctx, [[x - 40 * k, y - 18 * k], [x + 40 * k, y - 18 * k], [x + 32 * k, y + 14 * k], [x - 32 * k, y + 14 * k]], { fill: '#8A6340', lw: 2.5, seed: 873, stroke: '#2A1A0E', hatch: { color: 'rgba(40,20,5,0.35)', gap: 6, angle: 0.8 } });
    ctx.strokeStyle = '#2A1A0E'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.ellipse(x, y - 18 * k, 40 * k, 30 * k, 0, Math.PI, Math.PI * 2); ctx.stroke();
  }

  // ---------- блестяшки ----------
  // kind: btnR btnB btnG btnS dew coin watch bead scale foil
  function shiny(ctx, x, y, r, kind, seed = 1) {
    const ring = (fill, stroke) => G.ellipse(ctx, x, y, r, r, { fill, lw: 2, seed, stroke });
    const holes = (n, c) => { const d = r * 0.32; const pts = n === 2 ? [[-d, 0], [d, 0]] : [[-d, -d], [d, -d], [-d, d], [d, d]]; for (const [dx, dy] of pts) dot(ctx, x + dx, y + dy, r * 0.13, c); };
    if (kind === 'btnR') { ring('#C0434F', '#4A1418'); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.arc(x, y, r * 0.72, 0, 7); ctx.stroke(); holes(4, '#3A0E12'); }
    else if (kind === 'btnB') { ring('#4D74A6', '#142640'); holes(2, '#0E1A2E'); }
    else if (kind === 'btnG') { ring('#33452F', '#0C140B'); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, 7); ctx.stroke(); holes(4, '#0A0F09'); }
    else if (kind === 'btnS') { ring('#EDEAE0', '#5A564C'); holes(2, '#6A665C'); }
    else if (kind === 'bead') { ring('#E58FB0', '#5A2034'); dot(ctx, x, y, r * 0.3, '#3A1020'); }
    else if (kind === 'scale') { ring('#BFD8D4', '#3E5A58'); ctx.fillStyle = 'rgba(255,190,230,0.4)'; ctx.beginPath(); ctx.arc(x - r * 0.2, y - r * 0.2, r * 0.6, 0, 7); ctx.fill(); }
    else if (kind === 'foil') { G.poly(ctx, Array.from({ length: 9 }, (_, i) => { const a = i / 9 * 6.283, rr = r * (0.8 + 0.3 * U.hash(i, seed)); return [x + Math.cos(a) * rr, y + Math.sin(a) * rr]; }), { fill: '#C8CED8', lw: 1.5, seed, stroke: '#4A505A' }); }
    else if (kind === 'dew') { ctx.fillStyle = 'rgba(170,220,255,0.55)'; ctx.strokeStyle = 'rgba(220,245,255,0.9)'; ctx.lineWidth = 1.5 * k; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.stroke(); }
    else if (kind === 'coin') { ring('#D9AE4A', '#5A4012'); ctx.strokeStyle = 'rgba(90,64,18,0.6)'; ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, 7); ctx.stroke(); ctx.fillStyle = '#2A1E08'; ctx.fillRect(x - r * 0.2, y - r * 0.2, r * 0.4, r * 0.4); }
    else if (kind === 'watch') {
      ring('#F1EBDA', '#5A5040');
      ctx.strokeStyle = '#3A3024'; ctx.lineWidth = 1 * k;
      for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.78, y + Math.sin(a) * r * 0.78); ctx.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); ctx.stroke(); }
      // 03:12
      const hA = ((3 + 12 / 60) / 12) * 6.283 - Math.PI / 2, mA = (12 / 60) * 6.283 - Math.PI / 2;
      ctx.lineWidth = 1.8 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(hA) * r * 0.45, y + Math.sin(hA) * r * 0.45); ctx.stroke();
      ctx.lineWidth = 1.2 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(mA) * r * 0.7, y + Math.sin(mA) * r * 0.7); ctx.stroke();
      ctx.fillStyle = 'rgba(200,230,255,0.25)'; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.45, 0, 7); ctx.fill();
    }
    // блик
    if (kind !== 'foil') dot(ctx, x - r * 0.38, y - r * 0.4, r * 0.16, 'rgba(255,255,255,0.75)');
  }

  // глаза Пуговки (координаты - в долях s от центра тела). at: когда пришит
  const EYES = [
    { x: -19, y: -10, r: 11, kind: 'btnR', at: -1 },
    { x: 19, y: -12, r: 11, kind: 'btnB', at: -1 },
    { x: -38, y: 8, r: 8, kind: 'dew' },
    { x: 35, y: 7, r: 9.5, kind: 'coin' },
    { x: 1, y: -35, r: 12, kind: 'btnG' },
    { x: 2, y: 22, r: 10.5, kind: 'watch', pupil: false },   // пришит прямо на ротик
    { x: -41, y: -24, r: 5.5, kind: 'bead' },
    { x: 43, y: -25, r: 6, kind: 'scale' },
    { x: 24, y: 35, r: 6.5, kind: 'foil' },
    { x: -24, y: 35, r: 6, kind: 'btnS' },
    { x: -15, y: -40, r: 4.5, kind: 'bead' },
    { x: 53, y: -4, r: 5, kind: 'dew' },
  ];
  EYES.forEach((e, i) => { if (i >= 2) e.at = ev.SEW[i - 2]; });
  const MAT = { dew: 2, coin: 3, button: 4, watch: 5 };   // что лежит на салфетке до пришивания
  const SEWX = (i) => EYES[i + 2];

  function eye(ctx, ex, ey, r, e, i, t, o) {
    shiny(ctx, ex, ey, r, e.kind, 900 + i);
    xst(ctx, ex - r * 0.85, ey - r * 0.85, r * 0.22, THREAD, 1.4 * k);
    xst(ctx, ex + r * 0.85, ey + r * 0.85, r * 0.22, THREAD, 1.4 * k);
    if (e.pupil === false) return;
    // зрачок: сначала все смотрят вместе, после шитья - кто куда, после поворота - в камеру
    const own = U.hash(i, 77) * 6.283 + 0.7 * Math.sin(t * 0.6 + i * 1.7);
    const dx = lerp(o.look, Math.cos(own), o.div), dy = lerp(0.1, Math.sin(own) * 0.8, o.div);
    const px = ex + dx * r * 0.32 * (1 - o.snap), py = ey + dy * r * 0.32 * (1 - o.snap);
    const pr = r * (0.3 + 0.06 * o.snap);
    dot(ctx, px, py, pr, '#06050A');
    dot(ctx, px - pr * 0.35, py - pr * 0.4, pr * 0.3, 'rgba(255,255,255,0.85)');
    if (o.rec) dot(ctx, px + pr * 0.4, py - pr * 0.1, pr * 0.22, `rgba(255,50,50,${o.rec})`);
  }

  // ---------- Пуговка ----------
  // o: { look, div, snap, rec, lp, rp (лапки: {x,y} мир), hold: {kind, paw}, needle: {x,y,ang} , hop, sway }
  function pug(ctx, x, y, s, t, o) {
    const cy = y - 50 * s - (o.hop || 0) * 10 * s;
    const sway = o.sway || 0;
    ctx.save(); ctx.translate(x, y); ctx.rotate(sway * 0.08); ctx.translate(-x, -y);
    for (const d of [-1, 1]) G.ellipse(ctx, x + d * 24 * s, y - 5 * s, 15 * s, 8 * s, { fill: FAB_D, lw: 2.5, seed: 400 + d, stroke: INK });
    // ушки
    for (const d of [-1, 1]) {
      G.ellipse(ctx, x + d * 34 * s, cy - 45 * s, 15 * s, 14 * s, { fill: FAB, lw: 2.5, seed: 410 + d, stroke: INK });
      G.ellipse(ctx, x + d * 34 * s, cy - 44 * s, 8 * s, 7 * s, { fill: d < 0 ? '#D98A8E' : PATCH, lw: 0, seed: 412 + d });
      if (d > 0) xst(ctx, x + d * 40 * s, cy - 52 * s, 2 * s, THREAD, 1.2 * k);
    }
    // тело-подушечка
    G.ellipse(ctx, x, cy, 58 * s, 52 * s, { fill: FAB, lw: 3, seed: 420, stroke: INK, hatch: { color: 'rgba(90,70,40,0.14)', gap: 6, angle: 0.6 } });
    // заплатка и шов
    G.poly(ctx, [[x - 50 * s, cy + 2 * s], [x - 30 * s, cy - 2 * s], [x - 26 * s, cy + 20 * s], [x - 46 * s, cy + 24 * s]], { fill: PATCH, lw: 1.5, seed: 421, stroke: FAB_D });
    for (let i = 0; i < 3; i++) xst(ctx, x - 49 * s + i * 9 * s, cy + 1 * s - i * 1.3 * s, 1.6 * s, THREAD, 1 * k);
    ctx.strokeStyle = FAB_D; ctx.lineWidth = 1.5 * k;
    ctx.beginPath(); ctx.moveTo(x + 8 * s, cy - 51 * s); ctx.quadraticCurveTo(x + 14 * s, cy, x + 6 * s, cy + 51 * s); ctx.stroke();
    for (let i = 1; i < 9; i++) { const p = i / 9, sx = x + 8 * s + Math.sin(p * Math.PI) * 5 * s, sy = cy - 51 * s + p * 102 * s; ctx.beginPath(); ctx.moveTo(sx - 3 * s, sy); ctx.lineTo(sx + 3 * s, sy); ctx.stroke(); }
    const lx = (o.look || 0) * 4 * s * (1 - (o.div || 0));
    // ротик-стежок (пока его не закрыли часами) и румянец
    if (t < EYES[5].at) {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * k;
      ctx.beginPath(); ctx.arc(x + lx, cy + 17 * s, 6 * s, 0.35, Math.PI - 0.35); ctx.stroke();
      ctx.fillStyle = 'rgba(220,120,120,0.35)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + lx + d * 27 * s, cy + 10 * s, 6 * s, 3.5 * s, 0, 0, 7); ctx.fill(); }
    }
    // глаза
    EYES.forEach((e, i) => {
      if (t < e.at) return;
      const pop = e.at > 0 ? 1 + 0.5 * (1 - ease.outBack(r01(t, e.at, e.at + 0.18))) : 1;
      eye(ctx, x + e.x * s + lx, cy + e.y * s, e.r * s * pop, e, i, t, o);
      if (e.at > 0 && t < e.at + 0.25) glow(ctx, x + e.x * s, cy + e.y * s, 40 * s, '255,240,220', 0.6 * (1 - r01(t, e.at, e.at + 0.25)));
    });
    ctx.restore();
    // лапки
    const arm = (sx, sy, p, seed) => {
      G.line(ctx, [[sx, sy], [(sx + p.x) / 2, (sy + p.y) / 2 + 4 * s], [p.x, p.y]], { color: INK, lw: 13 * s, seed });
      G.line(ctx, [[sx, sy], [(sx + p.x) / 2, (sy + p.y) / 2 + 4 * s], [p.x, p.y]], { color: FAB, lw: 9 * s, seed: seed + 1 });
      G.ellipse(ctx, p.x, p.y, 9 * s, 8.5 * s, { fill: FAB, lw: 2.5, seed: seed + 2, stroke: INK });
    };
    if (!o.noArms) { arm(x - 48 * s, cy + 8 * s, o.lp, 430); arm(x + 48 * s, cy + 8 * s, o.rp, 440); }
    if (o.hold) for (const h of o.hold) { const p = h.paw === 'l' ? o.lp : o.rp; shiny(ctx, p.x + (h.dx || 0) * s, p.y - 10 * s, h.r * s, h.kind, 950); }
  }

  // игла с ниткой (кончик - в tip, ушко - сзади)
  function needle(ctx, tip, ang, len, t, glint) {
    const ex = tip.x - Math.cos(ang) * len, ey = tip.y - Math.sin(ang) * len;
    ctx.strokeStyle = '#D8DEE8'; ctx.lineWidth = 3 * k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = '#5A6070'; ctx.lineWidth = 1 * k; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    if (glint) glow(ctx, tip.x, tip.y, 46 * k, '255,255,245', glint);
    return { x: ex, y: ey };
  }
  function threadLine(ctx, a, b, sag) {
    ctx.strokeStyle = THREAD; ctx.lineWidth = 2 * k;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo((a.x + b.x) / 2, Math.max(a.y, b.y) + sag, b.x, b.y); ctx.stroke();
  }

  // ---------- позы во времени ----------
  const SC = 1.0;
  function pose(t) {
    const s = k * SC, cy = P.y - 50 * s;
    const restL = { x: P.x - 56 * s, y: cy + 22 * s }, restR = { x: P.x + 56 * s, y: cy + 22 * s };
    const mix = (a, b, p) => ({ x: lerp(a.x, b.x, p), y: lerp(a.y, b.y, p) });
    let lp = restL, rp = restR, look = 0, hold = [], hop = 0, sway = 0;
    let ndl = null;   // { tip, ang, glint }
    // машет
    const wv = bump(t, 0.3, 0.7, 1.9);
    rp = mix(rp, { x: P.x + 70 * s + Math.sin(t * 14) * 10 * s, y: cy - 50 * s }, wv);
    // за иглой в корзинку и наверх
    rp = mix(rp, { x: BASKET.x - 4 * s, y: BASKET.y - 26 * s }, bump(t, ev.needle - 0.7, ev.needle - 0.1, ev.needle + 0.5));
    const needleUp = sm(t, ev.needle, ev.needle + 0.5) * (1 - sm(t, 8.0, 8.8));
    rp = mix(rp, { x: P.x + 72 * s, y: cy - 30 * s }, needleUp);
    if (t >= ev.needle && t < 8.8) ndl = { tip: { x: rp.x + 8 * s, y: rp.y - 46 * s }, ang: -1.45, glint: 0.9 * (1 - r01(t, ev.needle, ev.needle + 0.5)) };
    // показывает на мордочку
    lp = mix(lp, { x: P.x - 30 * s, y: cy - 16 * s }, bump(t, ev.point - 0.3, ev.point + 0.2, 8.4));
    // шаг 1: оглядывается
    if (t > 9.3 && t < 12.9) look = Math.sin((t - 9.3) * 1.8) * sm(t, 9.3, 9.8) * (1 - sm(t, 12.4, 12.9));
    // росинка - левой лапкой с листа
    const dewReach = bump(t, ev.dew - 0.7, ev.dew, ev.dew + 0.5);
    lp = mix(lp, { x: DEW0.x + 4 * s, y: DEW0.y + 10 * s }, dewReach);
    if (t >= ev.dew && t < ev.dew + 0.6) hold.push({ kind: 'dew', r: 6, paw: 'l' });
    // монетка - правой из воды
    const coinReach = bump(t, ev.coin - 0.6, ev.coin, ev.coin + 0.55);
    rp = mix(rp, COIN0, coinReach);
    if (t >= ev.coin && t < ev.coin + 0.65) hold.push({ kind: 'coin', r: 8, paw: 'r' });
    // тянется к светлячку
    rp = mix(rp, { x: FLY0.x - 6 * s, y: FLY0.y + 22 * s }, bump(t, ev.reach, ev.flee, ev.flee + 0.8));
    if (t > ev.flee && t < ev.flee + 1.2) look = -0.8 * bump(t, ev.flee, ev.flee + 0.3, ev.flee + 1.2);
    // шаг 2: продевает нитку - игла в правой, кончик нитки в левой
    const th = sm(t, 18.0, 18.6) * (1 - sm(t, ev.thread + 0.6, ev.thread + 1.1));
    rp = mix(rp, { x: P.x + 26 * s, y: cy - 66 * s }, th);
    if (th > 0.5) {
      ndl = { tip: { x: rp.x + 2 * s, y: rp.y - 44 * s }, ang: -1.5, glint: 0 };
      const eyeP = { x: rp.x + 2 * s + Math.cos(-1.5) * -44 * s, y: rp.y - 44 * s - Math.sin(-1.5) * 44 * s + 6 * s };
      const into = sm(t, ev.thread - 1.0, ev.thread);
      lp = mix(lp, { x: lerp(P.x - 40 * s, eyeP.x - 14 * s, into), y: lerp(cy - 50 * s, eyeP.y + 2 * s, into) }, th);
    }
    // пуговица и часы - левой лапкой из корзинки повыше
    const showB = bump(t, ev.button - 0.35, ev.button, ev.button + 1.4);
    const showW = bump(t, ev.watch - 0.35, ev.watch, ev.watch + 1.4);
    lp = mix(lp, { x: P.x - 48 * s, y: cy - 58 * s }, Math.max(showB, showW));
    if (t >= ev.button - 0.2 && t < ev.button + 1.2) hold.push({ kind: 'btnG', r: 13, paw: 'l' });
    if (t >= ev.watch - 0.2 && t < ev.watch + 1.2) hold.push({ kind: 'watch', r: 12, paw: 'l' });
    // шитьё: игла в правой, тычок к каждому новому глазу
    if (t >= ev.sew0 - 0.6 && t < ev.close) ndl = ndl || { tip: null };
    const sewOn = sm(t, ev.sew0 - 0.6, ev.sew0 - 0.15) * (1 - sm(t, ev.SEW[9] + 0.3, ev.SEW[9] + 0.8));
    if (sewOn > 0) {
      let tgt = { x: P.x + 40 * s, y: cy - 30 * s };
      for (let i = 0; i < 10; i++) {
        const a = ev.SEW[i], e = SEWX(i);
        if (t >= a - S.EIGHTH * 0.6 && t < a + S.EIGHTH * 0.4) {
          const p = t < a ? sm(t, a - S.EIGHTH * 0.6, a) : 1 - sm(t, a, a + S.EIGHTH * 0.4);
          tgt = mix(tgt, { x: P.x + (e.x + (e.x < 0 ? -18 : 18)) * s, y: cy + (e.y - 26) * s }, p);
        }
      }
      rp = mix(rp, tgt, sewOn);
      ndl = { tip: { x: rp.x + (rp.x < P.x ? 10 : -6) * s, y: rp.y + 18 * s }, ang: rp.x < P.x ? 1.1 : 1.9, glint: 0 };
    }
    // «Видите?» - покачивается, «Совсем не больно» - подпрыгивает
    if (t > 29.9 && t < 31.6) sway = Math.sin((t - 29.9) * 5) * (1 - r01(t, 30.8, 31.6));
    hop = bump(t, 30.85, 31.05, 31.35);
    // шаг последний: медленно поднимает иглу к камере
    const raise = sm(t, ev.SEW[9] + 0.5, ev.SEW[9] + 1.2);
    if (raise > 0 && t < ev.close) {
      const up = sm(t, 35.4, 38.8);
      rp = mix(rp, { x: P.x + lerp(46, 22, up) * s, y: cy + lerp(18, -20, up) * s }, raise);
      ndl = { tip: { x: rp.x - lerp(6, 14, up) * s, y: rp.y - lerp(36, 20, up) * s }, ang: lerp(-1.4, -2.3, up), glint: 0.15 * up };
    }
    return { lp, rp, look, hold, hop, sway, ndl };
  }

  // ---------- светлячок ----------
  function firefly(ctx, t) {
    if (t >= ev.close) return;
    let x, y, on;
    if (t < ev.flee) { x = FLY0.x + Math.sin(t * 1.3) * 18 * k; y = FLY0.y + Math.sin(t * 2.1) * 10 * k; on = 1; }
    else {
      const p = ease.outCubic(r01(t, ev.flee, ev.flee + 0.6));
      const fx0 = FLY0.x + Math.sin(ev.flee * 1.3) * 18 * k, fy0 = FLY0.y + Math.sin(ev.flee * 2.1) * 10 * k;
      x = lerp(fx0, FLYS.x, p) + Math.sin(t * 0.9) * 4 * k; y = lerp(fy0, FLYS.y, p) - Math.sin(p * Math.PI) * 40 * k + Math.sin(t * 1.4) * 3 * k;
      on = t < ev.flee + 1.2 ? 1 : (S.flyOn(t) ? 1 : 0);
    }
    if (on) glow(ctx, x, y, 34 * k, WARM, 0.75);
    dot(ctx, x, y, 3.4 * k, on ? 'rgba(255,236,170,0.95)' : 'rgba(90,80,60,0.9)');
    ctx.strokeStyle = 'rgba(230,240,255,0.45)'; ctx.lineWidth = 1 * k;
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 4 * k, y - 4 * k, 2.5 * k, 4.5 * k, d * 0.6, 0, 7); ctx.stroke(); }
  }

  // ---------- мир ----------
  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    // росинка ещё на листе
    if (t < ev.dew) { shiny(ctx, DEW0.x, DEW0.y + 8 * k, 6 * k, 'dew', 3); glow(ctx, DEW0.x, DEW0.y + 8 * k, 20 * k, '200,235,255', 0.3 + 0.15 * Math.sin(t * 3)); }
    // монетка поблёскивает в воде
    if (t < ev.coin) glow(ctx, COIN0.x, COIN0.y, 14 * k, '255,220,120', 0.25 + 0.2 * Math.sin(t * 2.3));
    if (t > ev.coin - 0.2 && t < ev.coin + 0.6) { const a = 1 - r01(t, ev.coin - 0.2, ev.coin + 0.6); ctx.strokeStyle = `rgba(180,210,255,${0.6 * a})`; ctx.lineWidth = 2 * k; const rr = (6 + 50 * (1 - a)) * k; ctx.beginPath(); ctx.ellipse(COIN0.x, COIN0.y + 4 * k, rr, rr * 0.28, 0, 0, 7); ctx.stroke(); }
    // материалы на салфетке, пока не пришиты
    const lay = [['dew', MAT.dew, ev.dew + 0.6, -30, 6], ['coin', MAT.coin, ev.coin + 0.65, -8, 8], ['btnG', MAT.button, ev.button + 1.2, 16, 11], ['watch', MAT.watch, ev.watch + 1.2, 36, 10]];
    for (const [kind, ei, t0, dx, r] of lay) if (t >= t0 && t < EYES[ei].at) shiny(ctx, NAPKIN.x + dx * k, NAPKIN.y - 2 * k, r * k, kind, 960 + ei);
    basket(ctx);
    // в тишине темнеет всё, кроме Пуговки
    if (t >= ev.gone) { ctx.fillStyle = `rgba(2,3,8,${0.6 * r01(t, ev.gone, ev.gone + 0.9)})`; ctx.fillRect(-W, -H, W * 3, H * 3); }
    const po = pose(t);
    const div = sm(t, ev.SEW[2], ev.SEW[9] + 0.4);
    const snap = t >= ev.turn ? ease.outBack(r01(t, ev.turn, ev.turn + 0.12)) : 0;
    const rec = t >= ev.turn + 0.6 ? 0.9 * (Math.floor((t - ev.turn) * 1.2) % 2 ? 0.6 : 1) : 0;
    // нитка: от катушки в корзинке к ушку иглы
    const s = k * SC;
    let nEye = null;
    if (po.ndl && po.ndl.tip) nEye = needle(ctx, po.ndl.tip, po.ndl.ang, 46 * s, t, po.ndl.glint);
    pug(ctx, P.x, P.y, s, t, { ...po, div, snap, rec, look: po.look });
    if (po.ndl && po.ndl.tip) {
      needle(ctx, po.ndl.tip, po.ndl.ang, 46 * s, t, po.ndl.glint);
      if (t > ev.thread - 0.05) threadLine(ctx, nEye, { x: BASKET.x - 14 * k, y: BASKET.y - 26 * k }, 40 * k);
    }
    // кончик нитки в левой лапке до продевания
    if (t > 18.0 && t < ev.thread) { ctx.strokeStyle = THREAD; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(po.lp.x + 6 * k, po.lp.y - 4 * k); ctx.lineTo(po.lp.x + 16 * k, po.lp.y - 8 * k); ctx.moveTo(po.lp.x, po.lp.y + 4 * k); ctx.quadraticCurveTo(po.lp.x + 40 * k, P.y + 30 * k, BASKET.x - 14 * k, BASKET.y - 26 * k); ctx.stroke(); }
    if (t >= ev.thread && t < ev.thread + 0.3) glow(ctx, nEye ? nEye.x : P.x, nEye ? nEye.y : P.y, 50 * k, '255,255,240', 0.8 * (1 - r01(t, ev.thread, ev.thread + 0.3)));
    firefly(ctx, t);
  }

  // камера: [центр x, центр y, зум]
  function cam(t) {
    const cyb = P.y - 50 * k * SC;
    const A = [P.x, cyb - 10 * k, 2.8];
    const B = [P.x - 28 * k, cyb - 34 * k, 2.3];
    const C = [P.x - 8 * k, cyb - 34 * k, 3.3];
    const D = [SLEEVE.x + 40 * k, SLEEVE.y - 30 * k, 3.0];
    const E = [P.x - 10 * k, cyb - 14 * k, 3.0];
    const F = [P.x, cyb - 6 * k, 4.4];
    const mix = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
    let c = mix(A, B, sm(t, 8.8, 10.2));
    c = mix(c, C, sm(t, 17.6, 18.9));
    c = mix(c, D, sm(t, ev.sleeve, ev.sleeve + 1.0));
    c = mix(c, E, sm(t, ev.sew0 - 0.9, ev.sew0 - 0.1));
    c = mix(c, F, sm(t, ev.turn + 0.4, ev.close));
    return c;
  }

  // ---------- крупно: игла к объективу ----------
  function closeUp(ctx, t) {
    ctx.fillStyle = '#05060C'; ctx.fillRect(0, 0, W, H);
    const p = r01(t, ev.close, ev.hit);
    const zs = lerp(6.2, 7.0, ease.inQuad(p));
    const s = k * zs;
    // мордочка заполняет экран, все глаза в камеру
    pug(ctx, W * 0.5, H * 0.55 + 50 * s - 5 * s, s, t, { lp: { x: W * 0.5 - 40 * s, y: H * 1.3 }, rp: { x: W * 0.5 + 40 * s, y: H * 0.55 + 40 * s }, look: 0, div: 0, snap: 1, rec: 0.9, hold: null, noArms: true });
    ctx.fillStyle = 'rgba(2,3,8,0.35)'; ctx.fillRect(0, 0, W, H);
    // игла летит в объектив: кончик растёт к центру
    const a = ease.inCubic(r01(t, ev.close + 0.3, ev.hit));
    const tip = { x: lerp(W * 0.68, W * 0.5, a), y: lerp(H * 0.7, H * 0.5, a) };
    const base = { x: W * 0.92, y: H * 1.02 };
    const thick = lerp(5, 30, a) * k;
    ctx.strokeStyle = '#C8CED8'; ctx.lineCap = 'round';
    ctx.lineWidth = thick; ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(tip.x, tip.y); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = thick * 0.25; ctx.beginPath(); ctx.moveTo(base.x - thick * 0.2, base.y); ctx.lineTo(tip.x - thick * 0.1, tip.y); ctx.stroke();
    glow(ctx, tip.x, tip.y, lerp(40, 160, a) * k, '255,255,245', 0.35 + 0.5 * a);
    lensRim(ctx, t);
  }
  // мы - объектив: тёмная оправа, блики стекла и REC в углу
  function lensRim(ctx, t) {
    const g = ctx.createRadialGradient(W / 2, H / 2, W * 0.42, W / 2, H / 2, H * 0.62);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.92)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(160,190,255,0.12)'; ctx.lineWidth = 6 * k;
    ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, W * 0.56, -2.6, -1.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(W * 0.5, H * 0.5, W * 0.48, 0.5, 0.9); ctx.stroke();
    if (Math.floor(t * 2) % 2 === 0) dot(ctx, W * 0.12, H * 0.145, 11 * k, '#E23A3A');
    pixelText(ctx, 'REC', W * 0.12 + 62 * k, H * 0.145, Math.round(4 * k), '#E8ECF5');
  }

  // ---------- крест-накрест ----------
  const STROKES = [[0.32, -1], [0.32, 1], [0.5, -1], [0.5, 1], [0.68, -1], [0.68, 1]];
  const buf = document.createElement('canvas'); buf.width = W; buf.height = H;
  function strokes(ctx, t, alpha, tug) {
    STROKES.forEach(([cy, d], i) => {
      const t0 = ev.STITCH[i];
      if (t < t0) return;
      const p = ease.outCubic(r01(t, t0, t0 + 0.12));
      const hw = W * 0.3 * (1 - 0.06 * tug), hh = H * 0.085;
      const ax = W / 2 - hw, ay = H * cy - d * hh, bx = W / 2 + hw, by = H * cy + d * hh;
      ctx.strokeStyle = `rgba(184,52,74,${alpha})`; ctx.lineWidth = 9 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(lerp(ax, bx, p), lerp(ay, by, p)); ctx.stroke();
      ctx.strokeStyle = `rgba(255,150,160,${alpha * 0.4})`; ctx.lineWidth = 2.5 * k;
      ctx.beginPath(); ctx.moveTo(ax, ay - 2 * k); ctx.lineTo(lerp(ax, bx, p), lerp(ay, by, p) - 2 * k); ctx.stroke();
      dot(ctx, ax, ay, 7 * k, `rgba(0,0,0,${alpha})`); if (p >= 1) dot(ctx, bx, by, 7 * k, `rgba(0,0,0,${alpha})`);
    });
  }
  function stitched(ctx, t) {
    const n = ev.STITCH.filter((x) => t >= x).length;
    const b = buf.getContext('2d');
    b.setTransform(1, 0, 0, 1, 0, 0);
    closeUp(b, Math.min(t, ev.hit - 1e-3));
    // игла прошла насквозь: трещина от центра
    b.strokeStyle = 'rgba(230,240,255,0.7)'; b.lineWidth = 2.5 * k;
    for (let i = 0; i < 9; i++) { const a = U.hash(i, 990) * 6.283, l = (140 + 260 * U.hash(i, 991)) * k; b.beginPath(); b.moveTo(W / 2, H / 2); b.lineTo(W / 2 + Math.cos(a) * l * 0.5 + 12 * k, H / 2 + Math.sin(a) * l * 0.5); b.lineTo(W / 2 + Math.cos(a) * l, H / 2 + Math.sin(a) * l); b.stroke(); }
    // стягивание: картинку тянет к шву
    const last = n ? ev.STITCH[n - 1] : ev.hit;
    const sq = lerp(1 - 0.14 * (n - 1), 1 - 0.14 * n, ease.outCubic(r01(t, last, last + 0.15)));
    ctx.fillStyle = '#020306'; ctx.fillRect(0, 0, W, H);
    const shake = (1 - r01(t, last, last + 0.15)) * 10 * k * (U.hash(n, 5) - 0.5);
    ctx.save(); ctx.globalAlpha = clamp(1 - 0.13 * n); ctx.drawImage(buf, (W - W * sq) / 2 + shake, 0, W * sq, H); ctx.restore();
    const fl = 1 - r01(t, ev.hit, ev.hit + 0.2);
    if (fl > 0) { ctx.fillStyle = `rgba(230,250,245,${0.75 * fl})`; ctx.fillRect(0, 0, W, H); }
    strokes(ctx, t, 1, 0);
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
    // нитки ещё видны в темноте; на tug их рывком стягивают
    const tug = bump(t, ev.tug - 0.04, ev.tug, ev.tug + 0.5);
    ctx.save();
    if (tug > 0) ctx.translate((U.hash(Math.floor(t * 30), 3) - 0.5) * 8 * k * tug, 0);
    strokes(ctx, t, 0.28 + 0.6 * tug, tug);
    ctx.restore();
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
      if (t < ev.close) {
        const [cx, cy, z] = cam(t);
        ctx.save();
        ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cx, -cy);
        world(ctx, t);
        ctx.restore();
      } else if (t < ev.hit) closeUp(ctx, t);
      else if (t < ev.dark) stitched(ctx, t);
      else { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.2, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.dark) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
