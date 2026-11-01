"""Montage of «Список покупок» (17 s + card): glide from the kitchen to the list on the fridge -> list close -> the tick next to «корм» -> the cat eating (30-frame loop, honest 24 fps)."""
import numpy as np
from PIL import Image
from edit import *
import edit as E
D = 'ep_list'
DUR = 17.0
T2, T3, T4 = 5.2, 8.4, 10.6
K = [(0.0, 1.0, (0.5, 0.5)), (T2, 2.6, (0.37, 0.3))]


def crop(im, z, c):
    W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


def glide(t):
    u = min(max(t / T2, 0), 1); u = u * u * (3 - 2 * u)
    z = K[0][1] + (K[1][1] - K[0][1]) * u
    c = (K[0][2][0] + (K[1][2][0] - K[0][2][0]) * u, K[0][2][1] + (K[1][2][1] - K[0][2][1]) * u)
    return crop(E._img(f'{D}/l1.png'), z, c)


def eat(sg, t):
    fi = int((t - sg['a']) * 24) % 30
    u = (t - sg['a']) / (sg['b'] - sg['a']); z = 1.15 + 0.1 * u * u * (3 - 2 * u)
    return crop(E._img(f'{D}/eat/f_{fi:04d}.png'), z, (0.45, 0.42))


_orig = E._view
E._view = lambda sg, t: glide(t) if sg['src'] == 'GLIDE' else (eat(sg, t) if sg['src'] == 'EAT' else _orig(sg, t))

TL = [seg(0.0, T2, 'GLIDE'),
      seg(T2, T3, f'{D}/l2.png', 1.0, 1.06, xf=0.35),
      seg(T3, T4, f'{D}/l3.png', 1.06, 1.1, xf=0.2),
      seg(T4, DUR, 'EAT', xf=0.4)]
build_video(TL, DUR, 'list_main.mp4')

m = Mix(DUR, 23); t = m.t
m.room(0.03)
m.hum(0.13)
m.noise_burst(T3 + 0.05, 0.35, 2500, 7000, 0.05)          # pen tick
rng = np.random.default_rng(4)
for k in range(14):                                          # crunching
    m.clink(T4 + 0.3 + k * 0.42 + rng.uniform(-0.05, 0.05), 0.03, 900 + rng.uniform(-150, 150))
m.purr(T4 + 1.0, DUR - 0.2, 0.25)
m.save('list.wav')
subs('list.ass', DUR, [(0.5, 4.8, "Список на неделю.", 'Box'),
                       (5.6, 8.2, "Денег — на одно.", 'Box'),
                       (11.4, 16.7, "Главное — купил.", 'Box')])
final('list_main.mp4', 'list.wav', 'list.ass', 'shorts_list.mp4', DUR)
sheet('shorts_list.mp4', [0.5, 3.0, 5.0, 7.0, 9.5, 11.5, 14.0, 16.5], 'list_check.png')
print('done')
