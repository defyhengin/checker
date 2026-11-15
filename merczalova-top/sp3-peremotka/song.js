// «Мерцалова топь» финальный спецвыпуск «Перемотка» - звук.
// Хвост колыбельной 19-й -> щелчок -> визг перемотки с нежным голосом задом наперёд (в нём спрятано
// «это уже не я» - если развернуть) -> стоп, снег -> кассета: гул, шипение, голос наблюдателя через динамик
// диктофона, лягушки за окном -> плёнку зажёвывает -> полная тишина -> «это я. открой.» вплотную ->
// Обманка: колыбельная 1-й серии и тихий звон нового огонька -> писк журнала.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, rng } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const box = bus(), rew = bus(), tape = bus(), dict = bus(), amb = bus(), fx = bus(), wh = bus(), verb = bus(), stat = bus();

function tone(f, len, { a = 0.004, r = 0.02 } = {}) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR, env = Math.min(1, t / a) * Math.min(1, (len - t) / r); b[i] = Math.sin(2 * Math.PI * f * t) * Math.max(0, env); }
  return b;
}
function noise(len, seed, { hp = 0 } = {}) {
  const w = rng(seed), n = Math.round(len * SR), b = new Float32Array(n); let prev = 0;
  for (let i = 0; i < n; i++) { const x = w() * 2 - 1; b[i] = hp ? x - prev : x; prev = x; }
  return b;
}
function croak(p) {
  const len = 0.22, n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.sin(Math.PI * t / len), am = 0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * 32 * p * t));
    b[i] = Math.sin(2 * Math.PI * 260 * p * t + 2 * Math.sin(2 * Math.PI * 520 * p * t)) * am * env;
  }
  return b;
}
const mono = (b) => { for (let i = 0; i < b.n; i++) { const m = (b.L[i] + b.R[i]) * 0.5; b.L[i] = m; b.R[i] = m; } return b; };

// --- начало: хвост колыбельной 19-й, камера на боку ---
for (const nt of sc.intro) box.addMono(I.musicBox(nt.midi), nt.t, 0.12, 0);
for (let t = 0; t < ev.click; t += 2.2) amb.addMono(I.noiseSweep(3.0, 300, 210, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t, 0.07, 0);
MIX.gate(box, ev.click + 0.05, ev.hit - 0.01);   // gate = заглушить отрезок
fx.addMono(I.tvClick(), ev.click, 0.5, 0);

// --- перемотка ---
{
  const len = ev.rew1 - ev.rew0, n = Math.round(len * SR), L = new Float32Array(n), w = rng(31);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, f = 1400 + 900 * (t / len) + 120 * Math.sin(t * 9);
    ph += 2 * Math.PI * f / SR;
    L[i] = 0.25 * Math.sin(ph) * (0.6 + 0.4 * Math.sin(t * 31)) + 0.18 * (w() * 2 - 1);
  }
  rew.addMono(L, ev.rew0, 0.14, 0);
  // мотор
  rew.addMono(I.noiseSweep(len, 900, 2400, { q: 1.4, shape: () => 1 }), ev.rew0, 0.12, 0);
}
MIX.loadAudio(path.join(__dirname, 'voice/rew.wav'), { at: ev.rew0, gain: 0.9, length: DURATION }).mixInto(rew, 1);
MIX.loadAudio(path.join(__dirname, 'voice/hid.wav'), { at: ev.rew0 + 2.6, gain: 0.45, length: DURATION }).mixInto(rew, 1);
MIX.lofi(rew, { wow: 2.5, flutter: 3, lowpass: 3600, sat: 1.8 });
MIX.gate(rew, 0, ev.rew0); MIX.gate(rew, ev.rew1, DURATION);
// стоп: тяжёлый щелчок механизма, снег
fx.addMono(I.thud(70, 0.1), ev.stop, 0.7, 0);
fx.addMono(I.tvClick(), ev.stop, 0.6, 0);
stat.addMono(noise(ev.tape - ev.stop, 7, { hp: 1 }), ev.stop, 0.14, 0);

