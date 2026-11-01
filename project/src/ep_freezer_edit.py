"""Montage of «Морозилка» (17 s + card): glide up the empty fridge to the freezer -> the single dumpling in the frost -> dinner on the plate with steam (36-frame loop, honest 24 fps), the cat on the guest chair."""
import numpy as np
from PIL import Image
from edit import *
import edit as E
D = 'ep_freezer'
DUR = 17.0
T2, T3 = 5.6, 10.2
K = [(0.0, 1.05, (0.5, 0.62)), (T2, 1.9, (0.5, 0.25))]


def crop(im, z, c):
    W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


def glide(t):
    u = min(max(t / T2, 0), 1); u = u * u * (3 - 2 * u)
    z = K[0][1] + (K[1][1] - K[0][1]) * u
    c = (K[0][2][0] + (K[1][2][0] - K[0][2][0]) * u, K[0][2][1] + (K[1][2][1] - K[0][2][1]) * u)
    return crop(E._img(f'{D}/z1.png'), z, c)


def steam(sg, t):
    fi = int((t - sg['a']) * 24) % 36
    u = (t - sg['a']) / (sg['b'] - sg['a']); z = 1.0 + 0.1 * u * u * (3 - 2 * u)
    return crop(E._img(f'{D}/steam/f_{fi:04d}.png'), z, (0.5, 0.5))


_orig = E._view
E._view = lambda sg, t: glide(t) if sg['src'] == 'GLIDE' else (steam(sg, t) if sg['src'] == 'STEAM' else _orig(sg, t))

TL = [seg(0.0, T2, 'GLIDE'),
      seg(T2, T3, f'{D}/z2.png', 1.0, 1.25, (0.5, 0.5), (0.5, 0.48), xf=0.35),
      seg(T3, DUR, f'{D}/z4.png', 1.0, 1.5, (0.5, 0.5), (0.57, 0.47), xf=0.4)]
build_video(TL, DUR, 'frz_main.mp4')

m = Mix(DUR, 31); t = m.t
m.room(0.03)
m.hum(0.15)
m.noise_burst(T2 - 0.2, 0.6, 3000, 8000, 0.03)            # freezer frost crackle
m.clink(T3 + 0.15, 0.08, 1800)                            # plate
m.save('frz.wav')
subs('frz.ass', DUR, [(0.5, 2.7, "Пусто.", 'Box'), (3.0, 5.3, "Почти.", 'Box'),
                      (6.0, 7.9, "Один пельмень.", 'Box'), (8.1, 9.9, "С лета.", 'Box'),
                      (11.0, 16.7, "Ужин. На одного.", 'Box')])
final('frz_main.mp4', 'frz.wav', 'frz.ass', 'shorts_freezer.mp4', DUR)
sheet('shorts_freezer.mp4', [0.5, 2.5, 4.5, 6.5, 8.5, 11.0, 13.5, 16.5], 'frz_check.png')
print('done')
