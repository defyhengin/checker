// «Мерцалова топь» - эпизод 12 «Луноед». Единый источник времени для музыки и картинки.
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

  // фразы из mp3 ElevenLabs (voice/vo.mp3); речь в каждом файле начинается с 0.15 с.
  // Длины (с): p1 3.45, p2 4.8 (пауза после «по кусочку» на 3.3 с), p3 2.5, p4a 1.6, p4b 1.7.
  const VO_AT = { p1: 0.6, p2: 4.4, p3: 10.0, p4a: 13.3, p4b: 15.7 };
  const vo = Object.entries(VO_AT).map(([id, at]) => ({ file: `voice/${id}.wav`, at: at - 0.15 }));

  const ev = {
    bites: [Q(7.85), Q(9.5), Q(12.8)],  // укусы луны: луна всё тоньше
    lastBite: Q(15.2),                 // луна закончилась
    toBooth: Q(15.7),                   // камера к будке
    rise: Q(16.9),                      // за крышей поднимается силуэт с глазами-лунами
    windowBite: Q(17.75),               // из окна откусан кусок, Морзе обрывается
    gone: Q(18.1),                      // тишина и темнота
    hit: Q(19.75),                      // вплотную: Луноед откусывает от точки REC
  };
  ev.cut = ev.hit + 3 * EIGHTH;
  ev.title = ev.cut + 0.5;
  ev.endBite = ev.title + 1.0;          // на финальном экране откусан край точки REC
  ev.endCut = ev.endBite + BEAT;
  const DURATION = ev.endCut + 1.3;

  const S = {
    moon: [0, ev.lastBite],
    booth: [ev.lastBite, ev.gone],
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
  }, [[0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'C'], [3, 0, 4, 'G'], [4, 0, 4, 'Dm'], [5, 0, 4, 'E'], [6, 0, 4, 'Am']]);
  const box = [
    ...placeBar(clock, [['A5', 0, 2], ['C6', 2, 2], ['E6', 4, 4]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['A5', 2, 2], ['C6', 4, 4]], 1),
    ...placeBar(clock, [['E5', 0, 2], ['G5', 2, 2], ['C6', 4, 4]], 2),
    ...placeBar(clock, [['D5', 0, 2], ['G5', 2, 2], ['B5', 4, 4]], 3),
    ...placeBar(clock, [['F5', 0, 4], ['D5', 4, 4]], 4),
    ...placeBar(clock, [['E5', 0, 4], ['G#4', 4, 4]], 5),
  ];
  // каждый укус - на свою ноту, всё ниже
  const BITE_NOTES = ['E6', 'C6', 'A5', 'E5'];

  // Морзе «ИДИ НА СВЕТ» - обрывается, когда из окна откусывают кусок
  const code = { 'И': '..', 'Д': '-..', 'Н': '-.', 'А': '.-', 'С': '...', 'В': '.--', 'Е': '.', 'Т': '-' };
  const MORSE = [];
  for (const word of ['ИДИ', 'НА', 'СВЕТ']) {
    [...word].forEach((ch) => {
      [...code[ch]].forEach((s, i) => { if (i) MORSE.push([0, 1]); MORSE.push([1, s === '-' ? 3 : 1]); });
      MORSE.push([0, 3]);
    });
    MORSE[MORSE.length - 1] = [0, 7];
  }
  const MLEN = MORSE.reduce((a, [, d]) => a + d, 0);
  const morseOn = (t) => {
    if (t >= ev.windowBite) return 0;
    let x = ((t - clock.OFFSET) / EIGHTH) % MLEN; if (x < 0) x += MLEN;
    for (const [on, d] of MORSE) { if (x < d) return on; x -= d; }
    return 0;
  };

  const markers = {
    b1: { t: ev.bites[0], sync: 'a' },
    lastBite: { t: ev.lastBite, sync: 'av' },
    toBooth: ev.toBooth,
    windowBite: { t: ev.windowBite, sync: 'a' },
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
    endBite: { t: ev.endBite, sync: 'a' },
  };

  const subtitles = [
    { t: VO_AT.p1, end: VO_AT.p1 + 3.5, text: 'На верхушке старой ели живёт Луноед.' },
    { t: VO_AT.p2, end: VO_AT.p2 + 3.4, text: 'Каждую ночь он откусывает от луны по кусочку.' },
    { t: VO_AT.p2 + 3.75, end: VO_AT.p2 + 4.9, text: 'Совсем чуть-чуть.' },
    { t: VO_AT.p3, end: VO_AT.p3 + 2.6, text: 'Поэтому луна становится всё тоньше.' },
    { t: VO_AT.p4a, end: VO_AT.p4b - 0.1, text: 'А когда луна закончится…' },
    { t: VO_AT.p4b, end: VO_AT.p4b + 2.0, text: '…он поищет другой свет.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №13' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    box, morseOn, subtitles, vo, BITE_NOTES, LOG: '03:20' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
