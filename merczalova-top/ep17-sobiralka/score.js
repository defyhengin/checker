// «Мерцалова топь» - эпизод 17 «Собиралка». Единый источник времени для музыки и картинки.
// Форма: обычная запись с камеры. Собиралка собирает потерянное, относит кассету в будку,
// а последней точкой маршрута оказывается сама камера - и тот, кто смотрит.
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
  const CLIP = { p1: 0.0, p2: 6.1, p3: 12.7, p4: 14.3, p5: 15.8, p6: 17.45, p7: 21.2, p8: 28.1, p9: 31.3, p10: 34.0, p11: 37.4 };
  const SHIFT = { p1: 0.4, p2: 0.4, p3: 0.4, p4: 0.4, p5: 0.4, p6: 0.4, p7: 0.4, p8: 0.4, p9: 0.4, p10: 3.0, p11: 3.0 };
  const vo = Object.keys(CLIP).map((id) => ({ file: `voice/${id}.wav`, at: CLIP[id] + SHIFT[id] }));
  // [кусок, начало речи, конец речи (секунды исходника), текст]
  const LINES = [
    ['p1', 0.13, 1.52, 'Это Собиралка.'],
    ['p1', 2.00, 5.39, 'Самая хозяйственная жительница Мерцаловой топи.'],
    ['p2', 6.37, 9.50, 'Всё, что теряется на болоте, она находит.'],
    ['p2', 9.94, 11.92, 'И ничего не пропадает зря.'],
    ['p3', 12.97, 13.56, 'Очки.'],
    ['p4', 14.60, 15.14, 'Ключик.'],
    ['p5', 16.11, 16.67, 'Пуговка.'],
    ['p6', 17.73, 20.72, 'А сегодня у неё особенная находка.'],
    ['p7', 21.43, 24.88, 'Кассеты она всегда относит одному и тому же другу.'],
    ['p7', 25.75, 27.51, 'Он очень любит смотреть записи.'],
    ['p8', 28.37, 30.74, 'Маршрут на сегодня почти закончен.'],
    ['p9', 31.52, 33.44, 'Осталась последняя точка.'],
    ['p10', 34.29, 36.82, 'Вы так долго стоите на одном месте.'],
    ['p11', 37.67, 39.85, 'Вас, наверное, тоже кто-то потерял.'],
  ];
  const at = (id, s) => s + SHIFT[id];

  const ev = {
    hello: at('p1', 0.6),               // Собиралка подпрыгивает у гнезда
    go: at('p1', 2.0),                  // отправляется в путь
    glasses: at('p3', 12.97),           // «Очки» - находка летит в корзинку
    key: at('p4', 14.60),               // «Ключик»
    button: at('p5', 16.11),            // «Пуговка»
    special: at('p6', 17.73),           // камера к кассете в иле
    raise: Q(at('p6', 20.72) + 0.2),    // поднимает кассету над головой
    toBooth: at('p7', 21.43),           // несёт кассету к будке
    atBooth: at('p7', 24.88),
    window: at('p7', 25.75),            // окошко приоткрывается
    take: Q(at('p7', 26.7)),            // лапка забирает кассету
    shut: Q(at('p7', 27.6)),            // окошко захлопывается
    zoomOut: at('p8', 28.37),           // вся карта
    last: at('p9', 31.52),              // ручка снова на карте
    turn: Q(at('p9', 32.2)),            // разворачивается и идёт к камере
    crawl: Q(at('p9', 33.44) + 0.3),    // тишина: только её шажки, всё ближе
  };
  ev.hit = Q(ev.crawl + 2.3);           // вплотную к объективу: в глазах - ваш экран
  ev.you = at('p10', 34.29);            // «Вы так долго…»
  ev.tap1 = Q(at('p10', 36.82) + 0.15); // тук-тук лапкой по объективу
  ev.tap2 = ev.tap1 + EIGHTH;
  ev.steps = at('p11', 37.67);          // лапки обхватывают камеру
  ev.lift = at('p11', 38.6);            // камеру поднимают
  ev.arrive = Q(at('p11', 39.85) + 0.5); // в корзинку - срез
  ev.dark = ev.arrive;
  ev.title = ev.dark + 0.5;
  ev.endCut = ev.title + 1.3;
  ev.near = ev.endCut + 0.4;            // в темноте - плетёнка корзинки и блеск находок
  // шорохи в корзинке
  const STEPS = [];
  for (let i = 0, t = ev.near; i < 7; i++) { STEPS.push(t); t += EIGHTH * 1.4 * (1 - i * 0.07); }
  const DURATION = STEPS[STEPS.length - 1] + 1.0;

  const S = {
    route: [0, ev.special],
    cassette: [ev.special, ev.zoomOut],
    back: [ev.zoomOut, ev.hit],
    you: [ev.hit, ev.dark],
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
  const PROG = ['Am', 'C', 'F', 'E', 'Am', 'C', 'Dm', 'E', 'F', 'C', 'Dm', 'E', 'Am', 'F', 'Dm', 'E'];
  const { chords, chordAt } = makeChords(clock, CH, PROG.map((c, i) => [i, 0, 4, c]));
  // шкатулка «шагает»: восьмые вверх-вниз, как пунктир
  const MEL = {
    Am: [['A5', 0, 1], ['C6', 1, 1], ['E6', 2, 2], ['C6', 4, 1], ['B5', 5, 1], ['A5', 6, 2]],
    C: [['G5', 0, 1], ['C6', 1, 1], ['E6', 2, 2], ['D6', 4, 2], ['C6', 6, 2]],
    F: [['A5', 0, 1], ['C6', 1, 1], ['F6', 2, 2], ['E6', 4, 1], ['C6', 5, 1], ['A5', 6, 2]],
    Dm: [['F5', 0, 1], ['A5', 1, 1], ['D6', 2, 2], ['C6', 4, 1], ['A5', 5, 1], ['F5', 6, 2]],
    E: [['G#5', 0, 2], ['B5', 2, 2], ['E6', 4, 4]],
  };
  const box = PROG.flatMap((c, i) => placeBar(clock, MEL[c], i));

  // Светлячок у будки чисто мигает «ОН В ЭКРАНЕ».
  const code = { 'О': '---', 'Н': '-.', 'В': '.--', 'Э': '..-..', 'К': '-.-', 'Р': '.-.', 'А': '.-', 'Е': '.' };
  const FLY = [];
  const UNIT = EIGHTH * 0.4;
  {
    let t = Q(ev.toBooth);
    for (const word of ['ОН', 'В', 'ЭКРАНЕ']) {
      for (const ch of word) {
        for (const s of code[ch]) { const d = (s === '-' ? 3 : 1) * UNIT; FLY.push([t, t + d]); t += d + UNIT; }
        t += 2 * UNIT;
      }
      t += 4 * UNIT;
    }
  }
  const flyOn = (t) => FLY.some(([a, b]) => t >= a && t < b);

  const markers = {
    go: ev.go,
    glasses: ev.glasses,
    key: ev.key,
    button: ev.button,
    special: ev.special,
    raise: ev.raise,
    turn: ev.turn,
    toBooth: ev.toBooth,
    window: ev.window,
    take: { t: ev.take, sync: 'a' },
    shut: ev.shut,
    zoomOut: ev.zoomOut,
    last: ev.last,
    crawl: ev.crawl,
    hit: { t: ev.hit, sync: 'av' },
    tap1: { t: ev.tap1, sync: 'av' },
    tap2: { t: ev.tap2, sync: 'av' },
    steps: ev.steps,
    lift: ev.lift,
    arrive: { t: ev.arrive, sync: 'av' },
    title: ev.title,
    near: ev.near,
  };

  const subtitles = LINES.map(([id, a, b, text]) => ({ t: at(id, a), end: at(id, b) + 0.15, text }));
  subtitles.push({ t: ev.title, end: DURATION, text: 'Наблюдение №18' });

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, Q, S, m, chords, chordAt, ev, markers,
    box, FLY, flyOn, subtitles, vo, STEPS, LOG: '03:25' };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
