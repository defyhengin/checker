// «Мерцалова топь» — эпизод 4 «Мохнач». Каждый кадр — чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.47);
  const CX = W * 0.56, GY = H * 0.63;          // мохнач сидит на кочке
  const RX = 150 * k, RY = 118 * k;             // размер мшистого тела
  const BY = GY - RY * 0.82;                    // центр тела
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const MOSS = '#3E6B4A', MOSS_D = '#22402E', MOSS_L = '#6A9A5E', INK = '#0B1A12';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }

  // будка в этой серии чуть ближе, чем в прошлых
  const BOOTH = { x: W * 0.2, b: HY + 6 * k, q: 1.32 * k };

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
    // кочка мохнача
    G.ellipse(ctx, CX, GY + 22 * k, 230 * k, 70 * k, { fill: '#2A4A3C', lw: 4, seed: 520, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.4)', gap: 7, angle: -0.6 } });
    // крупные камыши у камеры по краям
    for (let i = 0; i < 9; i++) {
      const left = i % 2 === 0, x = left ? W * (0.02 + 0.03 * i) : W * (1.0 - 0.025 * i), h = (0.32 + 0.14 * U.hash(i, 72)) * H;
      const lean = (left ? 1 : -1) * 0.08 * h;
      G.line(ctx, [[x, H + 20], [x + lean * 0.5, H - h * 0.5], [x + lean, H - h]], { color: '#050916', lw: 10 * k, seed: 600 + i });
      if (U.hash(i, 73) < 0.5) G.ellipse(ctx, x + lean, H - h, 13 * k, 40 * k, { fill: '#1E140E', lw: 3, seed: 620 + i, stroke: '#050508' });
    }
  }

  // ---------- мшистое тело (общее для вида спереди и сзади) ----------
  function mossBody(ctx, bx, by, sx, sy, back) {
    const rx = RX * sx, ry = RY * sy;
    // свисающие пряди мха
    for (let i = 0; i < 16; i++) {
      const a = Math.PI * (0.08 + 0.84 * (i / 15)), x = bx - Math.cos(a) * rx * 0.98;
      const y0 = by + Math.sin(a) * ry * 0.55, len = (24 + 30 * U.hash(i, 900)) * k;
      G.line(ctx, [[x, y0], [x + (U.hash(i, 901) - 0.5) * 10 * k, y0 + len]], { color: MOSS_D, lw: 5 * k, seed: 900 + i });
    }
    G.ellipse(ctx, bx, by, rx, ry, { fill: MOSS, lw: 4, seed: back ? 951 : 950, stroke: INK, hatch: { color: 'rgba(8,30,16,0.35)', gap: 7, angle: back ? -0.7 : 0.7 } });
    // кочки мха по верху
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.12 + 0.76 * (i / 8)), r = (26 + 12 * U.hash(i, 960)) * k * sx;
      G.ellipse(ctx, bx + Math.cos(a) * rx * 0.86, by + Math.sin(a) * ry * 0.86, r, r * 0.8, { fill: i % 2 ? MOSS_L : MOSS, lw: 3, seed: 960 + i + (back ? 20 : 0), stroke: INK });
    }
    // веточки и грибок на макушке
    G.line(ctx, [[bx - 30 * k * sx, by - ry * 0.95], [bx - 44 * k * sx, by - ry * 1.25]], { color: '#8A7A5A', lw: 3 * k, seed: 990 });
    G.ellipse(ctx, bx - 47 * k * sx, by - ry * 1.27, 7 * k, 4 * k, { fill: MOSS_L, lw: 2, seed: 991, stroke: INK });
    G.line(ctx, [[bx + 40 * k * sx, by - ry * 0.9], [bx + 40 * k * sx, by - ry * 0.9 - 18 * k]], { color: '#D8CDB0', lw: 4 * k, seed: 992 });
    G.ellipse(ctx, bx + 40 * k * sx, by - ry * 0.9 - 20 * k, 15 * k * Math.abs(sx), 8 * k, { fill: '#B8644A', lw: 2.5, seed: 993, stroke: INK });
  }

  // ---------- вид спереди: мордочка и длинные лапки ----------
  function front(ctx, t, bx, by, sx, sy) {
    mossBody(ctx, bx, by, sx, sy, false);
    const hide = t >= ev.hide - 0.25 ? ease.outBack(r01(t, ev.hide - 0.25, ev.hide), 1.2) : 0;
    const peek = sm(t, ev.peek - 0.6, ev.peek);
    // мордочка: в начале чуть выглядывает из мха
    const fx = bx, fy = by + RY * sy * (0.32 - 0.12 * peek);
    G.ellipse(ctx, fx, fy, 50 * k * Math.abs(sx), 38 * k * sy, { fill: '#D9CFB2', lw: 3, seed: 1000, stroke: INK });
    const blink = [2.6, 7.4].some((b) => t > b && t < b + 0.13) ? 0.1 : 1;
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#0A0A0A';
      ctx.beginPath(); ctx.ellipse(fx + s * 17 * k * sx, fy - 4 * k, 5.5 * k * Math.abs(sx), 6.5 * k * blink, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(232,140,150,0.55)'; ctx.beginPath(); ctx.ellipse(fx + s * 30 * k * sx, fy + 10 * k, 8 * k * Math.abs(sx), 5 * k, 0, 0, 7); ctx.fill();
    }
    ctx.fillStyle = '#6B3A3A'; ctx.beginPath(); ctx.ellipse(fx, fy + 8 * k, 4 * k * Math.abs(sx), 3 * k, 0, 0, 7); ctx.fill();
    // лапки: лежат на кочке → закрывают мордочку
    for (const s of [-1, 1]) {
      const sh = [bx + s * RX * sx * 0.62, by + RY * sy * 0.35];
      const rest = [bx + s * RX * sx * 0.78, GY + 4 * k];
      const cover = [fx + s * 14 * k * sx, fy - 2 * k];
      const hd = [lerp(rest[0], cover[0], hide), lerp(rest[1], cover[1], hide)];
      const el = [lerp((sh[0] + rest[0]) / 2 + s * 18 * k, (sh[0] + cover[0]) / 2 + s * 34 * k, hide), lerp((sh[1] + rest[1]) / 2, sh[1] + 30 * k, hide)];
      G.line(ctx, [sh, el, hd], { color: '#4A3A2E', lw: 9 * k, seed: 1010 + s });
      for (let f = 0; f < 3; f++) {
        const a = hide > 0.5 ? -Math.PI / 2 + s * (0.2 + f * 0.25) : Math.PI / 2 + s * (f - 1) * 0.5;
        G.line(ctx, [hd, [hd[0] + Math.cos(a) * 22 * k * Math.abs(sx), hd[1] + Math.sin(a) * 22 * k]], { color: '#4A3A2E', lw: 5 * k, seed: 1020 + f + (s > 0 ? 5 : 0) });
      }
    }
  }

  // ---------- вид сзади: мох… и глаза ----------
  function eyeOpen(e, t) {
    if (t < e.t) return 0;
    let o = ease.outBack(r01(t, e.t, e.t + 0.16), 1.6);
    if (t >= ev.blink && t < ev.blink + 0.16) o = 0.05; // все моргают разом
    return o;
  }
  function back(ctx, t, bx, by, sx, sy) {
    mossBody(ctx, bx, by, sx, sy, true);
    // хребет мха
    G.line(ctx, [[bx, by - RY * sy * 0.9], [bx + 6 * k, by], [bx, by + RY * sy * 0.6]], { color: MOSS_D, lw: 6 * k, seed: 1100 });
    const shake = t >= ev.blink ? Math.exp(-(t - ev.blink) * 5) : 0;
    for (let i = 0; i < S.eyes.length; i++) {
      const e = S.eyes[i];
      const ex = bx + e.x * RX * sx * 0.82, ey = by + e.y * RY * sy * 0.82, R = e.s * 24 * k * Math.abs(sx);
      const o = eyeOpen(e, t);
      if (o <= 0.02) { // закрытый глаз — едва заметная складка во мху
        G.line(ctx, [[ex - R * 0.8, ey], [ex, ey + R * 0.25], [ex + R * 0.8, ey]], { color: 'rgba(10,30,18,0.55)', lw: 2.5 * k, seed: 1200 + i });
        continue;
      }
      G.ellipse(ctx, ex, ey, R, R * 0.72 * o, { fill: '#ECE5C6', lw: 2.5, seed: 1300 + i, stroke: INK });
      if (o > 0.35) {
        // зрачок смотрит в камеру (чуть к центру кадра)
        const lx = clamp((CX - ex) / (RX * 1.6), -0.35, 0.35) + U.noise1(t * 2 + i, 7) * 0.08 + U.noise1(t * 40, i) * 0.2 * shake;
        const ly = clamp((BY - ey) / (RY * 1.6), -0.3, 0.3);
        const ix = ex + lx * R * 0.6, iy = ey + ly * R * 0.4;
        ctx.fillStyle = '#6FCFD2'; ctx.beginPath(); ctx.ellipse(ix, iy, R * 0.45, R * 0.45 * Math.min(1, o), 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#05080A'; ctx.beginPath(); ctx.ellipse(ix, iy, R * 0.2, R * 0.26 * Math.min(1, o), 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(ix - R * 0.16, iy - R * 0.16, R * 0.09, 0, 7); ctx.fill();
      }
      glow(ctx, ex, ey, R * 2.6, '90,200,210', 0.16 * Math.min(1, o) + 0.25 * Math.exp(-(t - e.t) * 4));
    }
  }

  function mokhnach(ctx, t) {
    const breathe = 1 + 0.018 * Math.sin(t * 2.1);
    const hideSquash = t >= ev.hide ? 0.95 + 0.05 * Math.exp(-(t - ev.hide) * 6) : 1;
    // поворот: сжимаем по ширине до нуля и разворачиваем уже спиной
    const a = r01(t, ev.turn - 0.18, ev.turn + 0.12);
    const c0 = Math.cos(Math.PI * ease.inOutQuad(a));
    const sx = Math.sign(c0 || 1) * (0.55 + 0.45 * Math.abs(c0)); // не сплющиваем в палочку
    const sy = breathe * hideSquash * (1 - 0.06 * Math.sin(Math.PI * a));
    const bx = CX, by = BY + (1 - sy) * RY;
    if (sx >= 0) front(ctx, t, bx, by, sx, sy);
    else back(ctx, t, bx, by, -sx, sy);
  }

  function fireflies(ctx, t) {
    if (t > ev.breath) return;
    const fade = 1 - r01(t, ev.turn, ev.breath);
    for (let i = 0; i < 4; i++) {
      const x = W * (0.2 + 0.6 * U.hash(i, 1500)) + Math.sin(t * 0.7 + i * 2) * 60 * k;
      const y = H * (0.42 + 0.12 * U.hash(i, 1501)) + Math.sin(t * 1.1 + i) * 30 * k;
      const a = (0.5 + 0.5 * Math.sin(t * 2 + i * 1.7)) * fade;
      ctx.fillStyle = `rgba(255,233,176,${a})`; ctx.beginPath(); ctx.arc(x, y, 5 * k, 0, 7); ctx.fill();
      glow(ctx, x, y, 60 * k, '255,190,90', 0.55 * a);
    }
  }

  function cam(t) {
    const push = sm(t, S.T(2), ev.hide);          // «когда на него смотрят» — камера подъезжает
    const z = 1.3 + 0.6 * push + 0.4 * sm(t, ev.eye0, ev.blink);
    return { x: CX, y: lerp(GY - 150 * k, BY, push), z };
  }

  Studio.film({
    draw(ctx, t) {
      const c = cam(t);
      const sh = t >= ev.blink ? 14 * k * Math.exp(-(t - ev.blink) * 7) : 0;
      ctx.save();
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H * 0.56 + U.noise1(t * 30, 2) * sh);
      ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
      ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
      // Морзе «ГДЕ»
      const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 10 * k, wy - 10 * k, 20 * k, 20 * k);
      if (on) glow(ctx, wx, wy, 75 * k, '255,180,90', 0.6);
      glow(ctx, W * 0.8, H * 0.13, 230 * k, '150,170,220', 0.2);
      // далёкая кувшинка из первой серии
      glow(ctx, W * 0.42, HY + 26 * k, 100 * k, '90,200,210', 0.25 + 0.06 * Math.sin(t * 1.3));
      ctx.fillStyle = '#C8F1F1'; ctx.beginPath(); ctx.ellipse(W * 0.42, HY + 26 * k, 9 * k, 4 * k, 0, 0, 7); ctx.fill();
      fireflies(ctx, t);
      mokhnach(ctx, t);
      ctx.restore();
      if (t >= ev.breath && t < ev.eye0 + 0.3) { ctx.fillStyle = `rgba(4,6,16,${0.25 * r01(t, ev.breath, ev.breath + 0.4) * (1 - r01(t, ev.eye0, ev.eye0 + 0.3))})`; ctx.fillRect(0, 0, W, H); }
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      Subs.draw(ctx, t, S.subtitles, { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
