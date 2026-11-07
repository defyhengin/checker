// «Мерцалова топь» — эпизод 3 «Подражатель». Единый источник времени для музыки и картинки.
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

  // ---------- звук и его эхо: каждый — событие для картинки и для звука ----------
  const pairs = {
    frog: { src: T(2, 0), echo: T(2, 1.5) },
    buzz: { src: T(3, 1), echo: T(3, 2.5) },
    lull: { src: T(4, 2), echo: T(5, 2.5) },
  };
  // колыбельная из первой серии: вдали, а потом её «напевает» подражатель
  const LULL = [['E5', 0, 2], ['C5', 2, 1], ['B4', 3, 1], ['A4', 4, 3]];
  const lullSrc = placeBar(clock, LULL, 0).map((n) => ({ ...n, t: n.t - T(0) + pairs.lull.src }));
  const lullEcho = placeBar(clock, LULL, 0).map((n) => ({ ...n, t: n.t - T(0) + pairs.lull.echo }));

  const ev = {
    turn: T(7, 0),      // смотрит в камеру — склейка на крупный план
    echoVoice: T(8, 1), // «...любой голос» тем же голосом из камышей
    breath: T(8, 3),    // тишина
    jaw: T(9, 0),       // «Даже этот»: пасть открывается шире, чем должна
    cut: T(9, 2),       // затемнение
    title: T(9, 2.6),
  };
  const DURATION = T(10, 2);

  // озвучка ElevenLabs (Maksim). at — момент начала файла (в каждом ~0.1 c тишины в начале)
  const vo = [
    { file: 'voice/p1.wav', at: T(0, 1) - 0.05 },
    { file: 'voice/p2a.wav', at: T(2, 2.5) - 0.11 },
    { file: 'voice/p2b.wav', at: T(4, 0) - 0.11 },
    { file: 'voice/p2c.wav', at: T(6, 2) - 0.11 },
    { file: 'voice/p3.wav', at: T(7, 0.5) - 0.11 },
    { file: 'voice/echo.wav', at: ev.echoVoice, echo: true },
    { file: 'voice/p4.wav', at: ev.jaw - 0.11 },
  ];

  const S = {
    intro: [0, T(2)],
    mimic: [T(2), ev.turn],
    turn: [ev.turn, ev.breath],
    breath: [ev.breath, ev.jaw],
    end: [ev.jaw, DURATION],
  };

  const { chords, chordAt } = makeChords(clock, {
    Am: { notes: ['A3', 'C4', 'E4'], bass: 'A1' },
    F: { notes: ['A3', 'C4', 'F4'], bass: 'F1' },
    Dm: { notes: ['A3', 'D4', 'F4'], bass: 'D2' },
    E: { notes: ['G#3', 'B3', 'E4'], bass: 'E1' },
  }, [
    [0, 0, 4, 'Am'], [1, 0, 4, 'F'], [2, 0, 4, 'Am'], [3, 0, 4, 'F'], [4, 0, 4, 'Dm'], [5, 0, 4, 'Am'], [6, 0, 4, 'F'], [7, 0, 4, 'Dm'], [8, 0, 3, 'E'],
  ]);
  // редкая шкатулка во вступлении
  const box = [...placeBar(clock, [['E5', 0, 2], ['A4', 4, 2]], 0), ...placeBar(clock, [['F5', 0, 2], ['C5', 4, 2]], 1)];

  // Морзе «ГОЛОСУ»: Г −−·  О −−−  Л ·−··  О −−−  С ···  У ··−
  const code = { 'Г': '--.', 'О': '---', 'Л': '.-..', 'С': '...', 'У': '..-' };
  const MORSE = [];
  for (const ch of 'ГОЛОСУ') {
    [...code[ch]].forEach((s, i) => { if (i) MORSE.push([0, 1]); MORSE.push([1, s === '-' ? 3 : 1]); });
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
    frog: { t: pairs.frog.src, sync: 'a' },
    frogEcho: { t: pairs.frog.echo, sync: 'a' },
    buzzEcho: pairs.buzz.echo,
    turn: { t: ev.turn, sync: 'v' },
    echoVoice: ev.echoVoice,
    breath: ev.breath,
    jaw: { t: ev.jaw, sync: 'v' },
    cut: { t: ev.cut, sync: 'v' },
  };

  const subtitles = [
    { t: T(0, 1), end: T(1, 3.3), text: 'Это подражатель. Он повторяет всё, что слышит.' },
    { t: T(2, 2.5), end: T(3, 0.9), text: 'Кваканье лягушки.' },
    { t: T(4, 0), end: T(4, 2.2), text: 'Жужжание светлячка.' },
    { t: T(6, 2), end: T(6, 3.9), text: 'Даже колыбельную.' },
    { t: T(7, 0.5), end: T(8, 0.7), text: 'Подражатель может повторить любой голос.' },
    { t: ev.echoVoice, end: ev.breath, text: '…любой голос.' },
    { t: ev.jaw, end: ev.cut, text: 'Даже этот.' },
    { t: ev.title, end: DURATION, text: 'Наблюдение №3' },
  ];

  const SCORE = { FPS, FORMAT, W, H, SAFE, WIDE, STYLE, DURATION, clock, T, BEAT, EIGHTH, S, m, chords, chordAt, ev, markers,
    pairs, lullSrc, lullEcho, box, morseOn, subtitles, vo };
  if (node) module.exports = SCORE; else globalThis.SCORE = SCORE;
})();
