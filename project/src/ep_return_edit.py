"""Montage of «Холодильник вернулся» (25 s + card). Stills + half-rate hop frames from ep_return.py (hop frames are doubled to 24 fps)."""
import os
import numpy as np
from edit import *
from film import lowpass, bandpass, ssv
D = 'ep_return'; DUR = 25.0; HOP = 0.62


def hopseq():
    sd = os.path.join(D, 'hopseq'); os.makedirs(sd, exist_ok=True)
    src = sorted(f for f in os.listdir(os.path.join(D, 'hop')) if f.startswith('f_'))
    last = int(src[-1][2:6]); n = last + 1
    have = {int(f[2:6]) for f in src}
    for i in range(n):
        j = i if i in have else (i // 2) * 2
        dst = os.path.join(sd, f'f_{i:04d}.png')
        if os.path.exists(dst):
            os.remove(dst)
        os.link(os.path.join(D, 'hop', f'f_{j:04d}.png'), dst)
    return sd, n, last


sd, n, last = hopseq(); HT = n / 24.0
H0 = 8.0; H1 = H0 + HT
TL = [seg(0.0, 4.6, f'{D}/n1.png', 1.0, 1.15, (0.5, 0.5), (0.5, 0.48)),
      seg(4.6, H0, f'{D}/n2.png', 1.0, 1.12, (0.5, 0.5), (0.5, 0.47), xf=0.3),
      seg(H0, H1, (sd, n), 1.0, 1.0, seq=True, xf=0.3),
      seg(H1, 13.5, f'{D}/hop/f_{last:04d}.png', 1.0, 1.04),
      seg(13.5, 19.0, f'{D}/n5.png', 1.0, 1.12, (0.5, 0.5), (0.5, 0.46), xf=0.4),
      seg(19.0, DUR, f'{D}/n4.png', 1.0, 1.1, (0.5, 0.5), (0.5, 0.5), xf=0.5)]
build_video(TL, DUR, 'ret_main.mp4')

m = Mix(DUR, 71); t = m.t
m.room(0.03)
for k in range(6):
    at = H0 + k * HOP + 0.46
    m.thud(at, 0.30)
    m.knock(at + 0.02, 0.10)
m.thud(H1 + 0.1, 0.18)
m.knock(13.4, 0.12)                                     # compressor clicks on
m.hum(0.13, env=ssv(13.5, 15.0, t), soft=0.3)
m.save('ret.wav')
subs('ret.ass', DUR, [(0.4, 2.9, "Пустой угол.", 'Default'), (3.0, 4.5, "Только след.", 'Default'),
                      (4.9, 7.9, "Что-то прыгает по лестнице.", 'Default'),
                      (9.0, 12.5, "Прыг. Прыг. Прыг.", 'Default'),
                      (13.9, 16.3, "Вернулся.", 'Default'), (16.6, 18.8, "Гудит.", 'Default'),
                      (19.6, 22.0, "Там тоже пусто.", 'Default'), (22.3, 24.8, "Зато дома.", 'Default')])
final('ret_main.mp4', 'ret.wav', 'ret.ass', 'shorts_return.mp4', DUR)
sheet('shorts_return.mp4', [2, 6, 9, 11, 13, 16, 21, 24], 'ret_check.png')
print('done')