// --- кассета ---
{
  const len = ev.chew - ev.tape, n = Math.round(len * SR), L = new Float32Array(n), w = rng(9);
  for (let i = 0; i < n; i++) { const t = i / SR; L[i] = 0.5 * Math.sin(2 * Math.PI * 60 * t) + 0.2 * Math.sin(2 * Math.PI * 120 * t) + 0.35 * (w() * 2 - 1); }
  tape.addMono(L, ev.tape, 0.045, 0);
}
for (let t = ev.tape; t < ev.chew; t += 3.1) amb.addMono(I.noiseSweep(4.0, 320, 220, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t, 0.05, 0.5);
for (const f of sc.FROGS) amb.addMono(croak(f.p), f.t, 0.035, f.pan);
// голос наблюдателя через динамик диктофона: глухо, узко, с плёночной плавучестью
MIX.loadAudio(path.join(__dirname, sc.vo[0].file), { at: sc.vo[0].at, gain: 1.0, length: DURATION }).mixInto(dict, 1);
mono(dict);
MIX.highpass(dict, 260);
MIX.lofi(dict, { wow: 0.8, flutter: 1.2, lowpass: 3400, sat: 1.5 });
for (let i = 0; i < N; i++) { dict.L[i] *= 1.0; dict.R[i] *= 0.9; }

// --- зажёвывание: голос/гул съезжают вниз, хруст ---
{
  const len = ev.black - ev.chew, n = Math.round(len * SR), L = new Float32Array(n), w = rng(13);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, k = t / len, f = 180 * (1 - 0.85 * k);
    ph += 2 * Math.PI * f / SR;
    L[i] = (0.5 * Math.sin(ph) + 0.4 * (w() * 2 - 1) * (U01(t * 60) > 0.6 ? 1 : 0.2)) * (1 - k * 0.3);
  }
  function U01(x) { return (Math.sin(x * 12.9898) * 43758.5453) % 1 < 0 ? -((Math.sin(x * 12.9898) * 43758.5453) % 1) : (Math.sin(x * 12.9898) * 43758.5453) % 1; }
  fx.addMono(L, ev.chew, 0.35, 0);
  fx.addMono(I.thud(48, 0.14), ev.chew, 0.6, 0);
}

// --- шёпот в полной тишине: близко, сухо, с маленьким хвостом ---
for (const v of sc.vo.slice(1)) MIX.loadAudio(path.join(__dirname, v.file), { at: v.at, gain: 0.55, length: DURATION }).mixInto(wh, 1);
mono(wh);
for (let i = 0; i < N; i++) verb.L[i] = wh.L[i] * 0.3, verb.R[i] = wh.R[i] * 0.3;

// --- Обманка: колыбельная 1-й серии, огонёк ---
fx.addMono(I.thud(60, 0.16), ev.hit, 0.45, 0);
for (const nt of sc.lull) box.addMono(I.musicBox(nt.midi), nt.t, 0.13, 0);
for (let t = ev.hit; t < ev.fade + 0.4; t += 2.6) amb.addMono(I.noiseSweep(3.4, 300, 210, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t, 0.06, -0.3);
fx.addMono(I.bell(1568, 0.6), ev.ignite, 0.08, 0.25);
fx.addMono(I.bell(1661, 0.4), ev.ignite + 0.22, 0.04, 0.25);   // чуть фальшиво - ещё не умеет
// --- журнал ---
fx.addMono(tone(1000, 0.18), ev.rec, 0.2, 0);
fx.addMono(tone(1000, 0.18), ev.again, 0.2, 0);

const stems = { box, rew, tape, dict, amb, fx, wh, stat, verb: reverb(verb, { room: 0.5, damp: 0.6 }) };
const GAIN = { box: 1.0, rew: 1.0, tape: 1.0, dict: 2.4, amb: 1.0, fx: 1.0, wh: 2.2, stat: 1.0, verb: 0.6 };
// тишина: кассета глохнет на зажёвывании, перед шёпотом и после - ничего
for (const name of ['tape', 'dict']) MIX.gate(stems[name], ev.chew + 0.02, DURATION);
MIX.gate(amb, ev.chew + 0.02, ev.hit - 0.01);
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
// полная тишина между зажёвыванием и шёпотом, кроме самого шёпота (и в конце - дорожки после Обманки)
MIX.fadeOut(mix, DURATION - 0.4, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
