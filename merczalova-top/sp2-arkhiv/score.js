// «Мерцалова топь» - спецвыпуск «Архив». Камера CAM-2 внутри будки, 03:17. Пиксель-арт, без нового голоса:
// на мониторе кто-то монтирует 1-ю серию (её голос глухо из динамика), лапа мигает лампой поддельное «ОТКРОЙ»,
// экспорт «НАБЛЮДЕНИЕ_01», монитор гаснет - в чёрном экране отражение: уши, куртка наблюдателя, оборачивается.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const { m, makeClock, placeBar } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const STYLE = 'pixel';
  const clock = makeClock({ bpm: 84, offset: 0.4 });
  const { T, BEAT } = clock;
  const SIX = BEAT / 4;

  const ev = {
    beep: 0.4, cam: 2.4,
    play: 3.6,                        // на мониторе запускается 1-я серия
    paw: 5.6, morse0: 6.2, morse1: 0, pawGone: 0,
    glitch: 11.6,                     // кадр в мониторе на миг чёрный - мелькает отражение
    exp0: 16.5, type0: 16.8, bar0: 18.4, bar1: 20.6, done: 20.7,
    dark: 21.6,                       // монитор гаснет, тишина
    turn0: 22.6, turn1: 23.8,         // отражение оборачивается
    hit: 24.6, cut: 0, next: 0,
  };
  ev.cut = ev.hit + 0.9;
  ev.next = ev.cut + 1.6;
  const DURATION = ev.next + 2.4;

  // таймкод: на ev.cam 03:17:40
  const TC0 = 3 * 3600 + 17 * 60 + 40;
  const tcAt = (t) => TC0 + Math.max(0, t - ev.cam);

  // голос 1-й серии из динамика монитора
  const vo = [
    { file: 'voice/p1.wav', at: ev.play + 0.3 },
    { file: 'voice/p2.wav', at: ev.play + 4.4 },
    { file: 'voice/p3.wav', at: ev.play + 10.0 },
  ];
  // субтитры внутри монитора (двумя строками)
  const msubs = [
    { t: vo[0].at, end: vo[0].at + 3.6, l: ['В Мерцаловой топи', 'цветёт лунная кувшинка.'] },
    { t: vo[1].at, end: vo[1].at + 2.0, l: ['Её свет виден', 'издалека.'] },
    { t: vo[1].at + 2.1, end: vo[1].at + 5.2, l: ['Светлячки летят к нему', 'со всей округи.'] },
    { t: vo[2].at, end: vo[2].at + 2.9, l: ['Кувшинка очень', 'гостеприимна.'] },
  ];

  // поддельное «ОТКРОЙ»: тире короткие (2 единицы вместо 3)
  const CODE = { О: '---', Т: '-', К: '-.-', Р: '.-.', Й: '.---' };
  const FLASH = [];
  let u = 0;
  [...'ОТКРОЙ'].forEach((ch) => {
    [...CODE[ch]].forEach((s, i) => { if (i) u += 1; const d = s === '-' ? 2 : 1; FLASH.push([ev.morse0 + u * SIX, ev.morse0 + (u + d) * SIX]); u += d; });
    u += 3;
  });
  ev.morse1 = ev.morse0 + (u - 3) * SIX;
  ev.pawGone = ev.morse1 + 0.5;
  const lampOn = (t) => FLASH.some(([a, b]) => t >= a && t < b);

  // имя файла печатается по букве
  const FNAME = 'НАБЛЮДЕНИЕ_01';
  const TYPE = [...FNAME].map((ch, i) => ({ ch, t: ev.type0 + i * 0.1 }));

  // колыбельная 1-й серии из динамика (тихо)
  const lull = [];
  for (let k = 0; k < 4; k++) {
    lull.push(...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 2 * k),
      ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]], 2 * k + 1));
  }
  const lullT = lull.map((n) => ({ ...n, t: n.t - T(0, 0) + ev.play })).filter((n) => n.t < ev.exp0);

  const R = U.mulberry32(1517);
  const FROGS = []; for (let t = ev.cam + 0.6; t < ev.dark - 1; t += 1.2 + R() * 2.0) FROGS.push({ t, p: 0.8 + R() * 0.5, pan: R() * 0.8 });

  const markers = {
    cam: { t: ev.cam, sync: 'v' },
    play: ev.play, morse0: ev.morse0, exp0: ev.exp0, dark: ev.dark, turn0: ev.turn0,
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, STYLE, DURATION, clock, T, BEAT, SIX, m, ev, markers, FLASH, lampOn, TYPE, FNAME,
    vo, msubs, lull: lullT, FROGS, tcAt, subtitles: [] };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
