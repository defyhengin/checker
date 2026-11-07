// «Мерцалова топь» эп.13 «Зубочка» - саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { BEAT, DURATION, m, ev, EIGHTH } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus();

// звон: чистый синус с быстрым спадом
function tink(f, dec = 14, len = 0.5) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.min(1, t / 0.001) * Math.exp(-t * dec); }
  return b;
}
// трепет крылышек: мягкий шум с быстрой модуляцией
function flutter(len, rate = 34) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  let s = 7, lp = 0;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280; const x = s / 233280 * 2 - 1;
    lp += (x - lp) * 0.08;
    const t = i / SR, env = Math.sin(Math.PI * Math.min(1, t / len));
    b[i] = lp * (0.5 + 0.5 * Math.sin(2 * Math.PI * rate * t)) * env;
  }
  return b;
}
// щёлканье зубками
function clicks(at, count, g) { for (let i = 0; i < count; i++) fx.addMono(I.woodTick(1.6 + 0.25 * (i % 3)), at + i * 0.07, g, (i % 2 ? -0.2 : 0.2)); }

// ветер
for (let i = 0; i < 10; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.1, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды, бас
for (const n of sc.box) { if (n.t >= ev.gone) continue; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.32); }
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.gone);
  if (c.t0 >= ev.gone) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: c.t0 >= ev.reveal ? 480 : 720, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.08, sub: 0.6 }), c.t0, 0.11);
}

// ---------- крылышки (полёт) ----------
amb.addMono(flutter(ev.landFrog - 0.2), 0.2, 0.05, -0.2);
amb.addMono(flutter(ev.toNest + 1.4 - ev.pebble - 0.3, 30), ev.pebble + 0.3, 0.05, 0.3);
// лягушка посапывает
for (let t = 4.0; t < ev.toNest + 2; t += 1.95) fx.addMono(I.noiseSweep(0.7, 180, 260, { q: 1.2, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t, 0.06, -0.3);

// ---------- зубик ----------
fx.addMono(tink(3400, 22, 0.4), ev.tooth, 0.28, -0.1);
fx.addMono(tink(5200, 30, 0.3), ev.tooth + 0.01, 0.12, 0.2);
{ const mb = I.musicBox(m('E6')); keys.addMono(mb, ev.tooth, 0.26, 0); verb.addMono(mb, ev.tooth, 0.4); }
// камушек: мягкий звон и тёплое свечение
fx.addMono(tink(1760, 6, 1.2), ev.pebble, 0.2, 0);
fx.addMono(I.thud(700, 0.03), ev.pebble, 0.18, 0);
{ const mb = I.musicBox(m('A5')); keys.addMono(mb, ev.pebble, 0.24, 0); verb.addMono(mb, ev.pebble, 0.45); }
// гнездо: расстроенная нота на «человеческих» зубах
{ const mb = I.musicBox(m('C6') - 0.45); keys.addMono(mb, ev.reveal, 0.24, 0.1); verb.addMono(mb, ev.reveal, 0.4); }
// пустое место: тихое постукивание зубиков
clicks(ev.toGap + 0.6, 3, 0.05);

// ---------- тишина: поворот и улыбка ----------
fx.addMono(I.noiseSweep(0.5, 900, 500, { q: 1, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.turn, 0.04, 0);
clicks(ev.smile, 2, 0.07);

// ---------- удар: мордочка вплотную ----------
fx.addMono(I.thud(50, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.hit + 0.04, 0.5);
fx.addMono(tink(3000, 30, 0.2), ev.hit, 0.35, 0);
clicks(ev.hit + 0.05, 6, 0.12);
keys.addMono(I.musicBox(m('E6') - 0.5), ev.hit, 0.3, 0);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.hit + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
// финал: в темноте загорается камушек - звон и одна нота
fx.addMono(tink(1760, 6, 1.2), ev.endPebble, 0.22, 0);
keys.addMono(I.musicBox(m('A4') - 0.4), ev.endPebble, 0.24, 0); verb.addMono(I.musicBox(m('A4') - 0.4), ev.endPebble, 0.4);
fx.addMono(I.thud(900, 0.03), ev.endCut, 0.22, 0);

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (!fs.existsSync(f)) continue;
  MIX.loadAudio(f, { at: v.at, gain: v.gain || 1.0 }).mixInto(voice, 1);
}
MIX.duck([keys, pad, low, amb, verb], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
};
for (const name of ['keys', 'pad', 'low', 'amb', 'verb']) MIX.gate(stems[name], ev.gone, ev.hit);
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.cut, ev.title);
MIX.fadeOut(mix, DURATION - 0.7, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
