// «Мерцалова топь» эп.10 «Пузырёк» - саундтрек.
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

// ---------- самодельные звуки ----------
function croak(pitch = 1) { // лягушка: низкое «ква»
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
function buzz(len = 0.9, pitch = 1) { // светлячок: тонкое жужжание
  const n = Math.round(len * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.01) * Math.exp(-t * 2.2);
    ph += (2 * Math.PI * (220 + 18 * Math.sin(2 * Math.PI * 7 * t)) * pitch) / SR;
    const saw = 2 * ((ph / (2 * Math.PI)) % 1) - 1;
    b[i] = saw * env * (0.6 + 0.4 * Math.sin(2 * Math.PI * 120 * t)) * 0.5;
  }
  return b;
}
function blub(f = 500, len = 0.12) { // подводный «бульк»: синус, скользящий вверх
  const n = Math.round(len * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.004) * Math.exp(-t * 28);
    ph += (2 * Math.PI * f * (1 + 2.2 * t / len)) / SR;
    b[i] = Math.sin(ph) * env;
  }
  return b;
}
// лопнувший пузырь: щелчок + короткий «бульк» вверх
function burst(at, g, pan = 0, size = 1) {
  fx.addMono(I.pop(2600 / size, 31), at, 0.7 * g, pan);
  fx.addMono(blub(900 / size, 0.08 * size), at, 0.5 * g, pan);
}

// подводный гул вместо ветра
for (let i = 0; i < 10; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 220 + 60 * (i % 3), 160, { q: 0.6, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.12, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды и бас до тишины
for (const n of sc.box) { if (n.t >= ev.gone) continue; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.32); }
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.gone);
  if (c.t0 >= ev.gone) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 620, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.08, sub: 0.6 }), c.t0, 0.12);
}

// ---------- мелкие пузырьки: выдох + тихий бульк-нота ----------
for (const b of sc.SMALL) {
  fx.addMono(blub(420 + 120 * b.size, 0.1), b.t, 0.12, b.dx * 0.3);
  const mb = I.musicBox(m(b.note)); keys.addMono(mb, b.t + 1.2, 0.08, b.dx * 0.4); verb.addMono(mb, b.t + 1.2, 0.15);
}

// ---------- звуковые пузыри: лопаются на поверхности - вылетает звук ----------
for (const s of sc.SOUND) {
  fx.addMono(blub(380, 0.14), s.t - sc.RISE, 0.18, 0);   // выдохнул
  burst(s.t, 1.0, 0.1);
  keys.addMono(I.musicBox(m(s.note)), s.t, 0.2, 0.1); verb.addMono(I.musicBox(m(s.note)), s.t, 0.3);
  if (s.kind === 'frog') { fx.addMono(croak(1.05), s.t + 0.04, 0.5, 0.2); verb.addMono(croak(1.05), s.t + 0.04, 0.25); }
  else { fx.addMono(buzz(1.3, 1.05), s.t + 0.04, 0.32, 0.2); verb.addMono(buzz(1.3, 1.05), s.t + 0.04, 0.18); }
}

// ---------- спуск на дно: низкий гул ----------
fx.addMono(I.noiseSweep(3.4, 500, 120, { q: 0.8, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.descend, 0.16, 0);
// надувает щёки и выдувает большой пузырь: растущий «вдох» и долгий низкий бульк
fx.addMono(I.noiseSweep(1.6, 300, 900, { q: 1.2, pink: true, shape: (x) => x * x }), ev.blow, 0.14, 0);
fx.addMono(blub(160, 0.5), ev.release, 0.35, 0);
// в тишине - только тонкое потрескивание пузыря (тише, кончается за восьмую до хлопка)
for (let i = 0; i < 5; i++) fx.addMono(I.pop(5200 + 400 * i, 40 + i), ev.gone + 0.3 + i * 0.22, 0.05, (i % 2 ? -0.3 : 0.3));

// ---------- хлопок у объектива ----------
fx.addMono(I.pop(1400, 50), ev.pop, 1.0, 0);
fx.addMono(I.thud(140, 0.05), ev.pop, 0.5, 0);
for (let i = 0; i < 6; i++) fx.addMono(blub(700 + 160 * i, 0.07), ev.pop + 0.05 + i * 0.045, 0.12, (i % 2 ? -0.5 : 0.5));

// ---------- удар: мордочка у стекла ----------
fx.addMono(I.thud(50, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.hit + 0.04, 0.5);
keys.addMono(I.musicBox(m('E6') - 0.5), ev.hit, 0.3, 0);
fx.addMono(blub(220, 0.3), ev.hit, 0.3, 0);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.hit + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
// финал: пузырёк лопается в темноте, одна нота
burst(ev.endPop, 0.45, 0, 0.8);
keys.addMono(I.musicBox(m('A4') - 0.4), ev.endPop, 0.24, 0); verb.addMono(I.musicBox(m('A4') - 0.4), ev.endPop, 0.4);

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
  verb: reverb(verb, { room: 0.9, damp: 0.4 }),
};
// тишина перед хлопком: глушим музыку (голос и потрескивание остаются)
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
