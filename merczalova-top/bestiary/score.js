// Карточки бестиария для Telegram (4:5). Какая карточка рисуется — CARD=<id> в окружении или ?card= в URL; по умолчанию последняя.
(function () {
  const node = typeof require !== 'undefined';
  const U = node ? require('./engine/util') : globalThis.U;
  const MU = node ? require('./engine/music') : globalThis.MUSIC;
  const FORMAT = U.pickFormat('4:5');
  const [W, H] = U.formatSize(FORMAT);
  const clock = MU.makeClock({ bpm: 84, offset: 0 });
  const SCORE = { FPS: 30, FORMAT, W, H, SAFE: U.safeArea(W, H), STYLE: 'paper', DURATION: 4, clock, T: clock.T, BEAT: clock.BEAT, markers: {}, subtitles: [] };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
