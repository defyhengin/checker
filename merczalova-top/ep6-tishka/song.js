// «Мерцалова топь» эп.6 «Тишка» — саундтрек. Звуки по очереди «съедаются».
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { BEAT, DURATION, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), frogs = bus(), verb = bus(), dly = bus();

function croak(pitch = 1) {
  const n = Math.round(0.42 * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.01) * Math.exp(-t * 6);
    const f = (150 + 40 * Math.exp(-t * 12)) * pitch;
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph + 2.5 * Math.sin(2 * Math.PI * 30 * pitch * t)) * env * (t % 0.11 < 0.075 ? 1 : 0.35);
  }
  return b;
}
// «всасывание»: шум, поднимающийся вверх и обрывающийся
const suck = (len = 0.45) => I.noiseSweep(len, 300, 3200, { q: 1.2, pink: true, shape: (x) => x * x * (x < 0.97 ? 1 : 0) });
// сухой щелчок
function click() {
  const n = Math.round(0.03 * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * 2100 * t) * 0.6 + (U01(i) * 2 - 1) * 0.6) * Math.exp(-t * 260); }
  return b;
}
function U01(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

// лягушки
for (const c of sc.croaks) frogs.addMono(croak(c.who ? 1.12 : 0.95), c.t, 0.45, c.who ? 0.5 : -0.5);
fx.addMono(suck(0.45), ev.frogsOff - 0.45, 0.22, -0.3);
// ветер
for (const g of sc.gusts) {
  const len = Math.min(2.6, ev.windOff - g.t);
  amb.addMono(I.noiseSweep(len, 360, 240, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * Math.min(1, x * 1.3)) }), g.t, 0.16, g.t % 2 > 1 ? -0.4 : 0.4);
}
fx.addMono(suck(0.5), ev.windOff - 0.5, 0.22, 0.3);
// шкатулка и пэды до musicOff
for (const n of sc.box) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.3); }
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.musicOff);
  if (c.t0 >= ev.musicOff) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 720, attack: 0.9, release: 0.05 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.1, sub: 0.6 }), c.t0, 0.12);
}
fx.addMono(suck(0.6), ev.musicOff - 0.6, 0.28, 0);
// щелчок
fx.addMono(click(), ev.click, 0.9, 0);
fx.addMono(I.thud(60, 0.05), ev.click, 0.35);

// ---------- голос: последняя фраза обрывается ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (!fs.existsSync(f)) continue;
  const b = MIX.loadAudio(f, { at: v.at, gain: 1.0 });
  if (v.cutAt) { const c = Math.round(v.cutAt * SR); for (let i = c; i < b.n; i++) { const g = Math.max(0, 1 - (i - c) / (SR * 0.012)); b.L[i] *= g; b.R[i] *= g; } }
  b.mixInto(voice, 1);
}
MIX.duck([keys, pad, low, amb, frogs, verb, dly], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb, frogs,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
  dly: pingpong(dly, BEAT * 0.75, 0.35, 3000),
};
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, frogs: 1.0, verb: 0.7, dly: 0.9 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.musicOff + 0.02, sc.LAST.t - 0.15);  // хвосты реверба тоже съедены
MIX.gate(mix, ev.voiceCut + 0.015, ev.click);         // абсолютная тишина
MIX.gate(mix, ev.click + 0.08, DURATION);              // после щелчка — ничего
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
