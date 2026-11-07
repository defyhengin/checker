// «Мерцалова топь» - спецвыпуск «Наблюдение №4». Честный пиксель-арт 180×320 ×6, кадр - чистая функция от t.
(function () {
  const U = globalThis.U, G = globalThis.G, S = globalThis.SCORE, Studio = globalThis.Studio;
  const { ev } = S;
  const W = G.W, H = G.H;
  const LW = 180, LH = 320, SC = W / LW;
  const lc = document.createElement('canvas'); lc.width = LW; lc.height = LH;
  let g = lc.getContext('2d');
  const P = {
    sky0: '#0B0E28', sky1: '#161E42', sky2: '#26325C', star: '#DCE4FF', moon: '#E8ECDC',
    tree0: '#141E3E', tree1: '#0D132A', ink: '#06080F', water0: '#142046', water1: '#0A1026', shine: '#788CBE',
    pad: '#22544C', padD: '#143430', moss: '#2E6050', mossD: '#1C3E36',
    wall0: '#150F0C', wall1: '#0D0907', frame: '#2C1F17', frameD: '#1A120D',
    desk: '#3A2A20', deskD: '#281C15', paper: '#D6D0BA', paperD: '#B4AD95', line: '#9BB0C8', pen: '#1D2C66',
    eye: '#FFC86B', rec: '#FF4A3D', hud: '#DCE6F5',
  };
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const r01 = (t, a, b) => U.clamp((t - a) / (b - a));

  // ---------- пиксельный текст (порог по альфе, без сглаживания) ----------
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

  // ---------- вид из окна (кэш статичного фона) ----------
  const WX = 22, WY = 46, WW = 136, WH = 132;   // окно
  const KX = WX + 70, KY = WY + 98;              // кочка
  let outside = null;

  // ---------- кадр ----------
  function figure(t) {
    if (t < ev.figure || t >= ev.figureGone) return;
    const x = KX - 2, y = KY - 3;
    ellipse(x, y - 8, 6, 9, P.ink);
    for (const s of [-1, 1]) { for (let i = 0; i < 9; i++) px(x + s * (4 + Math.floor(i / 2)) - (s < 0 ? 2 : 0), y - 15 - i, 3, 1, P.ink); }
    const blink = (t * 1.3) % 4 < 0.12;
    if (!blink) { px(x - 3, y - 11, 2, 2, P.eye); px(x + 2, y - 11, 2, 2, P.eye); }
  }
  function reflection(t, lamp) {
    // отражение наблюдателя в стекле: голова и плечи слева внизу окна
    let a = lamp ? 0.32 : 0.07;
    if (t >= ev.cc) a = 0.3;
    g.save(); g.globalAlpha = a;
    const hx = WX + 34, hy = WY + 66;
    const turn = r01(t, ev.creak, ev.creak + 0.4);           // на скрип голова поворачивается к двери
    const back = r01(t, ev.cc + 0.4, ev.cc + 1.6);            // на «это я» - медленно к камере
    const ox = Math.round(-5 * turn * (1 - back) + 3 * back);
    ellipse(hx + ox, hy, 8, 10, '#C8CCD8');
    px(hx - 3, hy + 9, 7, 5, '#C8CCD8');
    ellipse(hx, hy + 24, 20, 8, '#C8CCD8');
    if (turn > 0.5 && back < 0.5) px(hx + ox - 9, hy + 1, 2, 2, '#C8CCD8');   // нос в профиль
    if (back > 0.6) { px(hx - 3, hy - 1, 2, 1, '#06080F'); px(hx + 2, hy - 1, 2, 1, '#06080F'); }   // смотрит в камеру
    g.restore();
  }
  function notepad(t) {
    px(36, 194, 108, 54, P.paperD); px(35, 193, 108, 54, P.paper);
    for (let y = 202; y < 246; y += 9) px(37, y + 8, 104, 1, P.line);
    // «НЕ ВЕРЬ» - буква за буквой по мере расшифровки, потом быстро «ГОЛОСУ»
    let s1 = ''; for (const L of S.LETTER_DONE) if (t >= L.t) s1 += L.ch;
    let s2 = ''; for (const L of S.SCRIBBLE) if (t >= L.t) s2 += L.ch;
    let endX = 42;
    if (s1) endX = 42 + ptext(s1, 42, 199, P.pen, 11);
    if (s2) endX = 42 + ptext(s2, 42, 219, P.pen, 11);
    if (t >= S.SCRIBBLE[S.SCRIBBLE.length - 1].t + 0.18) { px(41, 233, 60, 1, P.pen); px(43, 235, 56, 1, P.pen); }
    // ручка у последней буквы
    const writing = (t > ev.morse0 && t < ev.silence);
    if (writing) {
      const py = s2 ? 222 : 202;
      for (let i = 0; i < 14; i++) px(endX + 1 + i, py + 8 + Math.floor(i * 0.9), 2, 1, i < 2 ? '#C9C2AE' : '#30303A');
    }
  }
  function lampProp(on) {
    // настольная лампа слева
    px(4, 196, 22, 4, P.deskD);
    for (let i = 0; i < 26; i++) px(13 + Math.floor(i * 0.2), 170 + i, 2, 1, '#202020');
    for (let i = 0; i < 9; i++) px(6 + i - Math.floor(i / 2), 164 + i, 18 - i * 1, 1, '#2A2A2E');
    if (on) { px(9, 172, 8, 2, '#FFE6A8'); }
  }
  function hud(t) {
    if (Math.floor(t * 2) % 2 === 0) { px(8, 37, 5, 5, P.rec); }
    ptext('REC', 16, 34, P.hud, 9);
    const s = Math.floor(S.tcAt(t));
    const hh = String(Math.floor(s / 3600)).padStart(2, '0'), mm = String(Math.floor(s / 60) % 60).padStart(2, '0'), ss = String(s % 60).padStart(2, '0');
    ptext(`${hh}:${mm}:${ss}`, 172, 34, P.hud, 9, 'right');
  }
  function cc(t) {
    if (t < ev.cc) return;
    const n = Math.floor((t - ev.cc) * 16);
    const full = S.CC.slice(0, n);
    const parts = full.split(': ');
    px(WX + 4, WY + WH - 30, WW - 8, 26, 'rgba(0,0,0,0.85)');
    ptext(parts[0] + (parts.length > 1 ? ':' : ''), WX + 8, WY + WH - 28, '#FFFFFF', 9);
    if (parts[1]) ptext(parts[1], WX + 8, WY + WH - 16, '#FFFFFF', 9);
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
    const lamp = S.lampOn(t);
    // стена
    if (!room.wall) {
      const c = document.createElement('canvas'); c.width = LW; c.height = LH; const prev = g; g = c.getContext('2d');
      dither(0, 0, LW, LH, [P.wall1, P.wall0], (x, y) => 1 + 0.6 * Math.sin(x * 0.45));
      for (let x = 6; x < LW; x += 15) px(x, 0, 1, LH, P.wall1);
      g = prev; room.wall = c;
    }
    g.drawImage(room.wall, 0, 0);
    // окно: вид наружу
    if (!outside) {
      const c = document.createElement('canvas'); c.width = LW; c.height = LH; const prev = g; g = c.getContext('2d');
      const hy = WY + 74;
      dither(WX, WY, WW, hy - WY, [P.sky0, P.sky1, P.sky2], (x, y) => (y / (hy - WY)) * 2.4);
      const R = U.mulberry32(7);
      for (let i = 0; i < 26; i++) px(WX + R() * WW, WY + R() * (hy - WY - 20), 1, 1, P.star);
      ellipse(WX + 104, WY + 20, 8, 8, P.moon);
      const spruce = (x, b, h, col) => { for (let i = 0; i < h; i++) { const w = Math.floor((i / h) * h * 0.3) + (i % 5 > 3 ? 1 : 0); px(x - w, b - h + i, w * 2 + 1, 1, col); } };
      for (let i = 0; i < 11; i++) spruce(WX + R() * WW, hy, 22 + R() * 18, P.tree0);
      for (let i = 0; i < 9; i++) spruce(WX + R() * WW, hy + 2, 14 + R() * 12, P.tree1);
      dither(WX, hy, WW, WY + WH - hy, [P.water0, P.water1], (x, y) => (y / (WY + WH - hy)) * 2.2);
      for (let i = 0; i < 6; i++) px(WX + 104 - (7 - i), hy + 3 + i * 4, (7 - i) * 2, 1, P.shine);
      for (const [x, y, rx, ry] of [[WX + 26, WY + 104, 14, 3], [WX + 112, WY + 112, 12, 3], [WX + 40, WY + 124, 18, 4]]) { ellipse(x, y, rx, ry, P.padD); ellipse(x, y - 1, rx - 1, ry - 1, P.pad); }
      ellipse(KX, KY, 22, 6, P.mossD); ellipse(KX, KY - 1, 21, 5, P.moss);
      for (let i = 0; i < 9; i++) { const x = WX + R() * WW; const h = 6 + R() * 10; px(x, hy + 2 - h, 1, h, P.ink); }
      g = prev; outside = c;
    }
    g.save(); g.beginPath(); g.rect(WX, WY, WW, WH); g.clip();
    g.drawImage(outside, 0, 0);
    figure(t);
    if (lamp) { g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(WX, WY, WW, WH); }
    reflection(t, lamp);
    g.restore();
    // рама и переплёт
    px(WX - 4, WY - 4, WW + 8, 4, P.frame); px(WX - 4, WY + WH, WW + 8, 5, P.frame);
    px(WX - 4, WY, 4, WH, P.frame); px(WX + WW, WY, 4, WH, P.frame);
    px(WX + WW / 2 - 1, WY, 3, WH, P.frame); px(WX, WY + 66, WW, 3, P.frame);
    px(WX - 4, WY + WH + 5, WW + 8, 1, P.frameD);
    // стол
    dither(0, 186, LW, LH - 186, [P.desk, P.deskD], (x, y) => 0.8 + y / 60 + 0.3 * Math.sin(x * 0.2 + y * 0.05));
    px(0, 186, LW, 2, '#4A372A');
    lampProp(lamp);
    notepad(t);
    // свет лампы на стене и столе
    if (lamp) {
      const gr = g.createRadialGradient(14, 176, 2, 14, 176, 110);
      gr.addColorStop(0, 'rgba(255,200,120,0.45)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
      g.fillStyle = gr; g.fillRect(0, 0, LW, LH);
    }
    cc(t);
    hud(t);
    grain(t, 140, 0.35);
    scanlines();
  }

  function screen(t) {
    g.fillStyle = '#000'; g.fillRect(0, 0, LW, LH);
    if (t < ev.cam) {
      { // «№» собираем вручную: в пиксельном шрифте он ломается
        const w1 = ptext('НАБЛЮДЕНИЕ', 26, 142, '#E6ECF8', 13);
        const nx = 26 + w1 + 6; ptext('N', nx, 142, '#E6ECF8', 13);
        px(nx + 10, 146, 4, 1, '#E6ECF8'); px(nx + 9, 147, 1, 3, '#E6ECF8'); px(nx + 14, 147, 1, 3, '#E6ECF8'); px(nx + 10, 150, 4, 1, '#E6ECF8'); px(nx + 9, 153, 6, 1, '#E6ECF8');
        ptext('4', nx + 19, 142, '#E6ECF8', 13);
      }
      if (Math.floor(t * 2) % 2 === 0) px(52, 166, 5, 5, P.rec);
      ptext('REC  03:11:54', 60, 163, P.hud, 9);
      grain(t, 60, 0.3); scanlines();
      return;
    }
    if (t < ev.hit) { room(t); return; }
    if (t < ev.cut) {
      // помехи: снег и рваные полосы
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
    ptext('03:12', LW / 2, 156, '#FFFFFF', 14, 'center');
    scanlines();
  }

  let gReal = g;
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
