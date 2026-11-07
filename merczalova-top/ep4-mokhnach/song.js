// «Мерцалова топь» эп.4 «Мохнач» — саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), eyes = bus(), verb = bus(), dly = bus();

// ветер в камышах (молчит в тишине перед глазами)
for (let i = 0; i < 10; i++) {
  const t0 = i * 3.3, len = 4.0;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(len, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.12, i % 2 ? -0.4 : 0.4);
}
// шорох мха: мохнач прячется и отворачивается
fx.addMono(I.noiseSweep(0.5, 1800, 600, { q: 0.8, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.hide - 0.15, 0.25, 0.1);
fx.addMono(I.noiseSweep(0.8, 1400, 400, { q: 0.8, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.turn - 0.3, 0.3, -0.1);

// колыбельная шкатулки во вступлении
for (const n of sc.box) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.3); }
// пэды и бас
for (const c of sc.chords) {
  const t1 = c.t0 < ev.breath ? Math.min(c.t1, ev.breath) : Math.min(c.t1, ev.blink);
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 720, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.1, sub: 0.6 }), c.t0, 0.12);
}

// ---------- глаза: каждый — нота шкатулки ----------
fx.addMono(I.thud(80, 0.06), ev.eye0, 0.3); // первый глаз — тихий толчок
for (const e of sc.eyes) {
  if (e.note) {
    const mb = I.musicBox(e.note - 12 + 0.15); // чуть расстроенная шкатулка
    eyes.addMono(mb, e.t, 0.32, (e.x || 0) * 0.6);
    verb.addMono(mb, e.t, 0.35);
    dly.addMono(mb, e.t, 0.12);
  } else {
    // мелкие глаза — влажные щелчки век
    eyes.addMono(I.noiseSweep(0.04, 4000, 2500, { q: 2, shape: (x) => 1 - x }), e.t, 0.12, (e.x || 0) * 0.7);
  }
}

// ---------- удар: все глаза моргают разом ----------
fx.addMono(I.thud(50, 0.14), ev.blink, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.blink + 0.04, 0.5);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.blink + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.blink, g);
}
keys.addMono(I.musicBox(m('A4') - 0.4), ev.title, 0.3);
verb.addMono(I.musicBox(m('A4') - 0.4), ev.title, 0.4);

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (!fs.existsSync(f)) continue;
  MIX.loadAudio(f, { at: v.at, gain: 1.0 }).mixInto(voice, 1);
}
MIX.duck([keys, pad, low, amb, eyes, verb, dly], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb, eyes,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
  dly: pingpong(dly, BEAT * 0.75, 0.35, 3000),
};
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, eyes: 0.9, verb: 0.7, dly: 0.9 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath + 0.15, ev.eye0);   // полная тишина перед первым глазом
MIX.gate(mix, ev.blink - EIGHTH(), ev.blink - 0.01); // вдох перед ударом
MIX.gate(mix, ev.cut, ev.title);
MIX.fadeOut(mix, DURATION - 1.2, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
function EIGHTH() { return sc.EIGHTH; }
