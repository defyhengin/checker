// «Мерцалова топь» эп.11 «Моховички» - саундтрек.
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

// мягкий «чпок» прорастания
function sprout(f = 700) {
  const n = Math.round(0.09 * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.003) * Math.exp(-t * 45);
    ph += (2 * Math.PI * f * (1.6 - 0.8 * t / 0.09)) / SR;
    b[i] = Math.sin(ph) * env;
  }
  return b;
}
// сонное сопение лягушки
function snore(len = 1.4) {
  return I.noiseSweep(len, 300, 180, { q: 0.9, pink: true, shape: (x) => Math.sin(Math.PI * x) ** 2 });
}

// ветер в камышах
for (let i = 0; i < 11; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.12, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды, бас до тишины
for (const n of sc.box) { if (n.t >= ev.gone) continue; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.32); }
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.gone);
  if (c.t0 >= ev.gone) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 680, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.08, sub: 0.6 }), c.t0, 0.12);
}
// сопение лягушки, пока на неё смотрим
for (let t = ev.toFrog - 0.4; t < ev.reveal + 0.6; t += BEAT * 2) fx.addMono(snore(1.3), t, 0.08, 0.3);

// ---------- прорастание: «чпок» + нота шкатулки ----------
for (const s of sc.SPROUT) {
  fx.addMono(sprout(620 + 90 * s.i), s.t, 0.3, s.on === 'stump' ? -0.3 : 0.3);
  const mb = I.musicBox(m(s.note)); keys.addMono(mb, s.t, 0.24, s.on === 'stump' ? -0.3 : 0.3); verb.addMono(mb, s.t, 0.35);
}
// отъезд: низкий гул и шорох мха
fx.addMono(I.noiseSweep(3.2, 900, 160, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.reveal, 0.14, 0);
for (const [n, g] of [[m('A1'), 0.25], [m('E2'), 0.15]]) {
  const s = I.strings(n, ev.wide - ev.reveal + 1.5, { attack: 1.2, release: 0.8, bright: 0.3, seed: n });
  low.addStereo(s.L, s.R, ev.reveal, g);
}
// в тишине - тонкий скрип ползущих нитей (кончается за восьмую до удара)
fx.addMono(I.noiseSweep(ev.hit - ev.gone - EIGHTH - 0.2, 5200, 7600, { q: 2.5, pink: false, shape: (x) => 0.4 + 0.6 * x }), ev.gone + 0.2, 0.025, 0);

// ---------- удар: грибочек на объективе, все открыли глаза ----------
fx.addMono(I.thud(50, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.hit + 0.04, 0.5);
fx.addMono(sprout(380), ev.hit, 0.6, 0);
keys.addMono(I.musicBox(m('E6') - 0.5), ev.hit, 0.3, 0);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.hit + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
// финал: грибочки вокруг строки журнала, по ноте; затем щелчок
sc.END_SPROUT.forEach((t, i) => {
  fx.addMono(sprout(700 + 60 * i), t, 0.16, (i - 2) * 0.2);
  const mb = I.musicBox(m(['A5', 'G5', 'E5', 'D5', 'A4'][i]) - (i === 4 ? 0.4 : 0)); keys.addMono(mb, t, 0.16, (i - 2) * 0.2); verb.addMono(mb, t, 0.3);
});
fx.addMono(I.thud(900, 0.03), ev.endCut, 0.25, 0);

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
