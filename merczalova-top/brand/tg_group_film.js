// Аватарка группы «Мерцаловой топи» в Telegram: будка наблюдателя, в окне — силуэт с большими ушами.
(function () {
  const U = globalThis.U, G = globalThis.G, Studio = globalThis.Studio;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = H * 0.64;
  function glow(ctx, x, y, r, rgb, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  function spruce(ctx, x, base, h, fill, seed) {
    const pts = []; const wd = h * 0.3;
    for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
    const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
    G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
  }
  function scene(ctx, reflect) {
    const cx = W / 2, base = HY, q = 4.4 * k;
    // будка
    G.poly(ctx, [[cx - 34 * q, base], [cx - 34 * q, base - 44 * q], [cx, base - 72 * q], [cx + 34 * q, base - 44 * q], [cx + 34 * q, base]], { fill: '#10162C', lw: 4, seed: 90, stroke: '#04060E', hatch: { color: 'rgba(0,0,0,0.3)', gap: 9, angle: 1.1 } });
    G.line(ctx, [[cx - 40 * q, base - 42 * q], [cx, base - 75 * q], [cx + 40 * q, base - 42 * q]], { color: '#04060E', lw: 7 * k, seed: 91 });
    // окно
    const wx = cx, wy = base - 30 * q, ww = 30 * q, wh = 24 * q;
    ctx.fillStyle = '#FFC874'; ctx.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
    if (!reflect) glow(ctx, wx, wy, 330 * k, '255,180,90', 0.55);
    // силуэт: голова и огромные уши
    ctx.fillStyle = '#05060B';
    ctx.beginPath(); ctx.ellipse(wx, wy + 5 * q, 6.5 * q, 5.8 * q, 0, 0, 7); ctx.fill();
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.moveTo(wx + d * 2 * q, wy + 1.5 * q); ctx.lineTo(wx + d * 13 * q, wy - 13 * q); ctx.lineTo(wx + d * 7.5 * q, wy + 5 * q); ctx.closePath(); ctx.fill(); }
    ctx.fillRect(wx - 7 * q, wy + 9 * q, 14 * q, wh / 2 - 9 * q);
    // два светлых глаза в силуэте
    if (!reflect) for (const d of [-1, 1]) { ctx.fillStyle = '#F4EEDC'; ctx.beginPath(); ctx.ellipse(wx + d * 2.6 * q, wy + 4.6 * q, 1.4 * q, 1.7 * q, 0, 0, 7); ctx.fill(); }
    // переплёт
    G.line(ctx, [[wx, wy - wh / 2], [wx, wy + wh / 2]], { color: '#10162C', lw: 2.4 * q, seed: 92 });
    G.line(ctx, [[wx - ww / 2, wy], [wx + ww / 2, wy]], { color: '#10162C', lw: 2.4 * q, seed: 93 });
    // дверь и сваи
    G.poly(ctx, [[cx + 14 * q, base], [cx + 14 * q, base - 22 * q], [cx + 26 * q, base - 22 * q], [cx + 26 * q, base]], { fill: '#0A0F20', lw: 3, seed: 94, stroke: '#04060E' });
  }
  Studio.film({
    draw(ctx, t) {
      const g = ctx.createLinearGradient(0, 0, 0, HY);
      g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, HY + 2);
      for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(U.hash(i, 1) * W, U.hash(i, 2) * HY * 0.7, (0.8 + U.hash(i, 3) * 1.8) * k, 0, 7); ctx.fill(); }
      G.ellipse(ctx, W * 0.78, H * 0.18, 60 * k, 60 * k, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8' });
      glow(ctx, W * 0.78, H * 0.18, 220 * k, '150,170,220', 0.2);
      for (let i = 0; i < 9; i++) spruce(ctx, (i / 8) * W * 1.1 - W * 0.05 + (U.hash(i, 5) - 0.5) * 60 * k, HY, (0.2 + 0.1 * U.hash(i, 6)) * H, '#1A2547', 30 + i);
      for (let i = 0; i < 7; i++) spruce(ctx, (i / 6) * W * 1.1 - W * 0.05 + 70 * k, HY + 4 * k, (0.13 + 0.07 * U.hash(i, 7)) * H, '#121A35', 60 + i);
      scene(ctx, false);
      // вода и отражение будки полосами
      const wg = ctx.createLinearGradient(0, HY, 0, H); wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
      ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
      const lay = document.createElement('canvas'); lay.width = W; lay.height = H; const lc = lay.getContext('2d');
      scene(lc, true);
      const strip = 4 * k;
      ctx.save(); ctx.globalAlpha = 0.45;
      for (let y = 0; y < H - HY; y += strip) { const off = Math.sin(y * 0.05) * 3 * k; ctx.drawImage(lay, 0, HY - y - strip, W, strip, off, HY + y, W, strip); }
      ctx.restore();
      glow(ctx, W / 2, HY + 90 * k, 200 * k, '255,180,90', 0.18);
      // камыши по краям и светлячки
      for (let i = 0; i < 14; i++) {
        const side = i % 2 ? 1 : -1, x = W / 2 + side * (300 + 140 * U.hash(i, 8)) * k, h = (160 + 160 * U.hash(i, 9)) * k;
        G.line(ctx, [[x, H * 0.9], [x + side * 10 * k, H * 0.9 - h * 0.5], [x + side * 18 * k, H * 0.9 - h]], { color: '#070C1A', lw: 7 * k, seed: 100 + i });
        if (i % 3 === 0) G.ellipse(ctx, x + side * 18 * k, H * 0.9 - h, 9 * k, 26 * k, { fill: '#2A1F18', lw: 2, seed: 130 + i, stroke: '#070C1A' });
      }
      for (const [x, y] of [[0.22, 0.42], [0.8, 0.5], [0.3, 0.7], [0.72, 0.74]]) { glow(ctx, x * W, y * H, 60 * k, '255,210,120', 0.5); ctx.fillStyle = '#FFF0CC'; ctx.beginPath(); ctx.arc(x * W, y * H, 5 * k, 0, 7); ctx.fill(); }
    },
    post: { paper: 0.35, vignette: 0.55, grain: 0.05 },
  });
})();
