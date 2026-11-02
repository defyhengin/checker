"""Montage of «Мама прислала фото» (15 s + card): my empty plate, the phone lights up (Mum: photo) -> her table full-frame, slow pan
-> the chat: photo + «Приезжай.» -> (cut) my reply «Еду.»."""
import numpy as np
from edit import *
D = 'ep_mom'
DUR = 15.5
T2, T3, T4, T5, T6, T7 = 3.0, 6.6, 7.85, 9.2, 10.45, 11.6      # turn = 30 frames each way
TL = [seg(0.0, T2, f'{D}/m1.png', 1.0, 1.08, (0.55, 0.5), (0.57, 0.48)),
      seg(T2, T3, f'{D}/m2.png', 1.12, 1.0, (0.5, 0.62), (0.5, 0.5), xf=0.35),          # ends exactly on the turn's first frame
      seg(T3, T4, (f'{D}/turn', 30), 1.0, 1.0, seq=True),
      seg(T4, T5, f'{D}/m3.png', 1.0, 1.0),
      seg(T5, T6, (f'{D}/turn_back', 30), 1.0, 1.0, seq=True),
      seg(T6, T7, f'{D}/m4.png', 1.0, 1.15, (0.5, 0.5), (0.5, 0.64)),
      seg(T7, DUR, f'{D}/m4.png', 1.15, 1.2, (0.5, 0.64), (0.5, 0.66))]
import os, shutil
os.makedirs(f'{D}/turn_back', exist_ok=True)
for k in range(30):
    shutil.copy(f'{D}/turn/f_{29 - k:04d}.png', f'{D}/turn_back/f_{k:04d}.png')
build_video(TL, DUR, 'mom_main.mp4')

m = Mix(DUR, 63)
m.room(0.03)
m.hum(0.14)
for k in range(2):                                       # the phone buzzes twice on the table
    m.noise_burst(0.35 + k * 0.45, 0.28, 120, 260, 0.35)
m.purr(T4 - 0.3, T5 + 0.8, 0.22)
m.clink(T6 + 0.3, 0.05, 1600)                           # my message goes
m.save('mom.wav')
subs('mom.ass', DUR, [(0.4, 2.8, "Мама прислала фото.", 'Box'), (3.4, 6.4, "У мамы — ужин.", 'Box'),
                      (12.0, 15.2, "Холодильник подождёт.", 'Box')])
final('mom_main.mp4', 'mom.wav', 'mom.ass', 'shorts_mom.mp4', DUR)
sheet('shorts_mom.mp4', [2.5, 5.0, 6.9, 7.3, 8.5, 9.8, 11.0, 14.5], 'mom_check.png')
print('done')
