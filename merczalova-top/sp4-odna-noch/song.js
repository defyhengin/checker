// «Одна ночь на Мерцаловой топи» - саундтрек. Колыбельная шкатулки на всю ночь; к рассвету звуков всё меньше
// (Тишка наедается). Перед жутью - тишина, потом удар.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const Sing = require('./engine/audio/sing');
const sc = require('./score');
const { DURATION, m, ev, A, CH, EIGHTH } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus(), frogs = bus(), humB = bus();
const soft = (len, f0, f1, q = 0.8, seed = 20) => I.noiseSweep(len, f0, f1, { q, pink: true, seed, shape: (x) => Math.sin(Math.PI * x) });
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
// мягкая шкатулка: на октаву ниже, мягкая атака, почти без звенящих обертонов
function softBox(midi) {
  const f = hz(midi), n = Math.round(2.6 * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.014) * Math.exp(-t / 0.75);
    b[i] = env * (Math.sin(2 * Math.PI * f * t) + 0.22 * Math.sin(2 * Math.PI * 2 * f * t) * Math.exp(-t / 0.25) + 0.05 * Math.sin(2 * Math.PI * 3.01 * f * t) * Math.exp(-t / 0.12));
  }
  return b;
}
function lowpassBus(bus, fc) {
  const a = 1 - Math.exp(-2 * Math.PI * fc / SR);
  for (const ch of [bus.L, bus.R]) { let y = 0; for (let i = 0; i < ch.length; i++) { y += a * (ch[i] - y); ch[i] = y; } }
}
function U01(i) { const x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
function croak(pitch = 1) {
  const n = Math.round(0.42 * SR), b = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.01) * Math.exp(-t * 6), f = (150 + 40 * Math.exp(-t * 12)) * pitch;
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph + 2.5 * Math.sin(2 * Math.PI * 30 * pitch * t)) * env * (t % 0.11 < 0.075 ? 1 : 0.35);
  }
  return b;
}
function crunch(seed = 1, bright = 1) {
  const n = Math.round(0.16 * SR), b = new Float32Array(n); let s = seed * 9301 + 49297, lp = 0;
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 * 2 - 1; };
  for (let i = 0; i < n; i++) { const t = i / SR, grit = (t % 0.028 < 0.012 ? 1 : 0.25) * Math.exp(-t * 22), x = rnd(); lp += (x - lp) * (0.35 * bright); b[i] = (lp * 1.4 + (i < 90 ? x * 0.8 : 0)) * grit; }
  return b;
}
const suck = (len = 0.45) => I.noiseSweep(len, 300, 3200, { q: 1.2, pink: true, shape: (x) => x * x * (x < 0.97 ? 1 : 0) });
function humNote(midi, dur) {
  const n = Math.round((dur + 0.35) * SR), b = new Float32Array(n), f = hz(midi); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, vib = 1 + 0.008 * Math.sin(2 * Math.PI * 5.2 * t) * Math.min(1, t * 3);
    ph += (2 * Math.PI * f * vib) / SR;
    const env = Math.min(1, t / 0.18) * Math.min(1, (dur + 0.35 - t) / 0.35);
    b[i] = (Math.sin(ph) + 0.28 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph)) * env;
  }
  return b;
}
// громкость «жизни» болота: к рассвету всё тише (Тишка наедается)
const life = (t) => (t < ev.c3 ? 1 : t < ev.c4 ? 0.8 : t < ev.c5 ? 0.6 : 0.35);

// ---------- атмосфера ----------
for (let t0 = 0; t0 < DURATION; t0 += 3.1) {
  if (t0 >= ev.hush && t0 < ev.e4 + 1) continue;
  if (t0 > ev.eye - 4) break;
  amb.addMono(soft(4.0, 300 + 90 * (Math.round(t0) % 3), 210, 0.7, 40 + Math.round(t0)), t0, 0.07 * life(t0), Math.round(t0 / 3.1) % 2 ? -0.6 : 0.6);
}
// снег и ветер в главе 4
for (let t0 = ev.snow - 2; t0 < ev.hush; t0 += 2.3) amb.addMono(soft(3.2, 900, 500, 0.6, 90 + Math.round(t0)), t0, 0.05, Math.sin(t0) * 0.7);
// лягушки: в сумерках и до «без звука»
for (const c of sc.croaks) frogs.addMono(croak(c.pitch), c.t, 0.18, c.pan);

