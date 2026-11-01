"""Montage of «Кот и холодильник» (17 s + card): smooth glide over one big still -> honest 24 fps head-turn (84 frames) -> glide back up the fridge door."""
import numpy as np
from PIL import Image
from edit import *
from film import lowpass, bandpass, ssv
import edit as E
D = 'ep_catfridge2'; BIG = f'{D}/big.png'
T1, T2 = 7.0, 7.0 + 84 / 24      # head-turn segment
DUR = 17.0

K1 = [(0.0, 1.0, (0.5, 0.5)), (3.5, 1.3, (0.54, 0.62)), (T1, 1.85, (0.57, 0.7))]                  # wide -> the cat
K2 = [(T2, 1.85, (0.57, 0.66)), (12.5, 1.6, (0.47, 0.38)), (DUR, 1.5, (0.45, 0.3))]                # up the fridge door


def herm(keys, t):
    ts = [k[0] for k in keys]
    i = max(0, min(len(keys) - 2, sum(1 for x in ts if x <= t) - 1))
    t0, t1 = ts[i], ts[i + 1]; u = min(max((t - t0) / (t1 - t0), 0), 1)
    v = lambda j: np.array([keys[j][1], *keys[j][2]], float)
    def tan(j):
        if j in (0, len(keys) - 1):
            return np.zeros(3)
        return (v(j + 1) - v(j - 1)) / (ts[j + 1] - ts[j - 1])
    h00, h10, h01, h11 = 2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2
    r = h00 * v(i) + h10 * tan(i) * (t1 - t0) + h01 * v(i + 1) + h11 * tan(i + 1) * (t1 - t0)
    return max(r[0], 1.0), (r[1], r[2])


def glide(t):
    z, c = herm(K1 if t < T1 else K2, t)
    im = E._img(BIG); W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


_orig = E._view


def _view(sg, t):
    if sg['src'] == 'GLIDE':
        return glide(t)
    return _orig(sg, t)


E._view = _view
TL = [seg(0.0, T1, 'GLIDE'),
      seg(T1, T2, (f'{D}/turn', 84), 1.0, 1.0, seq=True, xf=0.35),
      seg(T2, DUR, 'GLIDE', xf=0.35)]
build_video(TL, DUR, 'cfr_main.mp4')

m = Mix(DUR, 101); t = m.t
m.room(0.03)
m.hum(0.13)
m.purr(T1 + 1.1, T1 + 2.6, 0.25)
m.meow(T1 + 2.0, 0.5, 470, 0.16)
m.knock(15.2, 0.12)                                       # compressor clicks — nothing happens
m.save('cfr.wav')
subs('cfr.ass', DUR, [(0.4, 3.2, "Сидит.", 'Default'), (3.5, 6.8, "Ждёт.", 'Default'),
                      (T1 + 0.9, T2 - 0.1, "Ты чего?", 'Box'),
                      (11.0, 16.6, "Вдруг там что-то появилось.", 'Box')])
final('cfr_main.mp4', 'cfr.wav', 'cfr.ass', 'shorts_catfridge.mp4', DUR)
sheet('shorts_catfridge.mp4', [0.5, 3.5, 6.5, 8.0, 9.2, 11, 14, 16.5], 'cfr_check.png')
print('done')
