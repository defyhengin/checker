// Карточка бестиария «Мерцаловой топи» (1080×1350): бумага полевого журнала, кадр в карандашной рамке,
// факты в две колонки, пометка наблюдателя красной ручкой, разделитель — Морзе.
(function () {
  const U = globalThis.U, G = globalThis.G, Studio = globalThis.Studio;
  const W = G.W, H = G.H, k = W / 1080;
  const id = (new URLSearchParams(location.search)).get('card') || globalThis.CARD_ID;
  const C = globalThis.CARDS[id];
  const INK = '#1A2547', RUST = '#B5562A', PAPER = '#EEE4CE', RED = '#B3261E';
  let IMG = null;

  const MORSE = { А: '.-', Б: '-...', В: '.--', Г: '--.', Д: '-..', Е: '.', Ж: '...-', З: '--..', И: '..', Й: '.---', К: '-.-', Л: '.-..', М: '--', Н: '-.', О: '---', П: '.--.', Р: '.-.', С: '...', Т: '-', У: '..-', Ф: '..-.', Х: '....', Ц: '-.-.', Ч: '---.', Ш: '----', Щ: '--.-', Ы: '-.--', Ь: '-..-', Э: '..-..', Ю: '..--', Я: '.-.-' };

  function font(ctx, size, weight = 400, fam = 'Inter', style = '') { ctx.font = `${style} ${weight} ${Math.round(size)}px "${fam}"`; }
  function wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
    if (cur) lines.push(cur); return lines;
  }
  function spaced(ctx, text, x, y, sp, align = 'left') {
    const chars = [...text]; const w = chars.reduce((a, c) => a + ctx.measureText(c).width + sp, -sp);
    let cx = align === 'right' ? x - w : x;
    for (const c of chars) { ctx.fillText(c, cx, y); cx += ctx.measureText(c).width + sp; }
  }

  function paper(ctx) {
    ctx.fillStyle = PAPER; ctx.fillRect(0, 0, W, H);
    // пятна и потёртости
    for (let i = 0; i < 14; i++) {
      const x = U.hash(i, 1) * W, y = U.hash(i, 2) * H, r = (60 + 220 * U.hash(i, 3)) * k;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(150,110,60,${0.05 + 0.05 * U.hash(i, 4)})`); g.addColorStop(1, 'rgba(150,110,60,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // след от кружки
    ctx.strokeStyle = 'rgba(120,80,40,0.12)'; ctx.lineWidth = 6 * k;
    ctx.beginPath(); ctx.arc(W * 0.86, H * 0.9, 95 * k, 0.3, 5.6); ctx.stroke();
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(70,45,20,0.28)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  function tape(ctx, x, y, ang) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(230,220,180,0.75)'; ctx.fillRect(-60 * k, -18 * k, 120 * k, 36 * k);
    ctx.strokeStyle = 'rgba(150,130,90,0.35)'; ctx.lineWidth = 1.5 * k; ctx.strokeRect(-60 * k, -18 * k, 120 * k, 36 * k);
    ctx.restore();
  }

  function morseRule(ctx, word, x0, x1, y) {
    // разделитель из точек и тире — читается как Морзе
    const u = 7 * k, items = [];
    for (const ch of word) { [...(MORSE[ch] || '')].forEach((s, i) => { if (i) items.push(['gap', 1]); items.push([s, s === '-' ? 3 : 1]); }); items.push(['gap', 3]); }
    const unitW = (x1 - x0) / items.reduce((a, [, d]) => a + d, 0);
    let x = x0; ctx.fillStyle = 'rgba(181,86,42,0.75)';
    for (const [s, d] of items) {
      if (s === '.') { ctx.beginPath(); ctx.arc(x + unitW / 2, y, 2.6 * k, 0, 7); ctx.fill(); }
      else if (s === '-') ctx.fillRect(x + unitW * 0.15, y - 2.2 * k, unitW * 2.7, 4.4 * k);
      x += d * unitW;
    }
    return u;
  }

  Studio.film({
    async init() { IMG = await Studio.loadImage(C.img); await document.fonts.load('italic 40px "Lora"'); await document.fonts.load('800 40px "Inter Display"'); },
    draw(ctx) {
      paper(ctx);
      const M = 74 * k;
      // шапка
      ctx.textBaseline = 'alphabetic';
      font(ctx, 30 * k, 700); ctx.fillStyle = 'rgba(26,37,71,0.75)';
      spaced(ctx, 'БЕСТИАРИЙ МЕРЦАЛОВОЙ ТОПИ', M, 96 * k, 4.5 * k);
      font(ctx, 40 * k, 800, 'Inter Display'); ctx.fillStyle = RUST;
      spaced(ctx, `№ ${C.no}`, W - M, 98 * k, 1 * k, 'right');

      // кадр в рамке
      const fx = M, fy = 130 * k, fw = W - 2 * M, fh = fw * (IMG.height / IMG.width);
      ctx.save();
      ctx.translate(W / 2, fy + fh / 2); ctx.rotate(-0.008); ctx.translate(-W / 2, -(fy + fh / 2));
      ctx.fillStyle = 'rgba(60,40,20,0.25)'; ctx.fillRect(fx + 8 * k, fy + 10 * k, fw, fh);
      ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
      ctx.drawImage(IMG, fx, fy, fw, fh);
      ctx.restore();
      G.poly(ctx, [[fx, fy], [fx + fw, fy], [fx + fw, fy + fh], [fx, fy + fh]], { fill: null, lw: 5, seed: 7, stroke: INK });
      ctx.restore();
      tape(ctx, fx + 40 * k, fy + 4 * k, -0.5);
      tape(ctx, fx + fw - 40 * k, fy + 4 * k, 0.45);

      // имя и подзаголовок
      let y = fy + fh + 110 * k;
      font(ctx, 96 * k, 800, 'Inter Display'); ctx.fillStyle = INK;
      ctx.fillText(C.title, M, y);
      y += 66 * k;
      font(ctx, 44 * k, 400, 'Lora', 'italic'); ctx.fillStyle = 'rgba(26,37,71,0.72)';
      ctx.fillText(C.sub, M, y);

      // разделитель-Морзе
      y += 48 * k;
      morseRule(ctx, C.morse, M, W - M, y);

      // факты в две колонки
      const colW = (W - 2 * M - 50 * k) / 2;
      let rowY = y + 62 * k;
      for (let r = 0; r < 2; r++) {
        let maxH = 0;
        for (let c = 0; c < 2; c++) {
          const [lab, val] = C.facts[r * 2 + c];
          const x = M + c * (colW + 50 * k);
          font(ctx, 25 * k, 700); ctx.fillStyle = RUST; spaced(ctx, lab.toUpperCase(), x, rowY, 3 * k);
          font(ctx, 32 * k, 400); ctx.fillStyle = INK;
          const lines = wrap(ctx, val, colW);
          lines.forEach((ln, i) => ctx.fillText(ln, x, rowY + 46 * k + i * 42 * k));
          maxH = Math.max(maxH, 46 * k + (lines.length - 1) * 42 * k);
        }
        rowY += maxH + 60 * k;
      }

      // пометка наблюдателя красной ручкой
      ctx.save();
      ctx.translate(W - M - 10 * k, H - 58 * k); ctx.rotate(-0.06);
      font(ctx, 42 * k, 500, 'Lora', 'italic'); ctx.fillStyle = RED;
      ctx.textAlign = 'right'; ctx.fillText(C.note, 0, 0);
      const nw = ctx.measureText(C.note).width;
      G.line(ctx, [[-nw, 14 * k], [-nw * 0.5, 18 * k], [0, 12 * k]], { color: RED, lw: 3 * k, seed: 31 });
      G.line(ctx, [[-nw * 0.9, 26 * k], [-nw * 0.1, 24 * k]], { color: RED, lw: 2.2 * k, seed: 32 });
      ctx.restore();
    },
    post: { paper: 0.2, vignette: 0, grain: 0.04 },
  });
})();