// ---------- музыка ----------
for (const n of sc.box) {
  if (sc.quiet(n.t) || sc.quiet(n.t + 0.3)) continue;
  const g = 0.075 * (n.t < ev.c5 ? 1 : 0.7);
  if (n.t > ev.c5 && n.t % (4 * sc.BEAT) > 2 * sc.BEAT) continue; // к рассвету шкатулка реже
  const mb = softBox(n.midi - 12); keys.addMono(mb, n.t, g, 0); verb.addMono(mb, n.t, 0.3);
}
for (const c of sc.chords) {
  if (c.t0 >= DURATION - 1) continue;
  if (sc.quiet(c.t0 + 0.1) && sc.quiet(c.t1 - 0.1)) continue;
  const len = c.t1 - c.t0;
  for (const n of c.notes) { const { L, R } = I.padNote(n, len, { cutoff: c.t0 > ev.c4 ? 480 : 680, attack: 1.2, release: 1.2 }); pad.addStereo(L, R, c.t0, 0.05 * life(c.t0)); }
  low.addMono(I.bass(c.bass + 12, len, { bright: 0.05, sub: 0.6 }), c.t0, 0.06 * life(c.t0));
}

// ---------- глава 1 ----------
sc.caps.forEach((t, i) => fx.addMono(I.pop(1600 + i * 120, 40 + i), t, 0.07, (i - 3) * 0.15));        // шляпки
sc.lightsOn.forEach((t, i) => { const b = softBox(m(['A5', 'C6', 'E6', 'A5', 'E6', 'C6', 'B5', 'A5', 'E6'][i])); fx.addMono(b, t, 0.03, (i - 4) * 0.18); verb.addMono(b, t, 0.06); });
fx.addMono(crunch(1, 1), ev.bite1, 0.5, 0.4);
for (let i = 0; i < 3; i++) fx.addMono(crunch(20 + i, 0.25), ev.bite1 + 0.3 + i * 0.22, 0.08, 0.4);
// остальные укусы луны (в переходах) - тихо, издалека
ev.bites.slice(1).forEach((t, i) => { fx.addMono(crunch(5 + i, 0.8), t, 0.22, 0.5); verb.addMono(crunch(5 + i, 0.8), t, 0.2); });

// ---------- глава 2 ----------
fx.addMono(soft(1.4, 200, 700, 1.2, 61), ev.blow, 0.08, -0.4);                                     // выдувает пузырь
fx.addMono(I.pop(900, 62), ev.pop, 0.5, -0.2);                                                      // лопается
frogs.addMono(croak(1.0), ev.pop + 0.02, 0.32, -0.2);                                               // кваканье вырвалось...
fx.addMono(suck(0.5), ev.eat - 0.45, 0.16, 0.1);                                                    // ...и его съели
ev.catch.forEach((t, i) => fx.addMono(I.pop(1300 + i * 200, 70 + i), t, 0.18, 0.2 + i * 0.1));        // ловят огоньки
{ const s = I.strings(m('A1'), 2.4, { attack: 0.4, release: 1, bright: 0.3, seed: 7 }); low.addStereo(s.L, s.R, ev.fingers - 0.2, 0.18); }
for (let i = 0; i < 5; i++) fx.addMono(I.woodTick(2.2 + i * 0.15), ev.laugh + 0.2 + i * 0.17, 0.05, (i - 2) * 0.2); // зубки падают
fx.addMono(I.noiseSweep(1.6, 5200, 4800, { q: 6, seed: 81, shape: (x) => Math.sin(Math.PI * x) * (0.6 + 0.4 * Math.sin(x * 160)) }), ev.zubIn, 0.03, 0.3); // крылышки
sc.eyesOff.forEach((t, i) => fx.addMono(I.thud(260 - i * 6, 0.04), t, 0.06, 0.3));                  // глаза закрываются
sc.arrows.forEach((t, i) => fx.addMono(I.scribble(0.5, 90 + i), t, 0.05, (i - 1.5) * 0.3));
sc.arrowsToMimic.forEach((t, i) => fx.addMono(I.scribble(0.3, 100 + i), t, 0.04, 0.5));
fx.addMono(I.thud(52, 0.14), ev.mimicEyes, 0.6, 0.4);
fx.addMono(I.subBoom(1.6, 60, 30), ev.mimicEyes + 0.03, 0.35, 0.4);
{ for (const [n, g] of [[m('A1'), 0.3], [m('A#1'), 0.2]]) { const s = I.strings(n, 1.8, { attack: 0.03, release: 0.8, bright: 0.4, seed: n }); low.addStereo(s.L, s.R, ev.mimicEyes, g); } }

