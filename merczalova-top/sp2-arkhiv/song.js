// «Мерцалова топь» спецвыпуск «Архив» - звук записи CAM-2: гул, динамик монитора (голос и шкатулка 1-й серии),
// щелчки лампы (поддельное «ОТКРОЙ»), клавиши, писк экспорта, тишина, помехи.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, rng } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const hum = bus(), amb = bus(), fx = bus(), spk = bus(), verb = bus(), stat = bus();

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

// гул камеры и компьютера - до тишины
{
  const n = Math.round((ev.dark - ev.cam) * SR), L = new Float32Array(n), w = rng(7);
  for (let i = 0; i < n; i++) { const t = i / SR; L[i] = 0.5 * Math.sin(2 * Math.PI * 60 * t) + 0.25 * Math.sin(2 * Math.PI * 120 * t) + 0.1 * (w() * 2 - 1); }
  hum.addMono(L, ev.cam, 0.05, 0);
}
fx.addMono(tone(1000, 0.18), ev.beep, 0.25, 0);
fx.addMono(tone(1000, 0.5), ev.next, 0.22, 0);

// болото за окном (справа, тихо)
for (let t = ev.cam; t < ev.dark; t += 3.1) amb.addMono(I.noiseSweep(4.0, 320, 220, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t, 0.06, 0.5);
for (const f of sc.FROGS) amb.addMono(croak(f.p), f.t, 0.04, f.pan);

// динамик монитора: голос 1-й серии + шкатулка, глухо и узко
fx.addMono(I.woodTick(1.8), ev.play - 0.05, 0.2, -0.2);              // щелчок мыши - «плей»
for (const v of sc.vo) MIX.loadAudio(path.join(__dirname, v.file), { at: v.at, gain: 1.0 }).mixInto(spk, 1);
for (const nt of sc.lull) spk.addMono(I.musicBox(nt.midi), nt.t, 0.05, 0);
MIX.highpass(spk, 380);
MIX.lofi(spk, { wow: 0.6, flutter: 0.6, lowpass: 2800, sat: 1.6 });
// стерео -> чуть левее (монитор слева от центра)
for (let i = 0; i < N; i++) { const m = (spk.L[i] + spk.R[i]) * 0.5; spk.L[i] = m * 1.1; spk.R[i] = m * 0.8; }
MIX.gate(spk, ev.exp0, DURATION);
verb.addMono(new Float32Array(1), 0, 0);

// лампа: щелчок на каждое вкл/выкл (поддельный ритм)
sc.FLASH.forEach(([a, b]) => {
  fx.addMono(I.woodTick(1.6), a, 0.3, 0.55);
  fx.addMono(I.woodTick(1.3), b, 0.2, 0.55);
});
// клавиши: имя файла
for (const L of sc.TYPE) fx.addMono(I.woodTick(2.2 + (L.t * 7 % 1) * 0.4), L.t, 0.14, -0.15);
fx.addMono(I.woodTick(1.8), ev.bar0 - 0.1, 0.2, -0.2);                // Enter
fx.addMono(tone(1320, 0.12), ev.done, 0.12, 0); fx.addMono(tone(1760, 0.18), ev.done + 0.12, 0.12, 0);   // «готово»
// монитор гаснет: короткий спад высокого тона
{
  const len = 0.35, n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * (9000 - 7000 * t / len) * t) * (1 - t / len); }
  fx.addMono(b, ev.dark, 0.04, 0);
}

// помехи
stat.addMono(noise(ev.cut - ev.hit, 99, { hp: 1 }), ev.hit, 0.16, 0);
fx.addMono(I.thud(55, 0.12), ev.hit, 0.6, 0);

const stems = { hum, amb, fx, spk, stat, verb: reverb(verb, { room: 0.9, damp: 0.4 }) };
const GAIN = { hum: 0.7, amb: 1.0, fx: 1.0, spk: 2.6, stat: 1.0, verb: 0.0 };
// полная тишина после того, как монитор погас (кроме самого спада)
for (const name of ['hum', 'amb', 'spk']) MIX.gate(stems[name], ev.dark, ev.hit);
MIX.gate(fx, ev.dark + 0.4, ev.hit - 0.001);
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.cut, ev.next - 0.01);
MIX.fadeOut(mix, DURATION - 0.4, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
