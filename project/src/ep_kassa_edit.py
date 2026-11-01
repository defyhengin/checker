"""Montage of «Касса» (44 s + 3.5 s DonationAlerts card). Needs the stills from ep_kassa.py in ep_kassa/."""
import numpy as np
from edit import *
from film import lowpass, bandpass, ssv
D = 'ep_kassa'; DUR = 44.0

TL = [seg(0.0, 3.6, f'{D}/a1.png', 1.0, 1.3, (0.5, 0.5), (0.42, 0.56)),
      seg(3.6, 9.4, f'{D}/tall.png', 2.0, 2.0, (0.5, 0.25), (0.5, 0.75), xf=0.4, ease=True),
      seg(9.4, 10.15, f'{D}/p1.png', 1.0, 1.03, xf=0.12),
      seg(10.15, 10.9, f'{D}/p2.png', 1.0, 1.03, xf=0.12),
      seg(10.9, 11.65, f'{D}/p1.png', 1.03, 1.06, xf=0.12),
      seg(11.65, 12.4, f'{D}/p2.png', 1.03, 1.06, xf=0.12),
      seg(12.4, 15.4, f'{D}/c1.png', 1.0, 1.12, xf=0.3),
      seg(15.4, 17.6, f'{D}/c2.png', 1.0, 1.08, xf=0.2),
      seg(17.6, 21.0, f'{D}/c3.png', 1.0, 1.15, xf=0.3),
      seg(21.0, 22.6, f'{D}/t1.png', 1.0, 1.05, xf=0.12),
      seg(22.6, 23.8, f'{D}/t2.png', 1.0, 1.04, xf=0.3),
      seg(23.8, 25.0, f'{D}/t3.png', 1.0, 1.06, xf=0.3),
      seg(25.0, 28.4, f'{D}/k1.png', 1.0, 1.1, (0.5, 0.45), (0.5, 0.42), xf=0.3),
      seg(28.4, 32.2, f'{D}/k2.png', 1.0, 1.08, xf=0.25),
      seg(32.2, 36.2, f'{D}/k3.png', 1.0, 1.12, (0.5, 0.45), (0.5, 0.42), xf=0.25),
      seg(36.2, 40.0, f'{D}/e1.png', 1.0, 1.1, xf=0.5),
      seg(40.0, DUR, f'{D}/e2.png', 1.0, 1.15, (0.5, 0.5), (0.5, 0.45), xf=0.8)]
build_video(TL, DUR, 'kassa_main.mp4')

m = Mix(DUR, 61); t = m.t
inside = 1 - ssv(36.3, 37.3, t)
m.hum(0.1, env=inside * (0.6 + 0.4 * ssv(0.0, 1.0, t)), muffle=240)                      # shop fridges
wind = lowpass(m.rng.normal(0, 1, m.n), 400); wind = wind / np.abs(wind).max()
m.out += wind * 0.05 * ssv(36.3, 38.0, t) * (0.7 + 0.3 * np.sin(2 * np.pi * t / 6.0)) * m.fade()


def chime(at, amp=0.16):
    k = int(0.9 * SR); tm = np.arange(k) / SR
    sig = np.sin(2 * np.pi * 1320 * tm) * np.exp(-tm * 5) + np.sin(2 * np.pi * 990 * np.clip(tm - 0.28, 0, None)) * (tm > 0.28) * np.exp(-np.clip(tm - 0.28, 0, None) * 5)
    m.add_at(at, sig * amp)


def beep(at, f=2900, amp=0.07):
    k = int(0.14 * SR); tm = np.arange(k) / SR
    m.add_at(at, np.sin(2 * np.pi * f * tm) * np.minimum(1, tm * 400) * np.exp(-tm * 9) * amp)


def tick(at, amp=0.35):
    kk = int(0.025 * SR); m.add_at(at, bandpass(m.rng.normal(0, 1, kk), 1800, 7000) * np.exp(-np.linspace(0, 7, kk)) * amp)


chime(0.15); chime(36.25, 0.14)
m.steps(0.5, 3.5, 0.62, 0.9)
for at in (9.4, 10.15, 10.9, 11.65):
    tick(at)
beep(13.7); beep(15.55, 2200, 0.05)
m.knock(21.1, 0.16)
for at in (25.0, 28.4):
    m.knock(at + 0.05, 0.18)
m.thud(29.0, 0.14)
m.noise_burst(36.4, 0.9, 800, 5000, 0.10); m.noise_burst(37.6, 0.7, 800, 5000, 0.06)
m.steps(36.7, 43.2, 0.64, 0.8)
m.save('kassa.wav')

subs('kassa.ass', DUR, [(0.3, 1.9, "Вчера — стекло.", 'Box'), (2.0, 3.5, "Сегодня — дверь.", 'Box'),
                        (4.0, 6.6, "Сверху — дорого.", 'Box'), (6.9, 9.2, "Снизу — тоже.", 'Box'),
                        (9.5, 12.3, "2 по цене 1.", 'Box'),
                        (15.6, 17.4, "29 ₽.", 'Box'), (17.9, 20.8, "У меня — 12 ₽.", 'Box'),
                        (21.2, 24.8, "Не сегодня.", 'Box'),
                        (25.3, 27.9, "Подожди.", 'Box'),
                        (28.7, 31.9, "Хлеб всё равно спишут.", 'Box'),
                        (32.5, 35.8, "А это — за мой счёт.", 'Box'),
                        (37.0, 40.0, "Дойду.", 'Default'), (40.6, 43.8, "Дома ждёт холодильник.", 'Default')])
final('kassa_main.mp4', 'kassa.wav', 'kassa.ass', 'shorts_kassa.mp4', DUR)
sheet('shorts_kassa.mp4', [2, 6, 11, 14, 16, 19, 23, 26, 30, 34, 38, 42], 'kassa_check.png')
print('done')
