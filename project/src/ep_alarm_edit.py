"""Montage of «Будильник «Обед»» (15 s + card): the desk, the phone rings -> «13:00 ОБЕД» close -> the alarm list: ОБЕД moved to tomorrow
(«Ужин» switched off) -> the cat eats from its full bowl on time (30-frame honest loop)."""
import numpy as np
from PIL import Image
from edit import *
import edit as E
D = 'ep_alarm'
DUR = 15.0
T2, T3, T4 = 3.4, 7.0, 10.6


def eat(t):
    fi = int(round((t - T4) * FPS)) % 30
    return np.asarray(E._img(f'{D}/eat/f_{fi:04d}.png'), np.float32)


_orig = E._view
E._view = lambda sg, t: eat(t) if sg['src'] == 'EAT' else _orig(sg, t)

TL = [seg(0.0, T2, f'{D}/a1.png', 1.0, 1.12, (0.5, 0.55), (0.62, 0.62)),
      seg(T2, T3, f'{D}/a2.png', 1.15, 1.22, (0.5, 0.4), (0.5, 0.38), xf=0.3),
      seg(T3, T4, f'{D}/a3.png', 1.0, 1.06, xf=0.12),
      seg(T4, DUR, 'EAT', xf=0.35)]
build_video(TL, DUR, 'alarm_main.mp4')

m = Mix(DUR, 85)
m.room(0.03)
m.hum(0.13)
k = int(0.07 * SR); tm = np.arange(k) / SR
beep = np.sin(2 * np.pi * 1950 * tm) * np.sin(np.pi * tm / 0.07) ** 2 * 0.09
for g in np.arange(0.2, T3 - 0.2, 0.75):                 # the alarm: groups of four beeps until I stop it
    for j in range(4):
        m.add_at(g + j * 0.11, beep)
for at in np.arange(T4 + 0.2, DUR, 0.625):              # crunch, in step with the cat's nods
    m.noise_burst(at, 0.06, 1500, 6000, 0.05)
m.purr(T4 + 0.3, DUR, 0.18)
m.save('alarm.wav')
subs('alarm.ass', DUR, [(0.4, 2.6, "13:00.", 'Box'), (3.9, 6.6, "Обеда нет.", 'Box'),
                        (7.4, 10.3, "Переставил на завтра.", 'Box'), (11.0, 14.7, "У кота обед по расписанию.", 'Box')])
final('alarm_main.mp4', 'alarm.wav', 'alarm.ass', 'shorts_alarm.mp4', DUR)
sheet('shorts_alarm.mp4', [1.0, 3.0, 4.5, 6.5, 8.0, 10.0, 12.0, 14.5], 'alarm_check.png')
print('done')
