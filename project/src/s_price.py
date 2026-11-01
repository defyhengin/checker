import numpy as np
from PIL import Image, ImageDraw, ImageFont
from eng import box, ss, lerp, main, f32

ALB = np.array([(0.30, 0.31, 0.33), (0.70, 0.72, 0.74), (0.45, 0.46, 0.48), (1, 1, 1), (1, 1, 1),
                (0.10, 0.10, 0.11)], f32)
SPEC = np.array([0.3, 0.35, 0.5, 0.15, 0.1, 0.0], f32)
TAG = (-0.13, 0.13, 0.905, 0.99, -0.342)
PACK = (-0.09, 0.09, 1.0, 1.26, -0.25)

PRIMS = [
    box((-0.6, 0.3, 0.0), (0.6, 1.95, 0.03), 0),
    box((-0.63, 0.3, -0.34), (-0.6, 1.95, 0.03), 2), box((0.6, 0.3, -0.34), (0.63, 1.95, 0.03), 2),
]
for y in (0.5, 0.98, 1.46):
    PRIMS.append(box((-0.6, y, -0.33), (0.6, y + 0.02, 0.0), 1))
    PRIMS.append(box((-0.6, y - 0.075, -0.335), (0.6, y + 0.02, -0.315), 2))
PRIMS += [box((TAG[0], TAG[2], TAG[4]), (TAG[1], TAG[3], -0.335), 3),
          box((PACK[0], PACK[2], PACK[4]), (PACK[1], PACK[3], -0.17), 4),
          box((-5, -3, 0.04), (5, 5, 0.1), 5)]

FB = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 64)
FS = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 16)
FP = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 30)


def make_pack():
    im = Image.new('RGB', (180, 260), (30, 60, 150))
    d = ImageDraw.Draw(im)
    d.rectangle((0, 90, 180, 170), fill=(240, 200, 40))
    d.text((90, 130), "МАКАРОНЫ", font=FP, fill=(30, 40, 90), anchor='mm')
    d.text((90, 205), "высший сорт", font=FS, fill=(230, 230, 240), anchor='mm')
    d.text((90, 40), "450 г", font=FS, fill=(230, 230, 240), anchor='mm')
    return np.asarray(im, f32) / 255.0


PACK_IMG = make_pack()


def price(t):
    keys = [(0, 89), (5.6, 89), (6.6, 149), (9.2, 149), (10.0, 199), (12.4, 199), (13.0, 349)]
    for (t0, a), (t1, b) in zip(keys, keys[1:]):
        if t0 <= t < t1:
            return int(round(a + (b - a) * (t - t0) / (t1 - t0)))
    return keys[-1][1]


_cache = {}


def tag_img(p):
    if p not in _cache:
        im = Image.new('RGB', (260, 85), (250, 215, 40))
        d = ImageDraw.Draw(im)
        d.rectangle((0, 0, 260, 16), fill=(200, 30, 30))
        d.text((8, 8), "Макароны 450 г", font=FS, fill=(255, 255, 255), anchor='lm')
        d.text((170, 54), str(p), font=FB, fill=(20, 20, 20), anchor='rm')
        d.text((178, 64), "руб.", font=FS, fill=(20, 20, 20), anchor='lm')
        _cache[p] = np.asarray(im, f32) / 255.0
    return _cache[p]


def sample(img, u, v):
    h, w, _ = img.shape
    return img[np.clip((v * h).astype(int), 0, h - 1), np.clip((u * w).astype(int), 0, w - 1)]


def tex(mid, Px, Py, Pz, alb, nx, ny, nz, t):
    m = (mid == 3) & (nz < -0.5)
    if m.any():
        alb[m] = sample(tag_img(price(t)), (TAG[1] - Px[m]) / (TAG[1] - TAG[0]), (TAG[3] - Py[m]) / (TAG[3] - TAG[2]))
    m4 = mid == 4
    if m4.any():
        fr = m4 & (nz < -0.5)
        alb[fr] = sample(PACK_IMG, (PACK[1] - Px[fr]) / (PACK[1] - PACK[0]), (PACK[3] - Py[fr]) / (PACK[3] - PACK[2]))
        sd = m4 & ~(nz < -0.5)
        alb[sd] = (0.12, 0.25, 0.6)
    return alb, nx, ny, nz


def power(t):
    v = 1.0 - 0.05 * np.sin(t * 50) * np.sin(t * 3.3) ** 2
    for a, b in [(3.1, 3.2), (3.28, 3.33), (8.0, 8.1)]:
        if a <= t <= b:
            v *= 0.25
    if t > 14.0:
        v *= np.exp(-(t - 14) * 30)
    return float(v)


def build(t):
    k = float(ss(0.6, 13.2, t))
    cam = lerp((0.05, 1.28, -1.55), (0.0, 1.0, -0.74), k)
    tgt = lerp((0.0, 1.1, -0.2), (0.0, 0.93, -0.3), k)
    pw = power(t)
    return dict(cam=cam, tgt=tgt, tanx=0.42, prims=PRIMS, alb=ALB, spec=SPEC, tex=tex, amb=0.02 * pw, exp=1.3,
                lights=[dict(p=(0.0, 1.55, -1.1), col=(0.85, 0.95, 1.0), I=1.2 * pw, att=(0.3, 0.6),
                             dir=(0, -0.5, 0.9), cos=(0.55, 0.9))])


if __name__ == '__main__':
    main(build, 'prc')
