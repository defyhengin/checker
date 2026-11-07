// «Мерцалова топь» — эпизод 9 «Пряталки». Единый источник времени для музыки и картинки.
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
    hide1: T(2, 0),     // прячется за камышинку (всё видно)
    hide2: T(3, 0),     // за лист кувшинки — торчат уши и глаза
    back: T(4, 0),      // выходит, «а теперь его очередь искать»
    cover: T(4, 3),     // закрывает глаза пальчиками
    count0: T(5, 0),    // раз… два… три… четыре… пять (по счёту каждые 2 доли)
    peek: T(6, 2),      // на «четыре» между пальцами приоткрывается глаз
    gone: T(7, 1),      // тишина: на кочке пусто
    hit: T(9, 0),       // он у самого объектива
    cut: T(9, 3),
    title: T(9, 3.6),
    window: T(10, 1.6), // в темноте загорается окно будки, в нём уши
  };
  const COUNTS = [0, 1, 2, 3, 4].map((i) => ev.count0 + i * BEAT * 2);
  const DURATION = T(11, 1);

  // фразы из mp3 ElevenLabs (voice/vo.mp3); речь в каждом файле начинается с 0.15 с.
  // Счёт порезан по словам и стоит ровно на нотах шкатулки.
  const VO_AT = { p1: T(0, 0.5), p2: T(1, 3), p3: T(4, 0), p5: T(7, 3) };
  const vo = [
    { file: 'voice/p1.wav', at: VO_AT.p1 - 0.15 },
    { file: 'voice/p2.wav', at: VO_AT.p2 - 0.15 },
    { file: 'voice/p3.wav', at: VO_AT.p3 - 0.15 },
    ...COUNTS.map((t, i) => ({ file: `voice/c${i + 1}.wav`, at: t - 0.15, gain: 1.6 })),
    { file: 'voice/p5.wav', at: VO_AT.p5 - 0.15 },
  ];

  const S = {
    play: [0, ev.back],
    seek: [ev.back, ev.gone],
    silence: [ev.gone, ev.hit],
    end: [ev.hit, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    G: { notes: ['G3', 'B3', 'D4'], bass: 'G1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [[0, 0, 4, 'C'], [1, 0, 4, 'Am'], [2, 0, 4, 'F'], [3, 0, 4, 'G'], [4, 0, 4, 'Am'], [5, 0, 4, 'Dm'], [6, 0, 4, 'E'], [7, 0, 2, 'E']]);
  // игривая колыбельная (до мажор), с «поиска» — минор
  const box = [
    ...placeBar(clock, [['G5', 0, 1], ['E5', 1, 1], ['G5', 2, 1], ['E5', 3, 1], ['C6', 4, 2], ['G5', 6, 2]], 0),
    ...placeBar(clock, [['A5', 0, 1], ['E5', 1, 1], ['A5', 2, 1], ['E5', 3, 1], ['C6', 4, 4]], 1),
    ...placeBar(clock, [['F5', 0, 2], ['A5', 2, 2], ['C6', 4, 4]], 2),
    ...placeBar(clock, [['G5', 0, 2], ['B5', 2, 2], ['D6', 4, 4]], 3),
    ...placeBar(clock, [['E5', 0, 4], ['C5', 4, 4]], 4),
  ];
  // счёт: по ноте шкатулки на каждое «раз… два…», вниз и всё тише
  const COUNT_NOTES = ['A5', 'G5', 'E5', 'D5', 'A4'];
  // спрятался: короткая нота-«ой» на каждое укрытие
  const HIDE_NOTES = [[ev.hide1, 'E6'], [ev.hide2, 'G6']];

  // Морзе «ПОЗДНО»: П ·−−·  О −−−  З −−··  Д −··  Н −·  О −−−
  const code = { 'П': '.--.', 'О': '---', 'З': '--..', 'Д': '-..', 'Н': '-.' };
  const MORSE = [];
  for (const ch of 'ПОЗДНО') {
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
    hide1: ev.hide1,
    hide2: ev.hide2,
    cover: ev.cover,
    count0: ev.count0,
    peek: ev.peek,
    gone: { t: ev.gone, sync: 'v' },
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const subtitles = [
    { t: VO_AT.p1, end: VO_AT.p1 + 4.2, text: 'Это Прятыш — самый весёлый малыш Мерцаловой топи.' },
    { t: VO_AT.p2, end: VO_AT.p2 + 2.3, text: 'Он очень любит играть в прятки.' },
    { t: VO_AT.p2 + 2.56, end: VO_AT.p2 + 5.0, text: 'Правда, прятаться он пока не умеет.' },
    { t: VO_AT.p3, end: VO_AT.p3 + 2.3, text: 'А теперь его очередь искать.' },
    ...['Раз…', 'два…', 'три…', 'четыре…', 'пять.'].map((w, i) => ({ t: COUNTS[i], end: COUNTS[i] + 1.1, text: w })),
    { t: VO_AT.p5, end: VO_AT.p5 + 1.1, text: 'Не бойтесь.' },
    { t: VO_AT.p5 + 1.3, end: VO_AT.p5 + 3.0, text: 'Он всегда находит.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №10' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    box, morseOn, subtitles, vo, COUNTS, COUNT_NOTES, HIDE_NOTES, LOG: '03:17' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
