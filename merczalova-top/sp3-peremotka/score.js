// «Мерцалова топь» - финальный спецвыпуск «Перемотка» (конец сезона 1).
// Камера из 19-й лежит на боку. Перемотка: бумажные серии 19 -> 1 летят назад (на 2 кадра - пиксельная правда).
// Стоп - пиксельная кассета наблюдателя, REC 21:04 первого вечера: он сам, усталым голосом, читает статью про кувшинку.
// В окне за его спиной силуэт с ушками шевелит губами на полслова раньше. Светлячок на линзе ровно мигает ВЫКЛЮЧИ.
// Наблюдатель тянется к кнопке - плёнку зажёвывает. Чёрный экран, «это я. открой.». Обманка, рядом загорается
// новый огонёк (сбивчиво). «ЗАПИСЬ ОКОНЧЕНА» -> «● REC 00:00:01».
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const ENV = node ? require('./env') : globalThis.ENV;
  const { m, makeClock, placeBar } = MU;

  const FPS = 30;
  const FORMAT = U.pickFormat('9:16');
  const [W, H] = U.formatSize(FORMAT);
  const SAFE = U.safeArea(W, H);
  const STYLE = 'paper';   // бумажные кадры без пикселизации; кассета рисуется пикселем вручную
  const clock = makeClock({ bpm: 84, offset: 0.4 });
  const { T, BEAT } = clock;
  const EIGHTH = BEAT / 2;

  const OBS = 8.9;                    // начало voice/obs.wav (в файле 0.1 с тишины)
  const S0 = OBS + 0.1;               // секунда исходника -> фильм: S0 + s
  const ev = {
    click: 1.8,                       // щелчок - перемотка
    rew0: 2.0, rew1: 8.0,             // перемотка
    stop: 8.0,                        // стоп, снег
    tape: 8.6,                        // пиксельная кассета
    turn: S0 + 21.49,                 // «это уже не я» - оборачивается к окну
    reach: S0 + 24.3,                 // тянется к кнопке диктофона
    chew: S0 + 25.6,                  // плёнку зажёвывает
  };
  ev.black = ev.chew + 0.7;           // чёрный экран, тишина
  ev.wh1 = ev.black + 3.6;            // «это я.»
  ev.wh2 = ev.wh1 + 0.72;             // «открой.»
  ev.hit = ev.wh2 + 1.2;              // Обманка
  ev.ignite = ev.hit + 1.4;           // загорается новый огонёк
  ev.fade = ev.hit + 3.8;
  ev.rec = ev.fade + 0.6;             // журнал REC 03:29
  ev.ended = ev.rec + 1.4;            // ЗАПИСЬ ОКОНЧЕНА
  ev.again = ev.ended + 1.6;          // ● REC 00:00:01
  const DURATION = ev.again + 1.8;

  // перемотка: серии 19 -> 1, на некоторых - 2 кадра пиксельной «правды»
  const EPS = []; for (let n = 19; n >= 1; n--) EPS.push(n);
  const SLOT = (ev.rew1 - ev.rew0) / EPS.length;
  const TRUTH = [17, 13, 8, 5, 4, 2];

  const vo = [
    { file: 'voice/obs.wav', at: OBS },
    { file: 'voice/wh1.wav', at: ev.wh1 - 0.1 },
    { file: 'voice/wh2.wav', at: ev.wh2 - 0.1 },
  ];
  // субтитры кассеты (пиксельные, в окне), секунды исходника
  const CC = [
    [0.0, 2.3, ['Запись для справочника.']],
    [3.25, 5.0, ['Кувшинка у старой ели.']],
    [5.56, 6.3, ['Красивая.']],
    [7.07, 8.1, ['Не подходите к ней.']],
    [9.11, 10.9, ['И не отвечайте,', 'если она позовёт вас']],
    [10.9, 12.3, ['вашим голосом.']],
    [13.74, 15.5, ['Я записываю всё.']],
    [16.13, 19.12, ['Если однажды эта запись', 'заговорит с вами нежно,']],
    [19.57, 20.61, ['моим голосом,']],
    [21.49, 22.75, ['это уже не я.']],
  ].map(([a, b, l]) => ({ t: S0 + a, end: S0 + b + 0.25, l }));

  // громкость голоса (для губ силуэта): ENV - 30 кадров/с от начала obs.wav
  const envAt = (t) => { const i = Math.floor((t - OBS) * 30); return i >= 0 && i < ENV.length ? ENV[i] : 0; };
  const LEAD = 0.38;                  // силуэт опережает на полслова
  const mouthAt = (t) => {
    let v = envAt(t + LEAD);
    // после последней фразы губы ещё шевелятся без звука: «это я. открой.»
    const a = S0 + 22.9, b = a + 1.9;
    if (t > a - LEAD && t < b) v = Math.max(v, 0.55 * Math.abs(Math.sin((t - a) * 9)) * (Math.sin((t - a) * 2.3) > -0.3 ? 1 : 0));
    return v;
  };

  // светлячок на линзе: ВЫКЛЮЧИ чисто (единица - 0.4 восьмой, как в 18-19)
  const code = { В: '.--', Ы: '-.--', К: '-.-', Л: '.-..', Ю: '..--', Ч: '---.', И: '..' };
  const UNIT = EIGHTH * 0.4;
  const FLY0 = S0 + 12.2;
  const FLASH = [];
  { let tt = FLY0 + 0.9; for (const ch of 'ВЫКЛЮЧИ') { for (const s of code[ch]) { const d = (s === '-' ? 3 : 1) * UNIT; FLASH.push([tt, tt + d]); tt += d + UNIT; } tt += 2 * UNIT; } }
  const FLY1 = FLASH[FLASH.length - 1][1];
  const flyOn = (t) => FLASH.some(([a, b]) => t >= a && t < b);

  // таймкоды
  const TC_TAPE = 21 * 3600 + 4 * 60 + 12;
  const tcTape = (t) => TC_TAPE + Math.max(0, t - ev.tape);
  const TC_END = 3 * 3600 + 29 * 60;

  // колыбельная 1-й серии - на Обманке, тихо
  const lull = [];
  for (let k = 0; k < 3; k++) {
    lull.push(...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 2 * k),
      ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]], 2 * k + 1));
  }
  const lullT = lull.map((n) => ({ ...n, t: n.t - T(0, 0) + ev.hit })).filter((n) => n.t < ev.fade + 0.4);
  // хвост колыбельной 19-й в начале (камера на боку)
  const intro = placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 0).map((n) => ({ ...n, t: n.t - T(0, 0) - 0.3 })).filter((n) => n.t >= 0 && n.t < ev.click);

  const R = U.mulberry32(2026);
  const FROGS = []; for (let t = ev.tape + 0.8; t < ev.chew - 0.5; t += 1.4 + R() * 2.2) FROGS.push({ t, p: 0.8 + R() * 0.5, pan: 0.2 + R() * 0.6 });

  const markers = {
    click: ev.click,
    stop: { t: ev.stop, sync: 'av' },
    turn: ev.turn,
    chew: { t: ev.chew, sync: 'a' },     // вспышка разрыва 2 кадра, детектор ловит её конец - картинку проверили глазами
    black: ev.black,
    hit: { t: ev.hit, sync: 'av' },
    ignite: ev.ignite, rec: ev.rec, again: ev.again,
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, STYLE, DURATION, clock, T, BEAT, m, ev, markers, EPS, SLOT, TRUTH,
    vo, CC, mouthAt, envAt, FLASH, flyOn, FLY0, FLY1, tcTape, TC_END, lull: lullT, intro, FROGS, subtitles: [] };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
