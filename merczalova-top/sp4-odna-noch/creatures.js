// «Одна ночь на Мерцаловой топи» - существа из серий 1-19, перенесены так, чтобы рисоваться в любой точке мира.
// Каждая функция: (ctx, x, y, s, t, o) - x,y = ноги/основание, s - масштаб (1 = как в вертикальной серии).
(function () {
  const U = globalThis.U, G = globalThis.G;
  const { clamp, lerp, ease } = U;
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const WARM = '255,200,116';
  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003 || r <= 0) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  const at = (ctx, x, y, s, fn) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore(); };
  function orb(ctx, x, y, s, a = 1) {
    if (a <= 0.01) return;
    glow(ctx, x, y, 90 * s, WARM, 0.55 * a);
    ctx.fillStyle = `rgba(255,236,190,${a})`; ctx.beginPath(); ctx.arc(x, y, 7 * s, 0, 7); ctx.fill();
  }

  // ---------- лягушка (серии 3, 6) ----------
  // o: { sac 0..1, sleep, look -1..1 }
  function frog(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const ink = '#0A1A10', sac = o.sac || 0;
      G.ellipse(ctx, 0, -18, 46, 30, { fill: '#4E8A4A', lw: 3, seed: 800, stroke: ink, hatch: { color: 'rgba(10,30,10,0.3)', gap: 7 } });
      if (sac > 0.02) G.ellipse(ctx, 20, -6, 22 * sac + 3, 18 * sac + 3, { fill: '#D6E3A8', lw: 2, seed: 801, stroke: ink });
      for (const e of [-1, 1]) {
        G.ellipse(ctx, e * 18 + 12, -42, 11, 11, { fill: '#4E8A4A', lw: 2.5, seed: 802 + e, stroke: ink });
        if (o.sleep) G.line(ctx, [[e * 18 + 7, -43], [e * 18 + 13, -40], [e * 18 + 19, -43]], { color: ink, lw: 2, seed: 806 + e });
        else dot(ctx, e * 18 + 14 + (o.look || 0) * 3, -43, 4.5, '#0A0A0A');
      }
    });
  }

  // ---------- Подражатель (серия 3) ----------
  // o: { look, lookY, mouth 0..1, half 0..1 (1 = открыты), glowEyes 0..1, small (без хвоста) }
  function mimic(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const fur = '#6B5F76', ink = '#17121D', belly = '#9C8EA6';
      const look = o.look || 0, lookY = o.lookY || 0;
      G.line(ctx, [[30, 10], [110, 20], [150, -40 + Math.sin(t * 1.3) * 10]], { color: fur, lw: 10, seed: 700 });
      G.ellipse(ctx, 0, -55, 52, 68, { fill: fur, lw: 4, seed: 701, stroke: ink, hatch: { color: 'rgba(20,10,30,0.3)', gap: 7, angle: 0.8 } });
      G.ellipse(ctx, 0, -45, 30, 44, { fill: belly, lw: 2, seed: 702, stroke: ink });
      for (const d of [-1, 1]) for (let f = 0; f < 3; f++) G.line(ctx, [[d * 22, -6], [d * (30 + f * 9), 8]], { color: ink, lw: 3, seed: 710 + f + (d > 0 ? 5 : 0) });
      const hx = 0, hy = -158;
      for (const d of [-1, 1]) {
        G.ellipse(ctx, hx + d * 62, hy - 52, 30, 42, { fill: fur, lw: 4, seed: 720 + d, stroke: ink });
        G.ellipse(ctx, hx + d * 62, hy - 50, 17, 28, { fill: '#C98E9E', lw: 2, seed: 722 + d, stroke: ink });
      }
      G.ellipse(ctx, hx, hy, 66, 58, { fill: fur, lw: 4, seed: 724, stroke: ink, hatch: { color: 'rgba(20,10,30,0.25)', gap: 8, angle: 0.6 } });
      const half = o.half === undefined ? 1 : o.half;
      for (const d of [-1, 1]) {
        const ex = hx + d * 29, ey = hy - 6, R = 27;
        G.ellipse(ctx, ex, ey, R, Math.max(1.5, R * half), { fill: '#FFC86B', lw: 3, seed: 730 + d, stroke: ink });
        if (half > 0.3) {
          G.ellipse(ctx, ex + look * 7, ey + lookY * 5, 15, 15 * half, { fill: '#08060A', lw: 2, seed: 732 + d, stroke: '#08060A' });
          dot(ctx, ex + look * 7 - 6, ey - 7 * half, 4.5, 'rgba(255,255,255,0.9)');
        }
        glow(ctx, ex, ey, 70 + 90 * (o.glowEyes || 0), '255,190,90', 0.2 + 0.6 * (o.glowEyes || 0));
      }
      const mo = o.mouth || 0;
      G.ellipse(ctx, hx, hy + 30, 9 + 6 * mo, Math.max(1.5, 1.5 + 13 * mo), { fill: '#1A0A12', lw: 2.5, seed: 740, stroke: ink });
    });
  }

  // ---------- Мохнач (серия 4) ----------
  const MOSS = '#3E6B4A', MOSS_D = '#22402E', MOSS_L = '#6A9A5E', MINK = '#0B1A12';
  const RX = 150, RY = 118;
  const EYES = [];
  {
    const rnd = U.mulberry32(404); const spots = []; let tries = 0;
    while (spots.length < 24 && tries < 4000) {
      tries++;
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.86, x = Math.cos(a) * r, y = Math.sin(a) * r * 0.95 - 0.05, s = 0.55 + rnd() * 0.6;
      if (spots.every((p) => Math.hypot(p.x - x, (p.y - y) * 1.1) > (p.s + s) * 0.15)) spots.push({ x, y, s });
    }
    spots.sort((p, q) => q.s - p.s);
    EYES.push(...spots);
  }
  function mossBody(ctx, back) {
    const by = -RY * 0.82;
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * (0.08 + 0.84 * (i / 15)), x = -Math.cos(a) * RX * 0.98, y0 = by + Math.sin(a) * RY * 0.55, len = 24 + 30 * U.hash(i, 900);
      G.line(ctx, [[x, y0], [x + (U.hash(i, 901) - 0.5) * 10, y0 + len]], { color: MOSS_D, lw: 5, seed: 900 + i });
    }
    G.ellipse(ctx, 0, by, RX, RY, { fill: MOSS, lw: 4, seed: back ? 951 : 950, stroke: MINK, hatch: { color: 'rgba(8,30,16,0.35)', gap: 7, angle: back ? -0.7 : 0.7 } });
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.12 + 0.76 * (i / 8)), r = 26 + 12 * U.hash(i, 960);
      G.ellipse(ctx, Math.cos(a) * RX * 0.86, by + Math.sin(a) * RY * 0.86, r, r * 0.8, { fill: i % 2 ? MOSS_L : MOSS, lw: 3, seed: 960 + i + (back ? 20 : 0), stroke: MINK });
    }
    G.line(ctx, [[40, by - RY * 0.9], [40, by - RY * 0.9 - 18]], { color: '#D8CDB0', lw: 4, seed: 992 });
    G.ellipse(ctx, 40, by - RY * 0.9 - 20, 15, 8, { fill: '#B8644A', lw: 2.5, seed: 993, stroke: MINK });
  }
  // спиной: 24 глаза. o: { open(i) -> 0..1, gaze(i) -> [lx, ly], breathe, sprout(i) -> 0..1 }
  function mokhnachBack(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const br = 1 + 0.018 * Math.sin(t * 1.4);
      ctx.save(); ctx.translate(0, 0); ctx.scale(1, br);
      mossBody(ctx, true);
      const by = -RY * 0.82;
      G.line(ctx, [[0, by - RY * 0.9], [6, by], [0, by + RY * 0.6]], { color: MOSS_D, lw: 6, seed: 1100 });
      EYES.forEach((e, i) => {
        const ex = e.x * RX * 0.82, ey = by + e.y * RY * 0.82, R = e.s * 24;
        const op = o.open ? o.open(i) : 1;
        if (op <= 0.02) {
          G.line(ctx, [[ex - R * 0.8, ey], [ex, ey + R * 0.25], [ex + R * 0.8, ey]], { color: 'rgba(10,30,18,0.55)', lw: 2.5, seed: 1200 + i });
        } else {
          G.ellipse(ctx, ex, ey, R, R * 0.72 * op, { fill: '#ECE5C6', lw: 2.5, seed: 1300 + i, stroke: MINK });
          if (op > 0.35) {
            const [lx, ly] = o.gaze ? o.gaze(i) : [U.noise1(t * 0.5 + i, 7) * 0.3, 0];
            const ix = ex + lx * R * 0.6, iy = ey + ly * R * 0.4;
            ctx.fillStyle = '#6FCFD2'; ctx.beginPath(); ctx.ellipse(ix, iy, R * 0.45, R * 0.45 * Math.min(1, op), 0, 0, 7); ctx.fill();
            ctx.fillStyle = '#05080A'; ctx.beginPath(); ctx.ellipse(ix, iy, R * 0.2, R * 0.26 * Math.min(1, op), 0, 0, 7); ctx.fill();
            dot(ctx, ix - R * 0.16, iy - R * 0.16, R * 0.09, 'rgba(255,255,255,0.9)');
          }
          glow(ctx, ex, ey, R * 2.6, '90,200,210', 0.14 * Math.min(1, op));
        }
        const sp = o.sprout ? o.sprout(i) : 0;
        if (sp > 0.01) mush(ctx, ex, ey + R * 0.5, 0.9 + e.s * 0.6, t, { grow: sp, awake: 0, seed: i * 3 + 1 });
      });
      ctx.restore();
    });
  }
  // спящий комок мха (рассвет)
  function mossMound(ctx, x, y, s, t) {
    at(ctx, x, y, s, () => {
      ctx.save(); ctx.scale(1, 0.72 + 0.01 * Math.sin(t * 1.2)); mossBody(ctx, true); ctx.restore();
      for (let i = 0; i < 6; i++) { const e = EYES[i]; const ex = e.x * RX * 0.8, ey = -RY * 0.6 + e.y * RY * 0.55; G.line(ctx, [[ex - 12, ey], [ex, ey + 4], [ex + 12, ey]], { color: 'rgba(10,30,18,0.6)', lw: 2.5, seed: 1250 + i }); }
    });
  }

  // ---------- Улыбыши (серия 5) ----------
  const BINK = '#15121C', SKIN = '#C4BDD3', SKIN_D = '#9D95B0';
  function smile(ctx, x, y, w, h) {
    ctx.save(); ctx.translate(x, y);
    ctx.beginPath(); ctx.moveTo(-w, -h * 0.15); ctx.quadraticCurveTo(0, h * 1.25, w, -h * 0.15); ctx.quadraticCurveTo(0, h * 0.55, -w, -h * 0.15); ctx.closePath();
    ctx.fillStyle = '#2A1420'; ctx.fill();
    ctx.fillStyle = '#F2EEE4';
    for (let i = 1; i < 8; i++) { const u = i / 8, xx = -w + 2 * w * u, top = -h * 0.15 + h * 1.1 * u * (1 - u) * 2 * 0.62; ctx.fillRect(xx - w * 0.04, top - h * 0.02, w * 0.08, h * 0.16); }
    ctx.restore();
  }
  // o: { hop px, sleep 0..1, lean, look }
  function baby(ctx, x, y, s, t, o = {}, i = 0) {
    at(ctx, x, y, s, () => {
      const sleep = o.sleep || 0, sq = 1 - 0.18 * sleep;
      const yy = -(o.hop || 0) - (1 - sleep) * Math.abs(Math.sin(t * 1.7 + i)) * 4;
      ctx.translate(0, yy);
      const lean = (o.lean || 0) + sleep * (i % 2 ? 0.25 : -0.25);
      const hr = 54, by = -30 * sq, hy = -78 * sq;
      G.ellipse(ctx, 0, by, 30, 26 * sq, { fill: SKIN_D, lw: 3, seed: 1600 + i, stroke: BINK });
      ctx.rotate(lean);
      G.ellipse(ctx, 0, hy, hr, hr * 0.9 * sq, { fill: SKIN, lw: 3.5, seed: 1610 + i, stroke: BINK, hatch: { color: 'rgba(40,30,60,0.18)', gap: 8, angle: 0.6 } });
      for (const d of [-1, 1]) {
        const ex = d * 17 + (o.look || 0) * 4, ey = hy - 10;
        if (sleep < 0.5) dot(ctx, ex, ey, 5.5, '#0A0A0A');
        else G.line(ctx, [[ex - 7, ey], [ex, ey + 4], [ex + 7, ey]], { color: BINK, lw: 3, seed: 1620 + i + d });
        ctx.fillStyle = 'rgba(232,140,150,0.45)'; ctx.beginPath(); ctx.ellipse(d * 30, hy + 6, 8, 5, 0, 0, 7); ctx.fill();
      }
      smile(ctx, 0, hy + 10, 30, 22);
    });
  }

  // ---------- Тишка (серия 6) ----------
  // o: { look 0 (боком, влево) .. 1 (в камеру), mouth 0..1 }; mouthAt даёт мировую точку рта
  function tishka(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const look = o.look || 0, ink = '#04050B', rim = 'rgba(140,200,220,0.55)';
      const breathe = 1 + 0.02 * Math.sin(t * 2.3), ear = Math.sin(t * 1.7) * 0.05 + (o.ear || 0);
      G.ellipse(ctx, 10 * (1 - look), -36, 46, 40 * breathe, { fill: ink, lw: 3, seed: 1700, stroke: rim });
      if (look < 0.6) G.ellipse(ctx, 52 * (1 - look), -26, 12, 11, { fill: ink, lw: 2, seed: 1701, stroke: rim });
      const hx = -30 * (1 - look), hy = -90;
      for (const d of [-1, 1]) {
        const ex = hx + d * 16 * (0.4 + 0.6 * look) + 6 * (1 - look);
        G.poly(ctx, [[ex - 10, hy - 20], [ex + d * 8 + ear * 60, hy - 104], [ex + 12, hy - 22]], { fill: ink, lw: 3, seed: 1710 + d, stroke: rim });
      }
      G.ellipse(ctx, hx, hy, 40, 36, { fill: ink, lw: 3, seed: 1720, stroke: rim });
      for (const d of look > 0.5 ? [-1, 1] : [-1]) dot(ctx, hx + (look > 0.5 ? d * 15 : -18), hy - 10, 4, '#DDE8F0');
      const mx = hx - lerp(18, 0, look), my = hy + 2 + look * 14, mo = o.mouth || 0;
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(mx, my, 5 + 16 * mo, 5 + 19 * mo, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(160,215,230,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
    });
  }
  const tishkaMouth = (x, y, s, look) => [x + s * (-30 * (1 - look) - lerp(18, 0, look)), y + s * (-88 + look * 14)];

  // ---------- Фонарница (серия 8) ----------
  const BARK = '#141A2C', FINK = '#05070F';
  // o: { lx, ly, rx, ry (кисти, локально), lit, nod, eyes, curl }; возвращает кончики пальцев (локально)
  function fonarnitsa(ctx, x, y, s, t, o = {}) {
    let tipsW = [];
    at(ctx, x, y, s, () => {
      const SHY = -480, sway = Math.sin(t * 0.6) * 6;
      G.poly(ctx, [[-26, 0], [-14 + sway * 0.5, SHY + 40], [-30 + sway, SHY], [sway, SHY - 20], [30 + sway, SHY], [16 + sway * 0.5, SHY + 40], [24, 0]], { fill: BARK, lw: 3, seed: 900, stroke: FINK, hatch: { color: 'rgba(0,0,0,0.35)', gap: 7, angle: 1.2 } });
      G.line(ctx, [[10, -120], [44, -170]], { color: BARK, lw: 6, seed: 901 });
      const nod = o.nod || 0, hx = sway + 18 + nod * 20, hy = SHY - 70 + nod * 14;
      G.line(ctx, [[sway, SHY - 20], [hx, hy + 30]], { color: BARK, lw: 12, seed: 902 });
      G.ellipse(ctx, hx, hy, 30, 40, { fill: BARK, lw: 3, seed: 903, stroke: FINK, hatch: { color: 'rgba(0,0,0,0.35)', gap: 6, angle: 0.4 } });
      for (const d of [-1, 1]) { ctx.fillStyle = `rgba(200,215,230,${0.35 + 0.5 * (o.eyes || 0)})`; ctx.beginPath(); ctx.ellipse(hx + d * 11, hy - 4, 6, 1.8 + 3 * (o.eyes || 0), 0, 0, 7); ctx.fill(); }
      const arm = (sx, wx, wy, seed) => { const ex = lerp(sx, wx, 0.5) + (wx > sx ? 30 : -30), ey = lerp(SHY, wy, 0.5) - 40; G.line(ctx, [[sx, SHY + 4], [ex, ey], [wx, wy]], { color: BARK, lw: 7, seed }); };
      const lx = o.lx ?? -170, ly = o.ly ?? SHY + 10, rx = o.rx ?? 160 + Math.sin(t * 0.8) * 8, ry = o.ry ?? SHY - 40;
      arm(-26 + sway, lx, ly, 910); arm(26 + sway, rx, ry, 911);
      const hand = (wx, wy, dir, curl, seedBase, lit, n) => {
        const tips = [];
        for (let i = 0; i < 4; i++) {
          const spread = (i - 1.5) * 0.32 * (1 - curl * 0.8), ang = dir + spread + Math.sin(t * 1.3 + i) * 0.04, len = 95 * (1 - curl * 0.55);
          const jx = wx + Math.cos(ang) * len * 0.55, jy = wy + Math.sin(ang) * len * 0.55, a2 = ang + curl * 1.6 * (i < 2 ? 1 : -1) * 0.6;
          const tx = jx + Math.cos(a2) * len * 0.5, ty = jy + Math.sin(a2) * len * 0.5;
          G.line(ctx, [[wx, wy], [jx, jy], [tx, ty]], { color: BARK, lw: 4.5, seed: seedBase + i });
          tips.push([tx, ty]);
        }
        tips.forEach(([px, py], i) => orb(ctx, px, py, 0.9, lit(n + i)));
        return tips;
      };
      const lit = o.lit || (() => 1);
      const a = hand(rx, ry, -1.4, 0, 930, lit, 0), b = hand(lx, ly, o.ldir ?? -1.9, o.curl || 0, 920, lit, 4);
      tipsW = [...a, ...b].map(([px, py]) => [x + px * s, y + py * s]);
    });
    return tipsW;
  }

  // ---------- Пузырёк (серия 10) ----------
  const PINK_ = '#120F18', PSKIN = 'rgba(232,214,238,0.9)', PSKIN_D = 'rgba(196,170,208,0.9)', GILL = '#E89AB8';
  function puz(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const INK = PINK_, puff = o.puff || 0, look = o.look || 0;
      const tw = Math.sin(t * 3.1) * 14;
      G.poly(ctx, [[-20, 36], [-60 + tw * 0.5, 74], [-110 + tw, 70], [-70 + tw * 0.6, 52], [-10, 52]], { fill: 'rgba(214,190,226,0.75)', lw: 2.5, seed: 700, stroke: INK });
      G.ellipse(ctx, 0, 42, 40, 28, { fill: PSKIN, lw: 3, seed: 701, stroke: INK, hatch: { color: 'rgba(90,60,110,0.14)', gap: 7, angle: 0.5 } });
      for (const d of [-1, 1]) {
        const fx = d * 30, fy = 62 + Math.sin(t * 2 + d) * 2;
        G.line(ctx, [[d * 18, 50], [fx, fy]], { color: PSKIN_D, lw: 6, seed: 702 + d });
        for (let f = -1; f <= 1; f++) dot(ctx, fx + f * 5, fy + 4, 2.6, PSKIN_D);
      }
      const hy = -4, hw = 62 * (1 + 0.18 * puff), hh = 46 * (1 + 0.12 * puff);
      for (const d of [-1, 1]) for (let j = 0; j < 3; j++) {
        const a = -0.9 + j * 0.55 + Math.sin(t * 2.4 + j + d) * 0.07, bx = d * hw * 0.82, by = hy - 10 + j * 12, L = 54 - j * 8;
        const ex = bx + d * Math.cos(a) * L, ey = by + Math.sin(a) * L;
        G.line(ctx, [[bx, by], [ex, ey]], { color: GILL, lw: 4.5, seed: 710 + j + d * 10 });
        for (let f = 1; f <= 4; f++) { const px = lerp(bx, ex, f / 5), py = lerp(by, ey, f / 5); G.line(ctx, [[px, py], [px + d * 9 * Math.cos(a - 1.2), py + 9 * Math.sin(a - 1.2)]], { color: GILL, lw: 2.2, seed: 720 + f + j * 5 + d * 30 }); }
        glow(ctx, ex, ey, 22, '240,150,190', 0.18);
      }
      G.ellipse(ctx, 0, hy, hw, hh, { fill: PSKIN, lw: 3.5, seed: 730, stroke: INK, hatch: { color: 'rgba(90,60,110,0.12)', gap: 8, angle: 0.6 } });
      if (puff > 0.05) for (const d of [-1, 1]) G.ellipse(ctx, d * 34, hy + 16, 16 * puff, 12 * puff, { fill: 'rgba(240,160,190,0.45)', lw: 0, seed: 731 + d });
      for (const d of [-1, 1]) {
        const ex = d * 30 + look * 4, ey = hy - 6;
        ctx.fillStyle = '#07060B'; ctx.beginPath(); ctx.ellipse(ex, ey, 13, 14, 0, 0, 7); ctx.fill();
        dot(ctx, ex - 4, ey - 5, 3.6, 'rgba(255,255,255,0.9)'); dot(ctx, ex + 4, ey + 4, 1.5, 'rgba(255,255,255,0.9)');
      }
      ctx.strokeStyle = INK; ctx.lineWidth = 2;
      if (puff > 0.3) { ctx.beginPath(); ctx.arc(0, hy + 20, 5, 0, 7); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(0, hy + 10, 18, 0.35, Math.PI - 0.35); ctx.stroke(); }
    });
  }
  const puzMouth = (x, y, s) => [x, y + 16 * s];
  function bubble(ctx, x, y, r, a = 1, inner) {
    if (a <= 0.01 || r <= 0.5) return;
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(210,235,250,0.10)'); g.addColorStop(0.8, 'rgba(160,200,230,0.10)'); g.addColorStop(1, 'rgba(200,230,250,0.35)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (inner) { ctx.save(); ctx.beginPath(); ctx.arc(x, y, r * 0.96, 0, 7); ctx.clip(); inner(ctx, x, y, r); ctx.restore(); }
    ctx.strokeStyle = 'rgba(205,232,250,0.75)'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.2, r * 0.11, -0.7, 0, 7); ctx.fill();
    ctx.restore();
  }

  // ---------- Моховичок (серия 11) ----------
  const MUINK = '#120F18';
  // o: { grow 0..1, awake 0..1, yawn, seed, quilt (тянет одеяльце) }
  function mush(ctx, x, y, s, t, o) {
    const g = o.grow; if (g <= 0.01) return;
    const sd = o.seed || 0, sway = Math.sin(t * 1.3 + sd) * 3 * s * (1 - (o.awake || 0) * 0.8);
    const h = 30 * s * g, tx = x + sway, ty = y - h;
    G.poly(ctx, [[x - 7 * s * g, y], [tx - 6 * s * g, ty + 4 * s], [tx + 6 * s * g, ty + 4 * s], [x + 7 * s * g, y]], { fill: '#E9E0CB', lw: 2.2, seed: 800 + sd, stroke: MUINK });
    const cw = 22 * s * g, chh = 14 * s * Math.min(1, g);
    glow(ctx, tx, ty + 4 * s, 30 * s, '90,200,210', 0.08);
    G.ellipse(ctx, tx, ty, cw, chh, { fill: '#C98A6E', lw: 2.5, seed: 810 + sd, stroke: MUINK, hatch: { color: 'rgba(80,30,20,0.18)', gap: 6, angle: 0.6 } });
    ctx.fillStyle = '#F2D9C6';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(tx + (i - 1) * cw * 0.5, ty - chh * (i === 1 ? 0.45 : 0.15), 2.6 * s * g, 0, 7); ctx.fill(); }
    if (g < 0.4) return;
    const fy = ty + 13 * s, aw = o.awake || 0;
    for (const d of [-1, 1]) {
      const ex = tx + d * 3.6 * s, ey = fy;
      if (aw > 0.5) { ctx.fillStyle = '#07060B'; ctx.beginPath(); ctx.ellipse(ex, ey, 2.4 * s, 2.9 * s, 0, 0, 7); ctx.fill(); dot(ctx, ex - 0.8 * s, ey - 1 * s, 0.9 * s, 'rgba(255,255,255,0.9)'); }
      else { ctx.strokeStyle = MUINK; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(ex, ey - 0.6 * s, 2 * s, 0.3, Math.PI - 0.3); ctx.stroke(); }
    }
    ctx.strokeStyle = MUINK; ctx.lineWidth = 1.1 * s;
    if ((o.yawn || 0) > 0.1) { ctx.fillStyle = '#3A1F22'; ctx.beginPath(); ctx.ellipse(tx, fy + 5 * s, 1.8 * s, 2.6 * s * o.yawn, 0, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.arc(tx, fy + 3.5 * s, 2 * s, 0.4, Math.PI - 0.4); ctx.stroke(); }
    ctx.fillStyle = 'rgba(230,140,140,0.35)';
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(tx + d * 6.5 * s, fy + 2.5 * s, 2 * s, 1.2 * s, 0, 0, 7); ctx.fill(); }
  }

  // ---------- Луноед (серия 12) ----------
  const LINK = '#120F18', LFUR = '#CFC8DC', LFUR_D = '#A69EB8';
  // o: { reach 0..1, chew 0..1, look, moon 0..1 }
  function lunoed(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const INK = LINK, tw = Math.sin(t * 1.1) * 10;
      for (let i = 0; i < 6; i++) { const p = i / 5; G.ellipse(ctx, 40 + Math.sin(p * 2.4) * 34 + tw * p, 20 + p * 190, 30 - 10 * p, 30, { fill: i % 2 ? LFUR : '#BDB5CC', lw: 2, seed: 600 + i, stroke: INK, hatch: { color: 'rgba(70,60,90,0.14)', gap: 6, angle: 1 } }); }
      G.ellipse(ctx, 0, 0, 46, 54, { fill: LFUR, lw: 3, seed: 610, stroke: INK, hatch: { color: 'rgba(70,60,90,0.16)', gap: 7, angle: 0.6 } });
      G.ellipse(ctx, -6, 10, 26, 34, { fill: '#E6E1EE', lw: 0, seed: 611 });
      const look = o.look || 0, chew = o.chew || 0, hx = -8 + look * 10, hy = -70;
      for (const d of [-1, 1]) G.ellipse(ctx, hx + d * 38, hy - 34, 16, 18, { fill: LFUR, lw: 2.5, seed: 620 + d, stroke: INK });
      G.ellipse(ctx, hx, hy, 52 * (1 + 0.12 * chew), 44, { fill: LFUR, lw: 3.5, seed: 630, stroke: INK, hatch: { color: 'rgba(70,60,90,0.12)', gap: 8, angle: 0.6 } });
      const ml = o.moon ?? 1;
      for (const d of [-1, 1]) {
        const ex = hx + d * 22 + look * 6, ey = hy - 4;
        ctx.fillStyle = '#06050A'; ctx.beginPath(); ctx.ellipse(ex, ey, 16, 18, 0, 0, 7); ctx.fill();
        if (ml > 0) { dot(ctx, ex - 4, ey - 5, 6, `rgba(240,244,230,${0.4 + 0.5 * ml})`); dot(ctx, ex - 4 + 6 * (1 - ml), ey - 5, 6, '#06050A'); }
        dot(ctx, ex + 5, ey + 6, 2, 'rgba(255,255,255,0.85)');
      }
      ctx.fillStyle = '#B07A90'; ctx.beginPath(); ctx.ellipse(hx + look * 6, hy + 14, 5, 3.5, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath();
      const mo = chew > 0.1 ? 3 * Math.abs(Math.sin(t * 14)) : 0;
      ctx.ellipse(hx + look * 6, hy + 23, 6, 2 + mo, 0, 0, Math.PI); ctx.stroke();
      const reach = o.reach || 0;
      for (const d of [-1, 1]) {
        const sx = d * 20, sy = -26, rx = lerp(d * 14, 60 + d * 14, reach * 0.6), ry = lerp(-6, -150, reach);
        G.line(ctx, [[sx, sy], [rx, ry]], { color: LFUR_D, lw: 9, seed: 640 + d });
        G.ellipse(ctx, rx, ry, 8, 7, { fill: LFUR, lw: 2, seed: 642 + d, stroke: INK });
      }
    });
  }

  // ---------- Зубочка (серия 13) ----------
  const ZINK = '#17121C', ZFUR = '#EADCE6', ZFUR_D = '#C9B4C6', ZPINK = '#E9A3B8';
  function tiny(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.fillStyle = '#F4F0E4'; ctx.strokeStyle = '#6A6256'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(-3.5 * s, 3 * s); ctx.quadraticCurveTo(0, -9 * s, 3.5 * s, 3 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function molar(ctx, x, y, s, rot, seed = 1) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    G.poly(ctx, [[-13 * s, -9 * s], [-6 * s, -13 * s], [0, -10 * s], [6 * s, -13 * s], [13 * s, -9 * s], [12 * s, 3 * s], [8 * s, 15 * s], [3 * s, 15 * s], [0, 6 * s], [-3 * s, 15 * s], [-8 * s, 15 * s], [-12 * s, 3 * s]], { fill: '#EFE8D6', lw: 2, seed, stroke: '#5A5246' });
    ctx.restore();
  }
  // o: { look, flap, tooth 0..1 (несёт зубик) }
  function zub(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const fl = 0.35 + 0.65 * Math.abs(Math.sin(t * (o.flap ? 38 : 4)));
      for (const d of [-1, 1]) for (const [ang, len, wd] of [[-0.5, 46, 13], [-0.05, 38, 11]]) {
        ctx.save(); ctx.translate(d * 8, -14); ctx.rotate(d * (ang - 0.9)); ctx.scale(1, fl);
        ctx.fillStyle = 'rgba(190,225,255,0.28)'; ctx.strokeStyle = 'rgba(210,235,255,0.75)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, -len * 0.5, wd * 0.5, len * 0.5, 0, 0, 7); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      G.line(ctx, [[12, 14], [26, 18], [30, 8], [24, 4]], { color: ZPINK, lw: 2.5, seed: 610 });
      G.ellipse(ctx, 0, 4, 15, 17, { fill: ZFUR, lw: 2.5, seed: 611, stroke: ZINK, hatch: { color: 'rgba(90,60,90,0.14)', gap: 5, angle: 0.6 } });
      G.ellipse(ctx, -1, 8, 8, 10, { fill: '#F7EEF3', lw: 0, seed: 612 });
      G.ellipse(ctx, 11, 10, 6, 5, { fill: '#8C6A54', lw: 1.5, seed: 613, stroke: ZINK });
      const look = o.look || 0, hx = look * 4, hy = -18;
      for (const d of [-1, 1]) { const ex = hx + d * 15 - look * 2, ey = hy - 13; G.ellipse(ctx, ex, ey, 10, 11, { fill: ZFUR, lw: 2, seed: 620 + d, stroke: ZINK }); G.ellipse(ctx, ex, ey + 1, 6, 7, { fill: ZPINK, lw: 0, seed: 622 + d }); }
      G.ellipse(ctx, hx, hy, 17, 15, { fill: ZFUR, lw: 2.5, seed: 630, stroke: ZINK, hatch: { color: 'rgba(90,60,90,0.1)', gap: 6, angle: 0.6 } });
      for (const d of [-1, 1]) { const ex = hx + d * 7 + look * 3, ey = hy - 2; ctx.fillStyle = '#07050A'; ctx.beginPath(); ctx.ellipse(ex, ey, 5.2, 6, 0, 0, 7); ctx.fill(); dot(ctx, ex - 1.6, ey - 2, 1.8, 'rgba(255,255,255,0.95)'); }
      const nx = hx + look * 6, ny = hy + 5;
      ctx.fillStyle = '#D7708E'; ctx.beginPath(); ctx.ellipse(nx, ny, 2.4, 1.8, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(40,30,40,0.5)'; ctx.lineWidth = 0.8;
      for (const d of [-1, 1]) for (const dy of [-1.5, 0.5]) { ctx.beginPath(); ctx.moveTo(nx + d * 4, ny + dy); ctx.lineTo(nx + d * 16, ny + dy * 2.5 - 1); ctx.stroke(); }
      ctx.fillStyle = 'rgba(235,140,160,0.35)'; for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(hx + d * 11, hy + 5, 3, 1.8, 0, 0, 7); ctx.fill(); }
      ctx.strokeStyle = ZINK; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(nx, hy + 7, 3.5, 0.3, Math.PI - 0.3); ctx.stroke();
      const lx = -17, ly = 2;
      G.line(ctx, [[-9, 0], [lx, ly]], { color: ZFUR_D, lw: 3, seed: 640 });
      G.line(ctx, [[lx, ly], [lx - 2, ly - 14]], { color: '#6B4E3A', lw: 1.8, seed: 641 });
      glow(ctx, lx - 2, ly - 18, 46, WARM, 0.55 + 0.1 * Math.sin(t * 7));
      dot(ctx, lx - 2, ly - 18, 3.2, 'rgba(255,236,170,0.95)');
      const rx = 14, ry = o.tooth ? -6 : 4;
      G.line(ctx, [[9, 0], [rx, ry]], { color: ZFUR_D, lw: 3, seed: 642 });
      if (o.tooth) { tiny(ctx, rx + 1, ry - 3, 1.5, 0.2); glow(ctx, rx, ry - 3, 18, '255,255,240', 0.5 * o.tooth); }
    });
  }
  // гнездо на пне. o: { extra 0..N зубов добавлено }
  function nest(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      G.poly(ctx, [[-70, 0], [-62, 90], [62, 90], [70, 0]], { fill: '#3A2A1E', lw: 3, seed: 940, stroke: '#140D08', hatch: { color: 'rgba(0,0,0,0.3)', gap: 7, angle: 1.4 } });
      G.ellipse(ctx, 0, 0, 72, 20, { fill: '#5A4430', lw: 3, seed: 941, stroke: '#140D08' });
      G.ellipse(ctx, 0, -4, 60, 22, { fill: '#2E241C', lw: 3, seed: 950, stroke: '#140D08' });
      for (let i = 0; i < 4; i++) { const px = (U.hash(i, 720) - 0.5) * 70, py = -6 + (U.hash(i, 721) - 0.5) * 14; glow(ctx, px, py, 22, '110,225,215', 0.22 + 0.1 * Math.sin(t * 2 + i)); dot(ctx, px, py, 3.5, 'rgba(170,245,235,0.9)'); }
      const n = 14 + (o.extra || 0);
      for (let i = 0; i < n; i++) {
        const a = U.hash(i, 730) * 7, r = Math.sqrt(U.hash(i, 731)), px = Math.cos(a) * 50 * r, py = -8 + Math.sin(a) * 15 * r;
        if (i % 5 === 0) molar(ctx, px, py, 0.8, U.hash(i, 732) - 0.5, 760 + i); else tiny(ctx, px, py, 1.6, U.hash(i, 733) * 2 - 1);
      }
    });
  }

  // ---------- Собиралка (серия 17) ----------
  function glasses(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#C9C2A8'; ctx.lineWidth = 3;
    for (const d of [-1, 1]) { ctx.fillStyle = 'rgba(150,190,230,0.25)'; ctx.beginPath(); ctx.arc(d * 13, 0, 10, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-3, -2); ctx.quadraticCurveTo(0, -6, 3, -2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-23, -2); ctx.lineTo(-32, -6); ctx.moveTo(23, -2); ctx.lineTo(32, -6); ctx.stroke();
    ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(8, -6); ctx.lineTo(14, 1); ctx.lineTo(11, 7); ctx.moveTo(14, 1); ctx.lineTo(20, 3); ctx.stroke();
    ctx.restore();
  }
  function key(ctx, x, y, s = 1) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(-0.4);
    ctx.strokeStyle = '#C8B27A'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(-14, 0, 8, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(20, 0); ctx.moveTo(14, 0); ctx.lineTo(14, 6); ctx.moveTo(19, 0); ctx.lineTo(19, 5); ctx.stroke();
    ctx.restore();
  }
  function mitten(ctx, x, y, s = 1, rot = 0, col = '#9A3E3A') {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    G.shape(ctx, [[-12, 14], [-14, -4], [-10, -16], [0, -20], [8, -14], [10, -2], [18, -8], [22, -2], [14, 10], [12, 14]], { fill: col, lw: 2, seed: 77, stroke: '#2A0E0C', amp: 0.8 });
    ctx.fillStyle = '#E9DFC6'; ctx.fillRect(-13, 11, 26, 6);
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-8 + i * 6, -10); ctx.lineTo(-6 + i * 6, -4); ctx.lineTo(-8 + i * 6, 2); ctx.stroke(); }
    ctx.restore();
  }
  // o: { walk, moving, look, items, face }
  function sobiralka(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s * 1.9, () => {
      const moving = o.moving || 0, walk = o.walk || 0;
      const step = moving * Math.abs(Math.sin(walk * Math.PI)), lift = 4 * step;
      const OUT = '#1A1626', FUR = '#B8B0C8', PINK = '#E7A9B8', HATCH = { color: 'rgba(40,30,60,0.22)', gap: 6, angle: 0.6 };
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 2, 26, 7, 0, 0, 7); ctx.fill();
      for (const d of [-1, 1]) { const up = moving * Math.max(0, Math.sin(walk * Math.PI + (d > 0 ? Math.PI : 0))) * 5; G.ellipse(ctx, d * 10, -3 - up, 8, 5, { fill: FUR, lw: 2.2, seed: 85 + d, stroke: OUT, step: 6 }); }
      ctx.translate(0, -lift); ctx.rotate(moving * Math.sin(walk * Math.PI) * 0.06);
      G.poly(ctx, [[-27, -84], [27, -84], [21, -44], [-21, -44]], { fill: '#8C6A3A', lw: 2.5, seed: 80, stroke: '#2A1C0E', step: 8, hatch: { color: 'rgba(40,24,10,0.45)', gap: 5, angle: -0.6 } });
      ctx.strokeStyle = 'rgba(40,24,10,0.5)'; ctx.lineWidth = 1.5;
      for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(-25 + i, -74 + i * 10); ctx.lineTo(25 - i, -74 + i * 10); ctx.stroke(); }
      for (let i = 0; i < 7; i++) dot(ctx, -24 + i * 8, -84 + Math.sin(i * 2.3) * 2, 4.5, '#3E6B4A');
      if ((o.items || 0) >= 1) mitten(ctx, -12, -92, 0.5, -0.4);
      G.ellipse(ctx, 0, -24, 22, 20, { fill: FUR, lw: 3, seed: 82, stroke: OUT, step: 7, hatch: HATCH });
      ctx.strokeStyle = '#5A3E22'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(d * 14, -40); ctx.quadraticCurveTo(d * 17, -28, d * 12, -14); ctx.stroke(); }
      ctx.strokeStyle = OUT; ctx.lineWidth = 3;
      for (const d of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(d * 18, -30);
        if (o.reach && d < 0) ctx.quadraticCurveTo(-34, -36, -40, -46 + o.reach * 6);
        else ctx.quadraticCurveTo(d * 28, -22 + moving * Math.sin(walk * Math.PI + d) * 4, d * 26, -12);
        ctx.stroke();
      }
      for (const d of [-1, 1]) { G.ellipse(ctx, d * 19, -64, 9, 10, { fill: FUR, lw: 2.5, seed: 87 + d, stroke: OUT, step: 6 }); G.ellipse(ctx, d * 19, -63, 5, 6, { fill: PINK, lw: 0, seed: 89 + d, stroke: 'rgba(0,0,0,0)', step: 6 }); }
      G.ellipse(ctx, 0, -48, 24, 20, { fill: FUR, lw: 3, seed: 83, stroke: OUT, step: 7, hatch: HATCH });
      const fx = (o.face || 0) * 3;
      for (const d of [-1, 1]) {
        const ex = d * 9 + fx, ey = -50;
        if (o.sleep) G.line(ctx, [[ex - 4, ey], [ex, ey + 2], [ex + 4, ey]], { color: OUT, lw: 1.6, seed: 95 + d });
        else { dot(ctx, ex, ey, 5.5, '#08070C'); dot(ctx, ex - 1.8, ey - 2, 1.8, '#FFFFFF'); dot(ctx, ex + 1.6, ey + 1.6, 0.8, '#FFFFFF'); }
        ctx.fillStyle = 'rgba(231,169,184,0.45)'; ctx.beginPath(); ctx.ellipse(d * 16 + fx, -42, 4, 2.5, 0, 0, 7); ctx.fill();
      }
      ctx.strokeStyle = OUT; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.arc(fx, -43, 3.5, 0.3, Math.PI - 0.3); ctx.stroke();
    });
  }

  // ---------- Баюнок (серия 19) ----------
  const BOUT = '#26202E', BFUR = '#EBD8A8', BFUR2 = '#CDB27A', BEAK = '#C7A64A', LEG = '#7F8C4E';
  const BHATCH = { color: 'rgba(110,80,40,0.16)', gap: 6, angle: 0.6 };
  function fluff(ctx, cx, cy, rx, ry, n, seed, fill) {
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, r = 4.5 + 2 * U.hash(seed, i); G.ellipse(ctx, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r, r, { fill, lw: 2, seed: seed + i, stroke: BOUT, step: 5 }); }
    G.ellipse(ctx, cx, cy, rx + 1, ry + 1, { fill, lw: 0, seed: seed + 99, stroke: 'rgba(0,0,0,0)', step: 8, hatch: BHATCH });
  }
  // o: { sway, turn, gx, gy, sing }
  function bayunok(ctx, x, y, s, t, o = {}) {
    at(ctx, x, y, s, () => {
      const sway = o.sway || 0, turn = o.turn || 0, sing = o.sing || 0;
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 3, 30, 7, 0, 0, 7); ctx.fill();
      for (const d of [-1, 1]) {
        ctx.strokeStyle = LEG; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(d * 7, -20); ctx.lineTo(d * 8, 0); ctx.stroke();
        ctx.lineWidth = 2.2;
        for (const a of [-0.7, 0, 0.7]) { ctx.beginPath(); ctx.moveTo(d * 8, 0); ctx.lineTo(d * 8 + Math.sin(a + d * 0.2) * 9, 3 * Math.cos(a)); ctx.stroke(); }
      }
      ctx.rotate(sway * 0.1);
      const br = 1 + 0.015 * Math.sin(t * 1.8);
      for (const d of [-1, 1]) { ctx.save(); ctx.translate(d * 20, -44); ctx.rotate(d * 0.25); G.ellipse(ctx, d * 2, 8, 6.5, 14, { fill: BFUR2, lw: 2.2, seed: 205 + d, stroke: BOUT, step: 5, hatch: { color: 'rgba(90,60,30,0.25)', gap: 4, angle: d * 0.6 } }); ctx.restore(); }
      fluff(ctx, 0, -40 * br, 21, 23 * br, 18, 220, BFUR);
      ctx.strokeStyle = 'rgba(120,85,45,0.55)'; ctx.lineWidth = 1.8;
      for (let i = 0; i < 7; i++) { const sx = -12 + U.hash(i, 231) * 24, sy = -52 + U.hash(i, 232) * 26; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (U.hash(i, 233) - 0.5) * 2, sy + 5); ctx.stroke(); }
      const hx = turn * 5 + sway * 9, hy = -112 + Math.abs(sway) * 3, nx = -sway * 7, throb = sing * (1 + Math.sin(t * 9)) * 1.2;
      ctx.lineCap = 'round';
      ctx.strokeStyle = BOUT; ctx.lineWidth = 18 + throb; ctx.beginPath(); ctx.moveTo(0, -58); ctx.quadraticCurveTo(nx, -86, hx, hy + 8); ctx.stroke();
      ctx.strokeStyle = BFUR; ctx.lineWidth = 14 + throb; ctx.beginPath(); ctx.moveTo(0, -56); ctx.quadraticCurveTo(nx, -86, hx, hy + 8); ctx.stroke();
      fluff(ctx, hx, hy, 16, 15, 16, 250, BFUR);
      ctx.strokeStyle = '#8A6A3A'; ctx.lineWidth = 2.4;
      for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.34 + Math.sin(t * 1.6 + i) * 0.06 - sway * 0.25, L = 6 + 5 * U.hash(i, 255); ctx.beginPath(); ctx.moveTo(hx + (i - 2.5) * 3, hy - 14); ctx.quadraticCurveTo(hx + (i - 2.5) * 3 + Math.cos(a) * L * 0.5, hy - 14 + Math.sin(a) * L * 0.7, hx + (i - 2.5) * 3 + Math.cos(a) * L, hy - 14 + Math.sin(a) * L); ctx.stroke(); }
      for (const d of [-1, 1]) {
        const ex = hx + turn * 4 + d * 8.2 * (1 - 0.25 * Math.abs(turn)), ey = hy - 1;
        dot(ctx, ex, ey, 7.4, '#F6F1DE');
        const px = ex + (o.gx || 0) * 1.4, py = ey + (o.gy || 0) * 1.4;
        dot(ctx, px, py, 6.2, '#0A0810'); dot(ctx, px - 2.3, py - 2.6, 2.1, '#FFFFFF');
        ctx.strokeStyle = BOUT; ctx.lineWidth = 1.9; ctx.beginPath(); ctx.arc(ex, ey, 7.4, 0, 7); ctx.stroke();
      }
      const bx = hx + turn * 9, by = hy + 6, tx = hx + turn * 30, ty = hy + 10 + (1 - Math.abs(turn)) * 12;
      const nxx = -(ty - by), nyy = tx - bx, nl = Math.hypot(nxx, nyy) || 1, wv = 4.6;
      if (sing > 0.05) { ctx.fillStyle = '#5A2A36'; ctx.beginPath(); ctx.ellipse(lerp(bx, tx, 0.45), lerp(by, ty, 0.45) + 3, 3.2, 1.2 + 2.6 * sing * (0.6 + 0.4 * Math.sin(t * 9)), 0, 0, 7); ctx.fill(); }
      ctx.fillStyle = BEAK; ctx.strokeStyle = BOUT; ctx.lineWidth = 1.8; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(bx + (nxx / nl) * wv, by + (nyy / nl) * wv); ctx.lineTo(tx, ty); ctx.lineTo(bx - (nxx / nl) * wv, by - (nyy / nl) * wv); ctx.closePath(); ctx.fill(); ctx.stroke();
    });
  }

  // ---------- Обманка (серия 1) - кувшинка ----------
  function lily(ctx, x, y, s, open, dim, seed) {
    const rings = [[10, 150, 0.0, '#9BDDE3', 12], [8, 112, 0.2, '#C8F1F1', 38], [6, 76, 0.45, '#F0FFFD', 62]];
    const petals = [];
    rings.forEach(([n, L, off, col, eo], r) => {
      const e = ((eo + (86 - eo) * (1 - open)) * Math.PI) / 180, Ls = L * s * (0.75 + 0.25 * open);
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * (i + off)) / n, X = Math.cos(a) * Math.cos(e), Y = Math.sin(a) * Math.cos(e), Z = Math.sin(e);
        petals.push({ Y, r, base: [x, y - 10 * s * r], tip: [x + X * Ls, y - 16 * s * r * open - Z * Ls * 0.85 + Y * Ls * 0.33], col, i });
      }
    });
    petals.sort((a, b) => b.Y - a.Y || a.r - b.r);
    for (const p of petals) {
      const dx = p.tip[0] - p.base[0], dy = p.tip[1] - p.base[1], ln = Math.hypot(dx, dy) + 1e-6, nx = -dy / ln, ny = dx / ln, wd = ln * 0.3, pts = [];
      for (let j = 0; j <= 10; j++) { const u = j / 10, w = Math.pow(Math.sin(Math.PI * u), 0.8) * wd; pts.push([p.base[0] + dx * u + nx * w, p.base[1] + dy * u + ny * w]); }
      for (let j = 10; j >= 0; j--) { const u = j / 10, w = Math.pow(Math.sin(Math.PI * u), 0.8) * wd; pts.push([p.base[0] + dx * u - nx * w, p.base[1] + dy * u - ny * w]); }
      const shade = 0.75 + 0.25 * (0.5 - p.Y * 0.5);
      G.shape(ctx, pts, { fill: G.tint(p.col, (shade - 1) * 1.2 - (1 - dim) * 0.6), lw: 2.5, seed: seed + p.r * 20 + p.i, stroke: '#3E8C93', amp: 1.2 });
    }
    G.ellipse(ctx, x, y - 22 * s, (6 + 14 * open) * s, (4 + 8 * open) * s, { fill: G.tint('#FFD27A', -(1 - dim) * 0.5), lw: 2, seed: seed + 99, stroke: '#B07A2A' });
    glow(ctx, x, y - 30 * s, 160 * s, '120,220,225', 0.25 * dim);
  }

  // ---------- куртка наблюдателя на спинке стула (по серии 16, проще) ----------
  function jacketOnChair(ctx, x, y, s, t) {
    at(ctx, x, y, s, () => {
      const OL = '#3D4C35', OD = '#2C3A2A', INK = '#0C120B', WOOD = '#4A3626';
      // табуретка-пенёк со спинкой из двух веток
      G.poly(ctx, [[-46, 0], [-40, 70], [40, 70], [46, 0]], { fill: '#3A2A1E', lw: 3, seed: 1541, stroke: '#140D08', hatch: { color: 'rgba(0,0,0,0.3)', gap: 7, angle: 1.4 } });
      G.line(ctx, [[-38, -4], [-36, -150]], { color: WOOD, lw: 8, seed: 1500 });
      G.line(ctx, [[38, -4], [36, -150]], { color: WOOD, lw: 8, seed: 1501 });
      G.line(ctx, [[-48, -146], [48, -144]], { color: WOOD, lw: 10, seed: 1502 });
      // куртка переброшена через перекладину: спина свисает за стулом, рукава висят по бокам, капюшон завалился назад
      G.poly(ctx, [[-44, -146], [44, -146], [46, -78], [-46, -78]], { fill: OD, lw: 2.5, seed: 1510, stroke: INK, hatch: { color: 'rgba(0,0,0,0.25)', gap: 6, angle: 0.5 } });
      G.ellipse(ctx, 0, -150, 50, 9, { fill: OL, lw: 2.5, seed: 1511, stroke: INK });
      for (const d of [-1, 1]) {
        G.line(ctx, [[d * 46, -148], [d * 54, -110], [d * 50, -64]], { color: INK, lw: 18, seed: 1520 + d });
        G.line(ctx, [[d * 46, -148], [d * 54, -110], [d * 50, -64]], { color: OL, lw: 14, seed: 1522 + d });
        ctx.fillStyle = OD; ctx.fillRect(d * 50 - 9, -68, 18, 6);
      }
      dot(ctx, -10, -120, 4, '#33452F'); dot(ctx, -10, -96, 4, '#33452F');
      // пустое сиденье
      G.ellipse(ctx, 0, 0, 50, 14, { fill: '#5A4430', lw: 3, seed: 1540, stroke: '#140D08' });
      for (let r = 1; r < 3; r++) { ctx.strokeStyle = 'rgba(30,18,10,0.45)'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.ellipse(0, 1, 16 * r, 4.5 * r, 0, 0, 7); ctx.stroke(); }
    });
  }

  globalThis.CR = { glow, dot, orb, r01, sm, frog, mimic, mokhnachBack, mossMound, EYES, baby, smile, tishka, tishkaMouth, fonarnitsa, puz, puzMouth, bubble, mush, lunoed, zub, nest, tiny, glasses, key, mitten, sobiralka, bayunok, lily, jacketOnChair };
})();
