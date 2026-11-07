// «Мерцалова топь» спецвыпуск «Наблюдение №4» - звук записи: гул камеры, болото, скрип, щелчки лампы, стук, помехи.
const fs = require('fs');
const path = require('path');
const { SR, Bus, reverb, rng } = require('./engine/audio/dsp');
const I = require('./engine/audio/instruments');
const MIX = require('./engine/audio/mix');
const sc = require('./score');
const { DURATION, m, ev } = sc;

const N = Math.ceil(DURATION * SR);
const bus = () => new Bus(N);
const hum = bus(), amb = bus(), fx = bus(), keys = bus(), verb = bus(), stat = bus();

function tone(f, len, { a = 0.004, r = 0.02, shape = 'sine' } = {}) {
  const n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.min(1, t / a) * Math.min(1, (len - t) / r);
    const ph = 2 * Math.PI * f * t;
    b[i] = (shape === 'square' ? Math.sign(Math.sin(ph)) * 0.6 : Math.sin(ph)) * Math.max(0, env);
  }
  return b;
}
function noise(len, seed, { hp = 0, decay = 0 } = {}) {
  const w = rng(seed), n = Math.round(len * SR), b = new Float32Array(n); let prev = 0;
  for (let i = 0; i < n; i++) { const x = w() * 2 - 1; const y = hp ? x - prev : x; prev = x; b[i] = y * (decay ? Math.exp(-i / SR * decay) : 1); }
  return b;
}
// лягушка: короткая пачка импульсов с тоном
function croak(p) {
  const len = 0.22, n = Math.round(len * SR), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR, env = Math.sin(Math.PI * t / len);
    const am = 0.5 + 0.5 * Math.sign(Math.sin(2 * Math.PI * 32 * p * t));
    b[i] = Math.sin(2 * Math.PI * 260 * p * t + 2 * Math.sin(2 * Math.PI * 520 * p * t)) * am * env;
  }
  return b;
}
// скрип двери: медленно ползущий «пилой» тон с дрожанием
function creak(len = 1.3) {
  const n = Math.round(len * SR), b = new Float32Array(n); let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR, x = t / len;
    const f = 180 + 260 * Math.sin(Math.PI * x * 0.8) + 25 * Math.sin(2 * Math.PI * 9 * t);
    ph += f / SR;
    const saw = 2 * (ph % 1) - 1, stick = (Math.sin(2 * Math.PI * 23 * t) > 0.2) ? 1 : 0.35;
    b[i] = saw * stick * Math.sin(Math.PI * x) * 0.6;
  }
  return b;
}

// ---------- гул камеры (с картинкой и до тишины) ----------
const humEnd = ev.silence;
{
  const n = Math.round((humEnd - ev.cam) * SR), L = new Float32Array(n);
  const w = rng(7);
  for (let i = 0; i < n; i++) { const t = i / SR; L[i] = 0.5 * Math.sin(2 * Math.PI * 60 * t) + 0.25 * Math.sin(2 * Math.PI * 120 * t) + 0.08 * (w() * 2 - 1); }
  hum.addMono(L, ev.cam, 0.05, 0);
}
// писк в начале и в конце
fx.addMono(tone(1000, 0.18), ev.beep, 0.25, 0);
fx.addMono(tone(1000, 0.5), ev.next, 0.22, 0);

// ---------- болото за окном ----------
for (let t = ev.cam; t < ev.silence; t += 3.1) amb.addMono(I.noiseSweep(4.0, 320, 220, { q: 0.7, pink: true, shape: (x) => Math.sin(Math.PI * x) }), t, 0.09, (t % 2) - 1);
for (const f of sc.FROGS) amb.addMono(croak(f.p), f.t, 0.06, f.pan);

// ---------- 03:12:00 - скрип двери ----------
fx.addMono(creak(1.3), ev.creak, 0.16, -0.4);
verb.addMono(creak(1.3), ev.creak, 0.08);

// ---------- колыбельная издалека (тихо, глухо, с эхом) ----------
for (const nt of sc.lull) { const mb = I.musicBox(nt.midi - 0.15); keys.addMono(mb, nt.t, 0.06, 0.35); verb.addMono(mb, nt.t, 0.16); }

// ---------- лампа: щелчок на каждое включение и выключение ----------
sc.FLASH.forEach(([a, b], i) => {
  fx.addMono(I.woodTick(1.6), a, 0.32, 0.45);
  fx.addMono(I.woodTick(1.3), b, 0.22, 0.45);
  fx.addMono(tone(110, b - a, { a: 0.003, r: 0.01 }), a, 0.012, 0.45);   // тихое гудение лампы
});
// ручка: буквы «НЕ ВЕРЬ» дописываются после каждой буквы - короткий росчерк; потом быстро «ГОЛОСУ»
for (const L of sc.LETTER_DONE) if (L.ch !== ' ') fx.addMono(I.scribble(0.12), L.t + 0.02, 0.08, -0.2);
for (const L of sc.SCRIBBLE) fx.addMono(I.scribble(0.11), L.t, 0.12, -0.2);

// ---------- тишина, стук ----------
for (const t of ev.knock) { fx.addMono(I.thud(85, 0.12), t, 0.55, -0.6); fx.addMono(I.woodTick(0.5), t, 0.25, -0.6); }

// ---------- помехи ----------
stat.addMono(noise(ev.cut - ev.hit, 99, { hp: 1 }), ev.hit, 0.16, 0);
fx.addMono(I.thud(55, 0.12), ev.hit, 0.6, 0);

const stems = { hum, amb, fx, keys, stat, verb: reverb(verb, { room: 0.92, damp: 0.4 }) };
const GAIN = { hum: 1.0, amb: 1.0, fx: 1.0, keys: 1.0, stat: 1.0, verb: 0.8 };
// полная тишина перед стуком: глушим всё, кроме fx (стук)
for (const name of ['hum', 'amb', 'keys', 'verb']) MIX.gate(stems[name], ev.silence, ev.hit);
const out = path.join(__dirname, 'out');
fs.mkdirSync(out, { recursive: true });
const mix = MIX.mixdown(stems, GAIN, { stemDir: process.env.STEMS ? out : null });
MIX.highpass(mix, 22);
MIX.gate(mix, ev.cut, ev.next - 0.01);
MIX.fadeOut(mix, DURATION - 0.4, DURATION);
const M = MIX.master(mix, 0.8, undefined, { lufs: process.env.LUFS ? parseFloat(process.env.LUFS) : -14 });
MIX.writeWav(path.join(out, 'music.wav'), mix);
console.log(`wrote out/music.wav (${DURATION.toFixed(2)}s, ${M.lufs !== undefined ? M.lufs.toFixed(1) + ' LUFS' : ''})`);
