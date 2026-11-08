// «Мерцалова топь» эп.15 «Пуговка» - саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev, EIGHTH } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus();

// звон: чистый синус с быстрым спадом
function tink(f, dec = 14, len = 0.5) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.min(1, t / 0.001) * Math.exp(-t * dec); }
  return b;
}
// прокол: короткий сухой щелчок ткани
function pierce(seed = 1) {
  const n = Math.round(0.06 * SR), b = new Float32Array(n);
  let s = seed * 7919 + 13, prev = 0;
  for (let i = 0; i < n; i++) { s = (s * 9301 + 49297) % 233280; const x = s / 233280 * 2 - 1; const hp = x - prev; prev = x; b[i] = hp * Math.exp(-i / SR * 120); }
  return b;
}
// нитка протягивается: узкий шорох с подъёмом
const pull = (len, f0, f1, g, at, pan = 0) => fx.addMono(I.noiseSweep(len, f0, f1, { q: 4, shape: (x) => Math.pow(Math.sin(Math.PI * x), 0.7) }), at, g, pan);

// ветер
for (let i = 0; i < 16; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.1, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды, бас
for (const n of sc.box) { if (n.t >= ev.gone - 0.05) continue; if (n.t > ev.sew0 - 0.05 && n.t < ev.SEW[9] + 0.1) continue; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.2, -0.1); verb.addMono(mb, n.t, 0.3); }
for (const c of sc.chords) {
  if (c.t0 >= ev.gone) continue;
  const t1 = Math.min(c.t1, ev.gone);
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: c.t0 >= ev.sew0 - 1 ? 520 : 720, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.08, sub: 0.6 }), c.t0, 0.11);
}

// ---------- интро и шаг 1 ----------
fx.addMono(I.paperFwip(1.4, 3), ev.wave, 0.06, 0.2);
fx.addMono(tink(4200, 26, 0.35), ev.needle, 0.22, 0.15);                 // игла блеснула
{ const mb = I.musicBox(m('E6')); keys.addMono(mb, ev.needle, 0.22, 0); verb.addMono(mb, ev.needle, 0.35); }
fx.addMono(tink(2900, 9, 0.9), ev.dew, 0.2, -0.2);                        // росинка
{ const mb = I.musicBox(m('A6')); keys.addMono(mb, ev.dew, 0.2, -0.1); verb.addMono(mb, ev.dew, 0.4); }
fx.addMono(tink(2350, 18, 0.5), ev.coin, 0.24, 0.1);                      // монетка
fx.addMono(tink(3520, 22, 0.4), ev.coin + 0.06, 0.12, 0.1);
fx.addMono(I.noiseSweep(0.25, 400, 900, { q: 1, pink: true }), ev.coin - 0.2, 0.05, 0.1); // плеск
fx.addMono(I.noiseSweep(0.35, 1800, 5000, { q: 2 }), ev.flee, 0.05, -0.5); // фррр - светлячок улетел

// ---------- шаг 2 ----------
pull(0.5, 2500, 5000, 0.04, ev.thread - 0.45, 0.1);
fx.addMono(tink(5200, 30, 0.25), ev.thread, 0.2, 0.1);                    // нитка в ушке
fx.addMono(I.woodTick(1.1), ev.button, 0.14, 0.1);                        // пуговица
{ const mb = I.musicBox(m('C6')); keys.addMono(mb, ev.button, 0.18, 0); verb.addMono(mb, ev.button, 0.3); }
for (let i = 0; i < 4; i++) fx.addMono(I.woodTick(2.2), ev.watch + 0.2 + i * 0.5, 0.035, -0.1); // тикают часы
{ const mb = I.musicBox(m('E6') - 0.4); keys.addMono(mb, ev.watch, 0.18, 0); verb.addMono(mb, ev.watch, 0.3); } // чуть фальшиво
{ const mb = I.musicBox(m('A4') - 0.45); keys.addMono(mb, ev.sleeve + 0.3, 0.2, -0.2); verb.addMono(mb, ev.sleeve + 0.3, 0.4); } // рукав

// ---------- пришивает глаза: каждый стежок - нота ----------
ev.SEW.forEach((t, i) => {
  fx.addMono(pierce(i + 1), t, 0.22, (i % 2 ? 0.25 : -0.25));
  pull(EIGHTH * 0.8, 1800, 3600, 0.025, t + 0.02, (i % 2 ? 0.25 : -0.25));
  const mb = I.musicBox(sc.SEW_NOTES[i]); keys.addMono(mb, t, 0.2, (i % 2 ? 0.15 : -0.15)); verb.addMono(mb, t, 0.35);
});

// ---------- тишина: глаза поворачиваются ----------
for (let i = 0; i < 10; i++) fx.addMono(I.woodTick(2.6 + 0.15 * (i % 4)), ev.turn + i * 0.006, 0.05, (i % 2 ? 0.4 : -0.4));
fx.addMono(tink(4600, 30, 0.3), ev.close, 0.08, 0);                       // игла у объектива
pull(1.2, 400, 900, 0.03, ev.close + 0.4, 0);

// ---------- стежок через объектив ----------
fx.addMono(I.thud(52, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.6, 60, 28), ev.hit + 0.04, 0.5);
fx.addMono(I.glass(3, { size: 0.6 }), ev.hit, 0.35, 0);
fx.addMono(pierce(40), ev.hit, 0.5, 0);
for (const [n, g] of [[m('A1'), 0.5], [m('A#1'), 0.38], [m('E2'), 0.22]]) {
  const s = I.strings(n, ev.dark - ev.hit + 0.2, { attack: 0.03, release: 0.15, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
// крест-накрест: каждый стежок - прокол, рывок нитки и нота шкатулки всё ниже и фальшивее
const DOWN = ['E6', 'C6', 'A5', 'E5', 'C5', 'A4'].map(m);
ev.STITCH.forEach((t, i) => {
  if (i) fx.addMono(pierce(50 + i), t, 0.45, (i % 2 ? 0.3 : -0.3));
  if (i) fx.addMono(I.thud(80 - i * 6, 0.06), t, 0.3, 0);
  pull(EIGHTH * 0.85, 1400 - i * 120, 2600 - i * 200, 0.06, t + 0.03, (i % 2 ? -0.3 : 0.3));
  keys.addMono(I.musicBox(DOWN[i] - 0.15 * i), t, 0.22, 0);
});
// финал: в темноте нитку тянут ещё раз
pull(0.6, 600, 1600, 0.12, ev.tug - 0.5, 0);
fx.addMono(pierce(77), ev.tug, 0.4, 0);
fx.addMono(I.thud(70, 0.05), ev.tug, 0.25, 0);
keys.addMono(I.musicBox(m('A4') - 0.5), ev.tug, 0.2, 0); verb.addMono(I.musicBox(m('A4') - 0.5), ev.tug, 0.35);

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
MIX.gate(mix, ev.dark + 0.25, ev.title);
MIX.fadeOut(mix, DURATION - 0.6, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
