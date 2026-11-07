// «Мерцалова топь» — эпизод 6 «Тишка». Единый источник времени для музыки и картинки.
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

  // каждый источник звука «съедается» в свой момент: дальше он молчит
  const ev = {
    frogsOff: T(2, 3),   // «…замолкают лягушки»
    windOff: T(4, 1),    // «Затихает ветер»
    musicOff: T(6, 0),   // после «…любит тишину» — шкатулка
    voiceCut: T(6, 2) - 0.11 + 3.075, // рассказчик обрывается на «гово…» (по огибающей mp3)
    turn: T(8, 0),       // тишка медленно поворачивается к камере
    click: T(8, 2),      // один сухой щелчок — и темнота
    title: T(8, 2.6),
  };
  ev.cut = ev.click;
  const DURATION = T(9, 2);

  // лягушки: кваканье до frogsOff
  const croaks = [];
  for (let b = 0; b < 3; b++) for (const beat of [0, 1.5, 2.5]) { const t = T(b, beat); if (t < ev.frogsOff - 0.2) croaks.push({ t, who: (b + beat * 2) % 2 | 0 }); }
  // порывы ветра до windOff
  const gusts = [];
  for (let t = 0.6; t < ev.windOff - 0.3; t += 1.7) gusts.push({ t });

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [[0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'Dm'], [3, 0, 4, 'Am'], [4, 0, 4, 'F'], [5, 0, 4, 'E']]);
  const box = [
    ...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]], 1),
    ...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 2),
    ...placeBar(clock, [['D5', 0, 2], ['F5', 4, 2]], 3),
    ...placeBar(clock, [['E5', 0, 2], ['C5', 4, 2]], 4),
    ...placeBar(clock, [['B4', 0, 2], ['E5', 4, 2]], 5),
  ].filter((n) => n.t < ev.musicOff - 0.05);

  const vo = [
    { file: 'voice/p1.wav', at: T(0, 1) - 0.11 },
    { file: 'voice/p2.wav', at: T(2, 0) - 0.11 },
    { file: 'voice/p3.wav', at: T(3, 3) - 0.11 },
    { file: 'voice/p4.wav', at: T(5, 0) - 0.11 },
    { file: 'voice/p5.wav', at: T(6, 2) - 0.11, cutAt: ev.voiceCut },
  ];

  const S = {
    intro: [0, T(2)],
    frogs: [T(2), ev.windOff],
    wind: [ev.windOff, ev.musicOff],
    last: [ev.musicOff, ev.voiceCut],
    silence: [ev.voiceCut, ev.click],
    end: [ev.click, DURATION],
  };

  // Морзе «МОЛЧИ»: М −−  О −−−  Л ·−··  Ч −−−·  И ··
  const code = { 'М': '--', 'О': '---', 'Л': '.-..', 'Ч': '---.', 'И': '..' };
  const MORSE = [];
  for (const ch of 'МОЛЧИ') {
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
    frogsOff: ev.frogsOff,
    windOff: ev.windOff,
    musicOff: ev.musicOff,
    voiceCut: ev.voiceCut,
    turn: ev.turn,
    click: { t: ev.click, sync: 'av' },
  };

  const subtitles = [
    { t: T(0, 1), end: T(0, 1) + 3.9, text: 'Тишка — самый тихий житель Мерцаловой топи.' },
    { t: T(2, 0), end: T(2, 0) + 2.9, text: 'Там, где он проходит, замолкают лягушки.' },
    { t: T(3, 3), end: T(3, 3) + 1.3, text: 'Затихает ветер.' },
    { t: T(5, 0), end: T(5, 0) + 2.1, text: 'Тишка очень любит тишину.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №7' },
  ];
  // последняя фраза рисуется по буквам (буквы улетают тишке в рот)
  const LAST = { t: T(6, 2), lines: ['Поэтому, когда тишка', 'рядом, лучше не гово'] };

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    croaks, gusts, box, morseOn, subtitles, LAST, vo, LOG: '03:14' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
