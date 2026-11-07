// «Мерцалова топь» - эпизод 13 «Зубочка». Каждый кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.5);
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#17121C', FUR = '#EADCE6', FUR_D = '#C9B4C6', PINK = '#E9A3B8', MOSS = '#1E4A47';
  const FX = W * 0.36, FY = H * 0.665;                // лягушка на кувшинке
  const SX = W * 0.74, SY = H * 0.6;                  // пень, сверху гнездо
  const NEST = { x: SX, y: SY - 6 * k, rx: 92 * k, ry: 34 * k };
  const GAP = { x: SX + 10 * k, y: SY + 18 * k };     // пустое место под большой зуб (спереди гнезда)
  const BOOTH = { x: W * 0.2, b: HY + 4 * k, q: 1.5 * k };
  const WIN = { x: BOOTH.x, y: BOOTH.b - 42 * BOOTH.q, r: 11 * k };
  const TEAL = '110,225,215';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
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
    G.ellipse(ctx, W * 0.78, H * 0.17, 62 * k, 62 * k, { fill: '#EFF2E6', lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 14; i++) spruce(U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.08 + 0.05 * U.hash(i, 15)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 12; i++) spruce(U.hash(i, 16) * W * 1.1 - W * 0.05, HY + 6 * k, (0.05 + 0.04 * U.hash(i, 17)) * H, '#121B38', 60 + i);
    const { x: hx, b: hb, q } = BOOTH;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    for (let i = 0; i < 14; i++) { const y = HY + 30 * k + i * 40 * k; ctx.strokeStyle = 'rgba(120,150,220,0.08)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(W * U.hash(i, 40), y); ctx.lineTo(W * U.hash(i, 40) + 160 * k, y); ctx.stroke(); }
    // камыши
    for (let i = 0; i < 18; i++) {
      const x = U.hash(i, 53) * W, h = (0.04 + 0.05 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * h;
      G.line(ctx, [[x, HY + 12 * k], [x + lean * 0.5, HY + 12 * k - h * 0.5], [x + lean, HY + 12 * k - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
      if (i % 3 === 0) G.ellipse(ctx, x + lean, HY + 12 * k - h, 5 * k, 14 * k, { fill: '#3A2A1E', lw: 1.5, seed: 330 + i, stroke: '#0A0806' });
    }
    // кувшинки на воде
    for (const [x, y, r, sd] of [[0.12, 0.6, 60, 1], [0.6, 0.78, 80, 2], [0.18, 0.86, 70, 3], [0.9, 0.82, 64, 4], [0.52, 0.58, 44, 5]]) {
      G.ellipse(ctx, W * x, H * y, r * k, r * 0.32 * k, { fill: MOSS, lw: 3, seed: 500 + sd, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.35)', gap: 7, angle: -0.5 } });
    }
    // кувшинка лягушки
    G.ellipse(ctx, FX, FY + 30 * k, 135 * k, 34 * k, { fill: MOSS, lw: 3.5, seed: 940, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.35)', gap: 7, angle: -0.5 } });
    // пень
    G.poly(ctx, [[SX - 96 * k, SY], [SX - 104 * k, SY + 150 * k], [SX - 130 * k, SY + 176 * k], [SX + 128 * k, SY + 178 * k], [SX + 102 * k, SY + 152 * k], [SX + 96 * k, SY]], { fill: '#4A3628', lw: 3.5, seed: 920, stroke: '#140D08', hatch: { color: 'rgba(20,10,5,0.35)', gap: 8, angle: 1.4 } });
    G.ellipse(ctx, SX, SY, 96 * k, 30 * k, { fill: '#2A1D14', lw: 3, seed: 921, stroke: '#140D08' });
  }

  // ---------- гнездо из зубиков ----------
  // мелкие зубики (лягушачьи, рыбьи) и среди них большие - человеческие
  const NEST_T = [];
  for (let i = 0; i < 70; i++) {
    const a = U.hash(i, 700) * Math.PI * 2, r = 0.55 + 0.45 * Math.sqrt(U.hash(i, 701));
    NEST_T.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.9, s: 0.7 + 0.5 * U.hash(i, 702), rot: (U.hash(i, 703) - 0.5) * 1.6, big: false, seed: i });
  }
  [[-0.62, 0.35, 0], [0.55, 0.45, 1], [-0.2, 0.7, 2], [0.8, -0.1, 3], [-0.85, -0.05, 4], [0.3, 0.75, 5]].forEach(([x, y, i]) => NEST_T.push({ x, y, s: 1, rot: (U.hash(i, 710) - 0.5) * 0.7, big: true, kind: i % 2 ? 'molar' : 'incisor', seed: 50 + i }));
  function molar(ctx, x, y, s, rot, fill = '#F1ECDC', seed = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    G.poly(ctx, [[-13 * s, -9 * s], [-6 * s, -13 * s], [0, -10 * s], [6 * s, -13 * s], [13 * s, -9 * s], [12 * s, 3 * s], [8 * s, 15 * s], [3 * s, 15 * s], [0, 6 * s], [-3 * s, 15 * s], [-8 * s, 15 * s], [-12 * s, 3 * s]], { fill, lw: 2, seed, stroke: '#5A5246' });
    ctx.restore();
  }
  function incisor(ctx, x, y, s, rot, fill = '#F1ECDC', seed = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    G.poly(ctx, [[-7 * s, -12 * s], [7 * s, -12 * s], [6 * s, 6 * s], [2 * s, 16 * s], [-2 * s, 16 * s], [-6 * s, 6 * s]], { fill, lw: 2, seed, stroke: '#5A5246' });
    ctx.restore();
  }
  function tiny(ctx, x, y, s, rot, seed) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#F4F0E4'; ctx.strokeStyle = '#6A6256'; ctx.lineWidth = 1.2 * k;
    ctx.beginPath(); ctx.moveTo(-3.5 * s, 3 * s); ctx.quadraticCurveTo(0, -9 * s, 3.5 * s, 3 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function nest(ctx, t) {
    const { x, y, rx, ry } = NEST;
    G.ellipse(ctx, x, y + 6 * k, rx * 1.05, ry * 1.1, { fill: '#2E241C', lw: 3, seed: 950, stroke: '#140D08' });
    // свечение камушков в гнезде
    for (let i = 0; i < 5; i++) {
      const px = x + (U.hash(i, 720) - 0.5) * rx * 1.1, py = y + (U.hash(i, 721) - 0.5) * ry * 0.8;
      glow(ctx, px, py, 26 * k, TEAL, 0.25 + 0.1 * Math.sin(t * 2 + i));
      ctx.fillStyle = 'rgba(170,245,235,0.9)'; ctx.beginPath(); ctx.arc(px, py, 4 * k, 0, 7); ctx.fill();
    }
    const items = NEST_T.slice().sort((a, b) => a.y - b.y);
    for (const it of items) {
      const tx = x + it.x * rx, ty = y + it.y * ry;
      if (it.big) (it.kind === 'molar' ? molar : incisor)(ctx, tx, ty, 1.45 * k, it.rot, '#EFE8D6', 760 + it.seed);
      else tiny(ctx, tx, ty, it.s * 1.25 * k, it.rot, it.seed);
    }
    // пустое место спереди - пунктиром, как в шкатулке для украшений
    ctx.save(); ctx.translate(GAP.x, GAP.y);
    ctx.fillStyle = '#120C08';
    ctx.beginPath(); ctx.ellipse(0, 1 * k, 15 * k, 17 * k, 0, 0, 7); ctx.fill();
    ctx.setLineDash([3 * k, 3 * k]); ctx.strokeStyle = 'rgba(240,230,210,0.55)'; ctx.lineWidth = 1.5 * k;
    ctx.beginPath(); ctx.ellipse(0, 1 * k, 15 * k, 17 * k, 0, 0, 7); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }

  // ---------- лягушка (спит) ----------
  function frog(ctx, t) {
    const br = 1 + 0.03 * Math.sin(t * 2.2);
    G.ellipse(ctx, FX + 10 * k, FY - 10 * k, 72 * k * br, 48 * k * br, { fill: '#5C8A5A', lw: 3.5, seed: 941, stroke: '#16261A', hatch: { color: 'rgba(20,40,20,0.25)', gap: 8, angle: 0.4 } });
    const hx = FX - 44 * k, hy = FY + 4 * k;
    G.ellipse(ctx, hx, hy, 42 * k, 31 * k, { fill: '#6A9A64', lw: 3, seed: 942, stroke: '#16261A' });
    for (const d of [-1, 1]) {
      const ex = hx + d * 20 * k, ey = FY - 20 * k;
      G.ellipse(ctx, ex, ey, 13 * k, 11 * k, { fill: '#6A9A64', lw: 2.5, seed: 943 + d, stroke: '#16261A' });
      ctx.strokeStyle = '#16261A'; ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.arc(ex, ey, 7 * k, 0.3, Math.PI - 0.3); ctx.stroke();
    }
    // ротик чуть приоткрыт во сне; пока зубик на месте - виден белый уголок
    ctx.fillStyle = '#2A1A1C'; ctx.beginPath(); ctx.ellipse(hx, hy + 12 * k, 11 * k, 4.5 * k, 0, 0, 7); ctx.fill();
    if (t < ev.tooth) { ctx.fillStyle = '#F4F0E4'; ctx.beginPath(); ctx.moveTo(hx + 1 * k, hy + 8 * k); ctx.lineTo(hx + 7 * k, hy + 8 * k); ctx.lineTo(hx + 4 * k, hy + 13 * k); ctx.closePath(); ctx.fill(); }
    // пузырь-соплюшка: надувается и сдувается во сне
    const b = 0.5 + 0.5 * Math.sin(t * 1.6);
    const bx = hx - 30 * k, by = hy - 2 * k, br2 = (6 + 14 * b) * k;
    ctx.strokeStyle = 'rgba(200,230,255,0.7)'; ctx.lineWidth = 2 * k; ctx.fillStyle = 'rgba(180,220,255,0.18)';
    ctx.beginPath(); ctx.arc(bx - br2 * 0.6, by, br2, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(bx - br2 * 0.9, by - br2 * 0.4, br2 * 0.18, 0, 7); ctx.fill();
    // светящийся камушек под щекой
    if (t >= ev.pebble) {
      const a = r01(t, ev.pebble, ev.pebble + 0.12);
      const px = hx + 26 * k, py = hy + 24 * k;
      if (t < ev.pebble + 0.5) glow(ctx, px, py, 160 * k, TEAL, 0.8 * (1 - r01(t, ev.pebble, ev.pebble + 0.5)));
      glow(ctx, px, py, 40 * k, TEAL, 0.45 * a);
      G.ellipse(ctx, px, py, 7 * k, 5 * k, { fill: 'rgba(190,250,240,0.95)', lw: 1.5, seed: 960, stroke: 'rgba(40,120,110,0.8)' });
    }
  }

  // ---------- Зубочка ----------
  // o: { flap, look (-1 влево .. 1 вправо, 0 - в камеру), smile (0 закрыт .. 1 зубы), pin (0..1 зрачки-точки), tooth (держит зубик), lantern }
  const SMILE = ['s', 'm', 's', 'i', 's', 'g', 'm', 's', 'i', 's', 'm', 's'];
  function zub(ctx, x, y, sc, t, o) {
    const s = k * sc;
    // крылья стрекозы - позади
    const fl = 0.35 + 0.65 * Math.abs(Math.sin(t * (o.flap ? 38 : 4)));
    for (const d of [-1, 1]) for (const [ang, len, wd] of [[-0.5, 46, 13], [-0.05, 38, 11]]) {
      ctx.save(); ctx.translate(x + d * 8 * s, y - 14 * s); ctx.rotate(d * (ang - 0.9)); ctx.scale(1, fl);
      ctx.fillStyle = 'rgba(190,225,255,0.28)'; ctx.strokeStyle = 'rgba(210,235,255,0.75)'; ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.ellipse(0, -len * s * 0.5, wd * s * 0.5, len * s * 0.5, 0, 0, 7); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(210,235,255,0.35)'; ctx.lineWidth = 1 * s;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -len * s * 0.95); ctx.stroke();
      ctx.restore();
    }
    // хвостик-завиток
    G.line(ctx, [[x + 12 * s, y + 14 * s], [x + 26 * s, y + 18 * s], [x + 30 * s, y + 8 * s], [x + 24 * s, y + 4 * s]], { color: PINK, lw: 2.5 * s, seed: 610 });
    // тельце
    G.ellipse(ctx, x, y + 4 * s, 15 * s, 17 * s, { fill: FUR, lw: 2.5, seed: 611, stroke: INK, hatch: { color: 'rgba(90,60,90,0.14)', gap: 5, angle: 0.6 } });
    G.ellipse(ctx, x - 1 * s, y + 8 * s, 8 * s, 10 * s, { fill: '#F7EEF3', lw: 0, seed: 612 });
    // сумочка через плечо
    G.ellipse(ctx, x + 11 * s, y + 10 * s, 6 * s, 5 * s, { fill: '#8C6A54', lw: 1.5, seed: 613, stroke: INK });
    // голова
    const hx = x + o.look * 4 * s, hy = y - 18 * s;
    for (const d of [-1, 1]) {
      const ex = hx + d * 15 * s - o.look * 2 * s, ey = hy - 13 * s;
      G.ellipse(ctx, ex, ey, 10 * s, 11 * s, { fill: FUR, lw: 2, seed: 620 + d, stroke: INK });
      G.ellipse(ctx, ex, ey + 1 * s, 6 * s, 7 * s, { fill: PINK, lw: 0, seed: 622 + d });
    }
    G.ellipse(ctx, hx, hy, 17 * s, 15 * s, { fill: FUR, lw: 2.5, seed: 630, stroke: INK, hatch: { color: 'rgba(90,60,90,0.1)', gap: 6, angle: 0.6 } });
    // глаза: большие и чёрные, в тишине - зрачки-точки
    for (const d of [-1, 1]) {
      const ex = hx + d * 7 * s + o.look * 3 * s, ey = hy - 2 * s;
      const pin = o.pin || 0;
      if (pin < 0.5) {
        ctx.fillStyle = '#07050A'; ctx.beginPath(); ctx.ellipse(ex, ey, 5.2 * s, 6 * s, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.arc(ex - 1.6 * s, ey - 2 * s, 1.8 * s, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(ex + 1.8 * s, ey + 2 * s, 0.8 * s, 0, 7); ctx.fill();
      } else {
        ctx.fillStyle = '#F6F0F2'; ctx.beginPath(); ctx.ellipse(ex, ey, 5.2 * s, 6 * s, 0, 0, 7); ctx.fill();
        ctx.strokeStyle = INK; ctx.lineWidth = 1.2 * s; ctx.stroke();
        ctx.fillStyle = '#07050A'; ctx.beginPath(); ctx.arc(ex, ey, 1.2 * s, 0, 7); ctx.fill();
      }
    }
    // носик, усы, румянец
    const nx = hx + o.look * 6 * s, ny = hy + 5 * s;
    ctx.fillStyle = '#D7708E'; ctx.beginPath(); ctx.ellipse(nx, ny, 2.4 * s, 1.8 * s, 0, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,40,0.5)'; ctx.lineWidth = 0.8 * s;
    const wx = o.smile ? 9 * s : 4 * s;
    for (const d of [-1, 1]) for (const dy of [-1.5, 0.5]) { ctx.beginPath(); ctx.moveTo(nx + d * wx, ny + dy * s); ctx.lineTo(nx + d * (wx + 12 * s), ny + (dy * 2.5 - 1) * s); ctx.stroke(); }
    if (!o.smile) { ctx.fillStyle = 'rgba(235,140,160,0.35)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + d * 11 * s, hy + 5 * s, 3 * s, 1.8 * s, 0, 0, 7); ctx.fill(); } }
    // ротик: милая улыбка или улыбка из чужих зубов
    const my = hy + lerp(9, 7.2, o.smile || 0) * s, mw = lerp(4, 12, o.smile || 0) * s;
    if (!o.smile) {
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.arc(nx, my - 2 * s, 3.5 * s, 0.3, Math.PI - 0.3); ctx.stroke();
    } else {
      // рот: верхняя губа почти прямая, нижняя - глубокая дуга; зубы растут из губ и обрезаны по форме рта
      const op = o.smile, up = 1.6 * s, low = 6.8 * s * op;
      const P0 = [nx - mw, my - 1 * s], P2 = [nx + mw, my - 1 * s];
      const qp = (c, p) => [(1 - p) * (1 - p) * P0[0] + 2 * p * (1 - p) * c[0] + p * p * P2[0], (1 - p) * (1 - p) * P0[1] + 2 * p * (1 - p) * c[1] + p * p * P2[1]];
      const qt = (c, p) => Math.atan2(2 * (1 - p) * (c[1] - P0[1]) + 2 * p * (P2[1] - c[1]), 2 * (1 - p) * (c[0] - P0[0]) + 2 * p * (P2[0] - c[0]));
      const CU = [nx, my - 1 * s + up], CL = [nx, my - 1 * s + low * 2];
      ctx.save();
      ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(CU[0], CU[1], P2[0], P2[1]); ctx.quadraticCurveTo(CL[0], CL[1], P0[0], P0[1]); ctx.closePath();
      const mg = ctx.createLinearGradient(0, my, 0, my + low * 1.2); mg.addColorStop(0, '#3A1420'); mg.addColorStop(1, '#12060A');
      ctx.fillStyle = mg; ctx.fill();
      ctx.clip();
      // язычок в глубине
      ctx.fillStyle = '#8A3A4E'; ctx.beginPath(); ctx.ellipse(nx, my + low * 0.95, mw * 0.45, low * 0.35, 0, 0, 7); ctx.fill();
      // зуб: f - форма, w - ширина, h - длина, dir 1 вниз (верхний ряд), -1 вверх (нижний)
      const tooth = (x, y, ang, w, h, kind, dir) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(1, dir);
        const g = ctx.createLinearGradient(0, 0, 0, h);
        if (kind === 'g') { g.addColorStop(0, '#F3D27A'); g.addColorStop(1, '#B98A2C'); }
        else { g.addColorStop(0, '#FBF7EC'); g.addColorStop(1, kind === 'm' ? '#D9CDB4' : '#E6DCC6'); }
        ctx.fillStyle = g; ctx.beginPath();
        if (kind === 's') { ctx.moveTo(-w / 2, -1 * s); ctx.quadraticCurveTo(-w * 0.15, h * 0.6, 0, h); ctx.quadraticCurveTo(w * 0.15, h * 0.6, w / 2, -1 * s); }
        else if (kind === 'i') { ctx.moveTo(-w / 2, -1 * s); ctx.lineTo(-w * 0.46, h * 0.85); ctx.quadraticCurveTo(0, h * 1.05, w * 0.46, h * 0.85); ctx.lineTo(w / 2, -1 * s); }
        else { ctx.moveTo(-w / 2, -1 * s); ctx.lineTo(-w * 0.5, h * 0.7); ctx.quadraticCurveTo(-w * 0.25, h * 0.95, 0, h * 0.78); ctx.quadraticCurveTo(w * 0.25, h * 0.95, w * 0.5, h * 0.7); ctx.lineTo(w / 2, -1 * s); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,30,0.55)'; ctx.lineWidth = 0.35 * s; ctx.stroke();
        ctx.restore();
      };
      // нижний ряд - мелкие острые, видны наполовину
      const NL = 8;
      for (let i = 0; i < NL; i++) {
        const p = 0.08 + 0.84 * (i + 0.5) / NL, [x, y] = qp(CL, p), c = 1 - 0.4 * Math.abs(2 * p - 1);
        tooth(x, y + 0.5 * s, qt(CL, p) + Math.PI, (mw * 2 / NL) * 0.95 * c, 3.2 * s * c * op, i === 4 ? 'm' : 's', 1);
      }
      // десна и верхний ряд: разные зубы, крупнее к центру
      ctx.strokeStyle = '#B0566C'; ctx.lineWidth = 2.4 * s;
      ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(CU[0], CU[1], P2[0], P2[1]); ctx.stroke();
      const NU = SMILE.length;
      for (let i = 0; i < NU; i++) {
        const p = (i + 0.5) / NU, [x, y] = qp(CU, p), c = 1 - 0.45 * Math.abs(2 * p - 1);
        const kind = SMILE[i], len = (kind === 's' ? 5.2 : kind === 'i' ? 4.6 : 3.8) * s * c * (0.4 + 0.6 * op);
        tooth(x, y + 0.6 * s, qt(CU, p), (mw * 2 / NU) * 1.02 * c, len, kind, 1);
      }
      ctx.restore();
      // губы
      ctx.strokeStyle = INK; ctx.lineWidth = 1.3 * s;
      ctx.beginPath(); ctx.moveTo(P0[0], P0[1]); ctx.quadraticCurveTo(CU[0], CU[1], P2[0], P2[1]); ctx.quadraticCurveTo(CL[0], CL[1], P0[0], P0[1]); ctx.stroke();
    }
    // лапки и фонарик-светлячок
    const lx = x - 17 * s, ly = y + 2 * s;
    G.line(ctx, [[x - 9 * s, y], [lx, ly]], { color: FUR_D, lw: 3 * s, seed: 640 });
    if (o.lantern !== false) {
      G.line(ctx, [[lx, ly], [lx - 2 * s, ly - 14 * s]], { color: '#6B4E3A', lw: 1.8 * s, seed: 641 });
      const fx2 = lx - 2 * s, fy2 = ly - 18 * s;
      glow(ctx, fx2, fy2, 46 * s, '255,200,116', 0.55 + 0.1 * Math.sin(t * 7));
      ctx.fillStyle = 'rgba(255,236,170,0.95)'; ctx.beginPath(); ctx.arc(fx2, fy2, 3.2 * s, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(230,240,255,0.6)'; ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.arc(fx2, fy2, 5.5 * s, 0, 7); ctx.stroke();
    }
    const rx = x + 14 * s, ry = y + (o.tooth ? -6 : 4) * s;
    G.line(ctx, [[x + 9 * s, y], [rx, ry]], { color: FUR_D, lw: 3 * s, seed: 642 });
    if (o.tooth) { tiny(ctx, rx + 1 * s, ry - 3 * s, 1.5 * s, 0.2, 1); glow(ctx, rx, ry - 3 * s, 18 * s, '255,255,240', 0.5 * o.tooth); }
  }

  // где Зубочка в момент t (в мировых координатах)
  const LAND_F = { x: FX + 8 * k, y: FY - 64 * k };        // над лягушкой, справа от мордочки
  const LAND_N = { x: SX - 30 * k, y: SY - 40 * k };       // на краю гнезда
  function zubPos(t) {
    const bob = (a) => Math.sin(t * 3.1) * a * k;
    if (t < ev.landFrog) {
      const p = ease.outCubic(r01(t, 0.2, ev.landFrog));
      return { x: lerp(-60 * k, LAND_F.x, p) + Math.sin(p * 9) * 30 * k * (1 - p), y: lerp(H * 0.5, LAND_F.y, p) + bob(10) * (1 - p), fly: true };
    }
    if (t < ev.pebble + 0.3) {
      // наклоняется к ротику за зубиком, потом - к щеке с камушком
      const toMouth = sm(t, ev.tooth - 0.9, ev.tooth - 0.1) * (1 - sm(t, ev.tooth + 0.2, ev.tooth + 0.8));
      const toCheek = sm(t, ev.pebble - 0.9, ev.pebble - 0.1);
      return { x: LAND_F.x + toMouth * -24 * k + toCheek * 10 * k, y: LAND_F.y + toMouth * 44 * k + toCheek * 54 * k + bob(4), fly: true };
    }
    if (t < ev.toNest + 1.4) {
      const p = ease.inOutCubic(r01(t, ev.pebble + 0.3, ev.toNest + 1.4));
      const sx = LAND_F.x + 10 * k, sy = LAND_F.y + 54 * k;
      return { x: lerp(sx, LAND_N.x, p), y: lerp(sy, LAND_N.y, p) - Math.sin(p * Math.PI) * 140 * k + bob(5), fly: true };
    }
    return { x: LAND_N.x, y: LAND_N.y + Math.sin(t * 1.4) * 1.5 * k, fly: false };
  }

  // ---------- окно будки: поддельное «СПИ» ----------
  function boothWindow(ctx, t) {
    const { x, y, r } = WIN;
    const on = S.morseOn(t);
    ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    if (on) {
      glow(ctx, x, y, 80 * k, '255,180,90', 0.7);
      // в окне - крошечный силуэт с крылышками
      ctx.fillStyle = 'rgba(30,18,10,0.85)';
      ctx.beginPath(); ctx.arc(x, y + 3 * k, 3 * k, 0, 7); ctx.fill();
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + d * 4.5 * k, y - 1 * k, 2 * k, 4.5 * k, d * 0.6, 0, 7); ctx.fill(); }
    }
  }

  // ---------- удар: мордочка вплотную ----------
  function closeUp(ctx, t) {
    ctx.fillStyle = '#05060C'; ctx.fillRect(0, 0, W, H);
    const p = ease.outCubic(r01(t, ev.hit, ev.hit + 0.1));
    const sc = lerp(15, 17, p);
    const fl = 1 - r01(t, ev.hit, ev.hit + 0.18);
    if (fl > 0) { ctx.fillStyle = `rgba(200,250,240,${0.5 * fl})`; ctx.fillRect(0, 0, W, H); }
    zub(ctx, W * 0.5, H * 0.5 + 20 * sc * k, sc, t, { flap: false, look: 0, smile: 1, pin: 1, lantern: false });
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
    const a = r01(t, ev.title + 0.3, ev.title + 0.6) * (1 - r01(t, S.DURATION - 0.5, S.DURATION));
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a;
    const sc = Math.round(4 * k), y = H * 0.42 + 210 * k;
    if (t < ev.endCut) {
      const secs = String(2 + Math.floor(t - ev.title)).padStart(2, '0');
      pixelText(ctx, `● REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
    } else if (Math.floor(t * 6) % 7 !== 0) {
      pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
    }
    // в темноте загорается светящийся камушек - она уже приходила
    if (t >= ev.endPebble) {
      const px = W * 0.5, py = H * 0.42 + 400 * k;
      const fl = 1 - r01(t, ev.endPebble, ev.endPebble + 0.4);
      glow(ctx, px, py, 120 * k, TEAL, 0.35 + 0.5 * fl);
      G.ellipse(ctx, px, py, 12 * k, 8 * k, { fill: 'rgba(190,250,240,0.95)', lw: 1.5, seed: 961, stroke: 'rgba(40,120,110,0.8)' });
    }
    ctx.restore();
  }

  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    boothWindow(ctx, t);
    frog(ctx, t);
    nest(ctx, t);
    const zp = zubPos(t);
    const turn = sm(t, ev.turn, ev.turn + 0.8);
    const look = t < ev.toNest + 1.4 ? (zp.fly && t < ev.landFrog ? 0.8 : -0.6) : lerp(0.7, 0, turn);
    const smile = t >= ev.smile ? ease.outCubic(r01(t, ev.smile, ev.smile + 0.6)) : 0;
    const holding = t >= ev.tooth && t < ev.pebble - 0.4 ? 1 : 0;
    zub(ctx, zp.x, zp.y, 2.0, t, { flap: zp.fly, look, smile, pin: t >= ev.smile ? 1 : 0, tooth: holding });
    if (t >= ev.tooth && t < ev.tooth + 0.4) {          // блеск зубика
      const a = 1 - r01(t, ev.tooth, ev.tooth + 0.4);
      glow(ctx, zp.x + 28 * k, zp.y - 12 * k, 90 * k, '255,255,240', 0.9 * a);
    }
  }

  // камера: [центр x, центр y, зум]
  function cam(t) {
    const A = [W * 0.42, H * 0.58, 1.35];
    const F = [FX + 10 * k, FY - 40 * k, 2.0];
    const N = [SX - 10 * k, SY - 20 * k, 2.2];
    const R = [SX, SY + 4 * k, 3.0];
    const Gp = [GAP.x, GAP.y, 4.2];
    const Z = [LAND_N.x, LAND_N.y - 20 * k, 4.6];
    const mix = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
    let c = mix(A, F, sm(t, ev.landFrog - 0.6, ev.tooth - 1.0));
    c = mix(c, N, sm(t, ev.toNest, ev.toNest + 1.6));
    c = mix(c, R, sm(t, ev.reveal, ev.reveal + 1.4));
    c = mix(c, Gp, sm(t, ev.toGap, ev.toGap + 1.2));
    c = mix(c, Z, sm(t, ev.turn - 0.4, ev.turn + 0.6));
    return c;
  }

  Studio.film({
    draw(ctx, t) {
      const [cx, cy, z] = cam(t);
      ctx.save();
      ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cx, -cy);
      world(ctx, t);
      ctx.restore();
      // в тишине темнеет, светится только Зубочка
      if (t >= ev.gone && t < ev.hit) { ctx.fillStyle = `rgba(2,3,8,${0.55 * r01(t, ev.gone, ev.gone + 1.0)})`; ctx.fillRect(0, 0, W, H); }
      if (t >= ev.hit && t < ev.cut) closeUp(ctx, t);
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.2, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
