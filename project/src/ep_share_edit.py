"""Montage of «Кот делится» (16.5 s + card): empty plate -> (cut) one fish-shaped kibble on it -> close -> glide up from the plate
to the cat on the table -> honest 24 fps blink (camera = glide end crop) -> hold."""
import numpy as np
from PIL import Image
from edit import *
import edit as E
D = 'ep_share'
DUR = 16.5
T2, T3, T4, T5, T6 = 3.0, 5.6, 8.4, 11.8, 13.3
G0, G1 = (1.55, (0.5, 0.84)), (1.7, (0.4, 0.33))


def crop(im, z, c):
    W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


def glide(t):
    u = min(max((t - T4) / (T5 - T4), 0), 1); u = u * u * (3 - 2 * u)
    z = G0[0] + (G1[0] - G0[0]) * u
    c = (G0[1][0] + (G1[1][0] - G0[1][0]) * u, G0[1][1] + (G1[1][1] - G0[1][1]) * u)
    return crop(E._img(f'{D}/s4.png'), max(z, 1.0), c)


_orig = E._view
E._view = lambda sg, t: glide(t) if sg['src'] == 'GLIDE' else _orig(sg, t)

TL = [seg(0.0, T2, f'{D}/s1.png', 1.0, 1.06),
      seg(T2, T3, f'{D}/s2.png', 1.06, 1.12, xf=0.1),
      seg(T3, T4, f'{D}/s3.png', 1.0, 1.15, xf=0.35),
      seg(T4, T5, 'GLIDE', xf=0.35),
      seg(T5, T6, (f'{D}/blink', 36), 1.0, 1.0, seq=True),
      seg(T6, DUR, f'{D}/s4.png', G1[0], G1[0] * 1.05, G1[1], G1[1])]
build_video(TL, DUR, 'share_main.mp4')

m = Mix(DUR, 41)
m.room(0.03)
m.hum(0.15)
m.clink(T2 + 0.02, 0.025, 3400)                  # the kibble lands on the plate
m.purr(T4 + 0.5, DUR, 0.32)
m.save('share.wav')
subs('share.ass', DUR, [(0.4, 2.7, "Тарелка пустая.", 'Box'), (3.3, 5.3, "Была.", 'Box'),
                        (6.0, 8.2, "Одна рыбка.", 'Box'), (10.6, 16.3, "Кот ждёт, пока я доем.", 'Box')])
final('share_main.mp4', 'share.wav', 'share.ass', 'shorts_share.mp4', DUR)
sheet('shorts_share.mp4', [1.0, 4.0, 7.0, 9.5, 11.5, 12.5, 13.5, 16.0], 'share_check.png')
print('done')
