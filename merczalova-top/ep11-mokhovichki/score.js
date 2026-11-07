// «Мерцалова топь» - эпизод 11 «Моховички». Единый источник времени для музыки и картинки.
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

  // события в секундах, прижатые к ближайшей восьмой (чтобы ноты ложились в сетку шкатулки)
  const Q = (t) => clock.OFFSET + Math.round((t - clock.OFFSET) / EIGHTH) * EIGHTH;
  // фразы из mp3 ElevenLabs (voice/vo.mp3); речь в каждом файле начинается с 0.15 с.
  // Длины (с): p1 3.7, p2 4.5, p3 3.7, p4a 1.4, p4b 1.5, p5 3.4, p6 2.7, p7 2.0.
  const VO_AT = { p1: 0.6, p2: 4.7, p3: 9.6, p4a: 13.5, p4b: 16.0, p5: 18.7, p6: 22.5, p7: 25.6 };
  const vo = Object.entries(VO_AT).map(([id, at]) => ({ file: `voice/${id}.wav`, at: at - 0.15 }));

  const ev = {
    toStump: Q(12.7),   // камера к пню
    toFrog: Q(15.6),    // к лягушке
    reveal: Q(18.7),    // отъезд: холм мха - лежащий человек и штатив
    wide: Q(22.2),
    gone: Q(27.8),      // тишина: по краям кадра ползут белые нити грибницы
    hit: Q(29.2),       // на объективе раскрывается грибочек; все моховички открывают глаза
  };
  ev.cut = ev.hit + 3 * EIGHTH;
  ev.title = ev.cut + 0.5;
  // грибочки вырастают по одному, каждый на ноту
  const SPROUT = [
    ...[0, 1, 2].map((i) => ({ t: Q(15.0) + i * EIGHTH, on: 'stump', i, note: ['E6', 'G6', 'A6'][i] })),
    ...[0, 1, 2].map((i) => ({ t: Q(17.65) + i * EIGHTH, on: 'frog', i, note: ['D6', 'F6', 'A6'][i] })),
  ];
  // финал: грибочки прорастают вокруг строки журнала, потом «ЗАПИСЬ ПРЕРВАНА»
  const END_SPROUT = [0, 1, 2].map((i) => ev.title + 0.7 + i * EIGHTH);
  ev.endCut = END_SPROUT[2] + BEAT;
  const DURATION = ev.endCut + 1.3;

  const S = {
    sleep: [0, ev.reveal],
    reveal: [ev.reveal, ev.gone],
    silence: [ev.gone, ev.hit],
    end: [ev.hit, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    G: { notes: ['G3', 'B3', 'D4'], bass: 'G1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [[0, 0, 4, 'C'], [1, 0, 4, 'Am'], [2, 0, 4, 'F'], [3, 0, 4, 'G'], [4, 0, 4, 'C'], [5, 0, 4, 'Dm'], [6, 0, 4, 'Am'], [7, 0, 4, 'E'], [8, 0, 4, 'Am'], [9, 0, 2, 'E']]);
  // сонная колыбельная, медленные половинки
  const box = [
    ...placeBar(clock, [['E5', 0, 4], ['G5', 4, 4]], 0),
    ...placeBar(clock, [['A5', 0, 4], ['E5', 4, 4]], 1),
    ...placeBar(clock, [['F5', 0, 4], ['A5', 4, 4]], 2),
    ...placeBar(clock, [['G5', 0, 4], ['D5', 4, 4]], 3),
    ...placeBar(clock, [['C5', 0, 4]], 4),
    ...placeBar(clock, [['D5', 0, 4]], 5),
    ...placeBar(clock, [['C5', 0, 4], ['A4', 4, 4]], 6),
    ...placeBar(clock, [['B4', 0, 4], ['G#4', 4, 4]], 7),
    ...placeBar(clock, [['A4', 0, 8]], 8),
  ];

  // Морзе «ОСТАНЬСЯ» - и сбой: после «Н» лишняя заикающаяся точка (сигнал подделан)
  const code = { 'О': '---', 'С': '...', 'Т': '-', 'А': '.-', 'Н': '-.', 'Ь': '-..-', 'Я': '.-.-' };
  const MORSE = [];
  [...'ОСТАНЬСЯ'].forEach((ch, ci) => {
    [...code[ch]].forEach((s, i) => { if (i) MORSE.push([0, 1]); MORSE.push([1, s === '-' ? 3 : 1]); });
    if (ci === 4) { MORSE.push([0, 1]); MORSE.push([1, 1]); }
    MORSE.push([0, 3]);
  });
  MORSE[MORSE.length - 1] = [0, 7];
  const MLEN = MORSE.reduce((a, [, d]) => a + d, 0);
  const morseOn = (t) => {
    let x = ((t - clock.OFFSET) / EIGHTH) % MLEN; if (x < 0) x += MLEN;
    for (const [on, d] of MORSE) { if (x < d) return on; x -= d; }
    return 0;
  };

  const markers = {
    s1: { t: SPROUT[0].t, sync: 'a' },
    reveal: ev.reveal,
    gone: ev.gone,
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
    endCut: { t: ev.endCut, sync: 'a' },
  };

  const subtitles = [
    { t: VO_AT.p1, end: VO_AT.p1 + 3.7, text: 'На мягком мху Мерцаловой топи живут Моховички.' },
    { t: VO_AT.p2, end: VO_AT.p2 + 4.5, text: 'Они очень любят спать… и растут медленно-медленно.' },
    { t: VO_AT.p3, end: VO_AT.p3 + 3.7, text: 'Моховички растут на всём, что долго стоит на месте.' },
    { t: VO_AT.p4a, end: VO_AT.p4b - 0.1, text: 'На старом пне…' },
    { t: VO_AT.p4b, end: VO_AT.p5 - 0.1, text: '…на сонной лягушке…' },
    { t: VO_AT.p5, end: VO_AT.p5 + 3.4, text: '…и на тех, кто остался здесь слишком надолго.' },
    { t: VO_AT.p6, end: VO_AT.p6 + 2.7, text: 'Поэтому никогда не стойте на месте.' },
    { t: VO_AT.p7, end: VO_AT.p7 + 2.1, text: 'Вы ведь уже давно смотрите?' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №12' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    box, morseOn, subtitles, vo, SPROUT, END_SPROUT, LOG: '03:19' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
