// «Мерцалова топь» эп.18 «Шептунья» - саундтрек (АСМР: тихо, широкая панорама).
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus();
const box = (note, at, g = 0.1, pan = 0, detune = 0, wet = 0.4) => { const mb = I.musicBox(m(note) + detune); keys.addMono(mb, at, g, pan); verb.addMono(mb, at, wet); };
function tink(f, dec = 14, len = 0.5) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.min(1, t / 0.001) * Math.exp(-t * dec); }
  return b;
}

// ветер - тише обычного, до тишины
for (let i = 0; i < 14; i++) { const t0 = i * 3.3; if (t0 > ev.hush) break; amb.addMono(I.noiseSweep(4.0, 320 + 80 * (i % 3), 220, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.06, i % 2 ? -0.6 : 0.6); }
for (const n of sc.box) { if (n.t >= ev.you) continue; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.11, 0); verb.addMono(mb, n.t, 0.4); }
for (const c of sc.chords) {
  if (c.t0 >= ev.hush) continue;
  const t1 = Math.min(c.t1, ev.hush);
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: c.t0 >= ev.near ? 480 : 680, attack: 1.2, release: 1.2 }); pad.addStereo(L, R, c.t0, 0.05); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.05, sub: 0.6 }), c.t0, 0.07);
}
// звуки болота с той же стороны, что и шёпот
for (let i = 0; i < 6; i++) fx.addMono(I.noiseSweep(0.25, 2600, 1400, { q: 1, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.w1 + 0.1 + i * 0.13, 0.05, -0.9);   // шорох камыша - слева
fx.addMono(tink(1800, 22, 0.4), ev.w2 + 0.1, 0.14, 0.9); fx.addMono(tink(900, 30, 0.3), ev.w2 + 0.12, 0.08, 0.9);                                             // кап - справа
fx.addMono(I.noiseSweep(0.9, 300, 160, { q: 2, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.w3 + 0.2, 0.08, 0);                                       // лягушка зевает - центр
// тишина: только едва слышный писк в ушах
fx.addMono((() => { const n = Math.round((ev.hit - ev.hush) * SR), b = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n; b[i] = Math.sin(2 * Math.PI * 7000 * i / SR) * Math.min(1, x * 6) * Math.min(1, (1 - x) * 8); } return b; })(), ev.hush, 0.002, 0.2);
// удар
fx.addMono(I.thud(48, 0.16), ev.hit, 0.8);
fx.addMono(I.subBoom(1.8, 58, 26), ev.hit + 0.04, 0.5);
fx.addMono(tink(1900, 6, 1.4), ev.hit, 0.1, 0.5);
for (const [n, g] of [[m('A1'), 0.5], [m('A#1'), 0.36], [m('E2'), 0.2]]) { const s = I.strings(n, ev.dark - ev.hit + 0.1, { attack: 0.03, release: 0.1, bright: 0.4, seed: n }); low.addStereo(s.L, s.R, ev.hit, g); }
fx.addMono(I.thud(64, 0.06), ev.cut, 0.6, 0);
fx.addMono(I.tvClick(), ev.cut, 0.3, 0);
box('A4', ev.title + 0.6, 0.12, 0, -0.5, 0.45);
fx.addMono(I.tvClick(), ev.egg, 0.15, 0);

// ---------- голос с панорамой ----------
const voice = bus();
function place(file, at, pan, gain = 1, close = false) {
  const b = MIX.loadAudio(path.join(__dirname, file), { at });
  const a = ((pan + 1) * Math.PI) / 4, gl = Math.cos(a) * Math.SQRT2, gr = Math.sin(a) * Math.SQRT2;
  const d = close ? Math.round(0.0006 * SR) : 0; // Хаас: левый канал чуть позже - «у самого уха»
  const warm = /voice\/w[123]\.wav$/.test(file);
  let lpv = 0;
  for (let i = 0; i < b.n && i < N; i++) {
    let mono = 0.5 * (b.L[i] + b.R[i]);
    if (warm) { lpv += 0.6 * (mono - lpv); mono = lpv; }   // мягче, без резких «с» и «ш»
    if (i + d < N) voice.L[i + d] += mono * gl * gain * (close ? 0.08 : 1);
    voice.R[i] += mono * gr * gain;
  }
}
for (const v of sc.vo) place(v.file, v.at, v.pan || 0, v.id === 'wX' ? 1.15 : 1, v.id === 'wX');
// АСМР-фактура на её шёпоте (w1-w3): дыхание и шорох пуха идут за огибающей голоса, тёплый мягкий шум
{
  let seed = 12345; const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff) * 2 - 1;
  for (const v of sc.vo.filter((x) => /^w[123]$/.test(x.id))) {
    const b = MIX.loadAudio(path.join(__dirname, v.file), { at: 0 });
    const a = ((v.pan + 1) * Math.PI) / 4, gl = Math.cos(a) * Math.SQRT2, gr = Math.sin(a) * Math.SQRT2;
    const start = Math.round(v.at * SR);
    let env = 0, lp = 0, hp = 0, prev = 0;
    for (let i = 0; i < b.n; i++) {
      const x = Math.abs(0.5 * (b.L[i] + b.R[i]));
      env += (x > env ? 0.01 : 0.0004) * (x - env);
      const w = rnd(); lp += 0.06 * (w - lp); hp += 0.06 * (lp - hp);   // тёплый мягкий шум (два слоя фильтра, без верхов)
      const flutter = 0.9 + 0.1 * Math.sin(i / SR * 2 * Math.PI * 3);   // шорох пуха
      const n = hp * env * 9 * flutter;
      const j = start + i; if (j >= N) break;
      voice.L[j] += n * gl; voice.R[j] += n * gr;
    }
  }
}
place('voice/wX.wav', ev.tail - 0.56, 1, 0.5, true);  // в темноте снова шёпот справа
MIX.duck([keys, pad, low, amb, verb], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = { voice, keys, pad, low, fx, amb, verb: reverb(verb, { room: 0.9, damp: 0.35 }) };
for (const name of ['keys', 'pad', 'amb', 'verb', 'low']) MIX.gate(stems[name], ev.hush, ev.hit);
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.fadeOut(mix, DURATION - 0.6, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
