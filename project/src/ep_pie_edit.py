import os, sys
import numpy as np
from edit import *

D = 'ep_pie'; DUR = 18.0


def catseq():
    sd = os.path.join(D, 'catseq'); os.makedirs(sd, exist_ok=True)
    n = 0
    for fi in range(84):
        src = os.path.join(D, 'cat', f'f_{fi % 30:04d}.png'); dst = os.path.join(sd, f'f_{n:04d}.png')
        if os.path.exists(dst): os.remove(dst)
        os.link(src, dst); n += 1
    for fi in range(30, 66):
        src = os.path.join(D, 'cat', f'f_{fi:04d}.png'); dst = os.path.join(sd, f'f_{n:04d}.png')
        if os.path.exists(dst): os.remove(dst)
        os.link(src, dst); n += 1
    return sd, n


sd, n = catseq()
TL = [seg(0.0, 3.5, f'{D}/p1.png', 1.0, 1.22, (0.5, 0.5), (0.5, 0.485)),
      seg(3.5, 7.0, f'{D}/p2.png', 1.02, 1.12, (0.5, 0.5), (0.5, 0.48), xf=0.3),
      seg(7.0, 10.0, f'{D}/p3.png', 1.06, 1.14, (0.5, 0.48), (0.52, 0.47), xf=0.25),
      seg(10.0, 15.0, (sd, n), 1.0, 1.0, seq=True, xf=0.3),
      seg(15.0, DUR, f'{D}/cat/f_0065.png', 1.0, 1.06, (0.5, 0.5), (0.5, 0.45))]
build_video(TL, DUR, 'pie_main.mp4')

m = Mix(DUR, 31); t = m.t
m.room(); m.hum(0.13)
m.noise_burst(3.45, 0.45, 2500, 8000, 0.10)           # foil unwrapped
m.noise_burst(6.95, 0.12, 1500, 6000, 0.10); m.knock(7.02, 0.25)   # knife cut + tap
for at in np.arange(10.2, 13.6, 0.31):                # cat chewing
    m.noise_burst(at, 0.05, 1200, 4000, 0.05)
m.meow(14.55, 0.7, 450, 0.3)
m.purr(15.0, DUR + 0.5, 0.45)
m.save('pie.wav')
subs('pie.ass', DUR, [(0.3, 3.3, "Остался последний.", 'Box'), (3.8, 6.8, "Мамин.", 'Box'),
                       (7.3, 9.9, "Одна половина — мне.", 'Box'), (10.4, 14.4, "Другая — ему.", 'Default'),
                       (15.2, 17.8, "Поровну.", 'Default')])
final('pie_main.mp4', 'pie.wav', 'pie.ass', 'shorts_pie.mp4', DUR)
sheet('shorts_pie.mp4', [1, 4.5, 8, 11, 14.2, 16.5], 'pie_check.png')
print('done')
