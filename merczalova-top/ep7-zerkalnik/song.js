// «Мерцалова топь» эп.7 «Зеркальник» — саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { BEAT, DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus(), dly = bus();
const EIGHTH = sc.EIGHTH;

// капля: короткий «плюх» с падающим тоном
function drop(pitch = 1) {
  const n = Math.round(0.12 * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.002) * Math.exp(-t * 40);
    ph += (2 * Math.PI * (900 + 1400 * Math.exp(-t * 60)) * pitch) / SR;
    b[i] = Math.sin(ph) * env;
  }
  return b;
}

// ветер
for (let i = 0; i < 9; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.12, i % 2 ? -0.4 : 0.4);
}
// шкатулка
for (const n of sc.box) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.32); }
// пэды и бас до тишины
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.breath);
  if (c.t0 >= ev.breath) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 720, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.1, sub: 0.6 }), c.t0, 0.12);
}

// ---------- эхо шкатулки: каждая нота отвечает тише и ниже, как отражение ----------
for (const n of sc.box) { const mb = I.musicBox(n.midi - 12 + 0.12); dly.addMono(mb, n.t + EIGHTH, 0.1, 0.3); }

// ---------- капля и рябь ----------
fx.addMono(drop(1.0), ev.drop, 0.5, 0.1);
verb.addMono(drop(1.0), ev.drop, 0.5);
for (let i = 1; i < 4; i++) fx.addMono(drop(1.0 - i * 0.08), ev.drop + i * 0.11, 0.18 / i, 0.1);
// переход к берегу: шорох камыша
fx.addMono(I.noiseSweep(0.9, 1200, 500, { q: 0.8, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.tilt, 0.25, -0.2);

// ---------- удар: рябь, и лицо вплотную ----------
fx.addMono(I.thud(50, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.hit + 0.04, 0.5);
fx.addMono(drop(0.7), ev.hit, 0.6, 0);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.hit + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
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
MIX.duck([keys, pad, low, amb, verb, dly], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
  dly: pingpong(dly, BEAT * 0.75, 0.35, 3000),
};
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7, dly: 0.9 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath + 0.15, ev.hit);      // полная тишина перед ударом
MIX.gate(mix, ev.cut, ev.title);
MIX.fadeOut(mix, DURATION - 1.2, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
