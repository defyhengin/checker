// «Мерцалова топь» - эпизод 10 «Пузырёк». Единый источник времени для музыки и картинки.
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
    pop1: T(4, 2.5),    // пузырь лопается - «ква»
    pop2: T(5, 2),      // пузырь лопается - жужжание светлячка
    descend: T(5, 3),   // камера опускается на дно (лампа, тетрадь)
    down: T(7, 0),
    blow: T(7, 2),      // надувает щёки, выдувает большой пузырь
    release: T(8, 1),   // пузырь отрывается и плывёт к камере
    gone: T(9, 0),      // тишина
    pop: T(9, 2),       // большой пузырь лопается у объектива - шёпот
    hit: T(10, 1),      // мордочка вплотную к стеклу
    cut: T(10, 3),
    title: T(10, 3.6),
  };
  ev.endPop = ev.title + 1.4; // на финальном экране лопается пузырёк -> «ЗАПИСЬ ПРЕРВАНА»
  const RISE = 1.7;           // столько поднимается «звуковой» пузырь от рта до поверхности
  const DURATION = T(12, 1);

  // фразы из mp3 ElevenLabs (voice/vo.mp3); речь в каждом файле начинается с 0.15 с.
  // Длины фраз (с): p1 4.2, p2 2.4, p3 3.2, p4a 1.3, p4b 1.5, p5 4.1, p6a 0.7, p6b 1.8, p7 (шёпот) 0.9.
  const VO_AT = { p1: T(0, 0.5), p2: T(1, 3), p3: T(2, 3), p4a: T(4, 0), p4b: T(4, 3.5), p5: T(5, 3), p6a: T(7, 2), p6b: T(8, 0), p7: ev.pop + 0.25 };
  const vo = Object.entries(VO_AT).map(([id, at]) => ({ file: `voice/${id}.wav`, at: at - 0.15, gain: id === 'p7' ? 1.8 : 1 }));

  const S = {
    play: [0, ev.descend],
    deep: [ev.descend, ev.gone],
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
  }, [[0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'C'], [3, 0, 4, 'G'], [4, 0, 4, 'Am'], [5, 0, 4, 'F'], [6, 0, 4, 'Dm'], [7, 0, 4, 'E'], [8, 0, 4, 'Am']]);
  // колыбельная шкатулки (ля минор), редкая - чтобы между нотами слышались «бульки»
  const box = [
    ...placeBar(clock, [['E5', 0, 2], ['A5', 2, 2], ['C6', 4, 2], ['B5', 6, 2]], 0),
    ...placeBar(clock, [['A5', 0, 3], ['F5', 3, 1], ['C6', 4, 4]], 1),
    ...placeBar(clock, [['G5', 0, 2], ['E5', 2, 2], ['C6', 4, 4]], 2),
    ...placeBar(clock, [['B5', 0, 2], ['G5', 2, 2], ['D6', 4, 4]], 3),
    ...placeBar(clock, [['E5', 0, 4]], 4),
    ...placeBar(clock, [['C5', 0, 4]], 5),
    ...placeBar(clock, [['D5', 0, 4], ['F5', 4, 4]], 6),
    ...placeBar(clock, [['E5', 0, 4], ['G#5', 4, 4]], 7),
    ...placeBar(clock, [['A4', 0, 8]], 8),
  ];
  // мелкие пузырьки (без звуковых): выдыхает их на доли, каждый со своей «бульк»-нотой
  const rng = U.mulberry32(1010);
  const SMALL = [];
  for (let i = 0; i < 9; i++) {
    const t = T(1, 2) + i * BEAT * 0.75 + (rng() - 0.5) * 0.12;
    SMALL.push({ t, size: 0.6 + rng() * 0.6, dx: (rng() - 0.5) * 2, note: ['A5', 'C6', 'E6', 'G5'][i % 4] });
  }
  // звуковые пузыри: внутри огонёк, на поверхности лопаются - и звук вылетает
  const SOUND = [
    { t: ev.pop1, kind: 'frog', note: 'E6' },
    { t: ev.pop2, kind: 'fly', note: 'A6' },
  ];

  // Морзе «ЛОЖЬ» - и один сбой: второе тире «О» тянется вдвое дольше (сигнал подделан)
  const code = { 'Л': '.-..', 'О': '---', 'Ж': '...-', 'Ь': '-..-' };
  const MORSE = [];
  for (const ch of 'ЛОЖЬ') {
    [...code[ch]].forEach((s, i) => {
      if (i) MORSE.push([0, 1]);
      MORSE.push([1, s === '-' ? (ch === 'О' && i === 1 ? 6 : 3) : 1]);
    });
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
    pop1: { t: ev.pop1, sync: 'a' },  // всплеск мелкий - картинку не меряем
    pop2: { t: ev.pop2, sync: 'av' },
    descend: ev.descend,
    blow: ev.blow,
    release: ev.release,
    gone: ev.gone,
    pop: { t: ev.pop, sync: 'av' },
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
    endPop: { t: ev.endPop, sync: 'a' },
  };

  const subtitles = [
    { t: VO_AT.p1, end: VO_AT.p1 + 4.3, text: 'Под кувшинками Мерцаловой топи живёт крошечный Пузырёк.' },
    { t: VO_AT.p2, end: VO_AT.p2 + 2.5, text: 'Он очень любит пускать пузыри.' },
    { t: VO_AT.p3, end: VO_AT.p3 + 3.3, text: 'А в каждый пузырь он бережно прячет звук.' },
    { t: VO_AT.p4a, end: VO_AT.p4b - 0.1, text: 'Кваканье лягушки…' },
    { t: VO_AT.p4b, end: VO_AT.p5 - 0.1, text: '…жужжание светлячка…' },
    { t: VO_AT.p5, end: VO_AT.p5 + 4.3, text: 'Пузырёк собирает звуки всех, кто когда-нибудь упал в воду.' },
    { t: VO_AT.p6a, end: VO_AT.p6b - 0.05, text: 'А этот…' },
    { t: VO_AT.p6b, end: VO_AT.p6b + 2.0, text: '…он берёг специально для вас.' },
    { t: VO_AT.p7, end: ev.hit - 0.05, text: 'не верь…', whisper: true },
    { t: ev.title, end: DURATION, text: 'Наблюдение №11' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    box, morseOn, subtitles, vo, SMALL, SOUND, RISE, LOG: '03:18' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
