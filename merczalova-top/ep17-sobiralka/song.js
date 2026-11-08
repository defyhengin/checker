// «Мерцалова топь» эп.17 «Собиралка» - саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev, EIGHTH, BEAT, clock } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus(), feet = bus();

function tink(f, dec = 14, len = 0.5) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.35 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.min(1, t / 0.001) * Math.exp(-t * dec); }
  return b;
}
function whine(len, f0, f1, g) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) { const x = i / n; ph += 2 * Math.PI * (f0 + (f1 - f0) * x) / SR; b[i] = Math.sin(ph) * g * Math.min(1, x * 8) * Math.min(1, (1 - x) * 6); }
  return b;
}
const tap = (at, g, pan = 0, f = 1400) => feet.addMono(I.noiseSweep(0.06, f, f * 0.6, { q: 1.5, pink: true, shape: (x) => Math.exp(-x * 6) }), at, g, pan);
const box = (note, at, g = 0.14, pan = 0, detune = 0, wet = 0.35) => { const mb = I.musicBox(m(note) + detune); keys.addMono(mb, at, g, pan); verb.addMono(mb, at, wet); };

// ветер
for (let i = 0; i < 18; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.1, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды, бас - до тишины
for (const n of sc.box) {
  if (n.t >= ev.crawl - 0.05) continue;
  const mb = I.musicBox(n.midi);
  keys.addMono(mb, n.t, 0.17, -0.1); verb.addMono(mb, n.t, 0.3);
}
for (const c of sc.chords) {
  if (c.t0 >= ev.crawl) continue;
  const t1 = Math.min(c.t1, ev.crawl);
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: c.t0 >= ev.zoomOut ? 520 : 760, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.08, sub: 0.6 }), c.t0, 0.1);
}

// шажки Собиралки: восьмые, пока она идёт
const WALK = [[ev.go + 0.3, ev.glasses - 0.4], [ev.glasses + 0.45, ev.key - 0.4], [ev.key + 0.45, ev.button - 0.4], [ev.button + 0.45, ev.special - 0.3], [ev.toBooth + 0.2, ev.atBooth - 0.1]];
for (const [a, b] of WALK) {
  let i = 0;
  for (let t = sc.Q(a); t < b; t += EIGHTH, i++) tap(t, 0.05, i % 2 ? 0.15 : -0.15, i % 2 ? 1500 : 1250);
}

