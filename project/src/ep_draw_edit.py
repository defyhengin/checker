"""Montage of «Холодильник рисует еду» (16 s + card): night, the door ajar and lit, crayon scratching -> morning: glide down the
shelves over the drawings (колбаса -> сыр -> торт) -> the cat sniffs the cake (36-frame honest loop, seamless)."""
import numpy as np
from PIL import Image
from edit import *
import edit as E
D = 'ep_draw'
DUR = 16.0
T2, T3 = 3.6, 11.0
# glide keys on d2.png: (time, zoom, centre); holds between moves
K = [(T2, 2.3, (0.47, 0.27)), (5.6, 2.3, (0.47, 0.27)), (6.6, 2.3, (0.47, 0.46)), (8.0, 2.3, (0.47, 0.46)),
     (9.2, 1.75, (0.57, 0.68)), (T3, 1.7, (0.58, 0.69))]


def crop(im, z, c):
    W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


def glide(t):
    for (a, za, ca), (b, zb, cb) in zip(K, K[1:]):
        if t <= b:
            u = min(max((t - a) / (b - a), 0), 1); u = u * u * (3 - 2 * u)
            return crop(E._img(f'{D}/d2.png'), za + (zb - za) * u, (ca[0] + (cb[0] - ca[0]) * u, ca[1] + (cb[1] - ca[1]) * u))
    return crop(E._img(f'{D}/d2.png'), K[-1][1], K[-1][2])


def sniff(t):
    fi = int(round((t - T3) * FPS)) % 36
    return np.asarray(E._img(f'{D}/sniff/f_{fi:04d}.png'), np.float32)


_orig = E._view
E._view = lambda sg, t: glide(t) if sg['src'] == 'GLIDE' else (sniff(t) if sg['src'] == 'SNIFF' else _orig(sg, t))

TL = [seg(0.0, T2, f'{D}/d1.png', 1.0, 1.1, (0.55, 0.5), (0.6, 0.48)),
      seg(T2, T3, 'GLIDE', xf=0.6),
      seg(T3, DUR, 'SNIFF', xf=0.35)]
build_video(TL, DUR, 'draw_main.mp4')

m = Mix(DUR, 74)
m.room(0.03)
m.hum(0.15)
rng = np.random.default_rng(9)
for at in np.sort(rng.uniform(0.3, 3.3, 14)):            # crayon scratching in the night
    m.noise_burst(at, rng.uniform(0.08, 0.2), 1800, 5200, 0.05)
m.birds([4.0, 4.3, 7.2, 7.4, 10.1])                      # morning
for k in range(int((DUR - T3) / 0.375)):                  # sniffs, in step with the nods
    m.noise_burst(T3 + 0.06 + k * 0.375, 0.07, 2500, 7000, 0.035)
m.purr(T3 + 0.5, DUR, 0.25)
m.save('draw.wav')
subs('draw.ass', DUR, [(0.4, 3.3, "Ночью холодильник не спал.", 'Box'), (4.2, 5.8, "Колбаса.", 'Box'),
                       (6.7, 8.1, "Сыр.", 'Box'), (9.2, 10.8, "Торт.", 'Box'), (11.8, 15.7, "Кот поверил.", 'Box')])
final('draw_main.mp4', 'draw.wav', 'draw.ass', 'shorts_draw.mp4', DUR)
sheet('shorts_draw.mp4', [1.5, 4.5, 6.2, 7.5, 9.0, 10.5, 12.5, 15.0], 'draw_check.png')
print('done')
