// «Мерцалова топь» - эпизод 19 «Баюнок». Единый источник времени для музыки и картинки.
// Форма «Камера засыпает»: Баюнок поёт самой камере. Шторка объектива смыкается, как веки.
// После каждого «моргания» кто-то укрыт моховым одеяльцем. После последнего - мир лежит на боку:
// камеру уложили спать. Сам Баюнок не моргает ни разу.
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

  // voice/vo.mp3 (ElevenLabs, 33.3 с) нарезан: CLIP - начало куска в исходнике, SHIFT - сдвиг в фильме.
  const CLIP = { pA: 0.0, pB: 17.7, pC: 27.3, pD: 31.2 };
  const SHIFT = { pA: 0.4, pB: 0.4, pC: 0.4, pD: 2.6 };
  const vo = Object.keys(CLIP).map((id) => ({ id, file: `voice/${id}.wav`, at: CLIP[id] + SHIFT[id] }));
  const at = (id, s) => s + SHIFT[id];
  // [кусок, начало, конец (секунды исходника), текст]
  const LINES = [
    ['pA', 0.12, 1.02, 'Это Баюнок.'],
    ['pA', 1.58, 3.08, 'Сам он не спит никогда.'],
    ['pA', 3.51, 5.31, 'Зато умеет укладывать других.'],
    ['pA', 5.82, 9.07, 'Он качается, как камыш, и тихонько поёт.'],
    ['pA', 9.72, 11.67, 'Кто услышал - уже зевает.'],
    ['pA', 12.23, 13.83, 'Баюнок укроет каждого.'],
    ['pA', 14.32, 16.72, 'Никто на топи не должен мёрзнуть во сне.'],
    ['pB', 18.64, 21.91, 'А сегодня он заметил: кто-то всё ещё не спит.'],
    ['pB', 22.41, 24.70, 'Кто-то смотрит на топь каждую ночь.'],
    ['pB', 25.06, 26.47, 'И совсем не моргает.'],
    ['pC', 28.06, 28.78, 'Вот так.'],
    ['pC', 29.26, 30.53, 'Глазки закрываются.'],
    ['pD', 31.98, 33.03, 'Спокойной ночи.'],
  ];

  const ev = {
    hello: at('pA', 0.12),
    sway: at('pA', 5.82),          // «качается, как камыш»
    sing: at('pA', 7.92),          // «и тихонько поёт» - клюв приоткрыт, гудит
    yawn: at('pA', 9.72),          // лягушка зевает
    b1: at('pA', 11.95),           // моргание 1 (шторка сомкнута) - после него лягушка укрыта
    tuck: at('pA', 12.23),
    b2: at('pA', 17.3),            // моргание 2, дольше - укрыты грибочки и окно будки
    notice: at('pB', 18.64),       // «он заметил» - голова поворачивается в объектив
    someone: at('pB', 20.34),      // идёт к нам
    watch: at('pB', 22.41),
    noblink: at('pB', 25.06),      // вплотную, глаза во весь кадр
    vot: at('pC', 28.06),          // «Вот так» - веко клюёт носом
    eyes: at('pC', 29.26),         // «Глазки закрываются»
  };
  ev.shut = at('pC', 30.53) + 0.2;        // шторка сомкнута, полная тишина
  ev.hit = Q(ev.shut + 2.3);              // открывается - мир на боку, удар
  ev.night = at('pD', 31.98);             // «Спокойной ночи» (после удара, не на нём)
  ev.close = at('pD', 33.03) + 0.7;       // шторка смыкается в последний раз
  ev.dark = ev.close + 1.3;
  ev.title = ev.dark + 0.4;
  ev.endCut = ev.title + 1.4;             // «ЗАПИСЬ УСНУЛА»
  ev.tail = ev.endCut + 0.6;              // в темноте два немигающих глаза, колыбельная продолжается
  const DURATION = ev.tail + 2.4;

  // шторка: 0 - открыта, 1 - сомкнута. Чистая функция t.
  const r01 = (t, a, b) => Math.max(0, Math.min(1, (t - a) / (b - a)));
  const sm = (t, a, b) => { const x = r01(t, a, b); return x * x * (3 - 2 * x); };
  const B1 = [ev.b1 - 0.45, ev.b1 - 0.1, ev.b1 + 0.3, ev.b1 + 0.7];
  const B2 = [ev.b2 - 0.7, ev.b2 - 0.2, ev.b2 + 0.55, ev.b2 + 1.05];
  function lid(t) {
    if (t >= ev.dark) return 1;
    if (t >= ev.hit) return sm(t, ev.close, ev.dark);
    if (t >= ev.shut) return 1;
    let v = 0;
    v = Math.max(v, sm(t, B1[0], B1[1]) * (1 - sm(t, B1[2], B1[3])));
    v = Math.max(v, sm(t, B2[0], B2[1]) * (1 - sm(t, B2[2], B2[3])));
    v = Math.max(v, 0.06 * sm(t, B2[3], B2[3] + 1));                               // веки тяжелеют
    v = Math.max(v, 0.16 * sm(t, ev.noblink, ev.vot));
    v = Math.max(v, 0.62 * sm(t, ev.vot - 0.1, ev.vot + 0.45) * (1 - 0.55 * sm(t, ev.vot + 0.5, ev.vot + 0.9))); // клюёт носом
    v = Math.max(v, sm(t, ev.eyes, ev.shut));
    return v;
  }
  // что уже укрыто (меняется, пока шторка сомкнута)
  const stage = (t) => (t < ev.b1 ? 0 : t < ev.b2 ? 1 : 2);

  const CH = {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  };
  const PROG = ['Am', 'F', 'C', 'E', 'Am', 'F', 'Dm', 'E', 'Am', 'F', 'C', 'E', 'Am', 'F', 'Dm', 'E', 'Am', 'F', 'C', 'E'];
  const { chords, chordAt } = makeChords(clock, CH, PROG.map((c, i) => [i, 0, 4, c]));
  // колыбельная шкатулки (та же, что в серии)
  const MEL = {
    Am: [['A5', 0, 1], ['C6', 1, 1], ['E6', 2, 2], ['C6', 4, 1], ['B5', 5, 1], ['A5', 6, 2]],
    C: [['G5', 0, 1], ['C6', 1, 1], ['E6', 2, 2], ['D6', 4, 2], ['C6', 6, 2]],
    F: [['A5', 0, 1], ['C6', 1, 1], ['F6', 2, 2], ['E6', 4, 1], ['C6', 5, 1], ['A5', 6, 2]],
    Dm: [['F5', 0, 1], ['A5', 1, 1], ['D6', 2, 2], ['C6', 4, 1], ['A5', 5, 1], ['F5', 6, 2]],
    E: [['G#5', 0, 2], ['B5', 2, 2], ['E6', 4, 4]],
  };
  const box = PROG.flatMap((c, i) => placeBar(clock, MEL[c], i));
  // Баюнок гудит ту же мелодию на две октавы ниже, длинными нотами (с «и тихонько поёт»)
  const HUM = { Am: ['A3', 'E4'], F: ['A3', 'F4'], C: ['G3', 'E4'], Dm: ['F3', 'D4'], E: ['G#3', 'E4'] };
  const hum = PROG.flatMap((c, i) => HUM[c].map((n, j) => ({ t: T(i, j * 2), dur: BEAT * 2, midi: m(n) })));

  // Светлячок у будки мигает «ВЫКЛЮЧИ» - моргания камеры съедают буквы, конец слова уходит под шторку.
  const code = { 'В': '.--', 'Ы': '-.--', 'К': '-.-', 'Л': '.-..', 'Ю': '..--', 'Ч': '---.', 'И': '..' };
  const UNIT = EIGHTH * 0.4;
  const raw = []; let tt = 0;
  for (const ch of 'ВЫКЛЮЧИ') { for (const s of code[ch]) { const d = (s === '-' ? 3 : 1) * UNIT; raw.push([tt, tt + d]); tt += d + UNIT; } tt += 2 * UNIT; }
  const flyStart = Q(B2[1] + 0.3 - tt);
  const FLY = raw.map(([a, b]) => [a + flyStart, b + flyStart]);
  const flyOn = (t) => FLY.some(([a, b]) => t >= a && t < b);

  const markers = {
    sing: ev.sing, yawn: ev.yawn, b1: ev.b1, b2: ev.b2, notice: ev.notice, noblink: ev.noblink, vot: ev.vot, shut: ev.shut,
    hit: { t: ev.hit, sync: 'av' },
    night: ev.night, close: ev.close, title: ev.title, tail: ev.tail,
  };

  const subtitles = LINES.map(([id, a, b, text]) => ({ t: at(id, a), end: at(id, b) + 0.15, text }));
  subtitles.push({ t: ev.title, end: DURATION, text: 'Наблюдение №20' });

  const S = { intro: [0, ev.sing], song: [ev.sing, ev.notice], you: [ev.notice, ev.shut], hush: [ev.shut, ev.hit], side: [ev.hit, ev.dark], end: [ev.dark, DURATION] };
  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, Q, S, m, chords, chordAt, ev, markers,
    box, hum, FLY, flyOn, flyStart, lid, stage, subtitles, vo, LOG: '03:27' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
