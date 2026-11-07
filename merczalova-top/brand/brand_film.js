// Аватар (квадрат) и шапка YouTube (2560x1440) «Мерцаловой топи» — одна сцена, две раскладки.
(function () {
  const U = globalThis.U, G = globalThis.G, Studio = globalThis.Studio;
  const W = G.W, H = G.H;
  const SQUARE = Math.abs(W - H) < 10;
  const k = SQUARE ? W / 1080 : H / 1440;

  function glow(ctx, x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function lily(ctx, x, y, s, seed) {
    const rings = [[10, 150, 0.0, '#9BDDE3', 12], [8, 112, 0.2, '#C8F1F1', 38], [6, 76, 0.45, '#F0FFFD', 62]];
    const petals = [];
    rings.forEach(([n, L, off, col, eo], r) => {
      const e = (eo * Math.PI) / 180, Ls = L * k * s;
      for (let i = 0; i < n; i++) {
        const a = (2 * Math.PI * (i + off)) / n;
        const X = Math.cos(a) * Math.cos(e), Y = Math.sin(a) * Math.cos(e), Z = Math.sin(e);
        petals.push({ Y, r, i, col, base: [x, y - 10 * k * s * r], tip: [x + X * Ls, y - 16 * k * s * r - Z * Ls * 0.85 + Y * Ls * 0.33] });
      }
    });
    petals.sort((a, b) => b.Y - a.Y || a.r - b.r);
    for (const p of petals) {
      const dx = p.tip[0] - p.base[0], dy = p.tip[1] - p.base[1], ln = Math.hypot(dx, dy) + 1e-6;
      const nx = -dy / ln, ny = dx / ln, wd = ln * 0.3, pts = [];
      for (let j = 0; j <= 10; j++) { const u = j / 10, w = Math.pow(Math.sin(Math.PI * u), 0.8) * wd; pts.push([p.base[0] + dx * u + nx * w, p.base[1] + dy * u + ny * w]); }
      for (let j = 10; j >= 0; j--) { const u = j / 10, w = Math.pow(Math.sin(Math.PI * u), 0.8) * wd; pts.push([p.base[0] + dx * u - nx * w, p.base[1] + dy * u - ny * w]); }
      G.shape(ctx, pts, { fill: G.tint(p.col, (0.75 + 0.25 * (0.5 - p.Y * 0.5) - 1) * 1.2), lw: 2.5 * Math.max(1, k), seed: seed + p.r * 20 + p.i, stroke: '#3E8C93', amp: 1.2 });
    }
    G.ellipse(ctx, x, y - 22 * k * s, 20 * k * s, 12 * k * s, { fill: '#FFD27A', lw: 2, seed: seed + 99, stroke: '#B07A2A' });
  }
  function spruce(ctx, x, base, h, fill, seed) {
    const pts = []; const wd = h * 0.3;
    for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
    const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
    G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
  }
  // бледные глаза под водой: «кто-то под ней»
  function eyes(ctx, x, y, s, a) {
    for (const dx of [-1, 1]) {
      const ex = x + dx * 70 * k * s, ey = y;
      G.ellipse(ctx, ex, ey, 30 * k * s, 13 * k * s, { fill: `rgba(205,238,222,${a})`, lw: 2, seed: 900 + dx, stroke: `rgba(20,40,40,${a})` });
      G.ellipse(ctx, ex, ey, 4 * k * s, 11 * k * s, { fill: `rgba(5,8,12,${a})`, lw: 1, seed: 910 + dx, stroke: `rgba(5,8,12,${a})` });
      glow(ctx, ex, ey, 90 * k * s, '120,200,180', 0.18 * a);
    }
  }

  function background(ctx, HY) {
    const g = ctx.createLinearGradient(0, 0, 0, HY);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 4);
    for (let i = 0; i < (SQUARE ? 50 : 160); i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.85, r = (1 + U.hash(i, 3) * 2) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
  }

  function avatar(ctx) {
    const HY = H * 0.5;
    background(ctx, HY);
    G.ellipse(ctx, W * 0.74, H * 0.2, 70 * k, 70 * k, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8' });
    glow(ctx, W * 0.74, H * 0.2, 230 * k, '150,170,220', 0.25);
    for (let i = 0; i < 9; i++) spruce(ctx, U.hash(i, 10) * W * 1.1 - W * 0.05, HY, (0.18 + 0.08 * U.hash(i, 11)) * H, '#1A2547', 30 + i);
    G.ellipse(ctx, W * 0.5, H * 0.62, 330 * k, 72 * k, { fill: '#1E4A47', lw: 5, seed: 500, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 9, angle: 0.5 } });
    eyes(ctx, W * 0.5, H * 0.83, 1.3, 0.85);
    lily(ctx, W * 0.5, H * 0.6, 2.0, 1000);
    glow(ctx, W * 0.5, H * 0.5, 520 * k, '90,200,210', 0.55);
    glow(ctx, W * 0.5, H * 0.52, 140 * k, '255,200,110', 0.45);
    for (const [x, y] of [[0.2, 0.36], [0.3, 0.24], [0.82, 0.42], [0.7, 0.3], [0.15, 0.55]]) {
      ctx.fillStyle = '#FFE9B0'; ctx.beginPath(); ctx.arc(x * W, y * H, 7 * k, 0, 7); ctx.fill();
      glow(ctx, x * W, y * H, 70 * k, '255,190,90', 0.6);
    }
  }

  function banner(ctx) {
    const HY = H * 0.6;
    background(ctx, HY);
    G.ellipse(ctx, W * 0.36, H * 0.17, 60 * k, 60 * k, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8' });
    glow(ctx, W * 0.36, H * 0.17, 220 * k, '150,170,220', 0.22);
    for (let i = 0; i < 40; i++) spruce(ctx, U.hash(i, 10) * W * 1.05 - W * 0.02, HY, (0.13 + 0.07 * U.hash(i, 11)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 34; i++) spruce(ctx, U.hash(i, 12) * W * 1.05 - W * 0.02, HY + 6 * k, (0.09 + 0.05 * U.hash(i, 13)) * H, '#121A35', 90 + i);
    // будка наблюдателя с горящим окном
    const hx = W * 0.22, hb = HY + 4 * k, q = 1.4 * k;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    ctx.fillStyle = '#FFC874'; ctx.fillRect(hx - 11 * k, hb - 52 * k, 22 * k, 22 * k); glow(ctx, hx, hb - 41 * k, 110 * k, '255,180,90', 0.6);
    // туманник вдали справа
    const tx = W * 0.83, tb = HY + 12 * k, th = 0.3 * H;
    G.line(ctx, [[tx - 8 * k, tb - th * 0.42], [tx - 10 * k, tb]], { color: '#0A0F1E', lw: 6 * k, seed: 600 });
    G.line(ctx, [[tx + 8 * k, tb - th * 0.42], [tx + 10 * k, tb]], { color: '#0A0F1E', lw: 6 * k, seed: 601 });
    G.shape(ctx, [[tx - 22 * k, tb - th * 0.78], [tx + 22 * k, tb - th * 0.78], [tx + 28 * k, tb - th * 0.42], [tx - 28 * k, tb - th * 0.42]], { fill: '#28335A', lw: 3, seed: 602, stroke: '#0A0F1E' });
    G.ellipse(ctx, tx, tb - th * 0.86, 20 * k, 26 * k, { fill: '#28335A', lw: 3, seed: 603, stroke: '#0A0F1E' });
    for (const dx of [-7, 7]) { ctx.fillStyle = '#E4F4EA'; ctx.beginPath(); ctx.arc(tx + dx * k, tb - th * 0.865, 3.5 * k, 0, 7); ctx.fill(); glow(ctx, tx + dx * k, tb - th * 0.865, 30 * k, '170,220,200', 0.4); }
    // туман
    for (let i = 0; i < 40; i++) {
      const x = U.hash(i, 60) * W, y = HY + (U.hash(i, 61) - 0.5) * 80 * k, r = (120 + 160 * U.hash(i, 62)) * k;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, 'rgba(190,205,235,0.09)'); gg.addColorStop(1, 'rgba(190,205,235,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // кувшинки и главная — в центре безопасной зоны
    for (const [x, y, rx, ry] of [[0.12, 0.72, 160, 30], [0.66, 0.76, 140, 26], [0.92, 0.7, 150, 30], [0.3, 0.84, 200, 36]])
      G.ellipse(ctx, x * W, y * H, rx * k, ry * k, { fill: '#1E4A47', lw: 4, seed: 520 + x * 100, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
    G.ellipse(ctx, W * 0.31, H * 0.615, 170 * k, 34 * k, { fill: '#1E4A47', lw: 4, seed: 540, stroke: '#081615', hatch: { color: 'rgba(5,25,24,0.35)', gap: 8, angle: 0.5 } });
    eyes(ctx, W * 0.31, H * 0.7, 0.8, 0.7);
    lily(ctx, W * 0.31, H * 0.605, 0.85, 1000);
    glow(ctx, W * 0.31, H * 0.56, 300 * k, '90,200,210', 0.5);
    // подражатель на кочке справа от центра
    const cx = W * 0.69, gy = H * 0.625, s = 0.6 * k, fur = '#6B5F76', ink = '#17121D';
    G.ellipse(ctx, cx, gy + 26 * s, 150 * s, 56 * s, { fill: '#2C5A4E', lw: 3, seed: 700, stroke: '#0A1A16' });
    G.ellipse(ctx, cx, gy - 50 * s, 46 * s, 62 * s, { fill: fur, lw: 3, seed: 701, stroke: ink });
    for (const d of [-1, 1]) { G.ellipse(ctx, cx + d * 55 * s, gy - 190 * s, 26 * s, 36 * s, { fill: fur, lw: 3, seed: 702 + d, stroke: ink }); G.ellipse(ctx, cx + d * 55 * s, gy - 188 * s, 15 * s, 24 * s, { fill: '#C98E9E', lw: 2, seed: 704 + d, stroke: ink }); }
    G.ellipse(ctx, cx, gy - 145 * s, 58 * s, 52 * s, { fill: fur, lw: 3, seed: 706, stroke: ink });
    for (const d of [-1, 1]) { G.ellipse(ctx, cx + d * 26 * s, gy - 150 * s, 24 * s, 24 * s, { fill: '#FFC86B', lw: 2.5, seed: 708 + d, stroke: ink }); G.ellipse(ctx, cx + d * 26 * s - 6 * s, gy - 150 * s, 13 * s, 13 * s, { fill: '#08060A', lw: 1, seed: 710 + d, stroke: '#08060A' }); glow(ctx, cx + d * 26 * s, gy - 150 * s, 60 * s, '255,190,90', 0.2); }
    // название в безопасной зоне (центр 1546x423)
    const ty = H * 0.445;
    G.text(ctx, 'Мерцалова топь', W / 2, ty, { size: Math.round(150 * k), fam: 'Caveat', weight: 700, color: '#F2F6EE', align: 'center', stroke: '#070B1C', strokeW: 10 * k });
    G.text(ctx, 'документалка о существах ночного болота', W / 2, ty + 74 * k, { size: Math.round(54 * k), fam: 'Inter', weight: 700, color: '#CFE6E6', align: 'center', stroke: '#070B1C', strokeW: 6 * k });
    for (const [x, y] of [[0.42, 0.5], [0.58, 0.47], [0.75, 0.4], [0.27, 0.45], [0.9, 0.5], [0.08, 0.4]]) {
      ctx.fillStyle = '#FFE9B0'; ctx.beginPath(); ctx.arc(x * W, y * H, 6 * k, 0, 7); ctx.fill(); glow(ctx, x * W, y * H, 60 * k, '255,190,90', 0.55);
    }
  }

  Studio.film({ draw(ctx) { if (SQUARE) avatar(ctx); else banner(ctx); }, post: { paper: 0.35, vignette: SQUARE ? 0.3 : 0.25, grain: 0.05 }, fadeOut: 0 });
})();
