// «Мерцалова топь» - эпизод 14 «Бессонник». Единый источник времени для музыки и картинки.
// Взгляд наоборот: существа из камышей наблюдают за человеком в будке, а в конце - за зрителем.
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
  const Q = (t) => clock.OFFSET + Math.round((t - clock.OFFSET) / EIGHTH) * EIGHTH;

  // ЧЕРНОВИК: тайминги фраз оценочные, после mp3 - заменить на реальные.
  const VO_AT = { p1: 0.5, p1b: 4.7, p2: 6.6, p2b: 9.8, p3: 12.0, p3b: 14.1, p4: 16.6, p5: 22.0, p5b: 24.5, p6: 27.2, p7: 31.2, p7b: 32.6, p7c: 33.7 };
  const VO_LEN = { p1: 4.0, p1b: 1.3, p2: 3.0, p2b: 1.8, p3: 1.8, p3b: 2.0, p4: 3.4, p5: 2.2, p5b: 1.2, p6: 3.2, p7: 1.1, p7b: 0.8, p7c: 1.7 };
  const LEAD = {};
  const vo = Object.keys(VO_AT).map((id) => ({ file: `voice/${id}.wav`, at: VO_AT[id] - (LEAD[id] || 0.14) }));

  const ev = {
    reveal: Q(4.7),        // «Это бессонник» - в окне загорается свет монитора, виден силуэт
    morse: Q(12.0),        // «мигает огоньком» - окно начинает мигать
    approach: Q(16.6),     // существа подбираются ближе, камера едет к будке
    gone: Q(20.6),         // тишина
    knock: Q(21.1),        // три стука в дверь (по восьмой)
    door: Q(24.3),         // дверь открывается - тёплый прямоугольник
    shadow: Q(25.2),       // по полосе света проходит тень
    shut: Q(26.0),         // дверь закрывается, окно гаснет
    eyes: Q(28.6),         // все глаза в камышах поворачиваются в камеру
    turn: Q(30.2),         // камера разворачивается: темнота, экран, лицо
    sour: Q(35.6),         // одна фальшивая нота шкатулки
  };
  ev.cut = ev.sour + 4 * EIGHTH;
  ev.title = ev.cut + 0.5;
  ev.endKnock = ev.title + 1.1;          // в темноте - полоска света под дверью и три стука
  ev.endCut = ev.endKnock + 3 * EIGHTH + BEAT;
  const DURATION = ev.endCut + 1.3;

  const S = {
    booth: [0, ev.gone],
    silence: [ev.gone, ev.turn],
    viewer: [ev.turn, ev.cut],
    end: [ev.cut, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    G: { notes: ['G3', 'B3', 'D4'], bass: 'G1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [[0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'C'], [3, 0, 4, 'G'], [4, 0, 4, 'Am'], [5, 0, 4, 'F'], [6, 0, 4, 'Dm'], [7, 0, 4, 'E']]);
  const box = [
    ...placeBar(clock, [['A5', 0, 2], ['C6', 2, 2], ['E6', 4, 2], ['C6', 6, 2]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['A5', 2, 2], ['C6', 4, 4]], 1),
    ...placeBar(clock, [['E5', 0, 2], ['G5', 2, 2], ['C6', 4, 2], ['G5', 6, 2]], 2),
    ...placeBar(clock, [['D5', 0, 2], ['G5', 2, 2], ['B5', 4, 4]], 3),
    ...placeBar(clock, [['A5', 0, 2], ['C6', 2, 2], ['E6', 4, 4]], 4),
    ...placeBar(clock, [['F5', 0, 2], ['A5', 2, 2], ['C6', 4, 4]], 5),
    ...placeBar(clock, [['F5', 0, 4], ['D5', 4, 4]], 6),
    ...placeBar(clock, [['E5', 0, 4], ['G#4', 4, 4]], 7),
  ];

  // Морзе в окне - подделка «ОТКРОЙ». Сбой: тире короткие (2 вместо 3), их легко спутать с точками.
  const code = { 'О': '---', 'Т': '-', 'К': '-.-', 'Р': '.-.', 'Й': '.---' };
  const MORSE = [];
  [...'ОТКРОЙ'].forEach((ch) => {
    [...code[ch]].forEach((s, i) => { if (i) MORSE.push([0, 1]); MORSE.push([1, s === '-' ? 2 : 1]); });
    MORSE.push([0, 3]);
  });
  MORSE[MORSE.length - 1] = [0, 8];
  const MLEN = MORSE.reduce((a, [, d]) => a + d, 0);
  const morseOn = (t) => {
    let x = ((t - ev.morse) / EIGHTH) % MLEN; if (x < 0) x += MLEN;
    for (const [on, d] of MORSE) { if (x < d) return on; x -= d; }
    return 0;
  };

  const knocks = [0, 1, 2].map((i) => ev.knock + i * EIGHTH);
  const endKnocks = [0, 1, 2].map((i) => ev.endKnock + i * EIGHTH);

  const markers = {
    reveal: { t: ev.reveal, sync: 'av' },
    knock1: { t: knocks[0], sync: 'a' },
    door: { t: ev.door, sync: 'av' },
    shut: { t: ev.shut, sync: 'av' },
    turn: { t: ev.turn, sync: 'v' },
    sour: { t: ev.sour, sync: 'a' },
    cut: { t: ev.cut, sync: 'v' },
    endKnock: { t: ev.endKnock, sync: 'av' },
  };

  const sub = (id, text, end) => ({ t: VO_AT[id], end: end || VO_AT[id] + VO_LEN[id], text });
  const subtitles = [
    sub('p1', 'Сегодня мы наблюдаем за самым редким жителем Мерцаловой топи.'),
    sub('p1b', 'Это бессонник.'),
    sub('p2', 'Он строит себе маленький домик на краю болота…'),
    sub('p2b', '…и совсем не спит по ночам.'),
    sub('p3', 'Иногда он мигает огоньком.'),
    sub('p3b', 'Так бессонники зовут своих.'),
    sub('p4', 'Мы долго наблюдали за ним. Очень, очень близко.'),
    sub('p5', 'Однажды ночью к нему постучали.'),
    sub('p5b', 'И он открыл.'),
    sub('p6', 'Но не волнуйтесь. Бессонники не переводятся.'),
    sub('p7', 'Вот ещё один.'),
    sub('p7b', 'Не спит.'),
    sub('p7c', 'И смотрит прямо на нас.'),
    { t: ev.title, end: DURATION, text: 'Наблюдение №15' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, Q, S, m, chords, chordAt, ev, markers,
    box, morseOn, knocks, endKnocks, subtitles, vo, VO_AT, LOG: '03:22' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
