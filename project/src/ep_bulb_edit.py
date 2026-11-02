"""Montage of «Свет в холодильнике перегорел» (13 s + card): closed fridge at night, the cat looks at me -> open: dark ->
the lamp flickers (frame-exact switch between the dark and the lit still) and shows empty shelves -> dark again, slow push."""
import numpy as np
from PIL import Image
from edit import *
import edit as E
D = 'ep_bulb'
DUR = 13.0
T2 = 3.2
ON = [(5.10, 5.18), (5.30, 5.38), (5.58, 6.40), (6.52, 6.58)]


def lamp(t):
    return any(a <= t < b for a, b in ON)


def crop(im, z, c):
    W, H = im.size; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


def main(t):
    u = min(max((t - T2) / (DUR - T2), 0), 1); u = u * u * (3 - 2 * u)
    z = 1.0 + 0.16 * u; c = (0.5 + 0.03 * u, 0.5 + 0.02 * u)
    return crop(E._img(f'{D}/{"n3" if lamp(t) else "n2"}.png'), z, c)


_orig = E._view
E._view = lambda sg, t: main(t) if sg['src'] == 'MAIN' else _orig(sg, t)

TL = [seg(0.0, T2, f'{D}/n1.png', 1.0, 1.08, (0.45, 0.5), (0.47, 0.5)),
      seg(T2, DUR, 'MAIN', xf=0.08)]
build_video(TL, DUR, 'bulb_main.mp4')

m = Mix(DUR, 52); t = m.t
m.room(0.03)
m.hum(0.15)
m.thud(T2 - 0.05, 0.35)                                     # the door seal lets go
for a, b in ON:
    m.clink(a, 0.03, 4200)                                  # the tick of the dying lamp
    m.noise_burst(a, b - a + 0.02, 90, 400, 0.05)           # its buzz
m.purr(8.5, DUR, 0.18)
m.save('bulb.wav')
subs('bulb.ass', DUR, [(0.3, 2.9, "Открываю холодильник.", 'Box'), (3.6, 4.9, "Темно.", 'Box'),
                       (5.2, 7.5, "Лампочка перегорела.", 'Box'), (8.2, 12.7, "Ничего не изменилось.", 'Box')])
final('bulb_main.mp4', 'bulb.wav', 'bulb.ass', 'shorts_bulb.mp4', DUR)
sheet('shorts_bulb.mp4', [1.0, 3.8, 5.15, 5.9, 6.45, 7.5, 10.0, 12.5], 'bulb_check.png')
print('done')
