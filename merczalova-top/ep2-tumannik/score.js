// «Мерцалова топь» — эпизод 2 «Туманник». Единый источник времени для музыки и картинки.
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

  // ---------- взгляды камеры и появления туманника ----------
  // look: камера поворачивается к силуэту (dir +1 вправо, -1 влево); на прибытии он исчезает
  // appear: камера вернулась в центр — силуэт уже на другом краю, ближе
  const LOOK = 0.30; // доля ширины кадра, на которую поворачивается камера
  const looks = [
    { from: T(3, 1), to: T(3, 2), dir: 1 },
    { from: T(4, 3), to: T(5, 1), dir: -1 },
    { from: T(6, 0), to: T(6, 1), dir: 1 },
  ];
  const backs = [
    { from: T(3, 3), to: T(4, 1) },
    { from: T(5, 2), to: T(5, 3) },
    { from: T(6, 2), to: T(6, 3) },
  ];
  // стадии силуэта: x — место в «центральном» виде (доля ширины), s — близость
  const stages = [
    { t: T(1, 0), end: T(3, 2), x: 0.86, s: 0 },
    { t: T(4, 1), end: T(5, 1), x: 0.13, s: 1 },
    { t: T(5, 3), end: T(6, 1), x: 0.87, s: 2 },
    { t: T(6, 3), end: T(7, 3), x: 0.10, s: 3 },
  ];

  const ev = {
    ticks: T(4, 1),     // с этого момента тикают «часы»
    breath: T(7, 3),    // силуэт молча пропадает, тишина
    eyeIn: T(8, 0),     // сбоку выплывает глаз
    eye: T(8, 1),       // глаз распахивается
    cut: T(8, 2),       // резкое затемнение
    title: T(8, 2.6),
  };
  const DURATION = T(9, 2.2);

  // озвучка: добавляется, когда придут файлы (voice/p1..p4.wav)
  const vo = [
    { file: 'voice/p1.wav', at: T(0, 1) - 0.05 },
    { file: 'voice/p2.wav', at: 5.45 },
    { file: 'voice/p3.wav', at: T(3, 2) - 3.13 },   // «исчезает» заканчивается ровно на исчезновении
    { file: 'voice/p4.wav', at: T(4, 1) - 0.11 },
    { file: 'voice/p5.wav', at: T(6, 3) + 0.3 },
  ];

  const S = {
    intro: [0, T(2)],
    rule: [T(2), T(4)],
    chase: [T(4), ev.breath],
    breath: [ev.breath, ev.eye],
    end: [ev.eye, DURATION],
  };

  // ---------- гармония: ре минор, тревожнее первой серии ----------
  const { chords, chordAt } = makeChords(clock, {
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    Bb: { notes: ['Bb3', 'D4', 'F4'], bass: 'Bb1' },
    Gm: { notes: ['G3', 'Bb3', 'D4'], bass: 'G1' },
    A: { notes: ['A3', 'C#4', 'E4'], bass: 'A1' },
    Dm9: { notes: ['A3', 'E4', 'F4'], bass: 'D2' },
  }, [
    [0, 0, 4, 'Dm'], [1, 0, 4, 'Bb'], [2, 0, 4, 'Gm'], [3, 0, 4, 'A'],
    [4, 0, 4, 'Dm'], [5, 0, 4, 'Bb'], [6, 0, 4, 'Gm'], [7, 0, 4, 'A'],
  ]);

  const LULL = {
    0: [['A5', 0, 2], ['F5', 2, 1], ['E5', 3, 1], ['D5', 4, 2], ['F5', 6, 2]],
    1: [['Bb5', 0, 2], ['A5', 2, 1], ['F5', 3, 1], ['D5', 4, 3]],
    2: [['G5', 0, 2], ['D5', 2, 1], ['Bb4', 3, 1], ['D5', 4, 2], ['G5', 6, 2]],
    3: [['E5', 0, 3], ['C#5', 3, 3]],
    4: [['A5', 0, 2], ['F5', 2, 2], ['D5', 4, 2], ['F5', 6, 2]],
    5: [['Bb5', 0, 2], ['F5', 2, 2], ['D5', 4, 2], ['Bb4', 6, 2]],
    6: [['G5', 0, 1], ['D5', 1, 1], ['G5', 2, 1], ['D5', 3, 1], ['G5', 4, 1], ['D5', 5, 1], ['G5', 6, 1], ['D5', 7, 1]],
    7: [['E5', 0, 1], ['C#5', 1, 1], ['E5', 2, 1], ['C#5', 3, 1], ['E5', 4, 1], ['C#5', 5, 1]],
  };
  let box = [];
  for (let b = 0; b <= 7; b++) box.push(...placeBar(clock, LULL[b], b));
  box = box.filter((n) => n.t < ev.breath - 0.05);

  // Морзе «ВЕРЬ»: В ·−−  Е ·  Р ·−·  Ь −··−  (единица = восьмая)
  const MORSE = [[1, 1], [0, 1], [1, 3], [0, 1], [1, 3], [0, 3], [1, 1], [0, 3], [1, 1], [0, 1], [1, 3], [0, 1], [1, 1], [0, 3],
    [1, 3], [0, 1], [1, 1], [0, 1], [1, 1], [0, 1], [1, 3], [0, 7]];
  const MLEN = MORSE.reduce((a, [, d]) => a + d, 0);
  const morseOn = (t) => {
    let x = ((t - clock.OFFSET) / EIGHTH) % MLEN; if (x < 0) x += MLEN;
    for (const [on, d] of MORSE) { if (x < d) return on; x -= d; }
    return 0;
  };

  const markers = {
    vanish1: { t: looks[0].to, sync: 'a' },
    appear1: { t: backs[0].to, sync: 'a' },
    vanish2: { t: looks[1].to, sync: 'a' },
    appear2: { t: backs[1].to, sync: 'a' },
    vanish3: { t: looks[2].to, sync: 'a' },
    appear3: { t: backs[2].to, sync: 'a' },
    breath: ev.breath,
    eye: { t: ev.eye, sync: 'av' },
    cut: ev.cut,
  };

  const subtitles = [
    { t: T(0, 1), end: 5.25, text: 'В тумане Мерцаловой топи живёт туманник.' },
    { t: 5.55, end: 7.15, text: 'Он очень пуглив.' },
    { t: 7.4, end: 10.6, text: 'Стоит на него посмотреть, и он исчезает.' },
    { t: T(4, 1), end: 16.0, text: 'Поэтому увидеть его можно только краем глаза.' },
    { t: T(6, 3), end: 22.75, text: 'Туманник никогда не приближается.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №2' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    LOOK, looks, backs, stages, box, morseOn, subtitles, vo };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
