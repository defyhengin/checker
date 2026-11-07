// «Мерцалова топь» эп.12 «Луноед» - саундтрек.
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

// хрусткий укус: короткий шумовой щелчок + «хрум»
function crunch(seed = 1, bright = 1) {
  const n = Math.round(0.16 * SR), b = new Float32Array(n);
  let s = seed * 9301 + 49297;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 * 2 - 1; };
  let lp = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const grit = (t % 0.028 < 0.012 ? 1 : 0.25) * Math.exp(-t * 22);
    const x = rnd(); lp += (x - lp) * (0.35 * bright);
    b[i] = (lp * 1.4 + (i < 90 ? x * 0.8 : 0)) * grit;
  }
  return b;
}
// жевание: три мягких «ням»
function chew(at, g = 0.08) { for (let i = 0; i < 3; i++) fx.addMono(crunch(20 + i, 0.25), at + 0.25 + i * 0.22, g, 0.2); }
// звон крошек
function sparkle(f) {
  const n = Math.round(0.4 * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = Math.sin(2 * Math.PI * f * t) * Math.min(1, t / 0.002) * Math.exp(-t * 12); }
  return b;
}

// ветер
for (let i = 0; i < 9; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.11, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды, бас - до конца луны; дальше только редкие ноты
for (const n of sc.box) { if (n.t >= ev.lastBite) continue; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.32); }
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.gone);
  if (c.t0 >= ev.gone) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: c.t0 >= ev.lastBite ? 420 : 700, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.08, sub: 0.6 }), c.t0, 0.12);
}

// ---------- укусы луны ----------
[...ev.bites, ev.lastBite].forEach((t, i) => {
  fx.addMono(crunch(i + 1), t, 0.55, 0.2);
  const mb = I.musicBox(m(sc.BITE_NOTES[i])); keys.addMono(mb, t, 0.24, 0.1); verb.addMono(mb, t, 0.35);
  for (let j = 0; j < 4; j++) fx.addMono(sparkle(2200 + 400 * j + 300 * i), t + 0.15 + j * 0.09, 0.05, (j % 2 ? -0.4 : 0.4));
  chew(t);
});
// луна закончилась: низкий выдох
fx.addMono(I.noiseSweep(1.6, 600, 140, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.lastBite + 0.05, 0.14, 0);
// шорох: силуэт поднимается за крышей
fx.addMono(I.noiseSweep(0.9, 300, 700, { q: 1, pink: true, shape: (x) => x }), ev.rise, 0.1, -0.2);
// укус окна: хруст стекла, свет гаснет
fx.addMono(crunch(9, 1.4), ev.windowBite, 0.5, -0.2);
fx.addMono(I.glass(7, { size: 0.5 }), ev.windowBite + 0.02, 0.18, -0.2);
fx.addMono(I.thud(900, 0.03), ev.windowBite + 0.05, 0.2, -0.2);

// ---------- удар: Луноед откусывает от точки REC ----------
fx.addMono(I.thud(50, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.hit + 0.04, 0.5);
fx.addMono(crunch(13, 1.2), ev.hit, 0.6, 0);
keys.addMono(I.musicBox(m('E6') - 0.5), ev.hit, 0.3, 0);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.hit + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
// финал: крошечный укус точки REC в журнале, одна нота, щелчок
fx.addMono(crunch(17, 0.8), ev.endBite, 0.3, 0);
keys.addMono(I.musicBox(m('A4') - 0.4), ev.endBite, 0.24, 0); verb.addMono(I.musicBox(m('A4') - 0.4), ev.endBite, 0.4);
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
