"""Montage of «Кот принёс ужин» v2: one continuous camera move. Rendered every 2nd frame (12 fps), in-betweens are 50/50 blends."""
import os
import numpy as np
from PIL import Image
from edit import *
from film import lowpass, bandpass, ssv
D = 'ep_catfish2'; DUR = 15.0; N = int(DUR * 24)


def build_seq():
    md = os.path.join(D, 'mov'); sd = os.path.join(D, 'seq'); os.makedirs(sd, exist_ok=True)
    for i in range(N):
        dst = os.path.join(sd, f'f_{i:04d}.png')
        if os.path.exists(dst):
            os.remove(dst)
        if i % 2 == 0:
            os.link(os.path.join(md, f'f_{i:04d}.png'), dst)
        else:
            a = np.asarray(Image.open(os.path.join(md, f'f_{i - 1:04d}.png')).convert('RGB'), np.float32)
            b = np.asarray(Image.open(os.path.join(md, f'f_{i + 1:04d}.png')).convert('RGB'), np.float32)
            Image.fromarray(((a + b) / 2).astype(np.uint8)).save(dst)
    return sd


sd = build_seq()
TL = [seg(0.0, DUR, (sd, N), 1.0, 1.0, seq=True)]
build_video(TL, DUR, 'cf2_main.mp4')

m = Mix(DUR, 91); t = m.t
m.room(0.03)
m.birds([1.2, 2.6, 3.1, 6.8, 9.5, 13.0], 0.03)
m.hum(0.06, soft=0.5, muffle=300)
m.noise_burst(5.6, 0.5, 400, 2500, 0.03)                 # soft whoosh as the camera passes the fish
m.meow(11.4, 0.7, 440, 0.26)
m.purr(10.8, DUR + 0.5, 0.5)
m.save('cf2.wav')
subs('cf2.ass', DUR, [(0.4, 2.9, "Утро.", 'Default'), (3.4, 6.2, "У двери — рыба.", 'Box'),
                      (6.6, 8.8, "Целая. Свежая.", 'Box'), (9.2, 11.2, "И он смотрит на меня.", 'Box'),
                      (11.9, 14.6, "Кормилец.", 'Default')])
final('cf2_main.mp4', 'cf2.wav', 'cf2.ass', 'shorts_catfish.mp4', DUR)
sheet('shorts_catfish.mp4', [1, 4, 7, 9.5, 12, 14.5], 'cf2_check.png')
print('done')
