"""Montage of «Кот принёс ужин» v3: smooth camera glide over one big still (no cuts, no frame blending), blink by swapping stills."""
import numpy as np
from edit import *
from film import lowpass, bandpass, ssv
import edit as E
D = 'ep_catfish4'; DUR = 15.0
BIG, BLINK = f'{D}/big.png', f'{D}/big_blink.png'
BLINKS = (11.6, 13.9)

# one continuous path of (time, zoom, centre) — Hermite-smoothed, so the speed never jumps
KEYS = [(0.0, 1.0, (0.5, 0.5)),           # whole scene
        (2.5, 1.05, (0.48, 0.52)),
        (6.0, 1.9, (0.36, 0.55)),         # the fish
        (8.5, 2.0, (0.39, 0.55)),        # drift along it toward the head
        (11.0, 2.1, (0.615, 0.25)),       # up to the cat's face
        (DUR, 2.3, (0.615, 0.24))]


def herm(t):
    ts = [k[0] for k in KEYS]
    i = max(0, min(len(KEYS) - 2, sum(1 for x in ts if x <= t) - 1))
    t0, t1 = ts[i], ts[i + 1]; u = (t - t0) / (t1 - t0)
    def v(j):
        return np.array([KEYS[j][1], *KEYS[j][2]], float)
    def tan(j):
        a, b = max(j - 1, 0), min(j + 1, len(KEYS) - 1)
        if j in (0, len(KEYS) - 1):
            return np.zeros(3)                  # ease in at the start, ease out at the end
        return (v(b) - v(a)) / (ts[b] - ts[a])
    h00, h10, h01, h11 = 2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2
    r = h00 * v(i) + h10 * tan(i) * (t1 - t0) + h01 * v(i + 1) + h11 * tan(i + 1) * (t1 - t0)
    return r[0], (r[1], r[2])


def _view(sg, t):
    z, c = herm(t); z = max(z, 1.0)
    blink = any(0 <= t - b < 3 / 24 for b in BLINKS)
    im = E._img(BLINK if blink else BIG)
    W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    from PIL import Image
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


E._view = _view
TL = [seg(0.0, DUR, BIG)]
build_video(TL, DUR, 'cf4_main.mp4')

m = Mix(DUR, 91); t = m.t
m.room(0.03)
m.birds([1.2, 2.6, 3.1, 6.8, 9.5, 13.0], 0.03)
m.hum(0.06, soft=0.5, muffle=300)
m.meow(11.0, 0.7, 440, 0.26)
m.purr(10.6, DUR + 0.5, 0.5)
m.save('cf4.wav')
subs('cf4.ass', DUR, [(0.4, 2.9, "Утро.", 'Default'), (3.4, 6.2, "У двери — рыба.", 'Box'),
                      (6.6, 9.0, "Целая. Свежая.", 'Box'), (9.4, 11.4, "И он смотрит на меня.", 'Box'),
                      (11.9, 14.6, "Кормилец.", 'Default')])
final('cf4_main.mp4', 'cf4.wav', 'cf4.ass', 'shorts_catfish.mp4', DUR)
sheet('shorts_catfish.mp4', [0.5, 3, 6, 8.5, 10, 12, 14.5], 'cf4_check.png')
print('done')
