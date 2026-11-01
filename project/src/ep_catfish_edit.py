"""Montage of «Кот принёс ужин» (24 s + card). Stills f1/w1/f2/f3 + 60-frame cat loop (looks at camera, blinks, tail)."""
import os
import numpy as np
from edit import *
from film import lowpass, bandpass, ssv
D = 'ep_catfish'; DUR = 24.0


def catseq():
    sd = os.path.join(D, 'catseq'); os.makedirs(sd, exist_ok=True)
    n = 0
    for rep in range(3):                                   # 60-frame loop x3 = 7.5 s
        for fi in range(60):
            dst = os.path.join(sd, f'f_{n:04d}.png')
            if os.path.exists(dst):
                os.remove(dst)
            os.link(os.path.join(D, 'cat', f'f_{fi:04d}.png'), dst); n += 1
    return sd, n


sd, n = catseq()
TL = [seg(0.0, 4.5, f'{D}/w1.png', 1.0, 1.2, (0.5, 0.5), (0.48, 0.6)),
      seg(4.5, 9.5, f'{D}/f1.png', 1.0, 1.12, (0.5, 0.5), (0.55, 0.52), xf=0.4),
      seg(9.5, 13.0, f'{D}/f2.png', 1.0, 1.1, (0.5, 0.5), (0.5, 0.5), xf=0.3),
      seg(13.0, 16.5, f'{D}/f3.png', 1.0, 1.12, (0.5, 0.5), (0.55, 0.55), xf=0.3),
      seg(16.5, DUR, (sd, n), 1.0, 1.0, seq=True, xf=0.4)]
build_video(TL, DUR, 'cf_main.mp4')

m = Mix(DUR, 91); t = m.t
m.room(0.03)
m.birds([1.2, 2.6, 3.1, 6.8, 10.5, 15.0, 19.2], 0.03)
m.hum(0.06, soft=0.5, muffle=300)
m.meow(15.8, 0.7, 440, 0.26)
m.purr(16.5, DUR + 0.5, 0.5)
m.save('cf.wav')
subs('cf.ass', DUR, [(0.4, 3.9, "Утро.", 'Default'), (4.8, 9.2, "У двери — рыба.", 'Box'),
                     (10.0, 12.8, "Свежая.", 'Box'), (13.4, 16.3, "Он смотрит на неё.", 'Box'),
                     (17.2, 23.6, "Кормилец.", 'Default')])
final('cf_main.mp4', 'cf.wav', 'cf.ass', 'shorts_catfish.mp4', DUR)
sheet('shorts_catfish.mp4', [2, 6, 11, 14.5, 18, 22], 'cf_check.png')
print('done')
