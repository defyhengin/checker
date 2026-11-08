// «Мерцалова топь» эп.16 «Тёплышка» - саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev, EIGHTH, BEAT, clock } = sc;
const BAR = 4 * BEAT;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus(), breath = bus();

function tink(f, dec = 14, len = 0.5) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.min(1, t / 0.001) * Math.exp(-t * dec); }
  return b;
}
// ровный тон тепловизора с медленным подъёмом
function whine(len, f0, f1, g) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) { const x = i / n; ph += 2 * Math.PI * (f0 + (f1 - f0) * x) / SR; b[i] = Math.sin(ph) * g * Math.min(1, x * 8) * Math.min(1, (1 - x) * 6); }
  return b;
}
const cloth = (len, at, g, pan = 0, f0 = 900, f1 = 2400) => fx.addMono(I.noiseSweep(len, f0, f1, { q: 1.2, pink: true, shape: (x) => Math.pow(Math.sin(Math.PI * x), 0.8) }), at, g, pan);

// ветер
for (let i = 0; i < 18; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.1, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды, бас (в тепловом зрении - глуше)
const inThermal = (t) => t >= ev.thermal;
for (const n of sc.box) {
  if (n.t >= ev.gone - 0.05) continue;
  const mb = I.musicBox(n.midi + (inThermal(n.t) ? 0 : 0));
  keys.addMono(mb, n.t, inThermal(n.t) ? 0.13 : 0.2, -0.1); verb.addMono(mb, n.t, 0.3);
}
for (const c of sc.chords) {
  if (c.t0 >= ev.gone) continue;
  const t1 = Math.min(c.t1, ev.gone);
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: inThermal(c.t0) ? 480 : 760, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.08, sub: 0.6 }), c.t0, 0.11);
}

// дыхание куртки: вдох в первой половине такта, выдох во второй. Не смолкает и в тишине.
for (let t = clock.OFFSET; t < ev.dark; t += BAR) {
  const near = t >= ev.gone ? 1.8 : t >= ev.thermal ? 1.2 : 1.0;
  breath.addMono(I.noiseSweep(BAR * 0.45, 380, 760, { q: 0.9, pink: true, shape: (x) => Math.pow(Math.sin(Math.PI * x), 1.5) }), t + 0.05, 0.05 * near, -0.05);
  breath.addMono(I.noiseSweep(BAR * 0.5, 620, 300, { q: 0.9, pink: true, shape: (x) => Math.pow(Math.sin(Math.PI * x), 1.2) }), t + BAR * 0.5, 0.06 * near, 0.05);
}

// ---------- объявление ----------
cloth(0.5, ev.sad - 0.1, 0.035, 0.1, 600, 300);                             // капюшон поник
{ const mb = I.musicBox(m('E5') - 0.2); keys.addMono(mb, ev.sad + 0.3, 0.12, 0); verb.addMono(mb, ev.sad + 0.3, 0.3); }
fx.addMono(tink(3900, 22, 0.4), ev.pocket, 0.2, 0.15);                      // ручка блеснула
{ const mb = I.musicBox(m('A6')); keys.addMono(mb, ev.pocket, 0.16, 0.1); verb.addMono(mb, ev.pocket, 0.35); }
cloth(0.7, ev.pocket - 0.35, 0.03, 0.15, 700, 1500);
cloth(1.2, ev.sniff + 0.2, 0.03, -0.1, 500, 1200);                          // капюшон поднимается
for (let i = 0; i < 3; i++) fx.addMono(I.noiseSweep(0.16, 1500, 3200, { q: 2, pink: true }), ev.sniff + 1.2 + i * 0.26, 0.035, 0.05); // нюх-нюх

