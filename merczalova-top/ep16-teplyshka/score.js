// «Мерцалова топь» - эпизод 16 «Тёплышка». Единый источник времени для музыки и картинки.
// Форма: объявление о находке + взгляд через тепло. Куртка наблюдателя дышит, греет и ищет хозяина по теплу.
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

  // voice/vo.mp3 (ElevenLabs) нарезан на куски. CLIP - начало куска в исходнике, SHIFT - сдвиг в фильме.
  const CLIP = { p1: 0.0, p2: 6.4, p3: 13.2, p4: 19.3, p4b: 27.6, p5: 29.5, p6: 35.0, p7: 39.8 };
  const SHIFT = { p1: 0.4, p2: 0.4, p3: 0.5, p4: 0.8, p4b: 1.4, p5: 1.7, p6: 4.1, p7: 4.3 };
  const vo = Object.keys(CLIP).map((id) => ({ file: `voice/${id}.wav`, at: CLIP[id] + SHIFT[id] }));
  // [кусок, начало речи, конец речи (секунды исходника), текст]
  const LINES = [
    ['p1', 0.18, 2.08, 'Найдена тёплая куртка.'],
    ['p1', 2.56, 3.50, 'Очень добрая.'],
    ['p1', 3.99, 5.12, 'Немного скучает.'],
    ['p2', 6.68, 8.59, 'Одной пуговицы не хватает.'],
    ['p2', 8.94, 10.34, 'В кармане - ручка.'],
    ['p2', 10.89, 12.16, 'А хозяина рядом нет.'],
    ['p3', 13.47, 15.92, 'Тёплышка ищет хозяина по теплу.'],
    ['p3', 16.37, 18.16, 'Вот так она видит болото.'],
    ['p4', 19.62, 21.77, 'Эта лягушка совсем замёрзла.'],
    ['p4', 22.34, 24.18, 'Тёплышка обняла её рукавом.'],
    ['p4', 24.53, 25.14, 'Вот так.'],
    ['p4', 25.64, 27.18, 'Лягушке больше не холодно.'],
    ['p4b', 27.85, 28.55, 'Совсем.'],
    ['p5', 29.82, 31.04, 'Хорошие новости.'],
    ['p5', 31.49, 34.12, 'Кажется, она нашла нового хозяина.'],
    ['p6', 35.32, 38.05, 'Самое тёплое место на болоте сейчас -'],
    ['p6', 38.30, 39.21, 'ваши руки.'],
    ['p7', 40.13, 41.11, 'Не убирайте их.'],
    ['p7', 41.52, 42.46, 'Она уже идёт.'],
  ];
  const at = (id, s) => s + SHIFT[id];

  const ev = {
    sad: at('p1', 3.99),               // капюшон грустно поникает
    btn: at('p2', 6.68),               // камера к пустому месту пуговицы
    pocket: Q(at('p2', 9.82) + 0.05),  // «ручка»: клапан кармана приподнимается, блеск
    empty: at('p2', 10.89),            // отъезд: никого
    sniff: at('p3', 13.47),            // капюшон поднимается и принюхивается
    thermal: Q(at('p3', 16.37) + 0.35), // переход в тепловое зрение
    shiver: at('p4', 19.62),           // лягушка дрожит
    wrap: Q(at('p4', 22.34) + 0.25),   // рукав тянется к лягушке
    drain0: at('p4', 25.4),            // тепло лягушки уходит в куртку
    frogOut: Q(at('p4b', 28.55) + 0.1), // «Совсем»: последнее пятнышко гаснет
    good: at('p5', 29.82),             // куртка разгорается
    look: at('p5', 31.49),             // капюшон медленно поворачивается к камере
    gone: Q(at('p5', 34.12) + 0.35),   // тишина
  };
  ev.release = ev.frogOut + 0.6;
  ev.whip = ev.gone + 5 * EIGHTH;      // резкий разворот камеры
  ev.hit = ev.whip + 2 * EIGHTH;       // ваши руки - самое тёплое
  ev.hands = at('p6', 38.30);          // «ваши руки» - руки разгораются ещё ярче
  ev.come = at('p7', 41.52);           // «Она уже идёт» - рукав выползает снизу
  ev.grab = Q(at('p7', 42.46) + 0.4);  // рукав касается пальца - срез в темноту
  ev.dark = ev.grab;
  ev.title = ev.dark + 0.5;
  ev.endCut = ev.title + 1.3;
  ev.cool = ev.endCut + 0.7;           // в темноте остаются тёплые следы пальцев и остывают
  const DURATION = ev.cool + 2.2;

  const S = {
    found: [0, ev.thermal],
    thermal: [ev.thermal, ev.gone],
    silence: [ev.gone, ev.hit],
    hands: [ev.hit, ev.dark],
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
  const PROG = ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E', 'Am', 'F', 'C', 'G', 'Dm', 'E', 'Am', 'E'];
  const { chords, chordAt } = makeChords(clock, CH, PROG.map((c, i) => [i, 0, 4, c]));
  const MEL = {
    Am: [['E5', 0, 2], ['A5', 2, 2], ['C6', 4, 3], ['B5', 7, 1]],
    F: [['A5', 0, 2], ['C6', 2, 2], ['F5', 4, 4]],
    C: [['G5', 0, 2], ['E5', 2, 2], ['C6', 4, 2], ['G5', 6, 2]],
    G: [['B5', 0, 3], ['A5', 3, 1], ['G5', 4, 4]],
    Dm: [['F5', 0, 2], ['A5', 2, 2], ['D6', 4, 4]],
    E: [['E5', 0, 4], ['G#5', 4, 4]],
  };
  const box = PROG.flatMap((c, i) => placeBar(clock, MEL[c], i));

  // Светлячок-наблюдатель: впервые мигает чисто «НЕ СМОТРИ». Единица - чуть больше шестнадцатой.
  const code = { 'Н': '-.', 'Е': '.', 'С': '...', 'М': '--', 'О': '---', 'Т': '-', 'Р': '.-.', 'И': '..' };
  const FLY = [];
  const UNIT = EIGHTH * 0.6;
  {
    let t = Q(ev.thermal + 1.4);
    for (const word of ['НЕ', 'СМОТРИ']) {
      for (const ch of word) {
        for (const s of code[ch]) { const d = (s === '-' ? 3 : 1) * UNIT; FLY.push([t, t + d]); t += d + UNIT; }
        t += 2 * UNIT;
      }
      t += 4 * UNIT;
    }
  }
  const flyOn = (t) => FLY.some(([a, b]) => t >= a && t < b);

  const markers = {
    pocket: { t: ev.pocket, sync: 'v' },
    thermal: { t: ev.thermal, sync: 'v' },
    wrap: ev.wrap,
    frogOut: ev.frogOut,
    gone: ev.gone,
    whip: ev.whip,
    hit: { t: ev.hit, sync: 'av' },
    hands: ev.hands,
    come: ev.come,
    grab: { t: ev.grab, sync: 'av' },
    title: ev.title,
    cool: ev.cool,
  };

  const subtitles = LINES.map(([id, a, b, text]) => ({ t: at(id, a), end: at(id, b) + 0.15, text }));
  subtitles.push({ t: ev.title, end: DURATION, text: 'Наблюдение №17' });

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, Q, S, m, chords, chordAt, ev, markers,
    box, FLY, flyOn, subtitles, vo, LOG: '03:24' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
