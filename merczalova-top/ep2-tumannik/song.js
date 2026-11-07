// «Мерцалова топь» эп.2 «Туманник» — саундтрек из событий score.js.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), tick = bus(), verb = bus(), dly = bus();

// ветер в тумане
for (let i = 0; i < 8; i++) {
  const t0 = i * 3.3, len = 4.0;
  if (t0 > ev.breath) break;
  amb.addMono(I.noiseSweep(len, 320 + 90 * (i % 3), 220, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.14, i % 2 ? -0.5 : 0.5);
}

// колыбельная шкатулки
for (const n of sc.box) {
  const mb = I.musicBox(n.midi);
  keys.addMono(mb, n.t, 0.3, 0.15);
  verb.addMono(mb, n.t, 0.3);
  dly.addMono(mb, n.t, 0.1);
}
// пэды и бас
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.breath);
  if (c.t0 >= ev.breath) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 800, attack: 0.8, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.07); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.1, sub: 0.6 }), c.t0, 0.15);
}

// «время»: часы тикают с первого появления и всё громче
const hits = [...sc.looks.map((l) => l.to), ...sc.backs.map((b) => b.to)];
for (let t = ev.ticks, i = 0; t < ev.breath - 0.01; t += BEAT / 2, i++) {
  if (hits.some((h) => Math.abs(h - t) < 0.2)) continue; // не мешаем ударам
  const g = 0.08 + 0.22 * ((t - ev.ticks) / (ev.breath - ev.ticks));
  tick.addMono(I.woodTick(i % 2 ? 0.9 : 1.15), t, g, i % 2 ? 0.25 : -0.25);
}

// поворот камеры: тихий свист воздуха; на прибытии — «пф», силуэт исчез
for (const L of sc.looks) {
  fx.addMono(I.noiseSweep(L.to - L.from, 300, 1800, { q: 0.9, pink: true, shape: (x) => x * x }), L.from, 0.12, L.dir * 0.6);
  fx.addMono(I.noiseSweep(0.35, 5000, 700, { q: 0.8, pink: true, shape: (x) => Math.exp(-x * 7) }), L.to, 0.55, L.dir * 0.5);
  fx.addMono(I.pop(0.5), L.to, 0.35, L.dir * 0.4);
  verb.addMono(I.pop(0.5), L.to, 0.2);
}
// камера вернулась — силуэт уже ближе: глухой удар + фальшивая нота шкатулки
sc.backs.forEach((B, i) => {
  fx.addMono(I.noiseSweep(B.to - B.from, 1600, 300, { q: 0.9, pink: true }), B.from, 0.1);
  const st = sc.stages[i + 1];
  const pan = st.x < 0.5 ? -0.6 : 0.6;
  fx.addMono(I.thud(60 - i * 6, 0.14), B.to, 0.7 + i * 0.1, pan * 0.5);
  fx.addMono(I.timpani(m('D2') - i, { decay: 1.2 }), B.to, 0.35 + i * 0.1, pan * 0.5);
  keys.addMono(I.musicBox(m('D#6')), B.to, 0.25, pan);
  keys.addMono(I.musicBox(m('D6')), B.to, 0.25, pan);
  verb.addMono(I.musicBox(m('D#6')), B.to, 0.3);
});

// финальный глаз: удар, звон, низкий гул
fx.addMono(I.subBoom(1.6, 62, 30), ev.eye + 0.05, 0.5);
fx.addMono(I.thud(52, 0.14), ev.eye, 0.8);
fx.addMono(I.bell(932, 1.4, 3.3, 1.41), ev.eye, 0.35);
fx.addMono(I.bell(988, 1.4, 3.1, 1.43), ev.eye, 0.3);
for (const [n, g] of [[m('D2'), 0.5], [m('D#2'), 0.35]]) {
  const s = I.strings(n, ev.cut - ev.eye + 0.4, { attack: 0.02, release: 0.1, bright: 0.5, seed: n });
  low.addStereo(s.L, s.R, ev.eye, g);
}
// под надписью — одна тихая расстроенная нота
keys.addMono(I.musicBox(m('A4') - 0.4), ev.title, 0.3);
verb.addMono(I.musicBox(m('A4') - 0.4), ev.title, 0.4);

// ---------- озвучка (если файлы уже есть) ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (fs.existsSync(f)) MIX.loadAudio(f, { at: v.at, gain: 1.0 }).mixInto(voice, 1);
}
MIX.duck([keys, pad, low, amb, verb, dly, tick], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

const stems = {
  voice, keys, pad, low, fx, amb, tick,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
  dly: pingpong(dly, BEAT * 0.75, 0.35, 3000),
};
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, tick: 2.6, verb: 0.7, dly: 0.9 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath + 0.2, ev.eye);   // тишина перед глазом
MIX.gate(mix, ev.cut, ev.title);          // затемнение — обрыв звука
MIX.fadeOut(mix, DURATION - 1.2, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
