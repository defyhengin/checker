// «Мерцалова топь» - спецвыпуск «Архив». Пиксель-арт 180×320 ×6, кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev } = S;
  const W = G.W, H = G.H;
  const LW = 180, LH = 320;
  const lc = document.createElement('canvas'); lc.width = LW; lc.height = LH;
  let g = lc.getContext('2d');
  const P = {
    sky0: '#0B0E28', sky1: '#161E42', sky2: '#26325C', star: '#DCE4FF', moon: '#E8ECDC',
    tree0: '#141E3E', tree1: '#0D132A', ink: '#06080F', water0: '#142046', water1: '#0A1026', shine: '#788CBE',
    pad: '#22544C', padD: '#143430', glow: '#5AC8D2', warm: '#FFC874',
    wall0: '#150F0C', wall1: '#0D0907', frame: '#2C1F17', frameD: '#1A120D',
    desk: '#3A2A20', deskD: '#281C15', paper: '#D6D0BA', paperD: '#9C9480',
    bez: '#1C1C22', bezL: '#2C2C34', ui: '#1A2030', uiL: '#2E3A56', hud: '#DCE6F5', rec: '#FF4A3D', eye: '#FFC86B',
    chair: '#100C0B', chairL: '#221A16', fur: '#16161C', claw: '#C9BFA0', refl: '#B8C0D0',
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const r01 = (t, a, b) => U.clamp((t - a) / (b - a));
  const ease = (x) => x * x * (3 - 2 * x);

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
  function offscreen(draw) {
    const c = document.createElement('canvas'); c.width = LW; c.height = LH; const prev = g; g = c.getContext('2d'); draw(); g = prev; return c;
  }

  // ---------- геометрия ----------
  const WX = 106, WY = 46, WW = 64, WH = 58;          // окно
  const MX = 10, MY = 108, MW = 136, MH = 84;         // монитор (внешний край рамки)
  const SX = MX + 3, SY = MY + 3, SW = MW - 6, SH = MH - 6;   // экран
  const VX = SX + 2, VY = SY + 2, VW = SW - 4, VH = 36;      // окошко видео
  const DESK = 194;

  // ---------- статичный фон ----------
  let bg = null;
  function buildBg() {
    bg = offscreen(() => {
      dither(0, 0, LW, LH, [P.wall1, P.wall0], (x) => 1 + 0.6 * Math.sin(x * 0.45));
      for (let x = 6; x < LW; x += 15) px(x, 0, 1, LH, P.wall1);
      // листки журнала, приколотые к стене
      for (const [x, y, w, h, tilt] of [[12, 48, 26, 34, 0], [44, 54, 22, 28, 1], [20, 86, 30, 16, 0]]) {
        px(x + 1, y + 1, w, h, '#050403'); px(x, y, w, h, P.paperD);
        for (let yy = y + 5; yy < y + h - 3; yy += 4) px(x + 3, yy + (tilt && yy % 8 ? 1 : 0), w - 7 - ((yy * 7) % 6), 1, '#6E6858');
        px(x + w / 2, y + 1, 2, 2, '#7A2A22');
      }
      // окно
      const hy = WY + 34;
      dither(WX, WY, WW, hy - WY, [P.sky0, P.sky1, P.sky2], (x, y) => (y / (hy - WY)) * 2.4);
      const R = U.mulberry32(17);
      for (let i = 0; i < 12; i++) px(WX + R() * WW, WY + R() * (hy - WY - 10), 1, 1, P.star);
      ellipse(WX + 46, WY + 11, 5, 5, P.moon);
      const spruce = (x, b, h, col) => { for (let i = 0; i < h; i++) { const w = Math.floor((i / h) * h * 0.3) + (i % 5 > 3 ? 1 : 0); px(x - w, b - h + i, w * 2 + 1, 1, col); } };
      for (let i = 0; i < 7; i++) spruce(WX + R() * WW, hy, 12 + R() * 12, P.tree0);
      dither(WX, hy, WW, WY + WH - hy, [P.water0, P.water1], (x, y) => (y / (WY + WH - hy)) * 2.2);
      for (let i = 0; i < 4; i++) px(WX + 46 - (4 - i), hy + 2 + i * 4, (4 - i) * 2, 1, P.shine);
      ellipse(WX + 18, WY + 48, 9, 2, P.padD); ellipse(WX + 18, WY + 47, 8, 1, P.pad);
      // рама окна
      px(WX - 3, WY - 3, WW + 6, 3, P.frame); px(WX - 3, WY + WH, WW + 6, 4, P.frame);
      px(WX - 3, WY, 3, WH, P.frame); px(WX + WW, WY, 3, WH, P.frame);
      px(WX + WW / 2 - 1, WY, 2, WH, P.frame); px(WX, WY + 28, WW, 2, P.frame);
      // стол
      dither(0, DESK, LW, LH - DESK, [P.desk, P.deskD], (x, y) => 0.8 + y / 60 + 0.3 * Math.sin(x * 0.2 + y * 0.05));
      px(0, DESK, LW, 2, '#4A372A');
      // подставка монитора
      px(MX + MW / 2 - 6, MY + MH, 12, DESK - MY - MH + 2, '#141418'); px(MX + MW / 2 - 16, DESK - 1, 32, 3, '#141418');
      // рамка монитора
      px(MX, MY, MW, MH, P.bez); px(MX, MY, MW, 1, P.bezL); px(MX, MY, 1, MH, P.bezL);
      px(MX + MW - 6, MY + MH - 2, 2, 1, '#3AE07A');
      // клавиатура и мышь
      px(28, DESK + 8, 82, 9, '#18181E'); for (let r = 0; r < 3; r++) for (let k = 0; k < 13; k++) px(30 + k * 6, DESK + 9 + r * 3, 5, 2, '#26262E');
      ellipse(122, DESK + 13, 4, 3, '#1A1A20');
      // кружка
      px(4, DESK - 9, 7, 10, '#3A4A5A'); px(11, DESK - 7, 2, 5, '#3A4A5A');
      // лампа справа (смотрит в окно)
      px(150, DESK - 3, 24, 4, '#1C1C20'); px(158, DESK - 6, 6, 3, '#2A2A30');
      for (let i = 0; i < 26; i++) px(162 - Math.floor(i * 0.25), DESK - 6 - i, 2, 1, '#202024');
      for (let i = 0; i < 8; i++) px(150 + i, DESK - 38 + i, 12 - i, 1, '#2A2A2E');
      // спинка пустого стула на переднем плане
      const rr = (x, y, w, h, r, col) => { for (let yy = 0; yy < h; yy++) { const d = yy < r ? r - Math.round(Math.sqrt(r * r - (r - yy) * (r - yy))) : yy > h - r ? r - Math.round(Math.sqrt(Math.max(0, r * r - (yy - h + r) * (yy - h + r)))) : 0; px(x + d, y + yy, w - 2 * d, 1, col); } };
      rr(52, 222, 76, 58, 12, P.chairL); rr(54, 224, 72, 55, 11, P.chair);
      for (let y = 230; y < 274; y += 6) px(60, y, 60, 1, '#0B0807');
      px(76, 279, 28, 6, P.chair); px(86, 285, 8, 35, P.chair); px(87, 285, 1, 35, P.chairL);
    });
  }

  // ---------- то, что на мониторе ----------
  function videoFrame(t, lt) {
    // пиксельная 1-я серия: небо, вода, кувшинка, светлячки
    dither(VX, VY, VW, 22, [P.sky0, P.sky1, P.sky2], (x, y) => (y / 22) * 2.4);
    dither(VX, VY + 22, VW, VH - 22, [P.water0, P.water1], (x, y) => (y / (VH - 22)) * 2.2);
    for (let i = 0; i < 8; i++) px(VX + U.hash(i, 3) * VW, VY + U.hash(i, 9) * 18, 1, 1, P.star);
    for (let i = 0; i < 9; i++) { const x = VX + 4 + i * 15; for (let k = 0; k < 9; k++) px(x - Math.floor(k / 3), VY + 13 + k, Math.floor(k / 3) * 2 + 1, 1, P.tree1); }
    const kx = VX + VW / 2, ky = VY + 30;
    const pulse = 0.6 + 0.4 * Math.sin(lt * 2.2);
    g.save(); g.globalAlpha = 0.35 * pulse; ellipse(kx, ky - 1, 12, 5, P.glow); g.restore();
    ellipse(kx, ky + 1, 9, 2, P.padD); ellipse(kx, ky, 8, 1, P.pad);
    ellipse(kx, ky - 3, 3, 2, '#DFF6F8'); px(kx - 1, ky - 6, 3, 2, '#DFF6F8');
    for (let i = 0; i < 7; i++) {
      const a = lt * (0.5 + i * 0.07) + i * 0.9, rr = 30 - Math.min(20, lt * 1.2) * (i % 3) / 3;
      const fx = kx + Math.cos(a) * rr, fy = ky - 8 + Math.sin(a * 1.3) * 6;
      if (fx > VX && fx < VX + VW - 1) px(fx, fy, 1, 1, P.warm);
    }
  }
  function monitor(t) {
    const playing = t >= ev.play && t < ev.exp0;
    const lt = Math.max(0, Math.min(t, ev.exp0) - ev.play);
    px(SX, SY, SW, SH, P.ui);
    // окошко видео
    if (t >= ev.glitch && t < ev.glitch + 0.1) { px(VX, VY, VW, VH, '#000'); reflection(t, 0.2, true); }
    else videoFrame(t, lt);
    if (!playing && t < ev.play) { // пауза: значок «плей»
      for (let i = 0; i < 9; i++) px(VX + VW / 2 - 3, VY + 16 + i, Math.min(i, 8 - i) + 1, 1, '#FFFFFF');
    }
    // субтитры серии
    let sub = null; for (const s of S.msubs) if (t >= s.t && t < s.end) sub = s;
    if (sub) { ptext(sub.l[0], SX + SW / 2, VY + VH, '#FFFFFF', 9, 'center'); ptext(sub.l[1], SX + SW / 2, VY + VH + 10, '#FFFFFF', 9, 'center'); }
    // таймлайн монтажки
    const ty = SY + SH - 15;
    px(SX, ty - 1, SW, 1, P.uiL);
    const R = U.mulberry32(9);
    let x = SX + 2;
    while (x < SX + SW - 4) { const w = 8 + Math.floor(R() * 16); px(x, ty + 1, w - 1, 5, R() > 0.5 ? '#3E6E8A' : '#4C5E9A'); x += w; }
    for (let i = 0; i < SW - 4; i += 2) { const h = 1 + Math.floor(U.hash(i, 5) * 4 * (0.4 + 0.6 * Math.abs(Math.sin(i * 0.11)))); px(SX + 2 + i, ty + 10 - Math.floor(h / 2), 1, h, '#5AC88A'); }
    const phAt = (tt) => SX + 2 + (SW - 6) * (0.06 + 0.86 * r01(tt, ev.play, ev.exp0));
    // каждая вспышка лампы ложится на дорожку видео меткой - он вшивает сигнал в серию
    for (const [a, b] of S.FLASH) if (t >= a) { const x0 = Math.round(phAt(a)), x1 = Math.max(x0 + 1, Math.round(phAt(Math.min(t, b)))); px(x0, ty + 1, x1 - x0, 5, P.warm); }
    const ph = phAt(t);
    px(ph, ty - 2, 1, 15, P.rec); px(ph - 1, ty - 3, 3, 1, P.rec);
    // экспорт
    if (t >= ev.exp0) {
      const bx = SX + 12, by = SY + 10, bw = SW - 24, bh = 52;
      px(bx + 2, by + 2, bw, bh, '#05070C'); px(bx, by, bw, bh, '#242C40'); px(bx, by, bw, 12, '#3A4666');
      ptext('ЭКСПОРТ', bx + 4, by + 1, '#FFFFFF', 9);
      px(bx + 4, by + 16, bw - 8, 13, '#0E121C');
      let s = ''; for (const L of S.TYPE) if (t >= L.t) s += L.ch;
      const w = ptext(s, bx + 6, by + 17, '#DCE6F5', 9);
      if (t < ev.bar0 && Math.floor(t * 3) % 2 === 0) px(bx + 6 + w, by + 18, 1, 9, '#DCE6F5');
      px(bx + 4, by + 33, bw - 8, 6, '#0E121C');
      const p = r01(t, ev.bar0, ev.bar1);
      if (p > 0) px(bx + 5, by + 34, Math.round((bw - 10) * p), 4, '#5AC8D2');
      if (t >= ev.done) ptext('ГОТОВО', bx + bw / 2, by + 40, '#5AC88A', 9, 'center');
    }
  }
  // отражение в тёмном экране: тот, кто стоит за камерой
  function reflection(t, alpha, clip) {
    const turn = ease(r01(t, ev.turn0, ev.turn1));
    g.save(); g.globalAlpha = alpha;
    g.beginPath(); if (clip) g.rect(VX, VY, VW, VH); else g.rect(SX, SY, SW, SH); g.clip();
    const hx = SX + 86, hy = SY + 32;
    // куртка с капюшоном
    ellipse(hx, hy + 40, 34, 16, P.refl);
    px(hx - 1, hy + 26, 2, 30, '#5A6070');                         // молния
    ellipse(hx, hy + 2, 13, 14, P.refl);                            // капюшон
    // уши прорвали капюшон
    for (const s of [-1, 1]) for (let i = 0; i < 20; i++) {
      const w = Math.max(1, Math.round(7 * (1 - i / 20))), cx = hx + s * (6 + Math.floor(i * 0.45)) - Math.round(turn * 2);
      px(cx - Math.floor(w / 2), hy - 8 - i, w, 1, P.refl);
    }
    // лицо поворачивается: сначала затылок, потом тёмный овал лица выезжает в центр
    if (turn > 0.05) {
      const fx = hx + Math.round(12 * (1 - turn)) - 2;
      g.globalAlpha = alpha * 1.4; ellipse(fx, hy + 3, Math.round(4 + 4 * turn), 8, '#0A0C14'); g.globalAlpha = alpha;
    }
    g.restore();
    if (turn > 0.85 && !clip) {   // глаза светятся по-настоящему, без прозрачности
      const fx = hx + Math.round(12 * (1 - turn)) - 2;
      const blink = t > ev.turn1 + 0.45 && t < ev.turn1 + 0.52;
      if (!blink) { px(fx - 4, hy + 1, 2, 2, P.eye); px(fx + 3, hy + 1, 2, 2, P.eye); }
    }
  }

  function paw(t) {
    if (t < ev.paw || t > ev.pawGone + 0.5) return;
    const inn = ease(r01(t, ev.paw, ev.paw + 0.5)) * (1 - ease(r01(t, ev.pawGone, ev.pawGone + 0.5)));
    const press = S.lampOn(t) ? 1 : 0;
    const x = Math.round(LW - 30 * inn), y = DESK - 6 + press;
    px(x + 7, y - 5, 34, 10, P.fur);
    for (let i = 0; i < 34; i += 2) px(x + 8 + i, y - 6 - ((i * 3) % 3 ? 1 : 0), 1, 2, P.fur);
    ellipse(x + 5, y, 7, 6, P.fur);
    const rim = S.lampOn(t) ? '#8A6A40' : '#2A2A34';
    for (let i = 0; i < 34; i += 2) px(x + 8 + i, y - 6, 1, 1, rim);
    ellipse(x + 5, y - 5, 4, 0, rim);
    for (const dy of [-4, 0, 4]) { px(x - 5, y + dy, 5, 1, P.claw); px(x - 6, y + dy + 1, 1, 1, P.claw); }
  }

  function hud(t) {
    if (Math.floor(t * 2) % 2 === 0) px(8, 37, 5, 5, P.rec);
    ptext('REC', 16, 34, P.hud, 9);
    ptext('CAM-2', 16, 300, P.hud, 7);
    const s = Math.floor(S.tcAt(t));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0'), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
    ptext(`${hh}:${mm}:${ss}`, 172, 34, P.hud, 9, 'right');
  }
  function grain(t, dens, bright = 0.5) {
    const f = Math.floor(t * S.FPS);
    for (let i = 0; i < dens; i++) {
      const x = Math.floor(U.hash(i, f) * LW), y = Math.floor(U.hash(i + 999, f) * LH), v = Math.floor(U.hash(i, f + 77) * 255 * bright);
      g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1);
    }
  }
  function scanlines() { g.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < LH; y += 2) g.fillRect(0, y, LW, 1); }

  function room(t) {
    if (!bg) buildBg();
    const lamp = S.lampOn(t);
    const dark = t >= ev.dark;
    g.drawImage(bg, 0, 0);
    if (!dark) monitor(t);
    else {
      px(SX, SY, SW, SH, '#020306');
      px(SX + 4, SY + 3, 20, 1, '#141A26');   // блик на стекле
    }
    // свет монитора на стол и стул
    if (!dark) {
      const gr = g.createRadialGradient(MX + MW / 2, MY + MH / 2, 10, MX + MW / 2, MY + MH / 2, 150);
      gr.addColorStop(0, 'rgba(120,160,230,0.16)'); gr.addColorStop(1, 'rgba(120,160,230,0)');
      g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
    } else { g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(0, 0, LW, LH); }
    // лампа
    if (lamp) {
      px(151, DESK - 32, 9, 2, '#FFE6A8');
      const gr = g.createRadialGradient(156, DESK - 30, 2, 156, DESK - 30, 120);
      gr.addColorStop(0, 'rgba(255,200,120,0.5)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
      g.fillStyle = 'rgba(255,220,150,0.25)'; g.fillRect(WX, WY, WW, WH);
    }
    paw(t);
    if (dark) { // отражение поверх затемнения - чтобы читалось
      reflection(t, 0.32 * r01(t, ev.dark + 0.2, ev.dark + 1.2));
    }
    hud(t);
    grain(t, 140, 0.35);
    scanlines();
  }

  function screen(t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, LW, LH);
    if (t < ev.cam) {
      ptext('АРХИВ', LW / 2, 140, '#E6ECF8', 15, 'center');
      if (Math.floor(t * 2) % 2 === 0) px(52, 166, 5, 5, P.rec);
      ptext('REC  03:17:40', 60, 163, P.hud, 9);
      grain(t, 60, 0.3); scanlines();
      return;
    }
    if (t < ev.hit) { room(t); return; }
    if (t < ev.cut) {
      const f = Math.floor(t * S.FPS);
      for (let y = 0; y < LH; y++) {
        const off = U.hash(y >> 3, f) > 0.8 ? Math.floor((U.hash(y, f) - 0.5) * 40) : 0;
        for (let x = 0; x < LW; x += 1) { const v = Math.floor(U.hash(x + off, y * 7 + f) * 230); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, y, 1, 1); }
      }
      return;
    }
    if (t < ev.next) {
      if (Math.floor(t * 6) % 7 !== 0) ptext('ЗАПИСЬ ПРЕРВАНА', LW / 2, 150, '#E6ECF8', 11, 'center');
      scanlines(); return;
    }
    ptext('СЛЕДУЮЩАЯ ЗАПИСЬ:', LW / 2, 140, P.hud, 9, 'center');
    ptext('03:23', LW / 2, 156, '#FFFFFF', 14, 'center');
    scanlines();
  }

  const gReal = g;
  Studio.film({
    async init() { await document.fonts.load('bold 9px "DejaVu Sans Mono"'); },
    draw(ctx, t) {
      g = gReal;
      screen(t);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(lc, 0, 0, LW, LH, 0, 0, W, H); ctx.restore();
    },
    post: { paper: 0, vignette: 0.25, grain: 0 },
  });
})();
