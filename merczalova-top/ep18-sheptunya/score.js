// «Мерцалова топь» - эпизод 18 «Шептунья». Единый источник времени для музыки и картинки.
// Форма «АСМР»: Шептунья шепчет звуки болота, звук гуляет из уха в ухо.
// В тишине «выключи...» звучит только в правом ухе, хотя она сидит перед нами с закрытым ртом.
// Финал: она поднимает глаза и смотрит не на нас, а чуть мимо - справа от нас.
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

  // voice/vo.mp3 (ElevenLabs, 35.1 с) нарезан: CLIP - начало куска в исходнике, SHIFT - сдвиг в фильме, PAN - панорама.
  // wX («выключи») - только в правом ухе, тишина вокруг него растянута.
  const CLIP = { pA: 0.0, w1: 12.25, w2: 13.85, w3: 15.3, pB: 16.95, wX: 26.0, pC: 28.0 };
  const SHIFT = { pA: 0.4, w1: 0.4, w2: 0.4, w3: 0.4, pB: 0.4, wX: 1.6, pC: 2.4 };
  const PAN = { w1: -0.85, w2: 0.85, w3: 0, wX: 1 };
  const vo = Object.keys(CLIP).map((id) => ({ id, file: `voice/${id}.wav`, at: CLIP[id] + SHIFT[id], pan: PAN[id] }));
  const at = (id, s) => s + SHIFT[id];
  // [кусок, начало, конец (секунды исходника), текст]
  const LINES = [
    ['pA', 0.15, 1.28, 'Это Шептунья.'],
    ['pA', 1.69, 3.01, 'Наденьте наушники.'],
    ['pA', 3.30, 5.59, 'Она очень, очень тихая.'],
    ['pA', 6.10, 12.02, 'Шептунья собирает звуки ночной топи и бережно шепчет их тем, кто не может уснуть.'],
    ['w1', 12.44, 13.62, 'Шорох камыша...'],
    ['w2', 14.08, 14.96, 'капля росы...'],
    ['w3', 15.55, 16.69, 'лягушка зевает...'],
    ['pB', 17.13, 19.47, 'Слышите? Будто совсем рядом.'],
    ['pB', 19.90, 22.81, 'Она шепчет только тем, кто остался один.'],
    ['pB', 23.31, 25.28, 'Сейчас она шепчет вам.'],
    ['wX', 26.56, 27.22, '...выключи...'],
    ['pC', 28.76, 29.64, 'Не волнуйтесь.'],
    ['pC', 29.97, 32.00, 'Она здесь, прямо перед вами.'],
    ['pC', 32.38, 34.88, 'Видите? Она даже не открывает рот.'],
  ];

  const ev = {
    hello: at('pA', 0.3),
    phones: at('pA', 1.69),        // «наденьте наушники» - она поправляет уши
    collect: at('pA', 6.10),
    w1: at('w1', 12.44),           // шорох - слева
    w2: at('w2', 14.08),           // капля - справа
    w3: at('w3', 15.55),           // лягушка - в центре
    near: at('pB', 17.13),         // «Слышите?» - медленный наезд
    alone: at('pB', 19.90),
    you: at('pB', 23.31),          // «Сейчас она шепчет вам» - она закрывает рот
    hush: at('pB', 25.28) + 0.15,  // полная тишина
    wX: at('wX', 26.56),           // «выключи» справа
    calm: at('pC', 28.76),
    see: at('pC', 32.38),
    look: at('pC', 33.4),          // поднимает глаза - мимо нас, вправо
  };
  ev.hit = Q(at('pC', 34.88) + 0.45);   // удар в тишине после фразы
  ev.cut = Q(ev.hit + 1.3);
  ev.dark = ev.cut;
  ev.title = ev.dark + 0.5;
  ev.endCut = ev.title + 1.3;
  ev.tail = ev.endCut + 0.5;             // в темноте снова шёпот справа
  ev.egg = ev.tail + 1.6;                // 4 кадра «журнал: mercalova_top»
  const DURATION = ev.egg + 1.0;

  const CH = {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  };
  const PROG = ['Am', 'F', 'C', 'E', 'Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm', 'E'];
  const { chords, chordAt } = makeChords(clock, CH, PROG.map((c, i) => [i, 0, 4, c]));
  // шкатулка редкая и тихая - АСМР
  const MEL = {
    Am: [['E6', 0, 3], ['C6', 4, 4]],
    F: [['A5', 0, 3], ['C6', 4, 4]],
    C: [['G5', 0, 3], ['E6', 4, 4]],
    Dm: [['F5', 0, 3], ['A5', 4, 4]],
    E: [['G#5', 0, 4], ['B5', 4, 4]],
  };
  const box = PROG.flatMap((c, i) => placeBar(clock, MEL[c], i));

  // Светлячок у будки беззвучно мигает «ВЫКЛЮЧИ» целиком, чисто, и заканчивает перед тишиной.
  const code = { 'В': '.--', 'Ы': '-.--', 'К': '-.-', 'Л': '.-..', 'Ю': '..--', 'Ч': '---.', 'И': '..' };
  const UNIT = EIGHTH * 0.4;
  const raw = []; let tt = 0;
  for (const ch of 'ВЫКЛЮЧИ') { for (const s of code[ch]) { const d = (s === '-' ? 3 : 1) * UNIT; raw.push([tt, tt + d]); tt += d + UNIT; } tt += 2 * UNIT; }
  const flyStart = Q(ev.hush - 0.3 - tt);
  const FLY = raw.map(([a, b]) => [a + flyStart, b + flyStart]);
  const flyOn = (t) => FLY.some(([a, b]) => t >= a && t < b);

  const markers = {
    phones: ev.phones, w1: ev.w1, w2: ev.w2, w3: ev.w3, near: ev.near, you: ev.you, hush: ev.hush, wX: ev.wX, look: ev.look,
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'av' },
    title: ev.title, tail: ev.tail, egg: ev.egg,
  };

  const subtitles = LINES.map(([id, a, b, text]) => ({ t: at(id, a), end: at(id, b) + 0.15, text, right: id === 'wX' }));
  subtitles.push({ t: ev.title, end: DURATION, text: 'Наблюдение №19' });

  const S = { intro: [0, ev.w1], asmr: [ev.w1, ev.you], hush: [ev.hush, ev.hit], you: [ev.hit, ev.dark], end: [ev.dark, DURATION] };
  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, Q, S, m, chords, chordAt, ev, markers,
    box, FLY, flyOn, subtitles, vo, LOG: '03:26' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
