// «Мерцалова топь» - спецвыпуск «Наблюдение №4». Запись камеры наблюдателя (пиксель-арт, без рассказчика).
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
  const SIX = BEAT / 4;               // единица Морзе здесь - шестнадцатая (наблюдатель спешит)

  const ev = {
    beep: 0.4,                        // писк, титр «НАБЛЮДЕНИЕ №4»
    cam: 2.4,                         // включается картинка с камеры
    creak: 0,                         // 03:12:00 - скрип двери (ставится ниже)
    lull0: 0, figure: 0,              // колыбельная издалека, силуэт на кочке
    morse0: 0, morse1: 0,             // лампа мигает «НЕ ВЕРЬ»
    figureGone: 0,
    scribble: 0,                      // быстро дописывает «ГОЛОСУ»
    silence: 0, knock: [], cc: 0,     // тишина, стук, субтитр «это я. открой.»
    hit: 0, cut: 0, next: 0,          // помехи, «ЗАПИСЬ ПРЕРВАНА», «СЛЕДУЮЩАЯ ЗАПИСЬ: 03:12»
  };
  // таймкод: на ev.cam показывает 03:11:54, так что 03:12:00 наступает через 6 с
  const TC0 = 3 * 3600 + 11 * 60 + 54;
  ev.creak = ev.cam + 6;
  ev.lull0 = ev.creak + 1.0;
  ev.figure = ev.creak + 1.8;
  ev.morse0 = ev.figure + 2.3;

  // Морзе «НЕ ВЕРЬ» лампой; каждая вспышка - щелчок вкл/выкл
  const CODE = { Н: '-.', Е: '.', В: '.--', Р: '.-.', Ь: '-..-' };
  const FLASH = []; const LETTER_DONE = [];
  let u = 0;
  const word = 'НЕ ВЕРЬ';
  [...word].forEach((ch, li) => {
    if (ch === ' ') { u += 4; LETTER_DONE.push({ ch: ' ', t: ev.morse0 + u * SIX }); return; } // +4 к 3 = 7
    [...CODE[ch]].forEach((s, i) => { if (i) u += 1; const d = s === '-' ? 3 : 1; FLASH.push([ev.morse0 + u * SIX, ev.morse0 + (u + d) * SIX]); u += d; });
    LETTER_DONE.push({ ch, t: ev.morse0 + u * SIX });
    u += 3;
  });
  ev.morse1 = ev.morse0 + u * SIX;
  ev.figureGone = ev.morse0 + 26 * SIX;
  ev.scribble = ev.morse1 + 0.2;
  const SCRIBBLE = [...'ГОЛОСУ'].map((ch, i) => ({ ch, t: ev.scribble + 0.14 + i * 0.13 }));
  ev.silence = ev.scribble + 1.2;
  ev.knock = [ev.silence + 0.6, ev.silence + 1.0, ev.silence + 1.4];
  ev.cc = ev.silence + 2.0;
  ev.hit = ev.cc + 2.5;
  ev.cut = ev.hit + 0.9;
  ev.next = ev.cut + 1.6;
  const DURATION = ev.next + 2.4;

  // колыбельная из 1-й серии издалека (Подражатель напевает)
  const lull = [
    ...placeBar(clock, [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]], 0),
    ...placeBar(clock, [['F5', 0, 2], ['E5', 2, 1], ['D5', 3, 1], ['C5', 4, 3]], 1),
  ].map((n) => ({ ...n, t: n.t - T(0, 0) + ev.lull0 }));

  const R = U.mulberry32(404);
  const FROGS = []; for (let t = ev.cam + 0.8; t < ev.morse0; t += 0.9 + R() * 1.6) FROGS.push({ t, p: 0.8 + R() * 0.5, pan: R() * 1.2 - 0.6 });

  const CC = '[голос за дверью]: это я. открой.';
  const tcAt = (t) => TC0 + Math.max(0, t - ev.cam);
  const lampOn = (t) => FLASH.some(([a, b]) => t >= a && t < b);

  const markers = {
    cam: { t: ev.cam, sync: 'v' },
    creak: ev.creak, figure: ev.figure, morse0: ev.morse0, silence: ev.silence, cc: ev.cc,
    hit: { t: ev.hit, sync: 'av' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const SCORE = { FPS, FORMAT, W, H, SAFE, STYLE, DURATION, clock, T, BEAT, SIX, m, ev, markers, FLASH, LETTER_DONE, SCRIBBLE,
    lull, FROGS, CC, tcAt, lampOn, subtitles: [] };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
