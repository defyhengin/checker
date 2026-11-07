// «Мерцалова топь» — эпизод 8 «Фонарница». Единый источник времени для музыки и картинки.
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
    lost: T(2, 0),      // в камышах мечется заблудившийся светлячок
    reach: T(3, 2),     // Фонарница наклоняется и подставляет палец
    land: T(4, 3),      // светлячок садится к огонькам
    lead: T(5, 0),      // уводит его в туман
    close: T(6, 0),     // после «…к себе домой» — пальцы смыкаются, светлячок гаснет
    reveal: T(6, 2),    // туман редеет: огоньки вокруг — тоже её пальцы
    breath: T(8, 2),    // тишина
    hit: T(9, 0),       // огоньки вплотную у камеры
    cut: T(9, 3),
    title: T(9, 3.6),
  };
  const DURATION = T(11, 0);

  // фразы из mp3 ElevenLabs (voice/vo.mp3), длина речи: 4.9 / 5.0 / 3.1 / 0.85 / 5.4 с
  const vo = [
    { file: 'voice/p1.wav', at: T(0, 0.5) - 0.22 },
    { file: 'voice/p2.wav', at: T(2, 0) - 0.16 },
    { file: 'voice/p3.wav', at: T(4, 0) - 0.15 },
    { file: 'voice/p4.wav', at: T(5, 2) - 0.16 },
    { file: 'voice/p5.wav', at: T(6, 2) - 0.16 },
  ];

  const S = {
    intro: [0, ev.lost],
    lost: [ev.lost, ev.land],
    lead: [ev.land, ev.close],
    reveal: [ev.close, ev.breath],
    breath: [ev.breath, ev.hit],
    end: [ev.hit, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
  }, [[0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'C'], [3, 0, 4, 'E'], [4, 0, 4, 'Am'], [5, 0, 4, 'F'], [6, 0, 4, 'Dm'], [7, 0, 4, 'E'], [8, 0, 2, 'E']]);
  // колыбельная шкатулки
  const box = [
    ...placeBar(clock, [['E5', 0, 2], ['A5', 2, 2], ['G5', 4, 2], ['E5', 6, 2]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 4]], 1),
    ...placeBar(clock, [['E5', 0, 4], ['G5', 4, 4]], 2),
    ...placeBar(clock, [['B4', 0, 4], ['E5', 4, 4]], 3),
    ...placeBar(clock, [['C5', 0, 4]], 4),
    ...placeBar(clock, [['A4', 0, 4]], 5),
    ...placeBar(clock, [['D5', 0, 4], ['F5', 4, 4]], 6),
    ...placeBar(clock, [['E5', 0, 4]], 7),
  ];

  // огоньки в тумане (на самом деле кончики пальцев): позиции в долях кадра, фаза покачивания
  const R = U.mulberry32(808);
  const LIGHTS = [];
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    LIGHTS.push({ x: 0.5 + side * (0.12 + 0.36 * R()), y: 0.2 + 0.46 * R(), ph: R() * 6.28, r: 0.7 + 0.5 * R() });
  }
  // финальный экран: пять огоньков ладони загораются по одному
  const PALM = [0, 1, 2, 3, 4].map((i) => ev.title + 0.6 + i * EIGHTH);
  const PALM_NOTES = ['E5', 'C5', 'A4', 'F4', 'D#4'];

  // Морзе «БЕГИ»: Б −···  Е ·  Г −−·  И ··
  const code = { 'Б': '-...', 'Е': '.', 'Г': '--.', 'И': '..' };
  const MORSE = [];
  for (const ch of 'БЕГИ') {
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
    lost: ev.lost,
    land: ev.land,
    close: ev.close,
    reveal: ev.reveal,
    breath: ev.breath,
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const subtitles = [
    { t: T(0, 0.5), end: T(0, 0.5) + 5.0, text: 'Это Фонарница — самая заботливая жительница Мерцаловой топи.' },
    { t: T(2, 0), end: T(2, 0) + 5.1, text: 'Каждую ночь она зажигает огоньки и ищет тех, кто сбился с пути.' },
    { t: T(4, 0), end: T(4, 0) + 3.4, text: 'Она поможет найти дорогу всем, кто потерялся…' },
    { t: T(5, 2), end: T(5, 2) + 1.3, text: '…к себе домой.' },
    { t: T(6, 2), end: T(6, 2) + 2.4, text: 'Если вы видите огоньки в тумане…' },
    { t: T(6, 2) + 2.9, end: T(6, 2) + 5.5, text: '…значит, вы уже потерялись.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №9' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    box, morseOn, subtitles, vo, LIGHTS, PALM, PALM_NOTES, LOG: '03:16' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
