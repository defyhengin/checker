// «Мерцалова топь» — эпизод 1 «Обманка».
// THE SCORE — единый источник времени для музыки И картинки.
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
  // 84 BPM колыбельная: 1 доля = 0.714 c, такт = 2.857 c
  const clock = makeClock({ bpm: 84, offset: 0.4 });
  const { T, BEAT } = clock;
  const EIGHTH = BEAT / 2;

  // ---------- ключевые события ----------
  const ev = {
    land: T(4, 0),        // светлячок садится на лепесток
    closeStart: T(4, 1),  // лепестки смыкаются
    closeEnd: T(4, 2.5),
    breath: T(4, 3),      // тишина: мир затаил дыхание
    snap: T(5, 0),        // ХЛОП: цветок утягивает под воду
    eyes: T(5, 1),        // под водой открываются глаза
    eyesClose: T(7, 1),
    rise: T(7, 2),        // кувшинка всплывает как ни в чём не бывало
    second: T(8, 2),      // вторая кувшинка загорается у самой камеры
  };
  const DURATION = ev.second + 2.6; // ~27.3 c

  // озвучка (ElevenLabs, голос Maksim): файл фразы и момент, когда она звучит
  const vo = [
    { file: 'voice/p1.wav', at: T(0, 1) - 0.05 },
    { file: 'voice/p2.wav', at: T(1, 3) - 0.12 },
    { file: 'voice/p3.wav', at: T(3, 3) - 0.11 },
    { file: 'voice/p4.wav', at: T(5, 2) - 0.12 },
  ];

  const S = {
    intro: [0, T(2)],
    lure: [T(2), ev.breath],
    breath: [ev.breath, ev.snap],
    reveal: [ev.snap, ev.rise],
    calm: [ev.rise, ev.second],
    end: [ev.second, DURATION],
  };

  // ---------- гармония (ля минор, сказочно-тревожно) ----------
  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    Amadd9: { notes: ['A3', 'B3', 'C4', 'E4'], bass: 'A1' },
  }, [
    [0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'C'], [3, 0, 4, 'Dm'], [4, 0, 3, 'E'],
    [7, 2, 2, 'Am'], [8, 0, 4, 'Amadd9'], [9, 0, 2, 'Amadd9'],
  ]);

  // колыбельная музыкальной шкатулки: каждая нота зажигает светлячок
  const LULLABY = {
    0: [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 2], ['C5', 6, 2]],
    1: [['F5', 0, 2], ['E5', 2, 1], ['C5', 3, 1], ['A4', 4, 3]],
    2: [['G5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 2], ['E5', 6, 2]],
    3: [['F5', 0, 2], ['D5', 2, 1], ['C5', 3, 1], ['A4', 4, 2], ['D5', 6, 2]],
    4: [['B4', 0, 3], ['G#4', 3, 3]],
    7: [['E5', 4, 2], ['C5', 6, 1], ['B4', 7, 1]],
    8: [['A4', 0, 4]],
  };
  const box = [...placeBar(clock, LULLABY[0], 0), ...placeBar(clock, LULLABY[1], 1), ...placeBar(clock, LULLABY[2], 2),
    ...placeBar(clock, LULLABY[3], 3), ...placeBar(clock, LULLABY[4], 4)].filter((n) => n.t < ev.breath - 0.05);
  // после всплытия шкатулка звучит снова — чуть расстроенная
  const boxDetuned = [...placeBar(clock, LULLABY[7], 7), ...placeBar(clock, LULLABY[8], 8)].map((n) => ({ ...n, detune: -0.35 }));

  // светлячки: каждый рождается на ноте шкатулки
  const rnd = U.mulberry32(19);
  const fireflies = box.map((n, i) => ({
    t: n.t, i, midi: n.midi,
    x: (0.12 + 0.76 * rnd()) * W,
    y: (0.18 + 0.36 * rnd()) * H,
    ph: rnd() * 6.28, orb: (0.09 + 0.12 * rnd()) * W, w: (0.4 + 0.5 * rnd()) * (rnd() < 0.5 ? -1 : 1),
  }));
  const HERO = 2; // этот светлячок сядет на цветок

  // Морзе «НЕ» в окне будки: единица = восьмая. Н = —·  Е = ·
  const MORSE = [[1, 3], [0, 1], [1, 1], [0, 3], [1, 1], [0, 7]]; // 16 восьмых = 2 такта
  const morseOn = (t) => {
    if (t < 0) return 0;
    let x = ((t - clock.OFFSET) / EIGHTH) % 16; if (x < 0) x += 16;
    for (const [on, d] of MORSE) { if (x < d) return on; x -= d; }
    return 0;
  };

  const markers = {
    land: ev.land,
    breath: ev.breath,
    snap: { t: ev.snap, sync: 'av' },
    eyes: ev.eyes,
    rise: ev.rise,
    second: { t: ev.second, sync: 'av' },
  };

  // субтитры (они же текст для озвучки в ElevenLabs)
  const subtitles = [
    { t: T(0, 1), end: T(1, 2.4), text: 'В Мерцаловой топи цветёт лунная кувшинка.' },
    { t: T(1, 3), end: T(2, 2.4), text: 'Её свет виден издалека.' },
    { t: T(2, 2.1), end: T(3, 2.8), text: 'Светлячки летят к нему со всей округи.' },
    { t: T(3, 3), end: T(4, 2.8), text: 'Кувшинка очень гостеприимна.' },
    { t: T(5, 2), end: T(6, 1.5), text: 'Кувшинка не растёт из дна.' },
    { t: T(6, 2), end: T(7, 2.1), text: 'Она растёт из того, кто под ней.' },
    { t: T(7, 2.5), end: T(8, 1.8), text: 'Наблюдение №1' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    box, boxDetuned, fireflies, HERO, morseOn, subtitles, vo };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
