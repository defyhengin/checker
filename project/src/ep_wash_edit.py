"""Montage of «Стиралка» (18 s + card): washer running, cat watching -> jeans, note in the pocket -> the note -> glide down the drier from the note to the cat."""
import numpy as np
from PIL import Image
from edit import *
import edit as E
D = 'ep_wash'
DUR = 18.0
T4 = 11.6
X = 0.35


def shake(out, t):
    if t > 4.3:
        return out
    dx = int(round(1.6 * np.sin(2 * np.pi * 13 * t))); dy = int(round(1.2 * np.sin(2 * np.pi * 9 * t + 1)))
    return np.roll(np.roll(out, dx, 1), dy, 0)


K = [(T4, 2.3, (0.51, 0.36)), (14.6, 1.7, (0.49, 0.5)), (DUR, 1.25, (0.47, 0.6))]


def glide(t):
    ts = [k[0] for k in K]
    i = 0 if t < ts[1] else 1
    u = min(max((t - ts[i]) / (ts[i + 1] - ts[i]), 0), 1); u = u * u * (3 - 2 * u)
    a, b = K[i], K[i + 1]
    z = max(a[1] + (b[1] - a[1]) * u, 1.0); c = (a[2][0] + (b[2][0] - a[2][0]) * u, a[2][1] + (b[2][1] - a[2][1]) * u)
    im = E._img(f'{D}/w4.png'); W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


_orig = E._view
E._view = lambda sg, t: glide(t) if sg['src'] == 'GLIDE' else _orig(sg, t)

TL = [seg(0.0, 4.6, f'{D}/w1.png', 1.0, 1.15, (0.5, 0.5), (0.52, 0.5), overlay=shake),
      seg(4.6, 8.1, f'{D}/w2.png', 1.0, 1.45, (0.5, 0.5), (0.45, 0.43), xf=X),
      seg(8.1, T4, f'{D}/w3.png', 1.0, 1.12, (0.5, 0.5), (0.5, 0.5), xf=X),
      seg(T4, DUR, 'GLIDE', xf=X)]
build_video(TL, DUR, 'wash_main.mp4')

m = Mix(DUR, 19); t = m.t
m.room(0.03)
m.hum(0.1)
m.noise_burst(0.0, 4.4, 60, 400, 0.10)        # drum rumbling
m.clink(4.35, 0.1, 2000); m.clink(4.55, 0.1, 2000); m.clink(4.75, 0.12, 2400)   # end-of-cycle beeps
m.purr(14.8, 17.8, 0.3)
m.save('wash.wav')
subs('wash.ass', DUR, [(0.5, 4.2, "Стирка.", 'Box'),
                       (5.0, 7.8, "В кармане джинсов…", 'Box'),
                       (8.5, 11.3, "Сто рублей.", 'Box'),
                       (12.2, 14.6, "Сохнут.", 'Box'),
                       (15.0, 17.8, "Чистые деньги.", 'Box')])
final('wash_main.mp4', 'wash.wav', 'wash.ass', 'shorts_wash.mp4', DUR)
sheet('shorts_wash.mp4', [1.0, 4.0, 6.0, 7.9, 10.0, 12.5, 15.0, 17.5], 'wash_check.png')
print('done')
