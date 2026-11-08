// «Мерцалова топь» - эпизод 14 «Бессонник». Каждый кадр - чистая функция от t.
// Снято из камышей: существа наблюдают за будкой. В конце камера разворачивается к зрителю.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const HY = Math.round(H * 0.5);
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#0A0C16', MOSS = '#1E4A47';
  const COLD = '90,200,210', WARM = '255,200,116';

  // будка - главный «зверь» серии: крупно в центре горизонта, на сваях
  const B = { x: W * 0.5, b: HY + 20 * k, q: 3.0 * k };
  const q = B.q;
  const WIN = { x: B.x - 14 * q, y: B.b - 28 * q, w: 16 * q, h: 12 * q };
  const DOOR = { x: B.x + 14 * q, y: B.b, w: 13 * q, h: 30 * q };

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
    for (let i = 0; i < 90; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * HY * 0.9, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    G.ellipse(ctx, W * 0.84, H * 0.31, 50 * k, 56 * k, { fill: '#EFF2E6', lw: 3, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 8 } });
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 14; i++) spruce(U.hash(i, 14) * W * 1.1 - W * 0.05, HY, (0.08 + 0.05 * U.hash(i, 15)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 12; i++) spruce(U.hash(i, 16) * W * 1.1 - W * 0.05, HY + 6 * k, (0.05 + 0.04 * U.hash(i, 17)) * H, '#121B38', 60 + i);
    const wg = ctx.createLinearGradient(0, HY, 0, H);
    wg.addColorStop(0, '#16224A'); wg.addColorStop(1, '#060A18');
    ctx.fillStyle = wg; ctx.fillRect(0, HY, W, H - HY);
    for (let i = 0; i < 14; i++) { const y = HY + 30 * k + i * 40 * k; ctx.strokeStyle = 'rgba(120,150,220,0.08)'; ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.moveTo(W * U.hash(i, 40), y); ctx.lineTo(W * U.hash(i, 40) + 160 * k, y); ctx.stroke(); }
    for (const [x, y, r, sd] of [[0.15, 0.58, 50, 1], [0.78, 0.6, 56, 2], [0.3, 0.68, 64, 3], [0.7, 0.7, 60, 4]]) {
      G.ellipse(ctx, W * x, H * y, r * k, r * 0.3 * k, { fill: MOSS, lw: 3, seed: 500 + sd, stroke: '#0A1A16', hatch: { color: 'rgba(5,25,20,0.35)', gap: 7, angle: -0.5 } });
    }
    // мостки от двери будки к нам
    const planks = 9;
    for (let i = 0; i < planks; i++) {
      const p = i / (planks - 1), y = lerp(B.b + 26 * k, H * 0.74, p * p), wd = lerp(36, 150, p) * k;
      const cx = lerp(DOOR.x, W * 0.56, p);
      G.poly(ctx, [[cx - wd, y - lerp(4, 12, p) * k], [cx + wd, y - lerp(4, 12, p) * k], [cx + wd, y + lerp(4, 12, p) * k], [cx - wd, y + lerp(4, 12, p) * k]], { fill: '#2C2620', lw: 2.5, seed: 400 + i, stroke: '#0C0A08' });
    }
    // сваи и будка
    for (const dx of [-30, -8, 16, 30]) G.line(ctx, [[B.x + dx * q, B.b - 2 * k], [B.x + dx * q + 2 * k, B.b + 34 * k]], { color: '#140F0B', lw: 7 * k, seed: 440 + dx });
    G.poly(ctx, [[B.x - 34 * q, B.b], [B.x - 34 * q, B.b - 44 * q], [B.x, B.b - 70 * q], [B.x + 34 * q, B.b - 44 * q], [B.x + 34 * q, B.b]], { fill: '#141B33', lw: 3.5, seed: 90, stroke: '#05070F', hatch: { color: 'rgba(5,8,20,0.35)', gap: 9, angle: 0.1 } });
    G.poly(ctx, [[B.x - 40 * q, B.b - 42 * q], [B.x, B.b - 74 * q], [B.x + 40 * q, B.b - 42 * q], [B.x + 36 * q, B.b - 40 * q], [B.x, B.b - 69 * q], [B.x - 36 * q, B.b - 40 * q]], { fill: '#0B0F1E', lw: 3, seed: 91, stroke: '#05070F' });
    // антенна на крыше
    G.line(ctx, [[B.x + 18 * q, B.b - 56 * q], [B.x + 20 * q, B.b - 86 * q]], { color: '#05070F', lw: 3 * k, seed: 92 });
    G.line(ctx, [[B.x + 14 * q, B.b - 80 * q], [B.x + 26 * q, B.b - 82 * q]], { color: '#05070F', lw: 3 * k, seed: 93 });
  }

  // ---------- окно: свет монитора, силуэт, поддельное «ОТКРОЙ» ----------
  function boothWindow(ctx, t) {
    const { x, y, w, h } = WIN;
    const lit = r01(t, ev.reveal, ev.reveal + 0.15) * (1 - r01(t, ev.shut, ev.shut + 0.08));
    const lamp = t >= ev.morse && t < ev.shut ? S.morseOn(t) : 0;
    ctx.fillStyle = '#0D0F18'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
    if (lit > 0) {
      const mg = ctx.createLinearGradient(x + w / 2, 0, x - w / 2, 0);
      mg.addColorStop(0, `rgba(${COLD},${0.85 * lit})`); mg.addColorStop(1, `rgba(${COLD},${0.25 * lit})`);
      ctx.fillStyle = mg; ctx.fillRect(x - w / 2, y - h / 2, w, h);
      if (lamp) { ctx.fillStyle = 'rgba(255,200,116,0.9)'; ctx.fillRect(x - w / 2, y - h / 2, w, h); }
      // силуэт в профиль: голова, плечи, спинка стула; сидит лицом к монитору справа
      ctx.fillStyle = 'rgba(6,8,14,0.95)';
      const sx = x - 1 * q, sy = y + h / 2;
      const nod = Math.sin(t * 0.7) * 0.4 * q;
      ctx.beginPath(); ctx.ellipse(sx, sy - 6.8 * q + nod, 2.4 * q, 2.8 * q, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(sx - 4.5 * q, sy); ctx.quadraticCurveTo(sx - 4 * q, sy - 4.2 * q, sx, sy - 4 * q); ctx.quadraticCurveTo(sx + 3.5 * q, sy - 4 * q, sx + 3.5 * q, sy); ctx.fill();
      ctx.fillRect(sx - 6 * q, sy - 7 * q, 1.2 * q, 7 * q);
      glow(ctx, x, y, 70 * q, lamp ? WARM : COLD, (lamp ? 0.7 : 0.35) * lit);
    }
    G.line(ctx, [[x, y - h / 2], [x, y + h / 2]], { color: '#05070F', lw: 2.2 * k, seed: 95 });
    ctx.strokeStyle = '#05070F'; ctx.lineWidth = 3 * k; ctx.strokeRect(x - w / 2, y - h / 2, w, h);
  }

  // ---------- дверь: открывается, по свету проходит тень, закрывается ----------
  function boothDoor(ctx, t) {
    const { x, y, w, h } = DOOR;
    const open = sm(t, ev.door, ev.door + 0.35) * (1 - sm(t, ev.shut - 0.25, ev.shut));
    ctx.fillStyle = '#0B0E1A'; ctx.fillRect(x - w / 2, y - h, w, h);
    if (open > 0) {
      ctx.fillStyle = `rgba(255,200,116,${0.95 * open})`; ctx.fillRect(x - w / 2, y - h, w * open, h);
      // полоса света на мостках
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const lg = ctx.createLinearGradient(0, y, 0, y + 120 * k);
      lg.addColorStop(0, `rgba(255,190,100,${0.5 * open})`); lg.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2 + w * open, y); ctx.lineTo(x + w * open * 1.6, y + 120 * k); ctx.lineTo(x - w * 1.4, y + 120 * k); ctx.fill();
      ctx.restore();
      glow(ctx, x, y - h / 2, 60 * q, WARM, 0.5 * open);
      // тень: кто-то низенький проходит внутрь (видно только тень на свету)
      const sp = r01(t, ev.shadow, ev.shadow + 0.6);
      if (sp > 0 && sp < 1) {
        const sxx = lerp(x + w * 1.2, x - w * 0.1, sp), syy = y + lerp(60, 0, sp) * k;
        ctx.fillStyle = `rgba(10,6,4,${0.75 * open})`;
        ctx.beginPath(); ctx.ellipse(sxx, syy - 6 * q, 4.5 * q, 7 * q, -0.15, 0, 7); ctx.fill();
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(sxx + d * 3 * q, syy - 14 * q, 1.4 * q, 4 * q, d * 0.3, 0, 7); ctx.fill(); }
      }
      // створка
      G.poly(ctx, [[x - w / 2 + w * open, y - h], [x - w / 2 + w * open + 3 * q * open, y - h - 1 * q], [x - w / 2 + w * open + 3 * q * open, y + 1 * q], [x - w / 2 + w * open, y]], { fill: '#1C1A1A', lw: 2, seed: 97, stroke: '#05070F' });
    }
    ctx.strokeStyle = '#05070F'; ctx.lineWidth = 3 * k; ctx.strokeRect(x - w / 2, y - h, w, h);
    // стук: дверь чуть вздрагивает, сыпется пыль
    for (const kt of S.knocks) {
      if (t >= kt && t < kt + 0.25) {
        const a = 1 - r01(t, kt, kt + 0.25);
        ctx.strokeStyle = `rgba(180,190,220,${0.5 * a})`; ctx.lineWidth = 2 * k;
        for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x, y - h * 0.55, (8 + 14 * (1 - a)) * q * 0.4, d > 0 ? -0.6 : Math.PI - 0.6, d > 0 ? 0.6 : Math.PI + 0.6); ctx.stroke(); }
      }
    }
  }

  // ---------- существа в камышах ----------
  // turn: 0 - смотрят на будку (спиной к нам), 1 - повернулись в камеру
  function pryatysh(ctx, x, y, s, turn, t) {
    const S2 = s * k;
    // огромные уши
    for (const d of [-1, 1]) {
      ctx.save(); ctx.translate(x + d * 26 * S2, y - 40 * S2); ctx.rotate(d * (0.5 + 0.05 * Math.sin(t * 1.3 + d)));
      G.ellipse(ctx, 0, -34 * S2, 22 * S2, 44 * S2, { fill: '#D8D2DA', lw: 3, seed: 700 + d, stroke: INK });
      G.ellipse(ctx, 0, -32 * S2, 12 * S2, 32 * S2, { fill: turn > 0.5 ? '#C9A2B4' : '#BFB6C2', lw: 0, seed: 702 + d });
      ctx.restore();
    }
    G.ellipse(ctx, x, y - 20 * S2, 40 * S2, 36 * S2, { fill: '#E2DCE3', lw: 3, seed: 704, stroke: INK, hatch: { color: 'rgba(60,50,70,0.15)', gap: 6, angle: 0.7 } });
    if (turn > 0.5) {
      const blink = (t > ev.turn - 0.6 && t < ev.turn - 0.5) ? 0.15 : 1;
      for (const d of [-1, 1]) {
        ctx.fillStyle = '#050407'; ctx.beginPath(); ctx.ellipse(x + d * 15 * S2, y - 22 * S2, 10 * S2, 13 * S2 * blink, 0, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(x + d * 15 * S2 - 3 * S2, y - 26 * S2, 2.6 * S2, 0, 7); ctx.fill();
      }
    }
  }
  const MEYES = [];
  for (let i = 0; i < 24; i++) MEYES.push([(U.hash(i, 810) - 0.5) * 1.5, -0.15 - 0.7 * U.hash(i, 811), 0.6 + 0.5 * U.hash(i, 812), U.hash(i, 813)]);
  function mokhnach(ctx, x, y, s, turn, t) {
    const S2 = s * k;
    G.ellipse(ctx, x, y, 110 * S2, 80 * S2, { fill: '#3F6E5C', lw: 3.5, seed: 820, stroke: INK, hatch: { color: 'rgba(10,30,20,0.4)', gap: 6, angle: -0.8 } });
    for (let i = 0; i < 26; i++) {
      const a = Math.PI + (i / 25) * Math.PI, rx = 110 * S2, ry = 80 * S2;
      G.line(ctx, [[x + Math.cos(a) * rx, y + Math.sin(a) * ry], [x + Math.cos(a) * (rx + 12 * S2), y + Math.sin(a) * (ry + 14 * S2)]], { color: '#2C5646', lw: 5 * S2, seed: 830 + i });
    }
    // 24 глаза на спине: открываются по одному
    MEYES.forEach(([ex, ey, es, ph], i) => {
      const o = clamp((turn * 1.6) - ph * 0.6);
      if (o <= 0) { ctx.strokeStyle = 'rgba(8,20,16,0.8)'; ctx.lineWidth = 2 * S2; ctx.beginPath(); ctx.arc(x + ex * 88 * S2, y + ey * 66 * S2, 9 * es * S2, 0.3, Math.PI - 0.3); ctx.stroke(); return; }
      const px = x + ex * 88 * S2, py = y + ey * 66 * S2, r = 10 * es * S2;
      ctx.fillStyle = '#F2EEDC'; ctx.beginPath(); ctx.ellipse(px, py, r, r * o, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = INK; ctx.lineWidth = 1.5 * S2; ctx.stroke();
      ctx.fillStyle = '#07090A'; ctx.beginPath(); ctx.arc(px, py, r * 0.42 * o, 0, 7); ctx.fill();
    });
  }
  // улыбки в темноте камышей
  function smile(ctx, x, y, s, a) {
    if (a <= 0) return;
    const S2 = s * k;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = '#1A0A10'; ctx.beginPath(); ctx.moveTo(x - 30 * S2, y); ctx.quadraticCurveTo(x, y + 30 * S2, x + 30 * S2, y); ctx.quadraticCurveTo(x, y + 8 * S2, x - 30 * S2, y); ctx.fill();
    ctx.fillStyle = '#F4EFE0';
    for (let i = 0; i < 9; i++) {
      const p = (i + 0.5) / 9, tx = x - 30 * S2 + 60 * S2 * p, ty = y + Math.sin(p * Math.PI) * 7 * S2;
      ctx.beginPath(); ctx.moveTo(tx - 3 * S2, ty); ctx.lineTo(tx, ty + 7 * S2); ctx.lineTo(tx + 3 * S2, ty); ctx.fill();
    }
    for (const d of [-1, 1]) { ctx.fillStyle = 'rgba(240,240,220,0.9)'; ctx.beginPath(); ctx.arc(x + d * 16 * S2, y - 18 * S2, 3.5 * S2, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function reedsFront(ctx, t, half) {
    for (let i = half; i < 22; i += 2) {
      const side = (i >> 1) % 2 ? 1 : -1, xx = side < 0 ? U.hash(i, 61) * W * 0.34 : W - U.hash(i, 61) * W * 0.34;
      const base = H * (0.96 + 0.06 * U.hash(i, 62)), h = (0.22 + 0.2 * U.hash(i, 63)) * H;
      const sway = Math.sin(t * 0.9 + i) * 8 * k, lean = side * (-0.1 - 0.15 * U.hash(i, 64)) * h;
      G.line(ctx, [[xx, base], [xx + lean * 0.5 + sway * 0.5, base - h * 0.5], [xx + lean + sway, base - h]], { color: '#04060E', lw: (9 + 8 * U.hash(i, 65)) * k, seed: 900 + i });
      if (i % 4 === 0) G.ellipse(ctx, xx + lean + sway, base - h, 8 * k, 24 * k, { fill: '#160F0A', lw: 2, seed: 930 + i, stroke: '#04060E' });
    }
  }
  // огоньки Фонарницы подплывают к будке
  function lanterns(ctx, t) {
    const a = sm(t, ev.approach, ev.approach + 1.5) * (1 - r01(t, ev.gone, ev.gone + 0.6)) + sm(t, ev.eyes, ev.eyes + 1) * (1 - r01(t, ev.turn - 0.1, ev.turn));
    if (a <= 0) return;
    for (let i = 0; i < 4; i++) {
      const p = sm(t, ev.approach + i * 0.3, ev.gone);
      const x = lerp(W * (0.2 + 0.2 * i), B.x + (i - 1.5) * 40 * k, p * 0.7) + Math.sin(t * 1.3 + i) * 8 * k;
      const y = lerp(H * 0.66, B.b + 20 * k, p * 0.7) + Math.cos(t * 1.1 + i) * 6 * k;
      glow(ctx, x, y, 40 * k, WARM, 0.5 * a);
      ctx.fillStyle = `rgba(255,230,170,${0.9 * a})`; ctx.beginPath(); ctx.arc(x, y, 4 * k, 0, 7); ctx.fill();
    }
  }

  function world(ctx, t) {
    ctx.drawImage(Studio.cache('scenery', scenery), 0, 0, W, H);
    boothWindow(ctx, t);
    boothDoor(ctx, t);
    lanterns(ctx, t);
    // Улыбыши - на мостках, подбираются ближе
    const app = sm(t, ev.approach, ev.gone);
    const sa = sm(t, ev.approach, ev.approach + 1.2);
    smile(ctx, lerp(W * 0.4, B.x - 40 * k, app * 0.8), lerp(H * 0.66, B.b + 60 * k, app * 0.8), lerp(1.0, 0.6, app), sa * (1 - r01(t, ev.door, ev.door + 0.3)));
    smile(ctx, lerp(W * 0.66, B.x + 70 * k, app * 0.8), lerp(H * 0.64, B.b + 50 * k, app * 0.8), lerp(0.9, 0.55, app), sa * (1 - r01(t, ev.door, ev.door + 0.3)));
    // после двери Улыбыши - снова в камышах, уже лицом к нам
    const back = sm(t, ev.eyes, ev.eyes + 0.8);
    smile(ctx, W * 0.36, H * 0.66, 1.1, back);
    smile(ctx, W * 0.64, H * 0.65, 1.0, back);
    const turn = sm(t, ev.eyes, ev.eyes + 1.6);
    reedsFront(ctx, t, 0);
    mokhnach(ctx, W * 0.8, H * 0.76, 1.35, turn, t);
    pryatysh(ctx, W * 0.21, H * 0.75, 1.6, turn, t);
    reedsFront(ctx, t, 1);
  }

  // камера: [центр x, центр y, зум]
  function cam(t) {
    const A = [W * 0.5, H * 0.6, 1.0];
    const B1 = [B.x, B.b - 20 * k, 1.5];
    const C = [B.x, B.b - 40 * k, 2.6];
    const mix = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
    let c = mix(A, B1, sm(t, ev.reveal - 0.5, ev.approach));
    c = mix(c, C, sm(t, ev.approach, ev.gone + 0.8));
    c = mix(c, A, sm(t, ev.shut + 0.4, ev.eyes + 0.4));
    return c;
  }

  // ---------- зритель: лицо в свете экрана ----------
  function viewer(ctx, t) {
    ctx.fillStyle = '#020306'; ctx.fillRect(0, 0, W, H);
    const cx = W * 0.5, cy = H * 0.5, s = k * 1.15;
    const p = r01(t, ev.turn, ev.turn + 3.5);
    const zoom = lerp(1.0, 1.08, ease.outQuad(p));
    ctx.save(); ctx.translate(cx, cy); ctx.scale(zoom, zoom); ctx.translate(-cx, -cy);
    // свет экрана снизу
    glow(ctx, cx, cy + 330 * s, 520 * s, COLD, 0.55 + 0.04 * Math.sin(t * 9));
    // плечи и капюшон
    G.poly(ctx, [[cx - 330 * s, H], [cx - 300 * s, cy + 260 * s], [cx - 120 * s, cy + 190 * s], [cx + 120 * s, cy + 190 * s], [cx + 300 * s, cy + 260 * s], [cx + 330 * s, H]], { fill: '#0E1420', lw: 3, seed: 1001, stroke: '#020306' });
    G.ellipse(ctx, cx, cy + 160 * s, 60 * s, 70 * s, { fill: '#5E7A86', lw: 2.5, seed: 1002, stroke: '#0A1016' });
    // голова - светлее снизу, тени вверх
    const hg = ctx.createLinearGradient(0, cy - 190 * s, 0, cy + 150 * s);
    hg.addColorStop(0, '#2C3A44'); hg.addColorStop(0.55, '#7F9CA6'); hg.addColorStop(1, '#BFE0E6');
    G.ellipse(ctx, cx, cy, 140 * s, 180 * s, { fill: hg, lw: 3.5, seed: 1003, stroke: '#081014', hatch: { color: 'rgba(10,25,35,0.12)', gap: 8, angle: 0.5 } });
    // волосы
    G.poly(ctx, [[cx - 146 * s, cy - 10 * s], [cx - 150 * s, cy - 120 * s], [cx - 80 * s, cy - 196 * s], [cx + 40 * s, cy - 200 * s], [cx + 130 * s, cy - 150 * s], [cx + 148 * s, cy - 30 * s], [cx + 110 * s, cy - 110 * s], [cx - 20 * s, cy - 130 * s], [cx - 110 * s, cy - 100 * s]], { fill: '#0B0E14', lw: 3, seed: 1004, stroke: '#020306' });
    // глаза: моргнёт на «Не спит», в зрачках - отражения экрана
    const bl = S.VO_AT.p7b;
    const lid = (t > bl + 0.1 && t < bl + 0.24) ? 0.08 : 1;
    for (const d of [-1, 1]) {
      const ex = cx + d * 52 * s, ey = cy - 10 * s;
      ctx.fillStyle = 'rgba(10,20,26,0.45)'; ctx.beginPath(); ctx.ellipse(ex, ey - 8 * s, 34 * s, 22 * s, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#D7EEF0'; ctx.beginPath(); ctx.ellipse(ex, ey, 24 * s, 13 * s * lid, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = '#081014'; ctx.lineWidth = 2.5 * s; ctx.stroke();
      if (lid > 0.5) {
        ctx.fillStyle = '#10181C'; ctx.beginPath(); ctx.arc(ex, ey + 1 * s, 9.5 * s, 0, 7); ctx.fill();
        ctx.fillStyle = 'rgba(200,250,255,0.95)'; ctx.fillRect(ex - 3 * s, ey - 3 * s, 4 * s, 6 * s);
      }
      ctx.strokeStyle = 'rgba(8,16,20,0.8)'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(ex - 28 * s, ey - 30 * s); ctx.quadraticCurveTo(ex, ey - 38 * s, ex + 28 * s, ey - 30 * s); ctx.stroke();
    }
    // нос: светлый кончик, тень над ним
    ctx.strokeStyle = 'rgba(10,22,28,0.6)'; ctx.lineWidth = 2.5 * s;
    ctx.beginPath(); ctx.moveTo(cx - 4 * s, cy + 10 * s); ctx.quadraticCurveTo(cx - 14 * s, cy + 52 * s, cx - 2 * s, cy + 58 * s); ctx.stroke();
    ctx.fillStyle = 'rgba(220,250,255,0.35)'; ctx.beginPath(); ctx.ellipse(cx - 2 * s, cy + 56 * s, 12 * s, 6 * s, 0, 0, 7); ctx.fill();
    // рот
    ctx.strokeStyle = 'rgba(10,20,26,0.75)'; ctx.lineWidth = 3 * s;
    ctx.beginPath(); ctx.moveTo(cx - 30 * s, cy + 100 * s); ctx.quadraticCurveTo(cx, cy + 104 * s, cx + 30 * s, cy + 100 * s); ctx.stroke();
    ctx.restore();
    // за спиной в темноте открываются глаза - по паре, на «смотрит прямо на нас»
    const pairs = [[0.14, 0.3, 0], [0.86, 0.26, 0.25], [0.1, 0.62, 0.5], [0.9, 0.58, 0.7], [0.24, 0.12, 0.9], [0.78, 0.1, 1.05]];
    for (const [px, py, d] of pairs) {
      const o = r01(t, S.VO_AT.p7c + d, S.VO_AT.p7c + d + 0.25);
      if (o <= 0) continue;
      for (const dd of [-1, 1]) {
        const ex = W * px + dd * 16 * k, ey = H * py;
        glow(ctx, ex, ey, 26 * k, '220,240,230', 0.25 * o);
        ctx.fillStyle = `rgba(235,245,230,${0.95 * o})`; ctx.beginPath(); ctx.ellipse(ex, ey, 7 * k, 7 * k * o, 0, 0, 7); ctx.fill();
        ctx.fillStyle = '#05070A'; ctx.beginPath(); ctx.arc(ex, ey, 2.4 * k * o, 0, 7); ctx.fill();
      }
    }
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
    // деталь: в темноте - полоска тёплого света под дверью, на стук в ней появляется тень двух ножек
    if (t >= ev.endKnock - 0.6) {
      const la = r01(t, ev.endKnock - 0.6, ev.endKnock - 0.2);
      const ly = H * 0.42 + 400 * k, lw = 300 * k;
      const lg = ctx.createLinearGradient(W / 2 - lw, 0, W / 2 + lw, 0);
      lg.addColorStop(0, 'rgba(255,190,100,0)'); lg.addColorStop(0.5, `rgba(255,200,116,${0.9 * la})`); lg.addColorStop(1, 'rgba(255,190,100,0)');
      ctx.fillStyle = lg; ctx.fillRect(W / 2 - lw, ly, lw * 2, 5 * k);
      glow(ctx, W / 2, ly, 140 * k, WARM, 0.18 * la);
      if (t >= ev.endKnock) {
        ctx.fillStyle = '#030408';
        for (const d of [-1, 1]) ctx.fillRect(W / 2 + d * 26 * k - 14 * k, ly - 1 * k, 28 * k, 7 * k);
      }
    }
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      const wp = ease.inOutCubic(r01(t, ev.turn - 0.25, ev.turn + 0.25));   // разворот камеры: быстрая панорама
      if (t < ev.turn + 0.25) {
        const [cx, cy, z] = cam(t);
        ctx.save();
        ctx.translate(-wp * W * 1.3, 0);
        ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-cx, -cy);
        world(ctx, t);
        ctx.restore();
        // в тишине темнеет, светятся только окно и дверь
        const dk = 0.45 * r01(t, ev.gone, ev.gone + 0.8) * (1 - r01(t, ev.shut + 0.4, ev.eyes));
        if (dk > 0) { ctx.fillStyle = `rgba(2,3,8,${dk})`; ctx.fillRect(0, 0, W, H); }
      }
      if (t >= ev.turn - 0.25 && t < ev.cut) {
        ctx.save(); ctx.translate((1 - wp) * W * 1.3, 0); viewer(ctx, t); ctx.restore();
        if (wp > 0 && wp < 1) { ctx.fillStyle = `rgba(2,3,8,${0.6 * Math.sin(wp * Math.PI)})`; ctx.fillRect(0, 0, W, H); }
      }
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      Subs.draw(ctx, t, S.subtitles.filter((x) => !isTitle(x)), { style: 'clean', size: Math.round(62 * k), y: H * 0.2, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