// ---------- глава 3 ----------
ev.gift.forEach((t, i) => fx.addMono(I.thud(170 + i * 30, 0.05), t, 0.12, -0.3));
fx.addMono(soft(1.2, 200, 700, 1.2, 63), ev.laughBub - 0.6, 0.07, 0.4);
{ // смех в пузыре: высокий, чужой, чуть мимо нот
  const notes = [0, 1, 2, 3, 4].map((i) => ({ t: i * 0.17, dur: 0.12, midi: m('E5') + [0, 2, 1, 3, 2][i] + 0.3 }));
  const a = Sing.line('ha ha ha ha ha', notes, { type: 'soprano', vib: 0.1, breath: 0.25, seed: 5 });
  fx.addMono(a, ev.laughBub + 0.6 - (a.lead || 0), 0.06, 0.3); verb.addMono(a, ev.laughBub + 0.6, 0.12);
  fx.addMono(I.pop(1100, 64), ev.laughPop, 0.3, 0.2);
  fx.addMono(a, ev.laughPop + 0.02 - (a.lead || 0), 0.11, 0.1); verb.addMono(a, ev.laughPop + 0.02, 0.25);
}
// Баюнок поёт
for (const c of sc.chords) {
  if (c.t0 < ev.sing - 0.1 || c.t0 > A(3, 13)) continue;
  const n = c.notes[2] - 12;
  humB.addMono(humNote(n, (c.t1 - c.t0) * 0.9), c.t0, 0.1, 0.5);
}
for (let i = 0; i < 4; i++) fx.addMono(I.woodTick(0.6 + i * 0.07), ev.twitch + i * 0.05, 0.12, 0);     // пальцы-свечи щёлкнули
{ const b = softBox(m('E6')); fx.addMono(b, ev.land, 0.05, 0.3); verb.addMono(b, ev.land, 0.2); } // огонёк сел

// ---------- глава 4 ----------
ev.quilt.forEach((t, i) => fx.addMono(I.paperFwip(0.6 + i * 0.1, 50 + i), t, 0.08, (i - 1.5) * 0.3));
ev.mittens.forEach((t, i) => fx.addMono(I.paperFwip(0.9 + i * 0.1, 60 + i), t, 0.07, 0.3));
ev.jars.forEach((t, i) => fx.addMono(I.glass(i + 3, { size: 0.5 }), t, 0.06, 0.5));
fx.addMono(I.noiseSweep(1.4, 2200, 1800, { q: 1, pink: true, seed: 88 }), ev.jars[1] + 0.2, 0.025, 0.5);   // дождик в банке
frogs.addMono(croak(1.05), ev.jars[2] + 0.25, 0.06, 0.5);                                                   // кваканье в банке
{ const h = humNote(m('A3'), 1.6); for (let i = 0; i < h.length; i++) h[i] *= 0.5 + 0.5 * Math.sin(i / SR * 30); fx.addMono(h, ev.jars[3] + 0.3, 0.03, 0.5); } // голос в банке
fx.addMono(suck(0.6), ev.hush - 0.55, 0.12, 0);

// ---------- глава 5 ----------
for (let i = 0; i < 4; i++) fx.addMono(I.noiseSweep(0.6, 300, 120, { q: 3, seed: 120 + i, shape: (x) => Math.exp(-x * 5) }), ev.ice + 0.5 + i * 1.3, 0.05, (i % 2 ? 0.5 : -0.5)); // лёд
fx.addMono(I.thud(42, 0.2), ev.eye, 0.55, 0);
fx.addMono(I.subBoom(2.6, 50, 22), ev.eye + 0.03, 0.5, 0);
{ for (const [n, g] of [[m('A1'), 0.32], [m('A#1'), 0.22], [m('E2'), 0.12]]) { const s = I.strings(n, ev.dark - ev.eye + 0.5, { attack: 0.03, release: 1.2, bright: 0.3, seed: n }); low.addStereo(s.L, s.R, ev.eye, g); } }
// в темноте - три ноты шкатулки, медленно
[['A4', 0], ['C5', 0.9], ['E5', 1.8]].forEach(([n, d]) => { const mb = softBox(m(n)); keys.addMono(mb, ev.rec + 0.4 + d, 0.09, 0); verb.addMono(mb, ev.rec + 0.4 + d, 0.45); });

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const b = MIX.loadAudio(path.join(__dirname, v.file), { at: v.at });
  for (let i = 0; i < b.n && i < N; i++) { const mono = 0.5 * (b.L[i] + b.R[i]); voice.L[i] += mono; voice.R[i] += mono; }
}
MIX.duck([keys, pad, low, amb, verb, humB, frogs], voice, { depth: 0.55, attack: 0.08, release: 0.5 });

lowpassBus(keys, 2400);
const stems = { voice, keys, pad, low, fx, amb, frogs, hum: humB, verb: reverb(verb, { room: 0.9, damp: 0.35 }) };
// «того услышат» - всё обрывается; перед глазом подо льдом - полная тишина
for (const name of ['keys', 'pad', 'amb', 'verb', 'low', 'hum', 'frogs']) { MIX.gate(stems[name], ev.hush, ev.e4 + 0.5); MIX.gate(stems[name], ev.eye - 2.2, ev.eye); }
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, frogs: 1.0, hum: 1.0, verb: 0.7 };
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.fadeOut(mix, DURATION - 0.8, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
