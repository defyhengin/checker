// «Мерцалова топь» эп.1 — саундтрек. Каждый звук привязан к событию из score.js.
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus(), dly = bus();

// ---------- ночь: тихий ветер в камышах (весь ролик, кроме тишины) ----------
for (let i = 0; i < 8; i++) {
  const t0 = i * 3.6, len = 4.2;
  if (t0 + len > ev.breath && t0 < ev.snap) continue;
  amb.addMono(I.noiseSweep(len, 380 + 120 * (i % 3), 260, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.12, i % 2 ? -0.4 : 0.4);
}
// редкие «капли» и кваканье-тики до разоблачения и после
[1.3, 3.1, 5.7, 7.9, 9.6, 22.6, 25.2].forEach((t, i) => amb.addMono(I.woodTick(0.45 + 0.1 * (i % 3)), t, 0.08, i % 2 ? 0.5 : -0.5));

// ---------- колыбельная: музыкальная шкатулка, каждая нота = светлячок ----------
for (const f of sc.fireflies) {
  const mb = I.musicBox(f.midi);
  const pan = (f.x / sc.W - 0.5) * 1.1; // звук там, где загорается светлячок
  keys.addMono(mb, f.t, 0.32, pan);
  verb.addMono(mb, f.t, 0.28);
  dly.addMono(mb, f.t, 0.1);
}
// после всплытия — та же мелодия, чуть расстроенная (детюн = нота «плывёт» вниз)
for (const n of sc.boxDetuned) {
  const mb = I.musicBox(n.midi + n.detune);
  keys.addMono(mb, n.t, 0.3, 0.1);
  verb.addMono(mb, n.t, 0.35);
  dly.addMono(mb, n.t, 0.14);
}

// ---------- мягкие пэды под колыбельной ----------
for (const c of sc.chords) {
  const t1 = c.t1 > ev.breath && c.t0 < ev.breath ? ev.breath : c.t1;
  if (c.t0 >= ev.breath && c.t0 < ev.rise) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 900, attack: 0.8, release: 1.2 }); pad.addStereo(L, R, c.t0, 0.07); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.1, sub: 0.6 }), c.t0, 0.16);
}

// ---------- светлячок садится ----------
fx.addMono(I.pop(1.6), ev.land, 0.2, 0.05);
// лепестки смыкаются: тихий «шорох» вниз
fx.addMono(I.noiseSweep(ev.closeEnd - ev.closeStart, 4000, 900, { q: 1.2, pink: true }), ev.closeStart, 0.12);

// ---------- ХЛОП: рывок под воду ----------
fx.addMono(I.thud(70, 0.12), ev.snap, 0.9);
fx.addMono(I.bwomp(), ev.snap, 0.5);
fx.addMono(I.noiseSweep(0.5, 6000, 500, { q: 0.8, pink: true, shape: (x) => Math.exp(-x * 6) }), ev.snap, 0.6); // всплеск
fx.addMono(I.subBoom(2.0, 60, 32), ev.snap, 0.55);
verb.addMono(I.thud(70, 0.12), ev.snap, 0.4);

// ---------- глаза: низкий гул и расстроенные струны ----------
const dur = ev.eyesClose + 0.6 - ev.eyes;
for (const [n, g, p] of [[m('A1'), 0.7, 0], [m('A#1'), 0.45, -0.3], [m('E2'), 0.35, 0.3]]) {
  const s = I.strings(n, dur, { attack: 0.6, release: 0.8, bright: 0.2, seed: n });
  low.addStereo(s.L, s.R, ev.eyes, g);
}
fx.addMono(I.heartbeat(), ev.eyes + 0.1, 0.35);
fx.addMono(I.heartbeat(), ev.eyes + 0.1 + BEAT * 2, 0.3);
fx.addMono(I.heartbeat(), ev.eyes + 0.1 + BEAT * 4, 0.25);

// всплытие: мягкий «бульк»
fx.addMono(I.pop(0.7), ev.rise, 0.25);

// ---------- вторая кувшинка у камеры: резкий стеклянный звон + низкая нота ----------
fx.addMono(I.bell(1108.7, 2.2, 3.1, 1.41), ev.second, 0.35);
keys.addMono(I.musicBox(m('A3')), ev.second, 0.5);
fx.addMono(I.thud(55, 0.1), ev.second, 0.5);
verb.addMono(I.bell(1108.7, 2.2, 3.1, 1.41), ev.second, 0.3);

// ---------- озвучка ElevenLabs ----------
const voice = bus();
for (const v of sc.vo) MIX.loadAudio(path.join(__dirname, v.file), { at: v.at, gain: 1.0 }).mixInto(voice, 1);
// музыка и фон уступают место голосу
MIX.duck([keys, pad, low, amb, verb, dly], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

// ---------- сведение ----------
const stems = {
  voice, keys, pad, low, fx, amb,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
  dly: pingpong(dly, BEAT * 0.75, 0.35, 3000),
};
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7, dly: 0.9 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath + 0.25, ev.snap); // тишина перед рывком — настоящая
MIX.fadeOut(mix, DURATION - 1.4, DURATION);
const M = MIX.master(mix, parseFloat(process.env.DRIVE || '0.8'), undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s${M.lufs !== undefined ? `, ${M.lufs.toFixed(1)} LUFS` : ''})`);
