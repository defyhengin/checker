// «Мерцалова топь» эп.3 «Подражатель» — саундтрек + огибающая рта из голоса.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, pingpong } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { T, BEAT, DURATION, m, ev, pairs } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const keys = bus(), pad = bus(), low = bus(), fx = bus(), amb = bus(), verb = bus(), dly = bus();
const MIMIC_PAN = 0.3; // подражатель справа

// ---------- самодельные звуки болота ----------
function croak(pitch = 1) { // лягушка: низкое «ква» с модуляцией
  const n = Math.round(0.42 * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / 0.01) * Math.exp(-t * 6);
    const f = (150 + 40 * Math.exp(-t * 12)) * pitch;
    ph += (2 * Math.PI * f) / SR;
    b[i] = Math.sin(ph + 2.5 * Math.sin(2 * Math.PI * 30 * pitch * t)) * env * (t % 0.11 < 0.075 ? 1 : 0.35);
  }
  return b;
}
function buzz(len = 0.9, pitch = 1) { // светлячок: тонкое жужжание
  const n = Math.round(len * SR), b = new Float32Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.sin(Math.PI * t / len);
    ph += (2 * Math.PI * (220 + 18 * Math.sin(2 * Math.PI * 7 * t)) * pitch) / SR;
    const saw = 2 * ((ph / (2 * Math.PI)) % 1) - 1;
    b[i] = saw * env * (0.6 + 0.4 * Math.sin(2 * Math.PI * 120 * t)) * 0.5;
  }
  return b;
}

// ветер
for (let i = 0; i < 9; i++) {
  const t0 = i * 3.3, len = 4.0;
  if (t0 > ev.breath) break;
  amb.addMono(I.noiseSweep(len, 360 + 90 * (i % 3), 240, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t0, 0.12, i % 2 ? -0.4 : 0.4);
}
// редкая шкатулка во вступлении
for (const n of sc.box) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.22, -0.1); verb.addMono(mb, n.t, 0.28); }
// мягкие пэды до склейки на крупный план
for (const c of sc.chords) {
  const t1 = Math.min(c.t1, ev.breath);
  if (c.t0 >= ev.breath) continue;
  for (const n of c.notes) { const { L, R } = I.padNote(n, t1 - c.t0, { cutoff: 750, attack: 0.9, release: 1.0 }); pad.addStereo(L, R, c.t0, 0.06); }
  low.addMono(I.bass(c.bass + 12, t1 - c.t0, { bright: 0.1, sub: 0.6 }), c.t0, 0.13);
}

// ---------- звук → эхо подражателя ----------
fx.addMono(croak(1), pairs.frog.src, 0.55, -0.5);
fx.addMono(croak(1.03), pairs.frog.echo, 0.55, MIMIC_PAN);
verb.addMono(croak(1.03), pairs.frog.echo, 0.2);
fx.addMono(buzz(1.6, 1), pairs.buzz.src - 0.6, 0.3, -0.4);
fx.addMono(buzz(0.9, 1.02), pairs.buzz.echo, 0.38, MIMIC_PAN);
// колыбельная из первой серии — издалека
for (const n of sc.lullSrc) { const mb = I.musicBox(n.midi); keys.addMono(mb, n.t, 0.14, -0.2); verb.addMono(mb, n.t, 0.45); }
// …и подражатель её напевает (мычит человеческим голосом — неправильно)
for (const n of sc.lullEcho) {
  const v = I.voice(n.midi - 12, n.dur * 0.95, { syl: 'u', type: 'alto', seed: n.midi, vib: 0.3, breath: 0.1 });
  keys.addMono(v, n.t, 0.6, MIMIC_PAN);
  verb.addMono(v, n.t, 0.25);
}
// склейка на крупный план: глухой толчок
fx.addMono(I.thud(70, 0.08), ev.turn, 0.35, MIMIC_PAN);
// «Даже этот»: пасть открывается
fx.addMono(I.thud(50, 0.14), ev.jaw, 0.8);
fx.addMono(I.subBoom(1.4, 58, 28), ev.jaw + 0.04, 0.5);
for (const [n, g] of [[m('A1'), 0.55], [m('A#1'), 0.4], [m('E2'), 0.25]]) {
  const s = I.strings(n, ev.cut - ev.jaw + 0.3, { attack: 0.03, release: 0.1, bright: 0.45, seed: n });
  low.addStereo(s.L, s.R, ev.jaw, g);
}
keys.addMono(I.musicBox(m('A4') - 0.4), ev.title, 0.3);
verb.addMono(I.musicBox(m('A4') - 0.4), ev.title, 0.4);

// ---------- голос ----------
const voice = bus();
for (const v of sc.vo) {
  const f = path.join(__dirname, v.file);
  if (!fs.existsSync(f)) continue;
  const b = MIX.loadAudio(f, { at: v.at, gain: 1.0 });
  b.mixInto(voice, v.echo ? 0.75 : 1);
  if (v.echo) b.mixInto(verb, 0.6); // эхо звучит из камышей, с хвостом
}
MIX.duck([keys, pad, low, amb, verb, dly], voice, { depth: 0.6, attack: 0.08, release: 0.5 });

// огибающая голоса по кадрам -> рот подражателя (он и есть рассказчик)
{
  const fps = sc.FPS, hop = Math.round(SR / fps), open = [];
  for (let i = 0; i * hop < N; i++) {
    let s = 0; const a = i * hop, b = Math.min(N, a + hop);
    for (let j = a; j < b; j++) { const x = voice.L[j] + voice.R[j]; s += x * x; }
    const db = 10 * Math.log10(s / Math.max(1, b - a) + 1e-12);
    open.push(Math.round(Math.max(0, Math.min(1, (db + 32) / 24)) * 100) / 100);
  }
  fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'mouth.json'), JSON.stringify({ fps, open }));
}

const stems = {
  voice, keys, pad, low, fx, amb,
  verb: reverb(verb, { room: 0.9, damp: 0.35 }),
  dly: pingpong(dly, BEAT * 0.75, 0.35, 3000),
};
const GAIN = { voice: 3.2, keys: 0.8, pad: 2.2, low: 1.0, fx: 1.0, amb: 1.0, verb: 0.7, dly: 0.9 };
const out = path.join(__dirname, 'out');
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.breath + 0.2, ev.jaw - 0.12);
MIX.gate(mix, ev.cut, ev.title);
MIX.fadeOut(mix, DURATION - 1.2, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
