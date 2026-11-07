// «Мерцалова топь» — эпизод 5 «Улыбыши». Единый источник времени для музыки и картинки.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, placeBar, makeChords } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const WIDE = W / H > 1.2;
  const STYLE = 'paper';
  const clock = makeClock({ bpm: 84, offset: 0.4 });
  const { T, BEAT } = clock;
  const EIGHTH = BEAT / 2;

  const ev = {
    play: T(2, 0),      // «играют» — прыжки
    sleep: T(3, 3),     // засыпают
    gone: T(6, 0.5),    // «…их нет» — малыши исчезают, улыбки остаются
    breath: T(6, 2),    // тишина
    hit: T(7, 0),       // десятки улыбок вокруг камеры
    cut: T(8, 0),
    title: T(8, 0.6),
  };
  const DURATION = T(9, 2);

  // пять малышей; прыжки на восьмые по очереди — каждый прыжок = капля-нота
  const BABIES = 5;
  const HOP_NOTES = ['A5', 'C6', 'E6', 'D6', 'B5', 'C6', 'A5', 'E5', 'A5', 'C6', 'E6', 'G6'];
  const hops = HOP_NOTES.map((n, i) => ({ t: ev.play + i * EIGHTH, who: [2, 0, 4, 1, 3][i % 5], note: m(n) }));

  // улыбки вокруг камеры в финале (детерминированно)
  const smiles = [];
  {
    const rnd = U.mulberry32(505);
    for (let i = 0; i < 34; i++) {
      const depth = rnd();                 // 0 — далеко, 1 — у камеры
      smiles.push({ x: rnd(), y: 0.3 + 0.6 * rnd(), depth, tilt: (rnd() - 0.5) * 0.4, dt: rnd() * 0.06 });
    }
    smiles.sort((a, b) => a.depth - b.depth);
  }

  const vo = [
    { file: 'voice/p1.wav', at: T(0, 1) - 0.11 },
    { file: 'voice/p2.wav', at: T(2, 1) - 0.11 },
    { file: 'voice/p3.wav', at: T(3, 3) - 0.11 },
    { file: 'voice/p4.wav', at: T(5, 2) - 0.11 },
  ];

  const S = {
    intro: [0, ev.play],
    play: [ev.play, ev.sleep],
    sleep: [ev.sleep, ev.gone],
    gone: [ev.gone, ev.breath],
    breath: [ev.breath, ev.hit],
    end: [ev.hit, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [
    [0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'C'], [3, 0, 4, 'Am'], [4, 0, 4, 'Dm'], [5, 0, 4, 'F'], [6, 0, 2, 'E'],
  ]);
  // колыбельная шкатулки (во сне — медленнее и тише)
  const box = [
    ...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]], 1),
    ...placeBar(clock, [['E5', 0, 4], ['C5', 4, 4]], 4),
    ...placeBar(clock, [['D5', 0, 4], ['A4', 4, 4]], 5),
  ];

  // Морзе «ВЫХОД»: В ·−−  Ы −·−−  Х ····  О −−−  Д −··
  const code = { 'В': '.--', 'Ы': '-.--', 'Х': '....', 'О': '---', 'Д': '-..' };
  const MORSE = [];
  for (const ch of 'ВЫХОД') {
    [...code[ch]].forEach((s, i) => { if (i) MORSE.push([0, 1]); MORSE.push([1, s === '-' ? 3 : 1]); });
    MORSE.push([0, 3]);
  }
  MORSE[MORSE.length - 1] = [0, 7];
  const MLEN = MORSE.reduce((a, [, d]) => a + d, 0);
  const morseOn = (t) => {
    let x = ((t - clock.OFFSET) / EIGHTH) % MLEN; if (x < 0) x += MLEN;
    for (const [on, d] of MORSE) { if (x < d) return on; x -= d; }
    return 0;
  };

  const markers = {
    play: { t: ev.play, sync: 'a' },
    sleep: ev.sleep,
    gone: ev.gone,
    breath: ev.breath,
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const subtitles = [
    { t: T(0, 1), end: T(0, 1) + 4.1, text: 'Улыбыши — самые счастливые малыши Мерцаловой топи.' },
    { t: T(2, 1), end: T(2, 1) + 2.4, text: 'Они улыбаются, когда играют.' },
    { t: T(3, 3), end: T(3, 3) + 1.9, text: 'Улыбаются, когда спят.' },
    { t: T(5, 2), end: T(5, 2) + 2.0, text: 'И даже когда их нет.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №6' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    BABIES, hops, smiles, box, morseOn, subtitles, vo, LOG: '03:13' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