// ---------- тепловое зрение ----------
fx.addMono(I.tvClick(), ev.thermal, 0.3, 0);
fx.addMono(whine(1.1, 3200, 5200, 1), ev.thermal, 0.025, 0);
fx.addMono(whine(ev.gone - ev.thermal, 7400, 7600, 1), ev.thermal + 0.2, 0.004, 0.3);  // еле слышный писк прибора
for (let i = 0; i < 6; i++) fx.addMono(I.noiseSweep(0.08, 2400, 3600, { q: 3 }), ev.shiver + 0.2 + i * 0.28, 0.015, -0.3); // лягушка дрожит
cloth(1.2, ev.wrap, 0.05, -0.2, 500, 1400);                                 // рукав обнимает
cloth(0.6, ev.wrap + 1.3, 0.03, -0.2, 900, 500);
// тепло уходит: шкатулка спускается и фальшивит
const DRAIN = ['C6', 'A5', 'E5', 'C5'].map(m);
DRAIN.forEach((n, i) => { const t = ev.drain0 + i * (ev.frogOut - ev.drain0) / 4; const mb = I.musicBox(n - 0.12 * i); keys.addMono(mb, t, 0.12, -0.2); verb.addMono(mb, t, 0.3); });
{ const mb = I.musicBox(m('A4') - 0.5); keys.addMono(mb, ev.frogOut, 0.2, -0.2); verb.addMono(mb, ev.frogOut, 0.45); }
cloth(0.8, ev.release, 0.03, -0.2, 1200, 500);
fx.addMono(whine(1.6, 300, 420, 1), ev.good, 0.03, 0);                       // куртка разгорается
cloth(1.6, ev.look + 0.4, 0.035, 0, 400, 900);                              // капюшон поворачивается

// ---------- тишина и разворот ----------
fx.addMono(I.noiseSweep(0.35, 900, 5000, { q: 0.8, pink: true, shape: (x) => Math.pow(x, 2) * (1 - x) * 4 }), ev.whip, 0.22, 0.3); // вжух
fx.addMono(I.thud(48, 0.16), ev.hit, 0.8);
fx.addMono(I.subBoom(1.8, 58, 26), ev.hit + 0.04, 0.5);
fx.addMono(I.tvClick(), ev.hit, 0.35, 0);
fx.addMono(whine(ev.dark - ev.hit, 5600, 6400, 1), ev.hit, 0.012, 0);
for (const [n, g] of [[m('A1'), 0.5], [m('A#1'), 0.36], [m('E2'), 0.2]]) {
  const s = I.strings(n, ev.dark - ev.hit + 0.1, { attack: 0.03, release: 0.1, bright: 0.4, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
{ const mb = I.musicBox(m('E6') - 0.45); keys.addMono(mb, ev.hands, 0.14, 0); verb.addMono(mb, ev.hands, 0.4); }
cloth(ev.grab - ev.come, ev.come, 0.07, 0, 300, 900);                       // рукав ползёт
fx.addMono(I.thud(64, 0.06), ev.grab, 0.6, 0);
fx.addMono(I.tvClick(), ev.grab, 0.3, 0);

// ---------- финал ----------
{ const mb = I.musicBox(m('A4') - 0.5); keys.addMono(mb, ev.cool, 0.18, 0); verb.addMono(mb, ev.cool, 0.4); }
breath.addMono(I.noiseSweep(1.4, 620, 260, { q: 0.9, pink: true, shape: (x) => Math.pow(Math.sin(Math.PI * x), 1.2) }), ev.cool + 0.5, 0.09, 0);

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (!fs.existsSync(f)) continue;
  MIX.loadAudio(f, { at: v.at, gain: v.gain || 1.0 }).mixInto(voice, 1);
}
MIX.duck([keys, pad, low, amb, verb], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb, breath,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
};
for (const name of ['keys', 'pad', 'amb', 'verb']) MIX.gate(stems[name], ev.gone, ev.dark);
MIX.gate(stems.low, ev.gone, ev.hit);
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7, breath: 1.0 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.dark + 0.25, ev.title);
MIX.fadeOut(mix, DURATION - 0.6, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
