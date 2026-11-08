// «Мерцалова топь» - эпизод 15 «Пуговка». Единый источник времени для музыки и картинки.
// Форма: уютный урок рукоделия. Пуговка пришивает себе глаза из блестящего; последний «глаз» - объектив.
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

  // voice/vo.mp3 (ElevenLabs) нарезан на p1..p7.wav. CLIP - начало куска в исходнике, AT - куда кладём в фильме.
  // Фразы внутри кусков (секунды исходника) - для субтитров.
  const CLIP = { p1: 0.0, p2: 1.40, p3: 8.2, p4: 17.15, p5: 26.2, p6: 32.0, p7: 37.22 };
  const SHIFT = { p1: 0.4, p2: 0.5, p3: 0.7, p4: 0.9, p5: 1.0, p6: 1.6, p7: 1.9 };
  const vo = Object.keys(CLIP).map((id) => ({ file: `voice/${id}.wav`, at: CLIP[id] + SHIFT[id] }));
  // [кусок, начало речи, конец речи (в исходнике), текст]
  const LINES = [
    ['p1', 0.12, 1.16, 'Это Пуговка.'],
    ['p2', 1.55, 3.56, 'Она очень любит рукоделие.'],
    ['p2', 3.92, 7.99, 'Сегодня Пуговка покажет вам, как пришить себе новый глазик.'],
    ['p3', 8.39, 12.19, 'Шаг первый. Найдите что-нибудь блестящее.'],
    ['p3', 12.40, 14.16, 'Росинку. Монетку.'],
    ['p3', 14.51, 16.85, 'Светлячок, к сожалению, улетел.'],
    ['p4', 17.34, 20.69, 'Шаг второй. Аккуратно проденьте нитку.'],
    ['p4', 21.07, 24.08, 'Пуговица с куртки. Стёклышко от часов.'],
    ['p4', 24.40, 26.0, 'Хозяину они больше не нужны.'],
    ['p5', 26.35, 28.59, 'Каждый глазик - на своё место.'],
    ['p5', 28.93, 30.82, 'Видите? Совсем не больно.'],
    ['p6', 32.19, 33.39, 'Шаг последний.'],
    ['p6', 33.75, 37.04, 'Возьмите самое блестящее, что есть на болоте.'],
    ['p7', 37.39, 38.17, 'Не моргайте.'],
  ];
  const at = (id, s) => s + SHIFT[id];

  const ev = {
    wave: 0.55,               // машет лапкой
    needle: Q(3.1),           // достаёт иглу из корзинки (блеск)
    point: Q(6.6),            // показывает на мордочку
    dew: Q(at('p3', 12.40) + 0.1),    // снимает росинку с камыша
    coin: Q(at('p3', 13.43) + 0.1),   // выуживает монетку
    reach: at('p3', 14.51),           // тянется к светлячку
    flee: Q(at('p3', 15.6)),          // светлячок улетает
    thread: Q(at('p4', 19.6)),        // нитка проходит в ушко
    button: Q(at('p4', 21.07)),       // пуговица с куртки
    watch: Q(at('p4', 22.70)),        // стёклышко от часов (03:12)
    sleeve: at('p4', 24.3),           // камера к рукаву куртки в камышах
    sew0: Q(at('p5', 26.45)),         // первый пришитый глаз (дальше на каждую восьмую)
    gone: Q(at('p5', 30.82) + 0.4),   // тишина
  };
  ev.turn = ev.gone + 2 * EIGHTH;      // все глаза разом - в камеру
  ev.close = Q(at('p6', 37.04) + 0.25); // крупно: игла к объективу
  ev.hit = Q(at('p7', 38.17) + 0.6);    // стежок через объектив
  ev.STITCH = [0, 1, 2, 3, 4, 5].map((i) => ev.hit + i * EIGHTH); // экран зашивают крест-накрест
  ev.dark = ev.STITCH[5] + EIGHTH;
  ev.title = ev.dark + 0.5;
  ev.endCut = ev.title + 1.3;
  ev.tug = ev.endCut + 0.9;             // в темноте нитку тянут ещё раз
  const DURATION = ev.tug + 1.6;

  const N_EYES = 10;
  ev.SEW = Array.from({ length: N_EYES }, (_, i) => ev.sew0 + i * EIGHTH);

  const S = {
    intro: [0, at('p3', 8.39)],
    step1: [at('p3', 8.39), at('p4', 17.34)],
    step2: [at('p4', 17.34), ev.sew0],
    sew: [ev.sew0, ev.gone],
    silence: [ev.gone, ev.hit],
    stitch: [ev.hit, ev.dark],
    end: [ev.dark, DURATION],
  };

  const CH = {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    C: { notes: ['G3', 'C4', 'E4'], bass: 'C2' },
    G: { notes: ['G3', 'B3', 'D4'], bass: 'G1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  };
  const PROG = ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E', 'Am', 'F', 'Dm', 'E'];
  const { chords, chordAt } = makeChords(clock, CH, PROG.map((c, i) => [i, 0, 4, c]));
  const MEL = {
    Am: [['A5', 0, 2], ['C6', 2, 2], ['E6', 4, 2], ['C6', 6, 2]],
    F: [['F5', 0, 2], ['A5', 2, 2], ['C6', 4, 4]],
    C: [['E5', 0, 2], ['G5', 2, 2], ['C6', 4, 2], ['G5', 6, 2]],
    G: [['D5', 0, 2], ['G5', 2, 2], ['B5', 4, 4]],
    Dm: [['F5', 0, 4], ['D5', 4, 4]],
    E: [['E5', 0, 4], ['G#4', 4, 4]],
  };
  const box = PROG.flatMap((c, i) => placeBar(clock, MEL[c], i));
  // пришитые глаза - ноты: восходящее арпеджио от аккорда в момент стежка
  const SEW_NOTES = ['A5', 'C6', 'E6', 'A6', 'E6', 'C6', 'E6', 'G#6', 'B6', 'E7'].map(m);

  // Светлячок-наблюдатель: пытается мигать «НЕ СМОТРИ», но ещё не умеет - сбивается, длины пляшут, буквы теряются.
  const code = { 'Н': '-.', 'Е': '.', 'С': '...', 'М': '--', 'О': '---', 'Т': '-', 'Р': '.-.', 'И': '..' };
  const rnd = U.mulberry32(1515);
  const FLY = [];  // [t0, t1] - когда горит
  {
    let t = ev.flee + 1.2;
    const unit = EIGHTH * 0.55;
    const word = [...'НЕСМОТРИ'];
    let li = 0;
    while (t < ev.close) {
      const ch = word[li % word.length]; li++;
      for (const s of code[ch]) {
        if (rnd() < 0.15) { t += unit * 2; continue; }               // потерянный сигнал
        const d = (s === '-' ? 3 : 1) * unit * (0.55 + rnd() * 1.1);  // сбивчивая длина
        FLY.push([t, t + d]);
        t += d + unit * (0.6 + rnd() * 0.8);
      }
      t += unit * (1 + rnd() * 4);
      if (ch === 'Е') t += unit * 3;
    }
  }
  const flyOn = (t) => FLY.some(([a, b]) => t >= a && t < b);

  const markers = {
    needle: { t: ev.needle, sync: 'av' },
    dew: ev.dew,
    coin: ev.coin,
    thread: { t: ev.thread, sync: 'v' },
    sew0: ev.sew0,
    sew5: { t: ev.SEW[5], sync: 'v' },
    gone: ev.gone,
    turn: { t: ev.turn, sync: 'a' },
    close: { t: ev.close, sync: 'v' },
    hit: { t: ev.hit, sync: 'av' },
    stitch3: { t: ev.STITCH[3], sync: 'v' },
    title: ev.title,
    tug: { t: ev.tug, sync: 'av' },
  };

  const subtitles = LINES.map(([id, a, b, text]) => ({ t: at(id, a), end: at(id, b) + 0.15, text }));
  subtitles.push({ t: ev.title, end: DURATION, text: 'Наблюдение №16' });

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, Q, S, m, chords, chordAt, ev, markers,
    box, SEW_NOTES, N_EYES, FLY, flyOn, subtitles, vo, LOG: '03:23' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