// ---------- находки ----------
const FIND = [[ev.glasses, 'E6', 4200], [ev.key, 'A6', 5200], [ev.button, 'C6', 3600]];
for (const [t, n, f] of FIND) {
  fx.addMono(tink(f, 20, 0.4), t + 0.38, 0.1, 0.1);       // упала в корзинку
  box(n, t + 0.38, 0.12, 0.1);
}
// особенная находка
box('A5', ev.special + 0.3, 0.1, -0.2); box('E6', ev.special + 0.3 + EIGHTH, 0.1, -0.2); box('A6', ev.special + 0.3 + 2 * EIGHTH, 0.12, -0.2, 0, 0.5);
fx.addMono(I.noiseSweep(0.5, 600, 1400, { q: 1, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.raise - 0.25, 0.05, -0.1); // вытащила из ила
fx.addMono(I.noiseSweep(0.18, 300, 180, { q: 1.2, pink: true }), ev.raise - 0.05, 0.08, -0.1);

// ---------- будка ----------
fx.addMono(I.noiseSweep(0.55, 260, 520, { q: 4, shape: (x) => Math.sin(Math.PI * x) }), ev.window, 0.08, 0.2);  // скрип ставен
fx.addMono(I.thud(140, 0.05), ev.take, 0.5, 0.2);                                                             // хвать
fx.addMono(tink(2600, 30, 0.3), ev.take, 0.14, 0.2);
fx.addMono(I.thud(110, 0.07), ev.shut, 0.45, 0.2);                                                            // хлоп
box('C5', ev.shut + 0.4, 0.1, 0, -0.35);

// ---------- обратно, к камере ----------
fx.addMono(I.noiseSweep(1.4, 400, 1200, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.zoomOut, 0.05, 0);
// в тишине - только её шажки, всё ближе и громче
{
  let i = 0;
  for (let t = sc.Q(ev.turn); t < ev.hit - 0.3; t += EIGHTH, i++) {
    const p = Math.max(0, (t - ev.turn) / (ev.hit - ev.turn));
    tap(t, 0.02 + 0.13 * p * p, i % 2 ? 0.12 : -0.12, (i % 2 ? 1300 : 1100) - 400 * p);
  }
}
fx.addMono(whine(ev.hit - ev.crawl, 6800, 7300, 1), ev.crawl, 0.003, 0.3);

// ---------- вплотную ----------
fx.addMono(I.thud(48, 0.16), ev.hit, 0.8);
fx.addMono(I.subBoom(1.8, 58, 26), ev.hit + 0.04, 0.5);
fx.addMono(tink(1900, 6, 1.4), ev.hit, 0.12, 0);
for (const [n, g] of [[m('A1'), 0.5], [m('A#1'), 0.36], [m('E2'), 0.2]]) {
  const s = I.strings(n, ev.dark - ev.hit + 0.1, { attack: 0.03, release: 0.1, bright: 0.4, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
fx.addMono(whine(ev.dark - ev.hit, 5600, 6200, 1), ev.hit, 0.008, 0);
box('E6', ev.you + 0.2, 0.12, 0, -0.45, 0.45);
// тук-тук по стеклу объектива
for (const t of [ev.tap1, ev.tap2]) { fx.addMono(I.thud(320, 0.03), t, 0.55, 0.15); fx.addMono(tink(2300, 45, 0.15), t, 0.2, 0.15); }
// лапки обхватывают камеру, её поднимают
fx.addMono(I.noiseSweep(0.6, 500, 1400, { q: 1, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.steps, 0.08, -0.3);
fx.addMono(I.noiseSweep(0.6, 520, 1500, { q: 1, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.steps + 0.15, 0.08, 0.3);
fx.addMono(I.noiseSweep(ev.arrive - ev.lift, 200, 900, { q: 0.6, pink: true, shape: (x) => Math.pow(x, 1.5) }), ev.lift, 0.12, 0);
for (let i = 0; i < 4; i++) fx.addMono(I.noiseSweep(0.3, 300, 200, { q: 4, shape: (x) => Math.sin(Math.PI * x) }), ev.lift + 0.3 + i * 0.35, 0.05, i % 2 ? 0.2 : -0.2); // скрип корзинки
fx.addMono(I.thud(64, 0.06), ev.arrive, 0.6, 0);
fx.addMono(I.tvClick(), ev.arrive, 0.3, 0);

// ---------- финал: внутри корзинки ----------
box('A4', ev.title + 0.6, 0.14, 0, -0.5, 0.45);
sc.STEPS.forEach((t, i) => { if (i % 2 === 0) fx.addMono(I.noiseSweep(0.4, 700, 400, { q: 1, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t, 0.03, i % 4 ? 0.3 : -0.3); });
fx.addMono(tink(4800, 25, 0.3), ev.near + 0.8, 0.05, -0.4);   // блеснули очки
fx.addMono(tink(3900, 25, 0.3), ev.near + 1.9, 0.05, 0.4);    // ключик

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (!fs.existsSync(f)) continue;
  MIX.loadAudio(f, { at: v.at, gain: v.gain || 1.0 }).mixInto(voice, 1);
}
MIX.duck([keys, pad, low, amb, verb], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb, feet,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
};
for (const name of ['keys', 'pad', 'amb', 'verb']) MIX.gate(stems[name], ev.crawl, ev.hit);
MIX.gate(stems.low, ev.crawl, ev.hit);
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7, feet: 3.2 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.dark + 0.25, ev.title);
MIX.fadeOut(mix, DURATION - 0.6, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
