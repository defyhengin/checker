"""Montage of «Мама прислала фото» (15 s + card): my empty plate, the phone lights up (Mum: photo) -> her table full-frame, slow pan
-> the chat: photo + «Приезжай.» -> (cut) my reply «Еду.»."""
import numpy as np
from edit import *
D = 'ep_mom'
DUR = 15.0
T2, T3, T4 = 3.0, 7.0, 10.4
TL = [seg(0.0, T2, f'{D}/m1.png', 1.0, 1.08, (0.55, 0.5), (0.57, 0.48)),
      seg(T2, T3, f'{D}/p0c.png', 1.0, 1.08, (0.3, 0.5), (0.68, 0.5), xf=0.35),
      seg(T3, T4, f'{D}/m2.png', 1.0, 1.12, (0.5, 0.5), (0.5, 0.62), xf=0.35),
      seg(T4, DUR, f'{D}/m4.png', 1.12, 1.2, (0.5, 0.62), (0.5, 0.66), xf=0.12)]
build_video(TL, DUR, 'mom_main.mp4')

m = Mix(DUR, 63)
m.room(0.03)
m.hum(0.14)
for k in range(2):                                       # the phone buzzes twice on the table
    m.noise_burst(0.35 + k * 0.45, 0.28, 120, 260, 0.35)
m.clink(T4 + 0.05, 0.05, 1600)                           # my message goes
m.save('mom.wav')
subs('mom.ass', DUR, [(0.4, 2.8, "Мама прислала фото.", 'Box'), (3.5, 6.7, "У мамы — ужин.", 'Box'),
                      (11.2, 14.7, "Холодильник подождёт.", 'Box')])
final('mom_main.mp4', 'mom.wav', 'mom.ass', 'shorts_mom.mp4', DUR)
sheet('shorts_mom.mp4', [1.0, 2.5, 4.0, 6.0, 8.0, 9.8, 11.5, 14.5], 'mom_check.png')
print('done')
