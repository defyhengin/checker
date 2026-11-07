// «Мерцалова топь» — эпизод 4 «Мохнач». Единый источник времени для музыки и картинки.
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
    peek: T(1, 2),      // выглядывает из мха
    hide: T(3, 0),      // «прячет мордочку» — лапы на морду
    turn: T(4, 2),      // «отворачивается»
    breath: T(5, 0),    // тишина
    eye0: T(5, 2),      // первый глаз на спине
    blink: T(9, 0),     // все глаза моргают разом — удар
    cut: T(9, 2),
    title: T(9, 2.6),
  };
  const DURATION = T(10, 2);

  // глаза на спине: каждый открывается на ноту шкатулки (восьмые), к концу — по два
  const EYE_NOTES = ['A5', 'E5', 'C6', 'B5', 'A5', 'E6', 'D6', 'C6', 'B5', 'G#5', 'A5', 'E5', 'C6', 'A6'];
  const eyes = [];
  {
    const rnd = U.mulberry32(404);
    // точки на спине (нормированные координаты в эллипсе спины), раскладываем без наложений
    const spots = [];
    let tries = 0;
    while (spots.length < 24 && tries < 4000) {
      tries++;
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.86;
      const x = Math.cos(a) * r, y = Math.sin(a) * r * 0.95 - 0.05;
      const s = 0.55 + rnd() * 0.6;
      if (spots.every((p) => Math.hypot(p.x - x, (p.y - y) * 1.1) > (p.s + s) * 0.15)) spots.push({ x, y, s });
    }
    // крупные — первыми, мелкие — потом, гурьбой
    spots.sort((p, q) => q.s - p.s);
    spots.forEach((p, i) => {
      const step = i < EYE_NOTES.length ? i : EYE_NOTES.length + (i - EYE_NOTES.length) * 0.25;
      const t = ev.eye0 + step * EIGHTH;
      eyes.push({ ...p, t, note: i < EYE_NOTES.length ? m(EYE_NOTES[i]) : null });
    });
  }
  const lastEye = eyes[eyes.length - 1].t;

  // озвучка ElevenLabs (Maksim). at — момент начала файла (в каждом ~0.15 c тишины в начале)
  const vo = [
    { file: 'voice/p1.wav', at: T(0, 1) - 0.11 },
    { file: 'voice/p2.wav', at: T(2, 1) - 0.11 },
    { file: 'voice/p3.wav', at: T(4, 0) - 0.11 },
    { file: 'voice/p4.wav', at: T(7, 2) - 0.11 },
  ];

  const S = {
    intro: [0, T(2)],
    look: [T(2), ev.turn],
    turn: [ev.turn, ev.breath],
    breath: [ev.breath, ev.eye0],
    eyes: [ev.eye0, ev.blink],
    end: [ev.blink, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [
    [0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'Dm'], [3, 0, 4, 'Am'], [4, 0, 4, 'E'],
    [6, 0, 4, 'Am'], [7, 0, 4, 'F'], [8, 0, 4, 'E'],
  ]);
  // колыбельная шкатулки во вступлении
  const box = [
    ...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]], 1),
    ...placeBar(clock, [['D5', 0, 2], ['F5', 4, 2]], 2),
    ...placeBar(clock, [['E5', 0, 2], ['C5', 4, 2]], 3),
    ...placeBar(clock, [['B4', 0, 4]], 4),
  ];

  // Морзе «ГДЕ»: Г −−·  Д −··  Е ·
  const code = { 'Г': '--.', 'Д': '-..', 'Е': '.' };
  const MORSE = [];
  for (const ch of 'ГДЕ') {
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
    hide: ev.hide,
    turn: { t: ev.turn, sync: 'v' },
    breath: ev.breath,
    eye0: { t: ev.eye0, sync: 'a' },
    blink: { t: ev.blink, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const subtitles = [
    { t: T(0, 1), end: T(0, 1) + 4.6, text: 'Мохнач — самое застенчивое существо Мерцаловой топи.' },
    { t: T(2, 1), end: T(2, 1) + 2.9, text: 'Когда на него смотрят, он прячет мордочку.' },
    { t: T(4, 0), end: T(4, 0) + 1.5, text: 'И отворачивается.' },
    { t: T(7, 2), end: T(7, 2) + 3.8, text: 'Поэтому мохнач никогда не теряет вас из виду.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №5' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    eyes, lastEye, box, morseOn, subtitles, vo };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
