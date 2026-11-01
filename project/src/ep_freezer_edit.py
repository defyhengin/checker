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


def steam_seq(sg, t):
    fi = int((t - sg['a']) * 24) % 36
    u = (t - sg['a']) / (sg['b'] - sg['a']); z = 1.0 + 0.1 * u * u * (3 - 2 * u)
    return crop(E._img(f'{D}/steam/f_{fi:04d}.png'), z, (0.5, 0.5))


# ---- soft rising steam drawn over the dinner shot (the 3D mist and transparent balls both failed) ----
_rng = np.random.default_rng(12)
def _vnoise(n, cells):
    g = _rng.random((cells + 1, cells + 1))
    g[-1, :] = g[0, :]; g[:, -1] = g[:, 0]
    im = Image.fromarray((g * 255).astype(np.uint8)).resize((n, n), Image.BICUBIC)
    return np.asarray(im, np.float32) / 255.0
NZ = (_vnoise(512, 6) * 0.55 + _vnoise(512, 14) * 0.3 + _vnoise(512, 32) * 0.15)
SRC = (0.468, 0.528)            # water centre in z4.png (fraction of the image)
Z4 = (1.0, 1.5, (0.5, 0.5), (0.57, 0.47))


def _sample(u, v):
    xi = (u * 511).astype(np.int32) % 512; yi = (v * 511).astype(np.int32) % 512
    return NZ[yi, xi]


def steam(out, t):
    a, b = T3, DUR
    s = (t - a) / (b - a); s = min(max(s, 0), 1); s = s * s * (3 - 2 * s)
    z = Z4[0] + (Z4[1] - Z4[0]) * s
    c = (Z4[2][0] + (Z4[3][0] - Z4[2][0]) * s, Z4[2][1] + (Z4[3][1] - Z4[2][1]) * s)
    W, H = 1080, 1920; ch = H / z; cw = ch * OW / OH
    x0 = min(max(c[0] * W - cw / 2, 0), W - cw); y0 = min(max(c[1] * H - ch / 2, 0), H - ch)
    sx = (SRC[0] * W - x0) / cw * OW; sy = (SRC[1] * H - y0) / ch * OH
    sc_ = OW / cw                                   # output px per source px
    bw = 190 * sc_; hh = 560 * sc_                   # bowl half-width and steam height in output px
    X0, X1 = int(max(sx - 2.2 * bw, 0)), int(min(sx + 2.2 * bw, OW)); Y0, Y1 = int(max(sy - hh, 0)), int(min(sy, OH))
    if X1 <= X0 or Y1 <= Y0:
        return out
    yy, xx = np.mgrid[Y0:Y1, X0:X1].astype(np.float32)
    v = (sy - yy) / hh                              # 0 at the water, 1 at the top
    u = (xx - sx) / bw
    sway = 0.18 * np.sin(v * 5.0 - t * 1.7) * v
    width = 0.55 + 0.9 * v
    n1 = _sample(u * 0.35 + sway * 0.5 + 0.1, v * 0.9 - t * 0.22)
    n2 = _sample(u * 0.5 - sway * 0.3 + 0.6, v * 1.3 - t * 0.31 + 0.4)
    d = np.clip((n1 * 0.6 + n2 * 0.4 - 0.42) * 3.2, 0, 1)
    d *= np.exp(-((u - sway) / width) ** 2 * 2.2)
    d *= np.clip(v / 0.08, 0, 1) * np.clip((1 - v) / 0.55, 0, 1)
    al = (d * 0.42)[..., None]
    reg = out[Y0:Y1, X0:X1]
    out[Y0:Y1, X0:X1] = reg * (1 - al) + np.array((238, 234, 228), np.float32) * al
    return out


_orig = E._view
E._view = lambda sg, t: glide(t) if sg['src'] == 'GLIDE' else (steam_seq(sg, t) if sg['src'] == 'STEAM' else _orig(sg, t))

TL = [seg(0.0, T2, 'GLIDE'),
      seg(T2, T3, f'{D}/z2.png', 1.0, 1.25, (0.5, 0.5), (0.5, 0.48), xf=0.35),
      seg(T3, DUR, f'{D}/z4.png', 1.0, 1.5, (0.5, 0.5), (0.57, 0.47), xf=0.4, overlay=steam)]
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
