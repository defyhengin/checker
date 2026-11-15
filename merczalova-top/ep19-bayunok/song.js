// «Мерцалова топь» эп.19 «Баюнок» - саундтрек. Колыбельная шкатулки + гудение Баюнка, шторка, тишина, удар.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus(), humB = bus();
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
// гудение птенца: мягкий тон с вибрато, без верхов
function humNote(midi, dur) {
  const n = Math.round((dur + 0.35) * SR), b = new Float32Array(n), f = hz(midi); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, vib = 1 + 0.008 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t * 3);
    ph += (2 * Math.PI * f * vib) / SR;
    const env = Math.min(1, t / 0.18) * Math.min(1, (dur + 0.35 - t) / 0.35);
    b[i] = (Math.sin(ph) + 0.28 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph)) * env;
  }
  return b;
}
const soft = (len, f0, f1, q = 0.8) => I.noiseSweep(len, f0, f1, { q, pink: true, shape: (x) => Math.sin(Math.PI * x) });

for (let i = 0; i < 14; i++) { const t0 = i * 3.3; if (t0 > ev.shut) break; amb.addMono(soft(4.0, 320 + 80 * (i % 3), 220, 0.7), t0, 0.07, i % 2 ? -0.6 : 0.6); }
for (const n of sc.box) { if (n.t >= ev.shut - 0.2) continue; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.11, 0); verb.addMono(mb, n.t, 0.4); }
for (const c of sc.chords) {
  if (c.t0 >= ev.shut) continue;
  const t1 = Math.min(c.t1, ev.shut);
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: c.t0 >= ev.notice ? 480 : 680, attack: 1.2, release: 1.2 }); pad.addStereo(L, R, c.t0, 0.05); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.05, sub: 0.6 }), c.t0, 0.07);
}
// Баюнок гудит: чем ближе к камере, тем громче
for (const h of sc.hum) {
  if (h.t < ev.sing || h.t >= ev.shut - 0.3) continue;
  const near = Math.max(0, Math.min(1, (h.t - ev.someone) / (ev.shut - ev.someone)));
  const b = humNote(h.midi, Math.min(h.dur, ev.shut - h.t) * 0.92);
  humB.addMono(b, h.t, 0.07 + 0.11 * near, 0); verb.addMono(b, h.t, 0.12 * (1 - near));
}
fx.addMono(soft(0.9, 300, 160, 2), ev.yawn + 0.2, 0.09, -0.5);                       // лягушка зевает
// шторка: мягкий выдох на каждое смыкание, подтыкание одеяльца
for (const [t0, g] of [[ev.b1 - 0.45, 0.07], [ev.b2 - 0.7, 0.08], [ev.vot - 0.1, 0.05], [ev.eyes + 0.3, 0.09]]) fx.addMono(soft(0.9, 500, 140), t0, g, 0);
for (const t0 of [ev.b1 + 0.05, ev.b1 + 0.3, ev.b2 + 0.05, ev.b2 + 0.32]) fx.addMono(I.thud(140, 0.035), t0, 0.1, 0);
// тишина: только едва слышный писк
fx.addMono((() => { const n = Math.round((ev.hit - ev.shut) * SR), b = new Float32Array(n); for (let i = 0; i < n; i++) { const x = i / n; b[i] = Math.sin(2 * Math.PI * 7000 * i / SR) * Math.min(1, x * 6) * Math.min(1, (1 - x) * 8); } return b; })(), ev.shut, 0.002, 0.2);
// удар: камера уже лежит
fx.addMono(I.thud(48, 0.16), ev.hit, 0.8);
fx.addMono(I.subBoom(1.8, 58, 26), ev.hit + 0.04, 0.5);
for (const [n, g] of [[m('A1'), 0.5], [m('A#1'), 0.34], [m('E2'), 0.2]]) { const s = I.strings(n, ev.dark - ev.hit, { attack: 0.03, release: 0.8, bright: 0.4, seed: n }); low.addStereo(s.L, s.R, ev.hit, g); }
fx.addMono(soft(1.3, 500, 120), ev.close, 0.08, 0);
// в темноте колыбельная продолжается - медленнее, и он гудит совсем рядом
[['A5', 0], ['C6', 0.7], ['E6', 1.4], ['C6', 2.4], ['A5', 3.3]].forEach(([n, d]) => { if (ev.title + 0.5 + d < DURATION - 0.3) { const mb = I.musicBox(m(n)); keys.addMono(mb, ev.title + 0.5 + d, 0.12, 0); verb.addMono(mb, ev.title + 0.5 + d, 0.45); } });
humB.addMono(humNote(m('A3'), DURATION - ev.tail - 0.5), ev.tail, 0.16, 0);

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const b = MIX.loadAudio(path.join(__dirname, v.file), { at: v.at });
  for (let i = 0; i < b.n && i < N; i++) { const mono = 0.5 * (b.L[i] + b.R[i]); voice.L[i] += mono; voice.R[i] += mono; }
}
MIX.duck([keys, pad, low, amb, verb, humB], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = { voice, keys, pad, low, fx, amb, hum: humB, verb: reverb(verb, { room: 0.9, damp: 0.35 }) };
for (const name of ['voice', 'keys', 'pad', 'amb', 'verb', 'low', 'hum']) MIX.gate(stems[name], ev.shut, ev.hit);
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, hum: 1.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.fadeOut(mix, DURATION - 0.6, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
