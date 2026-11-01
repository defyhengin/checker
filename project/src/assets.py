import numpy as np, wave, qrcode
from PIL import Image

SR = 44100
T = 15.0
t = np.arange(int(SR * T)) / SR
rng = np.random.default_rng(1)


def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[f > fc] = 0
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def norm(x, peak):
    return x / (np.abs(x).max() + 1e-9) * peak


def click(at, dur=0.02, amp=0.5):
    out = np.zeros_like(t)
    i0 = int(at * SR); n = int(dur * SR)
    burst = rng.normal(0, 1, n) * np.exp(-np.linspace(0, 6, n))
    out[i0:i0 + n] = burst[:len(out[i0:i0 + n])] * amp
    return out


def ss(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)


def save(name, x):
    x = np.clip(x, -1, 1)
    with wave.open(name, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


off = (t < 14.0).astype(float)
room = norm(lowpass(rng.normal(0, 1, len(t)), 180), 0.05)

# cupboard: quiet room, faint fridge hum, flashlight clicks
hum = 0.06 * np.sin(2 * np.pi * 50 * t) + 0.03 * np.sin(2 * np.pi * 100 * t)
a = room + hum + click(0.58, amp=0.6) + click(14.0, amp=0.6)
save('a_cup.wav', norm(a, 0.7))

# pot: hum + rising boil + pops
boil = norm(bandpass(rng.normal(0, 1, len(t)), 250, 2600), 1.0)
gate = lowpass(np.abs(rng.normal(0, 1, len(t))), 12)
gate = (gate - gate.min()) / (gate.max() - gate.min())
boil = boil * (0.3 + 0.7 * gate) * 0.22 * ss(1.5, 10, t)
pops = np.zeros_like(t)
for pt in 2 + 12 * np.sqrt(rng.random(120)):
    i0 = int(pt * SR); n = int(0.03 * SR)
    fr = rng.uniform(350, 900)
    seg = np.sin(2 * np.pi * fr * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.006 * SR))
    pops[i0:i0 + n] += seg[:len(pops[i0:i0 + n])] * 0.12 * ss(1.5, 10, pt)
hum2 = 0.08 * np.sin(2 * np.pi * 50 * t) + 0.04 * np.sin(2 * np.pi * 100 * t)
a = room + (hum2 + boil + pops) * off + click(14.0, amp=0.6)
save('a_pot.wav', norm(a, 0.75))

# microwave: start beep, motor hum, ding
run = ss(0.8, 0.9, t) * (1 - ss(13.55, 13.62, t))
motor = (0.25 * np.sin(2 * np.pi * 120 * t) + 0.12 * np.sin(2 * np.pi * 240 * t)
         + 0.08 * norm(lowpass(rng.normal(0, 1, len(t)), 600), 1)) * (1 + 0.1 * np.sin(2 * np.pi * 0.7 * t))
beep = np.sin(2 * np.pi * 1000 * t) * ((t > 0.55) & (t < 0.7)) * 0.25
dt = np.clip(t - 13.6, 0, None)
ding = (np.sin(2 * np.pi * 1760 * t) + 0.4 * np.sin(2 * np.pi * 2640 * t) + 0.2 * np.sin(2 * np.pi * 3520 * t)) \
       * np.exp(-dt * 2.2) * (t >= 13.6) * 0.35
a = room + motor * run * 0.6 + beep + ding + click(13.58, amp=0.4)
save('a_mic.wav', norm(a, 0.75))

# end card: black, QR (https link), white quiet zone
qr = qrcode.QRCode(border=3, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
qr.add_data('https://boosty.to/whatwhatwhat'); qr.make(fit=True)
q = qr.make_image(fill_color='black', back_color='white').convert('RGB').resize((380, 380), Image.NEAREST)
card = Image.new('RGB', (720, 1280), (6, 6, 6))
card.paste(q, ((720 - 380) // 2, 380))
card.save('card.png')
print('ok')
