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

  // фразы из mp3 ElevenLabs (voice/vo.mp3), нарезаны в voice/p*.wav; речь в файле начинается с ~0.14 с.
  const VO_AT = { p1: 0.4, p1b: 5.45, p2: 7.25, p2b: 10.35, p3: 12.6, p3b: 14.9, p4: 17.0, p5: 22.7, p5b: 25.4, p6: 27.8, p7: 31.9, p7b: 33.05, p7c: 34.0 };
  const VO_LEN = { p1: 4.76, p1b: 1.45, p2: 2.86, p2b: 1.91, p3: 1.97, p3b: 1.79, p4: 3.98, p5: 2.29, p5b: 0.8, p6: 3.33, p7: 0.84, p7b: 0.65, p7c: 1.65 };
  const LEAD = {};
  const vo = Object.keys(VO_AT).map((id) => ({ file: `voice/${id}.wav`, at: VO_AT[id] - (LEAD[id] || 0.14) }));

  const ev = {
    reveal: Q(6.0),        // «Это бессонник» - в окне загорается свет монитора, виден силуэт
    morse: Q(13.3),        // «мигает огоньком» - окно начинает мигать
    approach: Q(17.0),     // существа подбираются ближе, камера едет к будке
    gone: Q(21.2),         // тишина
    knock: Q(21.5),        // три стука в дверь (по восьмой)
    door: Q(25.1),         // дверь открывается - тёплый прямоугольник
    shadow: Q(26.0),       // по полосе света проходит тень
    shut: Q(27.2),         // дверь закрывается, окно гаснет
    eyes: Q(28.1),         // все глаза в камышах поворачиваются в камеру
    turn: Q(31.4),         // камера разворачивается: темнота, экран, лицо
    sour: Q(35.9),         // одна фальшивая нота шкатулки
  };
  ev.cut = ev.sour + 3 * EIGHTH;
  ev.title = ev.cut + 0.5;
  ev.endKnock = ev.title + 0.9;          // в темноте - полоска света под дверью и три стука
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
    reveal: { t: ev.reveal, sync: 'v' },
    knock1: { t: knocks[0], sync: 'a' },
    door: { t: ev.door, sync: 'av' },
    shut: { t: ev.shut, sync: 'av' },
    turn: ev.turn,
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
