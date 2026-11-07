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
  function hand(ctx, text, x, y, size, color, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.font = `italic 500 ${Math.round(size)}px "Lora"`; ctx.fillStyle = color;
    let cx = 0;
    [...text].forEach((ch, i) => {
      ctx.save(); ctx.translate(cx, (U.hash(i, 11) - 0.5) * size * 0.08); ctx.rotate((U.hash(i, 12) - 0.5) * 0.1);
      ctx.fillText(ch, 0, 0); ctx.restore();
      cx += ctx.measureText(ch).width * (0.96 + 0.06 * U.hash(i, 13));
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
    ctx.restore();
  }
  function morseMargin(ctx, word, x, y0) {
    // наблюдатель карандашом рисует точки и тире на полях - столбиком
    let y = y0;
    for (const ch of word) {
      for (const s of (MORSE[ch] || '')) {
        if (s === '.') { ctx.fillStyle = 'rgba(40,40,50,0.6)'; ctx.beginPath(); ctx.arc(x, y, 3.2 * k, 0, 7); ctx.fill(); y += 14 * k; }
        else { penLine(ctx, [[x - 1 * k, y - 4 * k], [x + 1 * k, y + 16 * k]], 'rgba(40,40,50,0.6)', 3.2, y | 0); y += 30 * k; }
      }
      y += 22 * k;
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
      ctx.font = `${Math.round(fs)}px ${TW}`;
      const sw = ctx.measureText(C.strike).width;
      penLine(ctx, [[L - 6 * k, y - 10 * k], [L + sw * 0.5, y - 12 * k], [L + sw + 8 * k, y - 8 * k]], PEN, 4, 41);
      penLine(ctx, [[L - 4 * k, y - 3 * k], [L + sw + 6 * k, y - 14 * k]], PEN, 3, 42);
      hand(ctx, C.strikeNote, L + sw + 18 * k, y - 26 * k, 50 * k, PEN, 0.15);

      y += lh;
      y += typeWrapped(ctx, C.sub, L, y, fs, maxW, lh).h + 18 * k;

      // факты
      let circ = null;
      for (const f of C.facts) {
        typeText(ctx, '-', L, y, fs);
        const r = typeWrapped(ctx, f, L + 40 * k, y, fs, maxW - 40 * k, lh, C.circle);
        if (r.hit) circ = r.hit;
        y += r.h + 12 * k;
      }

      // обвести «03:12» и написать на полях
      if (circ) {
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

      // Морзе на полях карандашом
      morseMargin(ctx, C.morse, 100 * k, py + ph + 40 * k);
    },
    post: { paper: 0.18, vignette: 0, grain: 0.045 },
  });
})();
