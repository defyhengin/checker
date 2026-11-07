// «Мерцалова топь» - эпизод 10 «Пузырёк». Каждый кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio, Subs = globalThis.Subs;
  const { ev } = S;
  const { clamp, lerp, ease } = U;
  const W = G.W, H = G.H, k = W / 1080;
  const WL = Math.round(H * 0.42);               // линия воды (кадр поделён: сверху ночь, снизу толща)
  const BOT = H * 1.36;                          // дно (видно после спуска камеры)
  const DROP = H * 0.5;                          // насколько опускается камера
  const PX = W * 0.52;                           // кувшинка, под которой живёт Пузырёк
  const r01 = (t, a, b) => clamp((t - a) / (b - a));
  const sm = (t, a, b) => ease.inOutQuad(r01(t, a, b));
  const INK = '#120F18';
  const SKIN = 'rgba(232,214,238,0.9)', SKIN_D = 'rgba(196,170,208,0.9)', GILL = '#E89AB8';

  function glow(ctx, x, y, r, rgb, a) {
    if (a <= 0.003) return;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(0.35, `rgba(${rgb},${a * 0.35})`); g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
  }
  const BOOTH = { x: W * 0.3, b: WL + 2 * k, q: 1.25 * k };

  // ---------- над водой: небо, ели, будка ----------
  function sky(ctx) {
    const g = ctx.createLinearGradient(0, 0, 0, WL);
    g.addColorStop(0, '#0B1030'); g.addColorStop(1, '#25325C');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, WL + 4);
    for (let i = 0; i < 60; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * WL * 0.75, r = (0.8 + U.hash(i, 3) * 1.8) * k;
      ctx.fillStyle = `rgba(230,236,255,${0.3 + 0.5 * U.hash(i, 4)})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    }
    G.ellipse(ctx, W * 0.8, H * 0.1, 58 * k, 58 * k, { fill: '#EFF2E6', lw: 4, seed: 2, stroke: '#7E8AA8', hatch: { color: 'rgba(110,120,150,0.18)', gap: 9 } });
    const spruce = (x, base, h, fill, seed) => {
      const pts = []; const wd = h * 0.3;
      for (let s = 0; s <= 5; s++) { const yy = base - h + (h * s) / 5; const ww = (wd * s) / 5; pts.push([x - ww, yy]); if (s < 5) pts.push([x - ww * 0.5, yy + 6 * k]); }
      const right = pts.map(([px, py]) => [2 * x - px, py]).reverse();
      G.poly(ctx, [[x, base - h - 6 * k], ...pts.slice(1), [x - wd, base], [x + wd, base], ...right.slice(0, -1)], { fill, lw: 3, seed, stroke: '#070B1C' });
    };
    for (let i = 0; i < 16; i++) spruce(U.hash(i, 14) * W * 1.1 - W * 0.05, WL, (0.11 + 0.06 * U.hash(i, 15)) * H, '#1A2547', 30 + i);
    for (let i = 0; i < 14; i++) spruce(U.hash(i, 16) * W * 1.1 - W * 0.05, WL + 4 * k, (0.07 + 0.05 * U.hash(i, 17)) * H, '#121A35', 60 + i);
    const { x: hx, b: hb, q } = BOOTH;
    G.poly(ctx, [[hx - 34 * q, hb], [hx - 34 * q, hb - 44 * q], [hx, hb - 72 * q], [hx + 34 * q, hb - 44 * q], [hx + 34 * q, hb]], { fill: '#0E1428', lw: 3, seed: 90, stroke: '#05070F' });
    // камыши у кромки
    for (let i = 0; i < 26; i++) {
      const x = U.hash(i, 53) * W, h = (0.04 + 0.06 * U.hash(i, 54)) * H, lean = (U.hash(i, 55) - 0.5) * 0.25 * h;
      if (Math.abs(x - PX) < 150 * k) continue;
      G.line(ctx, [[x, WL + 2 * k], [x + lean * 0.5, WL - h * 0.5], [x + lean, WL - h]], { color: '#0A1124', lw: 5 * k, seed: 300 + i });
    }
  }

  // ---------- под водой ----------
  function water(ctx, t) {
    const g = ctx.createLinearGradient(0, WL, 0, BOT + 80 * k);
    g.addColorStop(0, '#1B3158'); g.addColorStop(0.35, '#0F1E3E'); g.addColorStop(1, '#050913');
    ctx.fillStyle = g; ctx.fillRect(0, WL, W, BOT + 200 * k - WL);
    // лунные лучи сквозь воду
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const x0 = W * (0.2 + 0.17 * i) + Math.sin(t * 0.4 + i) * 20 * k, w0 = (30 + 25 * U.hash(i, 70)) * k;
      const lg = ctx.createLinearGradient(0, WL, 0, WL + H * 0.75);
      lg.addColorStop(0, 'rgba(140,175,220,0.10)'); lg.addColorStop(1, 'rgba(140,175,220,0)');
      ctx.fillStyle = lg; ctx.beginPath();
      ctx.moveTo(x0 - w0, WL); ctx.lineTo(x0 + w0, WL); ctx.lineTo(x0 + w0 * 2.4 - 140 * k, WL + H * 0.75); ctx.lineTo(x0 - w0 * 0.6 - 140 * k, WL + H * 0.75); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // взвесь
    for (let i = 0; i < 46; i++) {
      const x = (U.hash(i, 80) * W + Math.sin(t * 0.3 + i) * 14 * k) % W;
      const y = WL + 30 * k + ((U.hash(i, 81) * (BOT - WL) - t * 6 * k * (0.5 + U.hash(i, 82))) % (BOT - WL) + (BOT - WL)) % (BOT - WL);
      ctx.fillStyle = `rgba(190,215,235,${0.12 + 0.18 * U.hash(i, 83)})`; ctx.beginPath(); ctx.arc(x, y, (1 + 1.5 * U.hash(i, 84)) * k, 0, 7); ctx.fill();
    }
    // стебли кувшинок уходят вниз
    const stems = [[0.14, 0.2], [0.34, -0.15], [PX / W, 0.05], [0.8, -0.2], [0.93, 0.15]];
    stems.forEach(([sx, c], i) => {
      const x = sx * W, sw = Math.sin(t * 0.7 + i) * 8 * k;
      G.line(ctx, [[x, WL + 6 * k], [x + c * 120 * k + sw, WL + (BOT - WL) * 0.5], [x - c * 60 * k, BOT]], { color: '#16362F', lw: 6 * k, seed: 400 + i });
    });
    // кувшинки снизу: тёмные силуэты на поверхности
    const pads = [[0.14, 120], [0.34, 100], [PX / W, 170], [0.8, 130], [0.93, 90]];
    pads.forEach(([px, rx], i) => G.ellipse(ctx, px * W, WL + 6 * k, rx * k, 13 * k, { fill: '#0E2A27', lw: 3, seed: 500 + i, stroke: '#061210' }));
    // поверхность изнутри: светлая дрожащая кромка
    const pts = [];
    for (let i = 0; i <= 24; i++) pts.push([(i / 24) * W, WL + Math.sin(i * 1.3 + t * 1.8) * 2.5 * k]);
    G.line(ctx, pts, { color: 'rgba(170,205,235,0.55)', lw: 3 * k, seed: 520 });
  }

  // ---------- дно: ил, водоросли, лампа и тетрадь ----------
  function bottom(ctx, t) {
    const pts = [[0, BOT + 20 * k]];
    for (let i = 0; i <= 12; i++) pts.push([(i / 12) * W, BOT + Math.sin(i * 1.7) * 18 * k]);
    pts.push([W, BOT + 400 * k], [0, BOT + 400 * k]);
    G.poly(ctx, pts, { fill: '#141A1E', lw: 3, seed: 600, stroke: '#070A0C', hatch: { color: 'rgba(0,0,0,0.35)', gap: 9, angle: -0.4 } });
    for (let i = 0; i < 12; i++) {
      const x = U.hash(i, 610) * W, h = (60 + 110 * U.hash(i, 611)) * k, sw = Math.sin(t * 1.1 + i) * 12 * k;
      G.line(ctx, [[x, BOT + 6 * k], [x + sw * 0.5, BOT - h * 0.5], [x + sw, BOT - h]], { color: '#18352C', lw: 5 * k, seed: 620 + i });
    }
    // тетрадь наблюдателя, наполовину в иле
    const nx = W * 0.3, ny = BOT - 4 * k; ctx.save(); ctx.translate(nx, ny); ctx.scale(1.5, 1.5); ctx.translate(-nx, -ny);
    G.poly(ctx, [[nx - 90 * k, ny + 6 * k], [nx - 4 * k, ny - 22 * k], [nx + 4 * k, ny - 22 * k], [nx + 92 * k, ny + 4 * k], [nx + 6 * k, ny + 30 * k], [nx - 6 * k, ny + 30 * k]], { fill: '#8C8670', lw: 3, seed: 630, stroke: '#2A271E' });
    for (let i = 0; i < 4; i++) {
      G.line(ctx, [[nx - 74 * k + i * 8 * k, ny + 2 * k + i * 6 * k], [nx - 18 * k + i * 4 * k, ny - 14 * k + i * 6 * k]], { color: 'rgba(40,36,60,0.6)', lw: 2 * k, seed: 640 + i });
      G.line(ctx, [[nx + 18 * k - i * 4 * k, ny - 14 * k + i * 6 * k], [nx + 74 * k - i * 8 * k, ny + 2 * k + i * 6 * k]], { color: i === 1 ? 'rgba(170,40,40,0.7)' : 'rgba(40,36,60,0.6)', lw: 2 * k, seed: 650 + i });
    }
    ctx.restore();
    // сигнальная лампа на боку
    const lx = W * 0.7, ly = BOT - 18 * k; ctx.save(); ctx.translate(lx, ly); ctx.scale(1.5, 1.5); ctx.translate(-lx, -ly);
    G.poly(ctx, [[lx - 60 * k, ly - 34 * k], [lx + 30 * k, ly - 40 * k], [lx + 36 * k, ly + 24 * k], [lx - 56 * k, ly + 28 * k]], { fill: '#2C2A2F', lw: 3, seed: 660, stroke: '#0A090C', hatch: { color: 'rgba(0,0,0,0.3)', gap: 7, angle: 0.7 } });
    G.ellipse(ctx, lx + 44 * k, ly - 6 * k, 18 * k, 34 * k, { fill: '#6E6A55', lw: 3, seed: 661, stroke: '#0A090C' });
    G.line(ctx, [[lx - 40 * k, ly - 36 * k], [lx - 20 * k, ly - 70 * k], [lx + 10 * k, ly - 40 * k]], { color: '#1A191E', lw: 5 * k, seed: 662 });
    glow(ctx, lx + 44 * k, ly - 6 * k, 40 * k, '255,200,116', 0.05 + 0.04 * Math.sin(t * 0.9));
    ctx.restore();
  }

  // ---------- Пузырёк (прозрачный малыш вроде аксолотля) ----------
  // o: { puff (0..1 щёки), pin (0..1 глаза-точки), look (-1..1) }
  function puz(ctx, x, y, sc, t, o = {}) {
    const s = k * sc, puff = o.puff || 0, look = o.look || 0;
    if (!o.headOnly) {
    // хвост с плавником, виляет
    const tw = Math.sin(t * 3.1) * 14 * s;
    G.poly(ctx, [[x - 20 * s, y + 36 * s], [x - 60 * s + tw * 0.5, y + 74 * s], [x - 110 * s + tw, y + 70 * s], [x - 70 * s + tw * 0.6, y + 52 * s], [x - 10 * s, y + 52 * s]], { fill: 'rgba(214,190,226,0.75)', lw: 2.5, seed: 700, stroke: INK });
    // тельце
    G.ellipse(ctx, x, y + 42 * s, 40 * s, 28 * s, { fill: SKIN, lw: 3, seed: 701, stroke: INK, hatch: { color: 'rgba(90,60,110,0.14)', gap: 7, angle: 0.5 } });
    // лапки с пальчиками
    for (const d of [-1, 1]) {
      const fx = x + d * 30 * s, fy = y + 62 * s + Math.sin(t * 2 + d) * 2 * s;
      G.line(ctx, [[x + d * 18 * s, y + 50 * s], [fx, fy]], { color: SKIN_D, lw: 6 * s, seed: 702 + d });
      for (let f = -1; f <= 1; f++) { ctx.fillStyle = SKIN_D; ctx.beginPath(); ctx.arc(fx + f * 5 * s, fy + 4 * s, 2.6 * s, 0, 7); ctx.fill(); }
    }
    }
    // жабры - три пушистых веточки с каждой стороны, светятся розовым
    const hy = y - 4 * s, hw = 62 * s * (1 + 0.18 * puff), hh = 46 * s * (1 + 0.12 * puff);
    for (const d of [-1, 1]) for (let j = 0; j < 3; j++) {
      const a = -0.9 + j * 0.55 + Math.sin(t * 2.4 + j + d) * 0.07;
      const bx = x + d * hw * 0.82, by = hy - 10 * s + j * 12 * s;
      const L = (54 - j * 8) * s, ex = bx + d * Math.cos(a) * L, ey = by + Math.sin(a) * L;
      G.line(ctx, [[bx, by], [ex, ey]], { color: GILL, lw: 4.5 * s, seed: 710 + j + d * 10 });
      for (let f = 1; f <= 4; f++) {
        const px = lerp(bx, ex, f / 5), py = lerp(by, ey, f / 5);
        G.line(ctx, [[px, py], [px + d * 9 * s * Math.cos(a - 1.2), py + 9 * s * Math.sin(a - 1.2)]], { color: GILL, lw: 2.2 * s, seed: 720 + f + j * 5 + d * 30 });
      }
      glow(ctx, ex, ey, 22 * s, '240,150,190', 0.18);
    }
    // голова - широкая, мягкая
    G.ellipse(ctx, x, hy, hw, hh, { fill: SKIN, lw: 3.5, seed: 730, stroke: INK, hatch: { color: 'rgba(90,60,110,0.12)', gap: 8, angle: 0.6 } });
    if (puff > 0.05) for (const d of [-1, 1]) G.ellipse(ctx, x + d * 34 * s, hy + 16 * s, 16 * s * puff, 12 * s * puff, { fill: 'rgba(240,160,190,0.45)', lw: 0, seed: 731 + d });
    // глаза: большие чёрные с бликом; pin -> бледные с точкой
    const pin = o.pin || 0;
    for (const d of [-1, 1]) {
      const ex = x + d * 30 * s + look * 4 * s, ey = hy - 6 * s;
      ctx.fillStyle = pin > 0.5 ? '#E9E4EF' : '#07060B'; ctx.beginPath(); ctx.ellipse(ex, ey, 13 * s, 14 * s, 0, 0, 7); ctx.fill();
      if (pin > 0.5) { ctx.strokeStyle = INK; ctx.lineWidth = 1.6 * s; ctx.stroke(); ctx.fillStyle = '#07060B'; ctx.beginPath(); ctx.arc(ex + d * 1.5 * s, ey + 1 * s, 1.6 * s, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(90,60,110,0.25)'; ctx.beginPath(); ctx.ellipse(ex, ey + 16 * s, 12 * s, 3 * s, 0, 0, 7); ctx.fill(); }
      else { ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(ex - 4 * s, ey - 5 * s, 3.6 * s, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(ex + 4 * s, ey + 4 * s, 1.5 * s, 0, 7); ctx.fill(); }
    }
    // ротик
    ctx.strokeStyle = INK; ctx.lineWidth = 2 * s;
    if (pin > 0.5) { ctx.fillStyle = '#1A0F1A'; ctx.beginPath(); ctx.ellipse(x, hy + 22 * s, 7 * s, 9 * s, 0, 0, 7); ctx.fill(); }
    else if (puff > 0.3) { ctx.beginPath(); ctx.arc(x, hy + 20 * s, 5 * s, 0, 7); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(x, hy + 10 * s, 18 * s, 0.35, Math.PI - 0.35); ctx.stroke(); }
  }
  const mouthOf = (x, y, sc) => [x, y + 16 * k * sc];

  // где Пузырёк: под листом, потом спускается к лампе
  function pos(t) {
    const p = sm(t, ev.descend + 0.3, ev.down + 0.4);
    const x = lerp(PX, W * 0.5, p) + Math.sin(t * 0.8) * 10 * k;
    const y = lerp(WL + H * 0.22, BOT - 300 * k, p) + Math.sin(t * 1.5) * 8 * k;
    return [x, y];
  }

  function bubble(ctx, x, y, r, a = 1, inner) {
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    g.addColorStop(0, 'rgba(210,235,250,0.10)'); g.addColorStop(0.8, 'rgba(160,200,230,0.10)'); g.addColorStop(1, 'rgba(200,230,250,0.35)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    if (inner) inner(ctx, x, y, r);
    ctx.strokeStyle = 'rgba(205,232,250,0.75)'; ctx.lineWidth = Math.max(1.5, r * 0.06); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(x - r * 0.38, y - r * 0.42, r * 0.2, r * 0.11, -0.7, 0, 7); ctx.fill();
    ctx.restore();
  }

  // мелкие и звуковые пузыри: от рта к поверхности
  function bubbles(ctx, t) {
    for (const b of S.SMALL) {
      const age = t - b.t; if (age < 0 || age > 2.2) continue;
      const [mx, my] = mouthOf(...pos(b.t), 1.7);
      const p = age / 2.2, y = lerp(my, WL + 8 * k, p);
      if (y <= WL + 10 * k) continue;
      bubble(ctx, mx + b.dx * 40 * k * p + Math.sin(age * 5 + b.dx) * 6 * k, y, (5 + 6 * b.size) * k * (0.6 + 0.4 * p));
    }
    for (const s of S.SOUND) {
      const t0 = s.t - S.RISE, age = t - t0;
      const [mx, my] = mouthOf(...pos(t0), 1.7);
      if (age >= 0 && t < s.t) {
        const p = ease.inQuad(age / S.RISE), y = lerp(my, WL + 22 * k, p), x = mx + Math.sin(age * 3) * 10 * k;
        bubble(ctx, x, y, lerp(14, 40, Math.min(1, age * 2)) * k, 1, (c, bx, by, r) => {
          if (s.kind === 'frog') {
            // крошечная лягушачья мордочка
            G.ellipse(c, bx, by + r * 0.15, r * 0.5, r * 0.32, { fill: '#5C8A5A', lw: 1.5, seed: 800, stroke: '#1C2E1C' });
            for (const d of [-1, 1]) { c.fillStyle = '#E9F2D0'; c.beginPath(); c.arc(bx + d * r * 0.26, by - r * 0.12, r * 0.13, 0, 7); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(bx + d * r * 0.26, by - r * 0.12, r * 0.06, 0, 7); c.fill(); }
          } else {
            c.fillStyle = '#FFE7A8'; c.beginPath(); c.arc(bx, by, r * 0.2, 0, 7); c.fill();
            glow(c, bx, by, r * 0.9, '255,210,120', 0.6);
          }
        });
      }
      // лопнул: брызги, а звук вылетает над водой
      const pa = t - s.t;
      if (pa >= 0 && pa < 1.6) {
        const x = mx, a = Math.exp(-pa * 2.2);
        ctx.strokeStyle = `rgba(210,235,250,${0.8 * a})`; ctx.lineWidth = 2.5 * k;
        ctx.beginPath(); ctx.ellipse(x, WL, 30 * k + pa * 200 * k, 7 * k + pa * 28 * k, 0, 0, 7); ctx.stroke();
        if (pa < 0.12) glow(ctx, x, WL, 90 * k, '220,240,255', 0.7 * (1 - pa / 0.12));
        if (s.kind === 'frog') {
          for (let i = 0; i < 3; i++) {
            const ra = pa - i * 0.12; if (ra < 0) continue;
            ctx.strokeStyle = `rgba(150,220,150,${0.55 * Math.exp(-ra * 2)})`; ctx.lineWidth = 3 * k;
            ctx.beginPath(); ctx.arc(x, WL - 10 * k, 30 * k + ra * 220 * k, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
          }
        } else {
          const fx = x + pa * 160 * k + Math.sin(pa * 9) * 20 * k, fy = WL - 30 * k - pa * 120 * k;
          ctx.fillStyle = `rgba(255,232,160,${a})`; ctx.beginPath(); ctx.arc(fx, fy, 7 * k, 0, 7); ctx.fill();
          glow(ctx, fx, fy, 70 * k, '255,200,110', 0.7 * a);
        }
      }
    }
  }

  // большой пузырь: растёт у рта, отрывается, плывёт к камере (рисуется в экранных координатах)
  function bigBubble(ctx, t, camY) {
    if (t < ev.blow || t >= ev.pop) return;
    const [px, py] = pos(t);
    const [mx, my] = mouthOf(px, py, 1.7);
    const grow = sm(t, ev.blow + 0.3, ev.release);
    const fly = ease.inOutCubic(r01(t, ev.release, ev.gone + 0.4));
    const shiver = t > ev.gone ? Math.sin(t * 40) * 3 * k * r01(t, ev.gone, ev.pop) : 0;
    const r = lerp(lerp(6, 70, grow) * k, 470 * k, fly) + shiver;
    const x = lerp(mx, W * 0.5, fly), y = lerp(my - camY - lerp(6, 70, grow) * k, H * 0.56, fly);
    bubble(ctx, x, y, r, 1, (c, bx, by, rr) => {
      // внутри - тёплый огонёк, как окно вдалеке, с тёмной фигурой
      const wa = 0.25 + 0.5 * fly;
      c.fillStyle = `rgba(255,200,116,${0.5 * wa})`; c.fillRect(bx + rr * 0.1, by - rr * 0.12, rr * 0.16, rr * 0.13);
      glow(c, bx + rr * 0.18, by - rr * 0.06, rr * 0.4, '255,180,90', 0.25 * wa);
      c.fillStyle = `rgba(10,8,14,${0.7 * wa})`; c.beginPath(); c.ellipse(bx + rr * 0.18, by - rr * 0.02, rr * 0.03, rr * 0.05, 0, 0, 7); c.fill();
    });
  }

  // хлопок у объектива
  function popFx(ctx, t) {
    const pa = t - ev.pop;
    if (pa < 0 || pa > 1.0) return;
    if (pa < 0.07) { ctx.fillStyle = `rgba(225,240,255,${0.75 * (1 - pa / 0.07)})`; ctx.fillRect(0, 0, W, H); }
    const a = Math.exp(-pa * 3.5);
    ctx.strokeStyle = `rgba(210,235,250,${0.7 * a})`; ctx.lineWidth = 6 * k;
    ctx.beginPath(); ctx.arc(W / 2, H * 0.56, 470 * k + pa * 500 * k, 0, 7); ctx.stroke();
    for (let i = 0; i < 26; i++) {
      const ang = U.hash(i, 900) * 6.28, sp = (400 + 700 * U.hash(i, 901)) * k;
      const x = W / 2 + Math.cos(ang) * (470 * k + sp * pa), y = H * 0.56 + Math.sin(ang) * (470 * k + sp * pa) + 200 * k * pa * pa;
      bubble(ctx, x, y, (5 + 10 * U.hash(i, 902)) * k, a);
    }
  }

  // ---------- удар: мордочка прижата к стеклу ----------
  function closeUp(ctx, t) {
    const p = ease.outCubic(r01(t, ev.hit, ev.hit + 0.1));
    const sc = lerp(8.4, 9.6, p);
    ctx.fillStyle = 'rgba(5,10,22,0.7)'; ctx.fillRect(0, 0, W, H);
    puz(ctx, W / 2, H * 0.5, sc, t * 0.3, { pin: 1, puff: 0, headOnly: true });
    // изо рта выходит маленький пузырёк
    const ba = t - ev.hit;
    bubble(ctx, W / 2 + Math.sin(ba * 6) * 12 * k, H * 0.56 - ba * 420 * k, 24 * k);
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
    if (t < ev.endPop) {
      const secs = String(2 + Math.floor(t - ev.title)).padStart(2, '0');
      const dot = Math.floor((t - ev.title) * 2) % 2 === 0 ? '●' : ' ';
      pixelText(ctx, `${dot} REC  ${S.LOG}:${secs}`, W / 2, y, sc, '#C9D2E8');
      // из темноты поднимается пузырёк и лопается прямо на строке журнала
      const p = ease.inQuad(r01(t, ev.title + 0.2, ev.endPop));
      bubble(ctx, W / 2 + Math.sin(t * 4) * 10 * k, lerp(H * 0.92, y, p), 14 * k);
    } else {
      const pa = t - ev.endPop;
      if (pa < 0.5) { ctx.strokeStyle = `rgba(210,235,250,${0.7 * (1 - pa / 0.5)})`; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(W / 2, y, 14 * k + pa * 120 * k, 0, 7); ctx.stroke(); }
      if (Math.floor(t * 6) % 7 !== 0) pixelText(ctx, 'ЗАПИСЬ ПРЕРВАНА', W / 2, y, sc, '#C9D2E8');
    }
    ctx.restore();
  }

  Studio.film({
    draw(ctx, t) {
      const camY = DROP * sm(t, ev.descend, ev.down);
      const z = 1.0 + 0.06 * sm(t, 0, ev.descend) + 0.05 * sm(t, ev.blow, ev.gone);
      const sh = t >= ev.pop && t < ev.pop + 0.5 ? 10 * k * Math.exp(-(t - ev.pop) * 8) : 0;
      ctx.save();
      ctx.translate(W / 2 + U.noise1(t * 30, 1) * sh, H / 2 + U.noise1(t * 30, 2) * sh); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2 - camY);
      ctx.drawImage(Studio.cache('sky', sky), 0, 0, W, H, 0, 0, W, H);
      // Морзе в окне будки
      const on = S.morseOn(t), wx = BOOTH.x, wy = BOOTH.b - 42 * BOOTH.q;
      ctx.fillStyle = on ? '#FFC874' : '#2A2014'; ctx.fillRect(wx - 9 * k, wy - 9 * k, 18 * k, 18 * k);
      if (on) glow(ctx, wx, wy, 70 * k, '255,180,90', 0.6);
      glow(ctx, W * 0.8, H * 0.1, 220 * k, '150,170,220', 0.2);
      // светлячки над водой
      for (let i = 0; i < 6; i++) {
        const fx = W * (0.1 + 0.16 * i) + Math.sin(t * 0.7 + i * 2) * 30 * k, fy = WL - (60 + 120 * U.hash(i, 90)) * k + Math.cos(t * 0.9 + i) * 16 * k;
        const fl = 0.5 + 0.5 * Math.sin(t * 2.3 + i * 1.7);
        ctx.fillStyle = `rgba(255,232,160,${0.5 + 0.5 * fl})`; ctx.beginPath(); ctx.arc(fx, fy, 3.5 * k, 0, 7); ctx.fill();
        glow(ctx, fx, fy, 40 * k, '255,200,110', 0.35 * fl);
      }
      water(ctx, t);
      glow(ctx, PX, WL + 4 * k, 140 * k, '90,200,210', 0.2 + 0.05 * Math.sin(t * 1.3));
      bottom(ctx, t);
      bubbles(ctx, t);
      if (t < ev.pop + 0.6) {
        const [x, y] = pos(t);
        const puff = sm(t, ev.blow, ev.blow + 0.6) * (1 - sm(t, ev.release, ev.release + 0.4));
        puz(ctx, x, y, 1.7, t, { puff, look: Math.sin(t * 0.5) * 0.5 });
      }
      ctx.restore();
      bigBubble(ctx, t, camY);
      popFx(ctx, t);
      if (t >= ev.hit && t < ev.cut) closeUp(ctx, t);
      if (t >= ev.cut) { ctx.fillStyle = '#030408'; ctx.fillRect(0, 0, W, H); }
      const isTitle = (x) => x.text.startsWith('Наблюдение');
      const main = S.subtitles.filter((x) => !isTitle(x) && !x.whisper);
      Subs.draw(ctx, t, main, { style: 'clean', size: Math.round(62 * k), y: H * 0.24, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
      // шёпот - мельче, бледнее, ниже
      Subs.draw(ctx, t, S.subtitles.filter((x) => x.whisper), { style: 'clean', size: Math.round(48 * k), y: H * 0.3, fam: 'Inter', maxW: W * 0.84, x: W * 0.5, color: '#B8C4D6' });
      if (t >= ev.cut) endCard(ctx, t);
      Subs.draw(ctx, t, S.subtitles.filter(isTitle), { style: 'clean', size: Math.round(62 * k), y: H * 0.42, fam: 'Inter', maxW: W * 0.84, x: W * 0.5 });
    },
    post: { paper: 0.35, vignette: 0.5, grain: 0.06 },
  });
})();
