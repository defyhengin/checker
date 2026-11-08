// Карточка бестиария «Мерцаловой топи» - страница из журнала наблюдателя (1080×1350).
// Тетрадный лист в клетку, распечатка с камеры на скотче, машинопись рассказчика, пометки наблюдателя ручкой.
(function () {
  const U = globalThis.U, G = globalThis.G, Studio = globalThis.Studio;
  const W = G.W, H = G.H, k = W / 1080;
  const id = (new URLSearchParams(location.search)).get('card') || globalThis.CARD_ID;
  const C = globalThis.CARDS[id];
  const TYPE = '#23252B', PEN = '#1D3A8F', RED = '#B3261E';
  const TW = '"Courier 10 Pitch", "Courier", monospace';
  let IMG = null;
  const MORSE = { А: '.-', Б: '-...', В: '.--', Г: '--.', Д: '-..', Е: '.', Ж: '...-', З: '--..', И: '..', Й: '.---', К: '-.-', Л: '.-..', М: '--', Н: '-.', О: '---', П: '.--.', Р: '.-.', С: '...', Т: '-', У: '..-', Ф: '..-.', Х: '....', Ц: '-.-.', Ч: '---.', Ш: '----', Щ: '--.-', Ы: '-.--', Ь: '-..-', Э: '..-..', Ю: '..--', Я: '.-.-' };

  // машинопись: каждая буква чуть своя - неровный оттиск
  function typeText(ctx, text, x, y, size, opts = {}) {
    ctx.font = `${opts.bold ? 'bold ' : ''}${Math.round(size)}px ${TW}`;
    const marks = {}; let cx = x;
    [...text].forEach((ch, i) => {
      const h = U.hash(i + text.length * 7, y | 0);
      ctx.fillStyle = TYPE; ctx.globalAlpha = 0.78 + 0.22 * h;
      ctx.fillText(ch, cx + (U.hash(i, 3) - 0.5) * 1.2 * k, y + (U.hash(i, 5) - 0.5) * 1.6 * k);
      cx += ctx.measureText(ch).width + (opts.sp || 0);
    });
    ctx.globalAlpha = 1;
    return cx;
  }
  function typeWrapped(ctx, text, x, y, size, maxW, lh, find) {
    ctx.font = `${Math.round(size)}px ${TW}`;
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur);
    let hit = null;
    lines.forEach((ln, i) => {
      const yy = y + i * lh;
      typeText(ctx, ln, x, yy, size);
      if (find) { const j = ln.indexOf(find); if (j >= 0) { ctx.font = `${Math.round(size)}px ${TW}`; hit = { x: x + ctx.measureText(ln.slice(0, j)).width, y: yy, w: ctx.measureText(find).width }; } }
    });
    return { h: lines.length * lh, hit };
  }
  // «от руки»: курсив с дрожанием, каждая буква немного своя
  // подделка (forged): почерк слишком ровный - без дрожания и наклона букв
  function hand(ctx, text, x, y, size, color, rot = 0) {
    const j = C.forged ? 0 : 1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot * j);
    ctx.font = `italic 500 ${Math.round(size)}px "Lora"`; ctx.fillStyle = color;
    let cx = 0;
    [...text].forEach((ch, i) => {
      ctx.save(); ctx.translate(cx, (U.hash(i, 11) - 0.5) * size * 0.08 * j); ctx.rotate((U.hash(i, 12) - 0.5) * 0.1 * j);
      ctx.fillText(ch, 0, 0); ctx.restore();
      cx += ctx.measureText(ch).width * (C.forged ? 1 : 0.96 + 0.06 * U.hash(i, 13));
    });
    ctx.restore();
    return cx;
  }
  function penLine(ctx, pts, color, lw, seed) { G.line(ctx, pts, { color, lw: lw * k, seed }); }

  function paper(ctx) {
    ctx.fillStyle = '#F2EEE3'; ctx.fillRect(0, 0, W, H);
    // клетка
    ctx.strokeStyle = 'rgba(70,110,170,0.16)'; ctx.lineWidth = 1.4 * k;
    const g = 38 * k;
    for (let x = 0; x < W; x += g) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += g) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // поля
    ctx.strokeStyle = 'rgba(200,60,60,0.45)'; ctx.lineWidth = 2.5 * k;
    ctx.beginPath(); ctx.moveTo(132 * k, 0); ctx.lineTo(132 * k, H); ctx.stroke();
    // дырки под кольца
    for (let i = 0; i < 5; i++) {
      const y = H * (0.12 + 0.19 * i);
      ctx.fillStyle = '#20242E'; ctx.beginPath(); ctx.arc(52 * k, y, 17 * k, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(52 * k, y, 19 * k, 0, 7); ctx.stroke();
    }
    // пятна, потёртость, вода
    for (let i = 0; i < 10; i++) {
      const x = U.hash(i, 21) * W, y = U.hash(i, 22) * H, r = (80 + 200 * U.hash(i, 23)) * k;
      const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, `rgba(140,110,60,${0.04 + 0.05 * U.hash(i, 24)})`); gr.addColorStop(1, 'rgba(140,110,60,0)');
      ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(60,45,25,0.3)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  function tape(ctx, x, y, ang, w = 130) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(236,228,196,0.78)'; ctx.fillRect(-w / 2 * k, -20 * k, w * k, 40 * k);
    ctx.strokeStyle = 'rgba(150,130,90,0.3)'; ctx.lineWidth = 1.5 * k; ctx.strokeRect(-w / 2 * k, -20 * k, w * k, 40 * k);
    ctx.restore();
  }
  const pix = document.createElement('canvas');
  function pixelText(ctx, text, x, y, scale, color, align = 'left') {
    const fs = 10, px = pix.getContext('2d');
    px.font = `bold ${fs}px monospace`; const w = Math.ceil(px.measureText(text).width) + 4;
    pix.width = w; pix.height = fs + 5; px.font = `bold ${fs}px monospace`; px.textBaseline = 'top'; px.fillStyle = color; px.fillText(text, 2, 2);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    ctx.drawImage(pix, align === 'right' ? x - w * scale : x, y, w * scale, pix.height * scale); ctx.restore();
  }
  function printout(ctx, x, y, w, h, rot) {
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
    const b = 16 * k;
    ctx.fillStyle = 'rgba(40,30,20,0.28)'; ctx.fillRect(-b + 10 * k, -b + 12 * k, w + 2 * b, h + 2 * b);
    ctx.fillStyle = '#FAF8F2'; ctx.fillRect(-b, -b, w + 2 * b, h + 2 * b);
    ctx.drawImage(IMG, 0, 0, w, h);
    // строки развёртки и лёгкая выцветшесть распечатки
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(0, 0, w, h);
    for (let yy = 0; yy < h; yy += 4 * k) { ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.fillRect(0, yy, w, 1.4 * k); }
    const s = Math.round(3 * k);
    pixelText(ctx, `● REC  ${C.rec}`, 16 * k, 14 * k, s, '#FF5A4E');
    pixelText(ctx, 'CAM-1', w - 16 * k, h - 48 * k, s, '#E9EEF8', 'right');
    photoMarks(ctx, w, h);
    ctx.restore();
  }
  // пометки прямо на распечатке (координаты - доли фото)
  const MARKER = '#E8483C';
  function photoMarks(ctx, w, h) {
    // еле заметный второй силуэт в тумане (02) - он правда есть на снимке
    if (C.ghost) {
      const { x, y, s } = C.ghost, gx = x * w, gy = y * h, sc = s * h;
      ctx.fillStyle = 'rgba(20,24,46,0.22)';
      ctx.beginPath(); ctx.ellipse(gx, gy - sc * 0.42, sc * 0.05, sc * 0.06, 0, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(gx, gy - sc * 0.22, sc * 0.055, sc * 0.16, 0, 0, 7); ctx.fill();
      ctx.fillRect(gx - sc * 0.035, gy - sc * 0.08, sc * 0.018, sc * 0.3); ctx.fillRect(gx + sc * 0.017, gy - sc * 0.08, sc * 0.018, sc * 0.3);
      dot(ctx, gx - sc * 0.015, gy - sc * 0.43, sc * 0.008, 'rgba(220,235,255,0.35)'); dot(ctx, gx + sc * 0.015, gy - sc * 0.43, sc * 0.008, 'rgba(220,235,255,0.35)');
    }
    // обвод маркером и подпись на снимке
    if (C.photoCircle) {
      const { x, y, rx, ry, text, tx, ty } = C.photoCircle;
      const cx = x * w, cy = y * h;
      const pts = []; for (let i = 0; i <= 28; i++) { const a = -0.5 + (i / 25) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx * w * (1 + 0.05 * Math.sin(i * 1.3)), cy + Math.sin(a) * ry * h]); }
      penLine(ctx, pts, MARKER, 4.5, 71);
      if (text) hand(ctx, text, tx * w, ty * h, 44 * k, MARKER, -0.06);
    }
    // маршрут по болоту (08): пунктир тропинки, крестики огоньков, стрелка «не туда»
    if (C.route) {
      const R0 = C.route;
      ctx.setLineDash([12 * k, 10 * k]);
      penLine(ctx, R0.path.map(([a, b]) => [a * w, b * h]), MARKER, 3.5, 72);
      ctx.setLineDash([]);
      R0.crosses.forEach(([a, b], i) => { const x = a * w, y = b * h, r = 7 * k; penLine(ctx, [[x - r, y - r], [x + r, y + r]], MARKER, 3, 80 + i); penLine(ctx, [[x + r, y - r], [x - r, y + r]], MARKER, 3, 90 + i); });
      const [ax, ay] = R0.arrow[0], [bx, by] = R0.arrow[1];
      penLine(ctx, [[ax * w, ay * h], [bx * w, by * h]], MARKER, 4, 73);
      const ang = Math.atan2((by - ay) * h, (bx - ax) * w);
      for (const d of [-1, 1]) penLine(ctx, [[bx * w, by * h], [bx * w - Math.cos(ang + d * 0.5) * 26 * k, by * h - Math.sin(ang + d * 0.5) * 26 * k]], MARKER, 4, 74 + d);
      hand(ctx, R0.text, R0.tx * w, R0.ty * h, 44 * k, MARKER, -0.04);
      // перечёркнуто, переписано
      if (R0.count) hand(ctx, R0.count, R0.cx * w, R0.cy * h, 34 * k, MARKER, 0);
    }
    // глаза на снимке заштрихованы ручкой (15)
    if (C.hatch) for (const [a, b, r] of C.hatch) {
      const x = a * w, y = b * h, rr = r * w;
      for (let i = -6; i <= 6; i++) { const o = i * rr / 6; penLine(ctx, [[x - rr + o, y - rr * 0.9], [x + rr + o * 0.2, y + rr * 0.9]], 'rgba(18,22,40,0.9)', 3.4, 200 + i + (a * 100 | 0)); }
      for (let i = -5; i <= 5; i++) { const o = i * rr / 5; penLine(ctx, [[x + rr + o * 0.3, y - rr * 0.8], [x - rr + o, y + rr * 0.8]], 'rgba(18,22,40,0.9)', 3, 230 + i + (a * 100 | 0)); }
    }
  }
  const dot = (ctx, x, y, r, c) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); };
  function morseMargin(ctx, word, x, y0, codes) {
    // наблюдатель карандашом рисует точки и тире на полях - столбиком.
    // codes - свои коды по буквам (сбои подделки): 'L' - тире вдвое длиннее; пробел в слове - пауза между словами
    let y = y0, li = 0;
    for (const ch of word) {
      if (ch === ' ') { y += 34 * k; continue; }
      const code = (codes && codes[li]) || MORSE[ch] || ''; li++;
      for (const s of code) {
        if (s === '.') { ctx.fillStyle = 'rgba(40,40,50,0.6)'; ctx.beginPath(); ctx.arc(x, y, 3.2 * k, 0, 7); ctx.fill(); y += 14 * k; }
        else { const len = s === 'L' ? 42 : 20; penLine(ctx, [[x - 1 * k, y - 4 * k], [x + 1 * k, y + (len - 4) * k]], 'rgba(40,40,50,0.6)', 3.2, y | 0); y += (len + 10) * k; }
      }
      y += 22 * k;
    }
    return y;
  }
  // мох с моховичками поверх листа (11): под ним еле видна последняя настоящая пометка
  function moss(ctx, nx, ny) {
    if (C.mossNote) hand(ctx, C.mossNote, nx, ny, 46 * k, 'rgba(179,38,30,0.55)', -0.05);
    const blobs = [[nx + 250, ny - 8, 66], [nx + 360, ny + 24, 84], [W * 0.06, H * 0.97, 120], [W * 0.98, H * 0.12, 80], [W * 0.95, H * 0.2, 50]];
    blobs.forEach(([bx, by, r], b) => {
      for (let i = 0; i < 40; i++) {
        const a = U.hash(i, b * 7 + 1) * 6.28, d = Math.sqrt(U.hash(i, b * 7 + 2)) * r * k;
        const x = bx + Math.cos(a) * d, y = by + Math.sin(a) * d * 0.75, rr = (9 + 14 * U.hash(i, b * 7 + 3)) * k;
        ctx.fillStyle = ['#2E5A3A', '#3D7046', '#4C8250', '#24482F'][i % 4]; ctx.globalAlpha = 0.92;
        ctx.beginPath(); ctx.arc(x, y, rr, 0, 7); ctx.fill();
      }
      ctx.globalAlpha = 1;
      // крошечные грибочки
      for (let m = 0; m < 3; m++) {
        const x = bx + (U.hash(m, b + 40) - 0.5) * r * k, y = by + (U.hash(m, b + 41) - 0.6) * r * 0.5 * k, s = (10 + 6 * U.hash(m, b + 42)) * k;
        ctx.fillStyle = '#EDE3CF'; ctx.fillRect(x - s * 0.25, y - s * 0.2, s * 0.5, s * 1.1);
        ctx.fillStyle = '#C9774E'; ctx.beginPath(); ctx.ellipse(x, y - s * 0.2, s, s * 0.6, 0, Math.PI, 0); ctx.fill();
        ctx.fillStyle = '#F4E6D2'; ctx.beginPath(); ctx.arc(x - s * 0.35, y - s * 0.45, s * 0.14, 0, 7); ctx.arc(x + s * 0.3, y - s * 0.55, s * 0.12, 0, 7); ctx.fill();
      }
    });
  }
  // откушенный угол (12): полукруглые укусы, за листом темнота, рядом светящиеся крошки
  function bite(ctx, cy) {
    // край укуса как у печенья: большой круг из-за угла + зубчики по его краю
    const cx0 = -110 * k, cy0 = (cy + 300) * k, R = 280 * k;
    ctx.fillStyle = '#0A0D1C';
    ctx.beginPath(); ctx.arc(cx0, cy0, R, 0, 7); ctx.fill();
    for (let a = -1.7; a < 0.4; a += 0.16) {
      ctx.beginPath(); ctx.arc(cx0 + Math.cos(a) * R, cy0 + Math.sin(a) * R, (24 + 6 * U.hash(a * 10 | 0, 64)) * k, 0, 7); ctx.fill();
    }
    // светящиеся крошки у края
    for (let i = 0; i < 10; i++) {
      const a = -1.6 + 1.9 * U.hash(i, 61), d = R + (30 + 70 * U.hash(i, 62)) * k;
      const x = cx0 + Math.cos(a) * d, y = cy0 + Math.sin(a) * d, r = (2 + 4 * U.hash(i, 63)) * k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r * 4); g.addColorStop(0, 'rgba(240,236,190,0.9)'); g.addColorStop(1, 'rgba(240,236,190,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    }
  }

  // ---------- пометки наблюдателя: у каждой страницы своя ----------
  const PENCIL = 'rgba(60,60,70,0.7)';
  function devices(ctx, o) {
    const { L, R, bottom, circ } = o;
    // 01: спокойная правка цифры
    if (C.fix && circ) {
      const { x, y, w } = circ;
      penLine(ctx, [[x - 4 * k, y - 9 * k], [x + w + 4 * k, y - 12 * k]], PEN, 3.4, 61);
      hand(ctx, C.fix.to, x + w + 34 * k, y + 2 * k, 42 * k, PEN, -0.04);
      if (C.fix.note) hand(ctx, C.fix.note, R - 210 * k, bottom, 38 * k, PENCIL, -0.03);
    }
    // 03: записка на скотче поверх угла распечатки
    if (C.scrap) {
      const sx = o.px + o.pw - 340 * k, sy = o.py + o.ph - 236 * k, sw = 360 * k, sh = (60 + 52 * C.scrap.length) * k;
      ctx.save(); ctx.translate(sx + sw / 2, sy + sh / 2); ctx.rotate(0.05); ctx.translate(-sw / 2, -sh / 2);
      ctx.fillStyle = 'rgba(40,30,20,0.25)'; ctx.fillRect(8 * k, 10 * k, sw, sh);
      ctx.fillStyle = '#F6F1DF'; ctx.beginPath(); ctx.moveTo(0, 0);
      for (let i = 0; i <= 12; i++) ctx.lineTo(sw * i / 12, (U.hash(i, 501) * 8) * k);
      ctx.lineTo(sw, sh); ctx.lineTo(0, sh); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(70,110,170,0.25)'; ctx.lineWidth = 1.4 * k;
      for (let yy = 48 * k; yy < sh; yy += 52 * k) { ctx.beginPath(); ctx.moveTo(10 * k, yy + 10 * k); ctx.lineTo(sw - 10 * k, yy + 10 * k); ctx.stroke(); }
      C.scrap.forEach((ln, i) => {
        const last = i === C.scrap.length - 1;
        const tw = hand(ctx, ln, 22 * k, (50 + i * 52) * k, (i ? 36 : 32) * k, last ? RED : PEN, (U.hash(i, 502) - 0.5) * 0.04);
        if (last) penLine(ctx, [[22 * k, (62 + i * 52) * k], [22 * k + tw, (59 + i * 52) * k]], RED, 2.4, 503);
      });
      ctx.restore();
      tape(ctx, sx + sw * 0.5, sy - 4 * k, 0.08, 110);
    }
    // 04: считает глаза палочками, сбивается
    if (C.tally) {
      let x = L, yb = bottom;
      const n = C.tally.n;
      for (let g = 0; g < Math.ceil(n / 5); g++) {
        const m = Math.min(5, n - g * 5);
        for (let i = 0; i < Math.min(4, m); i++) penLine(ctx, [[x + i * 13 * k, yb - 34 * k], [x + i * 13 * k + 2 * k, yb + 2 * k]], PEN, 3, 300 + g * 7 + i);
        if (m === 5) penLine(ctx, [[x - 8 * k, yb - 8 * k], [x + 52 * k, yb - 26 * k]], PEN, 3, 320 + g);
        x += 76 * k;
      }
      x += 6 * k;
      const w1 = hand(ctx, `= ${n}`, x, yb, 42 * k, PEN, 0);
      penLine(ctx, [[x - 4 * k, yb - 12 * k], [x + w1 + 4 * k, yb - 16 * k]], PEN, 3, 330);
      // одна палочка дописана потом, другим нажимом
      penLine(ctx, [[x + w1 + 22 * k, yb - 36 * k], [x + w1 + 25 * k, yb + 4 * k]], RED, 3.6, 331);
      hand(ctx, C.tally.then, x + w1 + 44 * k, yb, 44 * k, RED, -0.05);
    }
    // 05: ни слова - только отпечаток маленькой мокрой ладошки
    if (C.handprint) {
      const { x, y, rot, s } = C.handprint, hx = x * W, hy = y * H, sc = s * k;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(70,82,74,0.42)';
      ctx.beginPath(); ctx.ellipse(0, 0, 34 * sc, 38 * sc, 0, 0, 7); ctx.fill();
      [[-30, -40, 0.5], [-12, -58, 0.18], [8, -60, -0.05], [26, -50, -0.3], [40, -6, -1.1]].forEach(([fx, fy, a], i) => {
        ctx.save(); ctx.translate(fx * sc, fy * sc); ctx.rotate(a);
        ctx.beginPath(); ctx.ellipse(0, 0, 8 * sc, (i === 4 ? 16 : 22) * sc, 0, 0, 7); ctx.fill();
        ctx.restore();
      });
      // подтёки
      for (let i = 0; i < 3; i++) ctx.fillRect((-20 + i * 18) * sc, 30 * sc, 4 * sc, (24 + 30 * U.hash(i, 411)) * sc);
      ctx.restore();
    }
    // 06: фраза оборвана на полуслове, ручка ушла в сторону
    if (C.cut) {
      const w = hand(ctx, C.cut, L, bottom, 42 * k, PEN, -0.02);
      penLine(ctx, [[L + w, bottom - 12 * k], [L + w + 40 * k, bottom - 4 * k], [L + w + 120 * k, bottom + 30 * k], [L + w + 160 * k, bottom + 70 * k]], PEN, 2.4, 341);
    }
    // 07: написано зеркально - читается только в отражении
    if (C.mirror) {
      ctx.save(); ctx.font = `italic 500 ${Math.round(46 * k)}px "Lora"`;
      const tw = ctx.measureText(C.mirror).width;
      ctx.translate(R - 20 * k, bottom); ctx.scale(-1, 1);
      hand(ctx, C.mirror, 0, 0, 46 * k, RED, 0.03);
      ctx.restore();
      void tw;
    }
    // 09, 12: почерк сначала ровный, потом дрожит и срывается
    if (C.shaky) {
      const { text, from, size = 42, color = PEN } = C.shaky;
      ctx.save(); ctx.font = `italic 500 ${Math.round(size * k)}px "Lora"`; ctx.fillStyle = color === 'red' ? RED : color;
      let cx = L + (C.shaky.dx || 0) * k;
      [...text].forEach((ch, i) => {
        const p = Math.max(0, (i - from) / Math.max(1, text.length - from));
        ctx.save(); ctx.translate(cx, bottom + (U.hash(i, 21) - 0.5) * size * k * (0.06 + 0.5 * p) + p * p * 40 * k);
        ctx.rotate((U.hash(i, 22) - 0.5) * (0.08 + 0.7 * p) + p * 0.3);
        ctx.fillText(ch, 0, 0); ctx.restore();
        cx += ctx.measureText(ch).width * (1 + 0.25 * p);
      });
      ctx.restore();
      if (C.shaky.tail) penLine(ctx, [[cx, bottom + 30 * k], [cx + 30 * k, bottom + 60 * k], [cx + 50 * k, bottom + 110 * k]], color === 'red' ? RED : color, 2.4, 351);
    }
    // 10: одно слово крупно, поверх машинописи
    if (C.big) {
      const { text, x, y, rot = -0.18, size = 150 } = C.big;
      hand(ctx, text, x * W, y * H, size * k, 'rgba(179,38,30,0.82)', rot);
    }
    // 12: клякса - ручку уронили
    if (C.blot) {
      const { x, y, r } = C.blot, bx = x * W, by = y * H;
      ctx.fillStyle = 'rgba(20,30,90,0.85)';
      ctx.beginPath(); ctx.arc(bx, by, r * k, 0, 7); ctx.fill();
      for (let i = 0; i < 9; i++) { const a = U.hash(i, 601) * 6.283, d = (r + 10 + 40 * U.hash(i, 602)) * k; dot(ctx, bx + Math.cos(a) * d, by + Math.sin(a) * d, (3 + 9 * U.hash(i, 603)) * k, 'rgba(20,30,90,0.8)'); }
      ctx.strokeStyle = 'rgba(20,30,90,0.6)'; ctx.lineWidth = 6 * k; ctx.beginPath(); ctx.moveTo(bx + r * 0.5 * k, by + r * 0.6 * k); ctx.lineTo(bx + r * 0.7 * k, by + r * 2.4 * k); ctx.stroke();
    }
    // 13: к странице приклеен настоящий зубик
    if (C.tooth) {
      const tx = C.tooth.x * W, ty = C.tooth.y * H, s = 2.2 * k;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(0.3);
      ctx.fillStyle = 'rgba(40,30,20,0.25)'; ctx.beginPath(); ctx.ellipse(5 * k, 6 * k, 15 * s, 18 * s, 0, 0, 7); ctx.fill();
      G.poly(ctx, [[-13 * s, -9 * s], [-6 * s, -13 * s], [0, -10 * s], [6 * s, -13 * s], [13 * s, -9 * s], [12 * s, 3 * s], [8 * s, 15 * s], [3 * s, 15 * s], [0, 6 * s], [-3 * s, 15 * s], [-8 * s, 15 * s], [-12 * s, 3 * s]], { fill: '#EFE8D6', lw: 2, seed: 7, stroke: '#6A6050' });
      ctx.restore();
      tape(ctx, tx, ty, -0.35, 120);
      if (C.tooth.label) hand(ctx, C.tooth.label, tx - 150 * k, ty + 82 * k, 30 * k, PENCIL, -0.05);
    }
    // 15: лист прошит красной ниткой крест-накрест
    if (C.sew) {
      const { x, y, s } = C.sew, cx = x * W, cy = y * H, d = s * k;
      const holes = [[-d, -d], [d, d], [d, -d], [-d, d]];
      ctx.strokeStyle = '#B8344A'; ctx.lineWidth = 6 * k; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - d, cy - d); ctx.lineTo(cx + d, cy + d); ctx.moveTo(cx + d, cy - d); ctx.lineTo(cx - d, cy + d); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,170,180,0.5)'; ctx.lineWidth = 1.6 * k;
      ctx.beginPath(); ctx.moveTo(cx - d, cy - d - 2 * k); ctx.lineTo(cx + d, cy + d - 2 * k); ctx.moveTo(cx + d, cy - d - 2 * k); ctx.lineTo(cx - d, cy + d - 2 * k); ctx.stroke();
      for (const [hx, hy] of holes) { dot(ctx, cx + hx, cy + hy, 5 * k, '#2A2018'); }
      // хвостик нитки
      ctx.strokeStyle = '#B8344A'; ctx.lineWidth = 3 * k;
      ctx.beginPath(); ctx.moveTo(cx - d, cy + d); ctx.bezierCurveTo(cx - d - 30 * k, cy + d + 40 * k, cx - d + 20 * k, cy + d + 60 * k, cx - d - 10 * k, cy + d + 100 * k); ctx.stroke();
    }
  }

  Studio.film({
    async init() { IMG = await Studio.loadImage(C.img); await document.fonts.load('italic 500 40px "Lora"'); await document.fonts.load(`32px ${TW}`); },
    draw(ctx) {
      paper(ctx);
      const L = 170 * k, R = W - 70 * k;
      ctx.textBaseline = 'alphabetic';
      typeText(ctx, 'БЕСТИАРИЙ МЕРЦАЛОВОЙ ТОПИ', L, 92 * k, 27 * k, { sp: 2.5 * k });
      ctx.font = `${Math.round(27 * k)}px ${TW}`;
      const lab = `ЗАПИСЬ № ${C.no}`; typeText(ctx, lab, R - ctx.measureText(lab).width - 10 * k, 92 * k, 27 * k, { sp: 1 * k });

      // распечатка с камеры
      const pw = R - L - 20 * k, ph = pw * (IMG.height / IMG.width), px = L + 10 * k, py = 140 * k;
      printout(ctx, px, py, pw, ph, -0.022);
      tape(ctx, px + 30 * k, py - 6 * k, -0.6);
      tape(ctx, px + pw - 30 * k, py - 6 * k, 0.55);

      // имя
      let y = py + ph + 112 * k;
      const tEnd = typeText(ctx, C.title.toUpperCase(), L, y, 70 * k, { bold: true, sp: 6 * k });
      ctx.fillStyle = TYPE; ctx.globalAlpha = 0.8; ctx.fillRect(L, y + 14 * k, tEnd - L, 3 * k); ctx.globalAlpha = 1;

      // вступление: «Милый…» - наблюдатель зачёркивает
      y += 96 * k;
      const fs = 31 * k, lh = 44 * k, maxW = R - L;
      typeText(ctx, C.intro, L, y, fs);
      if (C.strike) {
        ctx.font = `${Math.round(fs)}px ${TW}`;
        const sw = ctx.measureText(C.strike).width;
        penLine(ctx, [[L - 6 * k, y - 10 * k], [L + sw * 0.5, y - 12 * k], [L + sw + 8 * k, y - 8 * k]], PEN, 4, 41);
        penLine(ctx, [[L - 4 * k, y - 3 * k], [L + sw + 6 * k, y - 14 * k]], PEN, 3, 42);
        hand(ctx, C.strikeNote, L + sw + 18 * k, y - 26 * k, 50 * k, PEN, 0.15);
      }

      y += lh;
      y += typeWrapped(ctx, C.sub, L, y, fs, maxW, lh).h + 18 * k;

      // факты
      let circ = null;
      for (const f of C.facts) {
        typeText(ctx, '-', L, y, fs);
        const r = typeWrapped(ctx, f, L + 40 * k, y, fs, maxW - 40 * k, lh, C.circle || (C.fix && C.fix.find));
        if (r.hit) circ = r.hit;
        y += r.h + 12 * k;
      }

      // обвести «03:12» и написать на полях
      if (circ && C.note) {
        const cx = circ.x + circ.w / 2, cy = circ.y - 10 * k, rx = circ.w / 2 + 16 * k, ry = 30 * k;
        const pts = []; for (let i = 0; i <= 26; i++) { const a = -0.4 + (i / 24) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx * (1 + 0.04 * Math.sin(i)), cy + Math.sin(a) * ry]); }
        penLine(ctx, pts, RED, 3.6, 51);
        // стрелка уходит вправо на поля и вниз, пометка - под фактами
        ctx.font = `italic 500 ${Math.round(50 * k)}px "Lora"`;
        const nw0 = ctx.measureText(C.note).width;
        const ex = W - 34 * k, ny = Math.max(y + 40 * k, H - 70 * k), nx = R - nw0 - 30 * k;
        penLine(ctx, [[cx + rx, cy - 4 * k], [ex - 10 * k, cy + 6 * k], [ex, cy + 60 * k], [ex + 4 * k, ny - 80 * k], [ex - 12 * k, ny - 20 * k], [nx + nw0 + 18 * k, ny - 14 * k]], RED, 3, 52);
        penLine(ctx, [[nx + nw0 + 18 * k, ny - 14 * k], [nx + nw0 + 36 * k, ny - 30 * k]], RED, 3, 53);
        penLine(ctx, [[nx + nw0 + 18 * k, ny - 14 * k], [nx + nw0 + 38 * k, ny + 2 * k]], RED, 3, 54);
        const nw = hand(ctx, C.note, nx, ny, 50 * k, RED, -0.03);
        penLine(ctx, [[nx, ny + 16 * k], [nx + nw * 0.6, ny + 13 * k], [nx + nw, ny + 9 * k]], RED, 2.6, 55);
      }

      const bottom = Math.max(y + 34 * k, H - 92 * k);
      devices(ctx, { L, R, y, bottom, py, ph, px, pw, circ });

      // Морзе на полях карандашом
      const mEnd = morseMargin(ctx, C.morse, 100 * k, py + ph + 40 * k, C.morseCode);
      if (C.moss) moss(ctx, L + 10 * k, H - 70 * k);
      if (C.bite) bite(ctx, Math.max(mEnd / k + 20, 1150));
    },
    post: { paper: 0.18, vignette: 0, grain: 0.045 },
  });
})();
