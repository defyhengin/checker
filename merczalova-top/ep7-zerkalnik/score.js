// «Мерцалова топь» — эпизод 7 «Зеркальник». Единый источник времени для музыки и картинки.
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
    drop: T(4, 0),      // капля с кувшинки — рябь, отражение дрожит
    tilt: T(4, 2),      // камера опускается к воде у берега
    shot2: T(5, 0),     // кадр 2: штатив и его отражение
    breath: T(7, 0),    // тишина
    hit: T(7, 2),       // рябь — и лицо уже вплотную
    cut: T(8, 2),
    title: T(8, 2.6),
  };
  const DURATION = T(9, 2);

  const vo = [
    { file: 'voice/p1.wav', at: T(0, 1) - 0.11 },
    { file: 'voice/p2.wav', at: T(2, 0) - 0.11 },
    { file: 'voice/p3.wav', at: T(3, 2) - 0.11 },
    { file: 'voice/p4.wav', at: T(5, 1) - 0.11 },
  ];

  const S = {
    intro: [0, T(2)],
    above: [T(2), ev.drop],
    drop: [ev.drop, ev.shot2],
    shore: [ev.shot2, ev.breath],
    breath: [ev.breath, ev.hit],
    end: [ev.hit, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [[0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'Dm'], [3, 0, 4, 'Am'], [4, 0, 4, 'F'], [5, 0, 4, 'Dm'], [6, 0, 4, 'E']]);
  // колыбельная; на каждую ноту — «эхо» на октаву ниже (отражение)
  const box = [
    ...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]], 1),
    ...placeBar(clock, [['D5', 0, 4], ['F5', 4, 4]], 2),
    ...placeBar(clock, [['E5', 0, 4], ['C5', 4, 4]], 3),
    ...placeBar(clock, [['A4', 4, 4]], 4),
    ...placeBar(clock, [['D5', 0, 4], ['F5', 4, 4]], 5),
    ...placeBar(clock, [['E5', 0, 4]], 6),
  ];

  // Морзе «СЗАДИ»: С ···  З −−··  А ·−  Д −··  И ··
  const code = { 'С': '...', 'З': '--..', 'А': '.-', 'Д': '-..', 'И': '..' };
  const MORSE = [];
  for (const ch of 'СЗАДИ') {
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
    drop: { t: ev.drop, sync: 'a' },
    tilt: ev.tilt,
    shot2: ev.shot2,
    breath: ev.breath,
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const subtitles = [
    { t: T(0, 1), end: T(0, 1) + 4.1, text: 'Зеркальник — самый скромный житель Мерцаловой топи.' },
    { t: T(2, 0), end: T(2, 0) + 2.3, text: 'Над водой его никогда не видно.' },
    { t: T(3, 2), end: T(3, 2) + 1.1, text: 'Только в отражении.' },
    { t: T(5, 1), end: T(5, 1) + 4.6, text: 'Если его отражение рядом с вашим… не оборачивайтесь.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №8' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    box, morseOn, subtitles, vo, LOG: '03:15' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
