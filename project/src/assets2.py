import numpy as np, subprocess
from assets import t, SR, rng, lowpass, bandpass, norm, click, ss, save, room, off
import sys
sys.path.insert(0, '.')
from s_price import price

# price: fluorescent buzz + ticks when price rolls
buzz = (0.10 * np.sin(2 * np.pi * 100 * t) + 0.05 * np.sin(2 * np.pi * 200 * t) + 0.03 * np.sin(2 * np.pi * 300 * t))
store = norm(bandpass(rng.normal(0, 1, len(t)), 200, 1500), 0.03)
ticks = np.zeros_like(t)
prev = price(0)
for i in range(int(15 * 60)):
    tt = i / 60
    p = price(tt)
    if p != prev and tt < 14:
        i0 = int(tt * SR); n = int(0.006 * SR)
        ticks[i0:i0 + n] += np.sin(2 * np.pi * 2500 * np.arange(n) / SR) * np.exp(-np.arange(n) / (0.0015 * SR)) * 0.25
    prev = p
a = room + (buzz + store) * off + ticks + click(14.0, amp=0.6)
save('a_prc.wav', norm(a, 0.75))

# tea: hum + dip splashes
hum = 0.08 * np.sin(2 * np.pi * 50 * t) + 0.04 * np.sin(2 * np.pi * 100 * t)
spl = np.zeros_like(t)
k = 0
while True:
    st = 1.5 + 1.7 * k + 0.28
    if st > 13.3:
        break
    i0 = int(st * SR); n = int(0.25 * SR)
    burst = bandpass(rng.normal(0, 1, n * 2), 500, 4000)[:n] * np.exp(-np.arange(n) / (0.05 * SR))
    spl[i0:i0 + n] += norm(burst, 0.18)
    k += 1
a = room + hum * off + spl + click(14.0, amp=0.6)
save('a_tea.wav', norm(a, 0.75))

subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'empty_fridge.mp4', '-vn', '-ac', '1', '-ar', str(SR), 'a_crm.wav'], check=True)
print('ok')
