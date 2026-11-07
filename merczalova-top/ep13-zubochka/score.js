// «Мерцалова топь» - эпизод 13 «Зубочка». Единый источник времени для музыки и картинки.
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
  // события в секундах, прижатые к восьмой
  const Q = (t) => clock.OFFSET + Math.round((t - clock.OFFSET) / EIGHTH) * EIGHTH;

  // фразы из mp3 ElevenLabs (voice/vo.mp3), нарезаны в voice/p*.wav; речь в файле начинается с ~0.14 с (p1 - с 0.23).
  // Длины речи (с): p1 4.41 (пауза после «Зубочка»), p2 3.52, p3 2.5, p4 2.9, p5 2.18, p5b 2.06, p6 1.77, p7a 0.83, p7b 1.3.
  const VO_AT = { p1: 0.5, p2: 5.1, p3: 8.8, p4: 11.9, p5: 15.5, p5b: 18.1, p6: 20.5, p7a: 23.2, p7b: 24.9 };
  const VO_LEN = { p1: 4.41, p2: 3.52, p3: 2.5, p4: 2.9, p5: 2.18, p5b: 2.06, p6: 1.77, p7a: 0.83, p7b: 1.3 };
  const LEAD = { p1: 0.23 };
  const vo = Object.keys(VO_AT).map((id) => ({ file: `voice/${id}.wav`, at: VO_AT[id] - (LEAD[id] || 0.14) }));

  const ev = {
    landFrog: Q(6.6),     // Зубочка садится у спящей лягушки
    tooth: Q(11.45),        // вынимает зубик (нота + блеск)
    pebble: Q(14.95),      // кладёт светящийся камушек (нота, бирюзовая вспышка)
    toNest: Q(15.45),      // летит к пню, камера следом
    reveal: Q(17.9),      // «Самое уютное…» - видны человеческие зубы
    toGap: Q(20.2),       // камера к пустому месту в гнезде
    gone: Q(22.55),        // тишина: музыка гаснет
    turn: Q(22.9),        // Зубочка поворачивается к камере
    smile: Q(24.2),       // улыбается: чужие зубы
    hit: Q(26.75),         // удар: мордочка вплотную
  };
  ev.cut = ev.hit + 3 * EIGHTH;
  ev.title = ev.cut + 0.5;
  ev.endPebble = ev.title + 1.0;        // в темноте загорается светящийся камушек
  ev.endCut = ev.endPebble + BEAT;
  const DURATION = ev.endCut + 1.3;

  const S = {
    fly: [0, ev.landFrog],
    frog: [ev.landFrog, ev.toNest],
    nest: [ev.toNest, ev.gone],
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

  // Морзе в окне будки - подделка «СПИ». Сбой: паузы между буквами слишком короткие (1 вместо 3) -
  // буквы сливаются, сигнал мигает ровно, как колыбельная.
  const code = { 'С': '...', 'П': '.--.', 'И': '..' };
  const MORSE = [];
  [...'СПИ'].forEach((ch) => {
    [...code[ch]].forEach((s, i) => { if (i) MORSE.push([0, 1]); MORSE.push([1, s === '-' ? 3 : 1]); });
    MORSE.push([0, 1]);
  });
  MORSE[MORSE.length - 1] = [0, 8];
  const MLEN = MORSE.reduce((a, [, d]) => a + d, 0);
  const morseOn = (t) => {
    let x = ((t - clock.OFFSET) / EIGHTH) % MLEN; if (x < 0) x += MLEN;
    for (const [on, d] of MORSE) { if (x < d) return on; x -= d; }
    return 0;
  };

  const markers = {
    tooth: { t: ev.tooth, sync: 'av' },
    pebble: { t: ev.pebble, sync: 'av' },
    toNest: ev.toNest,
    reveal: { t: ev.reveal, sync: 'a' },
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
    endPebble: { t: ev.endPebble, sync: 'av' },
  };

  const sub = (id, text, end) => ({ t: VO_AT[id], end: end || VO_AT[id] + VO_LEN[id], text });
  const subtitles = [
    sub('p1', 'Это Зубочка - самая маленькая фея Мерцаловой топи.'),
    sub('p2', 'Каждую ночь она навещает тех, кто крепко спит…'),
    sub('p3', '…и бережно забирает по одному зубику.'),
    sub('p4', 'А взамен оставляет светящийся камушек.'),
    sub('p5', 'Из зубиков она вьёт гнёздышко.'),
    sub('p5b', 'Самое уютное на болоте.'),
    sub('p6', 'Осталось совсем чуть-чуть.'),
    sub('p7a', 'Не бойтесь.'),
    sub('p7b', 'Вы даже не проснётесь.'),
    { t: ev.title, end: DURATION, text: 'Наблюдение №14' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, Q, S, m, chords, chordAt, ev, markers,
    box, morseOn, subtitles, vo, VO_AT, LOG: '03:21' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
