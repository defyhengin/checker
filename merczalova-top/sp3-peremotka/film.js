// «Мерцалова топь» - финальный спецвыпуск «Перемотка». Кадр - чистая функция от t.
// Бумажные части (камера на боку, перемотка, Обманка) - готовые кадры серий из assets/.
// Кассета наблюдателя - честный пиксель-арт 180×320 ×6, как в «Наблюдении №4» и «Архиве».
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev } = S;
  const W = G.W, H = G.H;
  const LW = 180, LH = 320;
  const lc = document.createElement('canvas'); lc.width = LW; lc.height = LH;
  const gReal = lc.getContext('2d');
  let g = gReal;
  const tmp = document.createElement('canvas'); tmp.width = LW; tmp.height = LH;
  const tg = tmp.getContext('2d');
  const IMG = { rw: {}, tr: {} };
  const P = {
    sky0: '#15142F', sky1: '#24244C', sky2: '#3E3660', dusk: '#5E4458', star: '#DCE4FF', moon: '#E8ECDC',
    tree0: '#141A38', tree1: '#0D1128', ink: '#06070D', water0: '#1A2248', water1: '#0C1128', shine: '#8C90BE',
    pad: '#22544C', padD: '#143430', moss: '#2E6050', mossD: '#1C3E36',
    wall0: '#17100C', wall1: '#0E0907', frame: '#2C1F17', frameD: '#1A120D',
    desk: '#3A2A20', deskD: '#281C15', paper: '#D6D0BA', paperD: '#B4AD95', line: '#9BB0C8', pen: '#1D2C66',
    eye: '#FFC86B', rec: '#FF4A3D', hud: '#DCE6F5',
    hair: '#17110D', hairL: '#3E2C20', jacket: '#3A4434', jacketL: '#56604A', jacketD: '#232A20', skin: '#C9A07C',
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const r01 = (t, a, b) => U.clamp((t - a) / (b - a));
  const ease = (x) => x * x * (3 - 2 * x);

  // ---------- пиксельные примитивы ----------
  const tcache = new Map();
  function ptext(text, x, y, color, size = 9, align = 'left') {
    const key = text + '|' + color + '|' + size;
    let c = tcache.get(key);
    if (!c) {
      c = document.createElement('canvas');
      const cx = c.getContext('2d'); cx.font = `bold ${size}px "DejaVu Sans Mono"`;
      c.width = Math.ceil(cx.measureText(text).width) + 2; c.height = size + 4;
      cx.font = `bold ${size}px "DejaVu Sans Mono"`; cx.textBaseline = 'top'; cx.fillStyle = '#fff'; cx.fillText(text, 1, 1);
      const im = cx.getImageData(0, 0, c.width, c.height), d = im.data;
      const [r, gg, b] = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
      for (let i = 0; i < d.length; i += 4) { const on = d[i + 3] > 120; d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = on ? 255 : 0; }
      cx.putImageData(im, 0, 0); tcache.set(key, c);
    }
    const xx = align === 'right' ? x - c.width : align === 'center' ? x - Math.round(c.width / 2) : x;
    g.drawImage(c, Math.round(xx), Math.round(y));
    return c.width;
  }
  const px = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function ellipse(cx, cy, rx, ry, col) {
    for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry)))); px(cx - w, cy + y, w * 2 + 1, 1, col); }
  }
  function dither(x0, y0, w, h, cols, f) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const v = f(x, y) + BAYER[(y0 + y) % 4][(x0 + x) % 4] / 16 - 0.5;
      const i = Math.max(0, Math.min(cols.length - 1, Math.floor(v)));
      g.fillStyle = cols[i]; g.fillRect(x0 + x, y0 + y, 1, 1);
    }
  }
  function grain(t, dens, bright = 0.5) {
    const f = Math.floor(t * S.FPS);
    for (let i = 0; i < dens; i++) {
      const x = Math.floor(U.hash(i, f) * LW), y = Math.floor(U.hash(i + 999, f) * LH), v = Math.floor(U.hash(i, f + 77) * 255 * bright);
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1);
    }
  }
  function scanlines() { g.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < LH; y += 2) g.fillRect(0, y, LW, 1); }
  function snow(t) {
    const f = Math.floor(t * S.FPS);
    for (let y = 0; y < LH; y++) {
      const off = U.hash(y >> 3, f) > 0.8 ? Math.floor((U.hash(y, f) - 0.5) * 40) : 0;
      for (let x = 0; x < LW; x++) { const v = Math.floor(U.hash(x + off, y * 7 + f) * 230); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); }
    }
  }
  const tc = (s) => { s = Math.floor(s); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((v) => String(v).padStart(2, '0')).join(':'); };

  // ---------- комната (кассета) ----------
  const WX = 22, WY = 46, WW = 136, WH = 132;
  const KX = WX + 70, KY = WY + 98;
  const SX = WX + 106, SY = WY + 104;            // силуэт у стекла, нижняя правая створка
  let outside = null, wall = null;
  function buildStatic() {
    const prev = g;
    let c = document.createElement('canvas'); c.width = LW; c.height = LH; g = c.getContext('2d');
    dither(0, 0, LW, LH, [P.wall1, P.wall0], (x) => 1 + 0.6 * Math.sin(x * 0.45));
    for (let x = 6; x < LW; x += 15) px(x, 0, 1, LH, P.wall1);
    wall = c;
    c = document.createElement('canvas'); c.width = LW; c.height = LH; g = c.getContext('2d');
    const hy = WY + 74;
    dither(WX, WY, WW, hy - WY, [P.sky0, P.sky1, P.sky2, P.dusk], (x, y) => (y / (hy - WY)) * 3.3);   // первый вечер: ещё сумерки
    const R = U.mulberry32(11);
    for (let i = 0; i < 12; i++) px(WX + R() * WW, WY + R() * (hy - WY - 34), 1, 1, P.star);
    ellipse(WX + 30, WY + 24, 7, 7, P.moon);
    const spruce = (x, b, h, col) => { for (let i = 0; i < h; i++) { const w = Math.floor((i / h) * h * 0.3) + (i % 5 > 3 ? 1 : 0); px(x - w, b - h + i, w * 2 + 1, 1, col); } };
    for (let i = 0; i < 11; i++) spruce(WX + R() * WW, hy, 22 + R() * 18, P.tree0);
    for (let i = 0; i < 9; i++) spruce(WX + R() * WW, hy + 2, 14 + R() * 12, P.tree1);
    dither(WX, hy, WW, WY + WH - hy, [P.water0, P.water1], (x, y) => (y / (WY + WH - hy)) * 2.2);
    for (let i = 0; i < 6; i++) px(WX + 30 - (7 - i), hy + 3 + i * 4, (7 - i) * 2, 1, P.shine);
    for (const [x, y, rx, ry] of [[WX + 26, WY + 104, 14, 3], [WX + 64, WY + 118, 12, 3], [WX + 40, WY + 126, 18, 4]]) { ellipse(x, y, rx, ry, P.padD); ellipse(x, y - 1, rx - 1, ry - 1, P.pad); }
    // кувшинка у старой ели (ещё просто цветок)
    ellipse(WX + 26, WY + 102, 3, 2, '#8ED8E0'); px(WX + 25, WY + 99, 2, 2, '#C8F0F4');
    ellipse(KX + 34, KY + 8, 22, 6, P.mossD); ellipse(KX + 34, KY + 7, 21, 5, P.moss);
    for (let i = 0; i < 9; i++) { const x = WX + R() * WW; const h = 6 + R() * 10; px(x, hy + 2 - h, 1, h, P.ink); }
    outside = c;
    g = prev;
  }

  function silhouette(t) {
    // маленький, с ушками, у самого стекла. Губы шевелятся на полслова раньше наблюдателя.
    const x = SX, y = SY;
    ellipse(x, y + 18, 13, 10, P.ink);
    ellipse(x, y, 9, 10, P.ink);
    for (const s of [-1, 1]) for (let i = 0; i < 13; i++) px(x + s * (5 + Math.floor(i / 3)) - (s < 0 ? 2 : 0), y - 8 - i, 3, 1, P.ink);
    const blink = U.hash(Math.floor(t * 0.7), 5) > 0.85 && (t * 0.7) % 1 < 0.1;
    if (!blink) { px(x - 5, y - 3, 3, 2, P.eye); px(x + 3, y - 3, 3, 2, P.eye); }
    const o = S.mouthAt(t), h = Math.round(o * 4.4);
    if (h > 0) {
      px(x - 3, y + 3, 7, h, '#5A1620');
      if (h >= 2) px(x - 3, y + 3, 7, 1, '#D8D0C0');
    } else px(x - 2, y + 4, 5, 1, '#1A0C10');
  }

  function firefly(t) {
    if (t < S.FLY0) return;
    // на самой линзе: большое размытое пятно холодного света
    const a = r01(t, S.FLY0, S.FLY0 + 0.8) * (1 - r01(t, S.FLY1 + 0.3, S.FLY1 + 1.2) * 0.75);
    const on = S.flyOn(t);
    const x = 150, y = 70;
    const R0 = on ? 17 : 6, k = on ? 0.85 : 0.35;
    const gr = g.createRadialGradient(x, y, 1, x, y, R0);
    gr.addColorStop(0, `rgba(210,250,255,${k * a})`); gr.addColorStop(0.35, `rgba(90,200,210,${0.7 * k * a})`); gr.addColorStop(1, 'rgba(90,200,210,0)');
    g.fillStyle = gr; g.fillRect(x - R0, y - R0, R0 * 2, R0 * 2);
  }

  function observer(t) {
    const turn = ease(r01(t, ev.turn, ev.turn + 0.45));
    const reach = ease(r01(t, ev.reach, ev.reach + 0.9));
    const bob = Math.round(S.envAt(t) * 1.2);
    const hx = 56 + Math.round(turn * 2), hy = 186 - bob;
    // плечи и куртка
    ellipse(58, 246, 44, 30, P.jacketD);
    ellipse(58, 244, 42, 28, P.jacket);
    for (let i = 0; i < 18; i++) px(22 + i, 236 + Math.floor(i * 0.5), 1, 2, P.jacketL);   // свет лампы слева на плече
    px(49, 214, 15, 6, P.jacketD);                                                      // воротник
    // рука с диктофоном: от правого плеча вверх к лицу, на reach - вниз к столу
    const hx2 = Math.round(82 + 16 * reach), hy2 = Math.round(198 + 18 * reach);
    for (let i = 0; i <= 10; i++) { const k = i / 10; ellipse(Math.round(86 + (hx2 - 86) * k), Math.round(232 + (hy2 + 6 - 232) * k), 3, 3, P.jacket); }
    px(hx2 - 3, hy2 - 9, 6, 11, '#1E2226');                                             // диктофон
    px(hx2 - 2, hy2 - 8, 4, 3, '#3A4048');
    if (Math.floor(t * 2) % 2 === 0 && t < ev.chew) px(hx2 + 1, hy2 - 3, 1, 1, P.rec);
    px(hx2 - 3, hy2 + 1, 6, 4, P.skin);                                                 // пальцы
    if (reach > 0.7) px(hx2 - 1, hy2 - 5, 2, 2, P.skin);                                // палец на кнопке
    // шея и голова со спины
    px(hx - 5, hy + 10, 11, 12, '#2A2018');
    ellipse(hx, hy, 12, 14, P.hair);
    for (let i = 0; i < 10; i++) px(hx - 12 + (i > 6 ? 1 : 0), hy - 5 + i, 2, 1, P.hairL);                     // свет лампы на затылке
    if (turn < 0.5) { px(hx - 13, hy + 1, 2, 4, P.skin); px(hx + 12, hy + 1, 2, 4, P.skin); }                // уши
    else { px(hx - 13, hy + 1, 2, 4, P.skin); px(hx + 9, hy - 1, 4, 8, P.skin); px(hx + 12, hy + 2, 2, 2, P.skin); }   // повернулся вправо: щека и нос
  }

  function cc(t) {
    const c = S.CC.find((s) => t >= s.t && t < s.end);
    if (!c) return;
    const n = c.l.length, h = n * 11 + 5;
    px(WX + 3, WY + 4, WW - 6, h, 'rgba(0,0,0,0.82)');
    c.l.forEach((s, i) => ptext(s, WX + WW / 2, WY + 6 + i * 11, '#FFFFFF', 9, 'center'));
  }

  function room(t) {
    if (!wall) buildStatic();
    g.drawImage(wall, 0, 0);
    g.save(); g.beginPath(); g.rect(WX, WY, WW, WH); g.clip();
    g.drawImage(outside, 0, 0);
    silhouette(t);
    g.restore();
    px(WX - 4, WY - 4, WW + 8, 4, P.frame); px(WX - 4, WY + WH, WW + 8, 5, P.frame);
    px(WX - 4, WY, 4, WH, P.frame); px(WX + WW, WY, 4, WH, P.frame);
    px(WX + WW / 2 - 1, WY, 3, WH, P.frame); px(WX, WY + 66, WW, 3, P.frame);
    px(WX - 4, WY + WH + 5, WW + 8, 1, P.frameD);
    dither(0, 186, LW, LH - 186, [P.desk, P.deskD], (x, y) => 0.8 + y / 60 + 0.3 * Math.sin(x * 0.2 + y * 0.05));
    px(0, 186, LW, 2, '#4A372A');
    // блокнот справа: «кувшинка» и подчёркнуто
    px(104, 196, 62, 40, P.paperD); px(103, 195, 62, 40, P.paper);
    for (let y = 203; y < 233; y += 8) px(105, y + 6, 58, 1, P.line);
    ptext('кувшинка', 107, 199, P.pen, 9); px(107, 210, 44, 1, P.pen);
    ptext('не', 107, 215, P.pen, 9);
    // лампа слева (горит ровно - вечер)
    px(4, 196, 22, 4, P.deskD);
    for (let i = 0; i < 26; i++) px(13 + Math.floor(i * 0.2), 170 + i, 2, 1, '#202020');
    for (let i = 0; i < 9; i++) px(6 + i - Math.floor(i / 2), 164 + i, 18 - i, 1, '#2A2A2E');
    px(9, 172, 8, 2, '#FFE6A8');
    const gr = g.createRadialGradient(14, 176, 2, 14, 176, 120);
    gr.addColorStop(0, 'rgba(255,200,120,0.42)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
    observer(t);
    firefly(t);
    cc(t);
    // HUD
    if (Math.floor(t * 2) % 2 === 0) px(8, 37, 5, 5, P.rec);
    ptext('REC', 16, 34, P.hud, 9);
    ptext(tc(S.tcTape(t)), 172, 34, P.hud, 9, 'right');
    if (t < ev.tape + 1.8) ptext('КАССЕТА 1', 8, 22, P.hud, 9);
    // плёнка нервничает к концу: рваные строки
    const nerv = r01(t, ev.turn, ev.chew);
    const f = Math.floor(t * S.FPS);
    if (U.hash(f, 3) < 0.04 + nerv * 0.3) {
      tg.clearRect(0, 0, LW, LH); tg.drawImage(lc, 0, 0);
      const y0 = Math.floor(U.hash(f, 9) * LH), hh = 3 + Math.floor(U.hash(f, 4) * 8);
      g.drawImage(tmp, 0, y0, LW, hh, Math.floor((U.hash(f, 8) - 0.5) * 16), y0, LW, hh);
    }
    grain(t, 140, 0.35);
    scanlines();
  }

  function chew(t) {
    // плёнку зажёвывает: кадр плывёт, тянется вниз и схлопывается в полосу
    const p = r01(t, ev.chew, ev.black);
    room(ev.chew - 0.001);
    tg.clearRect(0, 0, LW, LH); tg.drawImage(lc, 0, 0);
    g.fillStyle = '#000'; g.fillRect(0, 0, LW, LH);
    const f = Math.floor(t * S.FPS);
    const sq = Math.max(0.02, 1 - ease(r01(p, 0.55, 1)));
    for (let y = 0; y < LH; y++) {
      const sy = Math.min(LH - 1, Math.floor(y * (1 - 0.6 * p) + (U.hash(y >> 2, f) > 0.7 ? 6 : 0)));
      const dx = Math.round(Math.sin(y * 0.08 + t * 40) * 18 * p + (U.hash(y, f) - 0.5) * 10 * p);
      const ty = Math.round(LH / 2 + (y - LH / 2) * sq);
      g.drawImage(tmp, 0, sy, LW, 1, dx, ty, LW, 1);
    }
    if (U.hash(f, 1) > 0.4) px(0, Math.floor(U.hash(f, 2) * LH), LW, 1, '#FFFFFF');
    if (t - ev.chew < 0.07) { g.fillStyle = 'rgba(235,240,255,0.95)'; g.fillRect(0, 0, LW, LH); }   // разрыв плёнки
    scanlines();
  }

  // ---------- бумажные части ----------
  function cover(ctx, img, zoom = 1, cx = W / 2, cy = H / 2, dy = 0) {
    ctx.save(); ctx.translate(cx, cy + dy); ctx.scale(zoom, zoom); ctx.drawImage(img, -cx, -cy, W, H); ctx.restore();
  }
  function rewIcon(ctx, t) {
    if (Math.floor(t * 3) % 3 === 2) return;
    ctx.save(); ctx.fillStyle = '#F2F4FA'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 8;
    const x = 90, y = 300;
    for (const o of [0, 46]) { ctx.beginPath(); ctx.moveTo(x + o + 46, y - 26); ctx.lineTo(x + o, y); ctx.lineTo(x + o + 46, y + 26); ctx.closePath(); ctx.fill(); }
    ctx.font = 'bold 56px "DejaVu Sans Mono"'; ctx.textBaseline = 'middle'; ctx.fillText('REW', x + 160, y + 2);
    ctx.restore();
  }
  function vhs(ctx, t, img, strength) {
    // рваные полосы, дорожка трекинга, сдвиг цвета
    const f = Math.floor(t * S.FPS);
    const roll = Math.sin(t * 2.7) * 24 * strength;
    const barY = H - ((t * 1500) % (H + 400)) + 200;
    const BAND = 48;
    for (let y = 0; y < H; y += BAND) {
      const near = Math.abs(y - barY) < 160;
      const dx = (U.hash(y / BAND, f) - 0.5) * 34 * strength + (near ? (U.hash(y, f + 3) - 0.5) * 160 : 0);
      ctx.drawImage(img, 0, ((y - roll) / H) * img.height, img.width, (BAND / H) * img.height, dx, y, W, BAND);
    }
    ctx.fillStyle = 'rgba(30,50,110,0.14)'; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.12;
    ctx.drawImage(img, 10, 0, W, H); ctx.restore();
    // дорожка
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, barY - 70, W, 140);
    for (let i = 0; i < 70; i++) {
      const yy = barY - 70 + U.hash(i, f) * 140, xx = U.hash(i + 50, f) * W, ww = 30 + U.hash(i + 90, f) * 220;
      ctx.fillStyle = `rgba(235,238,255,${0.25 + U.hash(i, f + 1) * 0.5})`; ctx.fillRect(xx, yy, ww, 3);
    }
  }
  function pixelTruth(ctx, img) {
    // 2 кадра «правды»: тот же кадр, сырой камерой (пиксель)
    tg.imageSmoothingEnabled = true; tg.clearRect(0, 0, LW, LH); tg.drawImage(img, 0, 0, LW, LH);
    const im = tg.getImageData(0, 0, LW, LH), d = im.data;
    for (let i = 0; i < d.length; i += 4) for (let k = 0; k < 3; k++) d[i + k] = Math.round(d[i + k] / 42) * 42;
    tg.putImageData(im, 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, LW, LH, 0, 0, W, H); ctx.restore();
  }

  function paper(ctx, t) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < ev.rew0) {
      // камера из 19-й так и лежит на боку
      const jolt = t >= ev.click ? Math.round(10 * (1 - r01(t, ev.click, ev.click + 0.12))) : 0;
      cover(ctx, IMG.side, 1, W / 2, H / 2, jolt);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, W, H);
      if (t >= ev.click) rewIcon(ctx, t);
      return;
    }
    if (t < ev.rew1) {
      const k = Math.min(S.EPS.length - 1, Math.floor((t - ev.rew0) / S.SLOT));
      const n = S.EPS[k], local = t - ev.rew0 - k * S.SLOT;
      const truth = S.TRUTH.includes(n) && local >= S.SLOT * 0.45 && local < S.SLOT * 0.45 + 2 / S.FPS;
      if (truth) { pixelTruth(ctx, IMG.tr[n]); return; }
      vhs(ctx, t, IMG.rw[n], 1);
      rewIcon(ctx, t);
      return;
    }
    // Обманка: монтаж вернулся
    const z = 1 + 0.035 * r01(t, ev.hit, ev.fade + 0.6);
    cover(ctx, IMG.ob, z, 540, 1152);
    if (t >= ev.ignite) {
      // новый огонёк - ещё не умеет мигать ровно
      const q = Math.floor((t - ev.ignite) / 0.11);
      const grow = r01(t, ev.ignite, ev.ignite + 0.5);
      const on = q < 2 ? 1 : (U.hash(q, 31) > 0.38 ? 1 : 0.25);
      const x = 540 + (628 - 540) * z, y = 1152 + (1036 - 1152) * z;
      const R0 = 74 * grow, a = on * grow;
      const gr = ctx.createRadialGradient(x, y, 1, x, y, R0);
      gr.addColorStop(0, `rgba(255,240,200,${a})`); gr.addColorStop(0.2, `rgba(255,200,116,${0.8 * a})`); gr.addColorStop(1, 'rgba(255,200,116,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - R0, y - R0, R0 * 2, R0 * 2);
    }
    const fo = r01(t, ev.fade, ev.rec);
    if (fo > 0) { ctx.fillStyle = `rgba(0,0,0,${fo})`; ctx.fillRect(0, 0, W, H); }
  }

  // ---------- пиксельные части ----------
  function pixel(t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, LW, LH);
    if (t < ev.tape) { snow(t); scanlines(); return; }
    if (t < ev.chew - 1e-4) { room(t); return; }
    if (t < ev.black) { chew(t); return; }
    if (t < ev.hit) {
      // чёрный экран. Еле слышно - и еле видно.
      if (t >= ev.wh1 && t < ev.wh2 + 1.3) {
        const w1 = ptext('это я.', LW / 2 - 22, 156, '#3C404A', 9, 'center');
        if (t >= ev.wh2) ptext('открой.', LW / 2 + 22, 156, '#3C404A', 9, 'center');
      }
      return;
    }
    // журнал
    if (t < ev.ended) {
      if (Math.floor(t * 2) % 2 === 0) px(46, 153, 5, 5, P.rec);
      ptext('REC ' + tc(S.TC_END + (t - ev.rec)), 55, 150, P.hud, 11);
    } else if (t < ev.again) {
      if (Math.floor(t * 6) % 9 !== 0) ptext('ЗАПИСЬ ОКОНЧЕНА', LW / 2, 150, '#E6ECF8', 11, 'center');
    } else {
      if (Math.floor((t - ev.again) * 2) % 2 === 0) px(46, 153, 5, 5, P.rec);
      ptext('REC ' + tc(1 + (t - ev.again)), 55, 150, P.hud, 11);
    }
    scanlines();
  }

  const isPaper = (t) => t < ev.stop || (t >= ev.hit && t < ev.rec);

  Studio.film({
    async init() {
      await document.fonts.load('bold 9px "DejaVu Sans Mono"');
      const jobs = [];
      for (let n = 1; n <= 19; n++) {
        jobs.push(Studio.loadImage(`assets/rw${n}.jpg`).then((im) => { IMG.rw[n] = im; }));
        if (S.TRUTH.includes(n)) jobs.push(Studio.loadImage(`assets/tr${n}.jpg`).then((im) => { IMG.tr[n] = im; }));
      }
      jobs.push(Studio.loadImage('assets/side.jpg').then((im) => { IMG.side = im; }));
      jobs.push(Studio.loadImage('assets/obmanka.jpg').then((im) => { IMG.ob = im; }));
      await Promise.all(jobs);
    },
    draw(ctx, t) {
      if (isPaper(t)) { paper(ctx, t); return; }
      g = gReal;
      pixel(t);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(lc, 0, 0, LW, LH, 0, 0, W, H); ctx.restore();
    },
    post: { paper: 0, vignette: 0.22, grain: 0 },
  });
})();
