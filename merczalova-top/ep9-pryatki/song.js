// «Мерцалова топь» эп.9 «Пряталки» — саундтрек.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { BEAT, DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus();
const EIGHTH = sc.EIGHTH;

// тонкий «звон» огонька
function twinkle(f) {
  const n = Math.round(0.5 * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; b[i] = (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.76 * t)) * Math.min(1, t / 0.003) * Math.exp(-t * 9); }
  return b;
}

// ветер
for (let i = 0; i < 9; i++) {
  const t0 = i * 3.3;
  if (t0 > DURATION) break;
  amb.addMono(I.noiseSweep(4.0, 340 + 90 * (i % 3), 230, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.12, i % 2 ? -0.4 : 0.4);
}
// шкатулка
for (const n of sc.box) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.32); }
// пэды и бас до тишины
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.gone);
  if (c.t0 >= ev.gone) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 720, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.1, sub: 0.6 }), c.t0, 0.12);
}

// ---------- прятки: на каждое укрытие — нота-«ой» и шорох ----------
for (const [t, n] of sc.HIDE_NOTES) {
  keys.addMono(I.musicBox(m(n)), t, 0.22, 0.2); verb.addMono(I.musicBox(m(n)), t, 0.35);
  fx.addMono(I.noiseSweep(0.35, 2400, 900, { q: 0.8, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t - 0.12, 0.12, -0.2);
}
// прыжки по кочке в начале: мягкие «топ» на доли
for (let i = 1; i < 6; i++) fx.addMono(twinkle(880 + 110 * (i % 3)), sc.T(0, 0) + i * BEAT, 0.035, (i % 2 ? -0.3 : 0.3));
// закрыл глазки: тихий выдох
fx.addMono(I.noiseSweep(0.8, 700, 300, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), ev.cover, 0.12, 0);
// счёт: нота шкатулки на каждое число, всё ниже и тише
sc.COUNTS.forEach((t, i) => { const mb = I.musicBox(m(sc.COUNT_NOTES[i]) - (i === 4 ? 0.4 : 0)); keys.addMono(mb, t, 0.24 - i * 0.03, 0); verb.addMono(mb, t, 0.4); });
// глаз между пальцами
keys.addMono(I.musicBox(m('C#6') - 0.3), ev.peek + EIGHTH, 0.12, 0.3);

// ---------- удар: он у объектива ----------
fx.addMono(I.thud(50, 0.14), ev.hit, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.hit + 0.04, 0.5);
keys.addMono(I.musicBox(m('E6') - 0.5), ev.hit, 0.3, 0);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.hit + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.hit, g);
}
// финал: щелчок выключателя в будке и одна нота
fx.addMono(I.thud(900, 0.03), ev.window, 0.25, -0.2);
keys.addMono(I.musicBox(m('A4') - 0.4), ev.window, 0.28, -0.2); verb.addMono(I.musicBox(m('A4') - 0.4), ev.window, 0.4);

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
// тишина: на кочке пусто — глушим всё, кроме голоса
for (const [name, b] of Object.entries(stems)) if (name !== 'voice') MIX.gate(b, ev.gone, ev.hit);
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
