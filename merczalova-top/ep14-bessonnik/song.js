// «Мерцалова топь» эп.14 «Бессонник» - саундтрек.
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

// низкий гул монитора/электричества в будке
function hum(len, f = 50) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) * 0.6 + Math.sin(2 * Math.PI * f * 3 * t) * 0.25) * Math.min(1, t / 0.5, (len - t) / 0.3); }
  return b;
}
// стук костяшками по дереву: глухой удар + призвук доски
function knock(g, pan = 0) {
  return (at) => { fx.addMono(I.thud(140, 0.05), at, g, pan); fx.addMono(I.woodTick(0.9), at, g * 0.6, pan); verb.addMono(I.thud(140, 0.05), at, g * 0.5); };
}

// ветер, камыши
for (let i = 0; i < 14; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.1, i % 2 ? -0.4 : 0.4);
}
// шкатулка, пэды, бас (до тишины; после двери - снова, тише и ниже)
const playing = (t) => t < ev.gone || (t >= ev.shut + 0.4 && t < ev.turn);
for (const n of sc.box) { if (!playing(n.t)) continue; const g = n.t > ev.shut ? 0.16 : 0.22; const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, g, -0.1); verb.addMono(mb, n.t, 0.32); }
for (const c of sc.chords) {
  for (const [a, b] of [[0, ev.gone], [ev.shut + 0.4, ev.turn]]) {
    const t0 = Math.max(c.t0, a), t1 = Math.min(c.t1, b);
    if (t1 - t0 < 0.2) continue;
    for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - t0, { cutoff: t0 > ev.shut ? 460 : 720, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, t0, 0.06); }
    low.addMono(I.bass(c.bass + 12, t1 - t0, { bright: 0.08, sub: 0.6 }), t0, 0.11);
  }
}

// ---------- окно загорается: щелчок и гул монитора ----------
fx.addMono(I.woodTick(2.4), ev.reveal, 0.12, 0);
{ const mb = I.musicBox(m('E6')); keys.addMono(mb, ev.reveal, 0.22, 0); verb.addMono(mb, ev.reveal, 0.4); }
amb.addMono(hum(ev.shut - ev.reveal), ev.reveal, 0.025, 0);

// ---------- тишина: три стука, дверь ----------
const kn = knock(0.5, 0.1);
for (const t of sc.knocks) kn(t);
fx.addMono(I.noiseSweep(0.6, 700, 300, { q: 1.4, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.door, 0.12, 0.1);   // скрип
{ const mb = I.musicBox(m('A5') - 0.4); keys.addMono(mb, ev.door, 0.2, 0.1); verb.addMono(mb, ev.door, 0.4); }
fx.addMono(I.noiseSweep(0.5, 300, 200, { q: 0.8, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.shadow, 0.05, 0.2);   // шорох
fx.addMono(I.thud(90, 0.08), ev.shut, 0.5, 0.1);           // дверь закрылась
fx.addMono(I.woodTick(1.2), ev.shut + 0.02, 0.2, 0.1);

// ---------- разворот камеры ----------
fx.addMono(I.noiseSweep(0.5, 400, 2400, { q: 0.6, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.turn - 0.25, 0.12, 0);
// у зрителя: тихий гул экрана
amb.addMono(hum(ev.cut - ev.turn, 60), ev.turn, 0.018, 0);
// одна фальшивая нота шкатулки
{ const mb = I.musicBox(m('E6') - 0.5); keys.addMono(mb, ev.sour, 0.3, 0); verb.addMono(mb, ev.sour, 0.55); }

// ---------- финал: стук уже в вашу дверь ----------
const kn2 = knock(0.42, 0);
for (const t of sc.endKnocks) kn2(t);
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
