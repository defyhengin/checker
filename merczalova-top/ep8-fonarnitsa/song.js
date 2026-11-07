// «Мерцалова топь» эп.8 «Фонарница» — саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { BEAT, DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus();
const EIGHTH = sc.EIGHTH;

// тонкий «звон» огонька
function twinkle(f) {
  const n = Math.round(0.5 * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.min(1, t / 0.003) * Math.exp(-t * 9); }
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

// ---------- заблудившийся светлячок: тихие звоночки, мечется ----------
for (let i = 0; i < 10; i++) {
  const t = ev.lost + 0.25 + i * EIGHTH * 1.5;
  if (t > ev.land - 0.3) break;
  fx.addMono(twinkle(2600 + 500 * Math.sin(i * 2.3)), t, 0.05, Math.sin(i * 1.7) * 0.6);
}
// садится к огонькам — тёплый звон
keys.addMono(I.musicBox(m('E6')), ev.land, 0.25, 0.2);
verb.addMono(I.musicBox(m('E6')), ev.land, 0.4);
fx.addMono(twinkle(1760), ev.land, 0.12, 0.2);
// пальцы смыкаются: расстроенная нота и выдох
keys.addMono(I.musicBox(m('A4') - 0.45), ev.close, 0.3, 0);
verb.addMono(I.musicBox(m('A4') - 0.45), ev.close, 0.45);
fx.addMono(I.noiseSweep(1.2, 900, 200, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.close, 0.18, 0);
// туман редеет: низкий гул нарастает до тишины
for (const [n, g] of [[m('A1'), 0.25], [m('E2'), 0.15]]) {
  const s = I.strings(n, ev.breath - ev.reveal + 0.2, { attack: ev.breath - ev.reveal, release: 0.1, bright: 0.25, seed: n });
  low.addStereo(s.L, s.R, ev.reveal, g);
}

// ---------- удар: огоньки вплотную ----------
fx.addMono(I.thud(50, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.hit + 0.04, 0.5);
for (const f of [1320, 1568, 1976]) fx.addMono(twinkle(f), ev.hit, 0.12, 0);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.hit + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
// финал: пять огоньков ладони, по ноте на каждый
sc.PALM.forEach((t, i) => { const mb = I.musicBox(m(sc.PALM_NOTES[i]) - 0.3); keys.addMono(mb, t, 0.26, -0.3 + i * 0.15); verb.addMono(mb, t, 0.4); });

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (!fs.existsSync(f)) continue;
  MIX.loadAudio(f, { at: v.at, gain: 1.0 }).mixInto(voice, 1);
}
MIX.duck([keys, pad, low, amb, verb], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
};
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath + 0.15, ev.hit);      // полная тишина перед ударом
MIX.gate(mix, ev.cut, ev.title);
MIX.fadeOut(mix, DURATION - 0.7, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
