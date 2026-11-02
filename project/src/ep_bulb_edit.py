"""Montage of «Свет в холодильнике перегорел» v2 (12 s + card): closed fridge at night, the cat looks at me -> the door opens smoothly
(48 honest frames, 24 fps, same camera) while the lamp flickers; by the time it is open the light is dead -> dark hold with a slow push."""
import numpy as np
from edit import *
D = 'ep_bulb'
DUR = 12.0
T2, T3 = 2.4, 4.4                                   # opening = 48 frames
ON = set(list(range(0, 7)) + [9, 10] + list(range(14, 19)) + [22, 26, 27, 31])
TL = [seg(0.0, T2, f'{D}/n1.png', 1.0, 1.0),
      seg(T2, T3, (f'{D}/open', 48), 1.0, 1.0, seq=True),
      seg(T3, DUR, f'{D}/n4.png', 1.0, 1.14, (0.5, 0.5), (0.53, 0.52))]
build_video(TL, DUR, 'bulb_main.mp4')

m = Mix(DUR, 52)
m.room(0.03)
m.hum(0.15)
m.thud(T2 - 0.02, 0.3)                              # the door seal lets go
m.noise_burst(T2, 1.8, 120, 500, 0.02)              # the door swinging
runs, a = [], None
for fi in range(49):                                # tick + buzz on each burst of light
    if fi in ON and a is None:
        a = fi
    if fi not in ON and a is not None:
        runs.append((a, fi)); a = None
for a, b in runs:
    m.clink(T2 + a / 24, 0.03, 4200)
    m.noise_burst(T2 + a / 24, (b - a) / 24 + 0.02, 90, 400, 0.05)
m.purr(7.0, DUR, 0.16)
m.save('bulb.wav')
subs('bulb.ass', DUR, [(0.2, 2.3, "Открываю холодильник.", 'Box'), (2.6, 4.3, "Лампочка мигает.", 'Box'),
                       (4.7, 6.4, "Перегорела.", 'Box'), (6.9, 11.7, "Там всё равно не на что смотреть.", 'Box')])
final('bulb_main.mp4', 'bulb.wav', 'bulb.ass', 'shorts_bulb.mp4', DUR)
sheet('shorts_bulb.mp4', [1.0, 2.6, 3.0, 3.4, 3.8, 4.3, 6.0, 11.0], 'bulb_check.png')
print('done')
