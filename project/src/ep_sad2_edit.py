"""Montage of «Холодильник грустит» v2 (24 s + card). Every angle exists in 4 lamp states (_0 on, _1 dim, _2 off, _3 half);
the lamp flickers by switching states frame by frame. The tear is an overlay on the s1 door."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from edit import *
from film import lowpass, bandpass, ssv
import edit as E
D = 'ep_sad2'; DUR = 24.0
TA, TB = 14.0, 20.0

rng = np.random.default_rng(9)
NF = int(DUR * FPS)
LAMP = np.zeros(NF, int)                                   # 0 on (default)
for a, b, p in ((3.2, 4.4, 0.55), (8.3, 9.0, 0.6), (11.2, 12.4, 0.5), (20.6, 21.6, 0.7)):
    for fi in range(int(a * FPS), int(b * FPS)):
        if rng.random() < p:
            LAMP[fi] = rng.choice([1, 2, 3], p=[0.4, 0.35, 0.25])
LAMP[int(21.6 * FPS):] = 2                                 # lamp gives up at the end


def L(t):
    return int(LAMP[min(int(t * FPS), NF - 1)])


def ov_tear(out, t):
    if t < TA:
        return out
    u = min(1.0, (t - TA) / (TB - TA)); u = u * u * (3 - 2 * u)
    cx, y0, y1 = OW * 0.30, OH * 0.34, OH * 0.82
    y = y0 + (y1 - y0) * u
    im = Image.new('L', (OW, OH), 0); d = ImageDraw.Draw(im)
    d.rounded_rectangle([cx - 2.5, y0, cx + 2.5, y], radius=2, fill=70)
    r = 12
    d.polygon([(cx, y - r * 2.4), (cx - r * 0.85, y - r * 0.5), (cx + r * 0.85, y - r * 0.5)], fill=255)
    d.ellipse([cx - r, y - r * 1.5, cx + r, y + r * 0.5], fill=255)
    m = np.asarray(im.filter(ImageFilter.GaussianBlur(1.4)), np.float32)[..., None] / 255
    hi = Image.new('L', (OW, OH), 0); ImageDraw.Draw(hi).ellipse([cx - r * 0.55, y - r * 1.2, cx - r * 0.1, y - r * 0.55], fill=255)
    h = np.asarray(hi.filter(ImageFilter.GaussianBlur(1.0)), np.float32)[..., None] / 255
    tint = np.array((170, 200, 235), np.float32)
    return out * (1 - 0.55 * m) + tint * 0.55 * m + 90 * h


# a segment whose source image depends on the lamp state at time t
_orig_view = E._view


def _view(sg, t):
    if isinstance(sg['src'], str) and '{L}' in sg['src']:
        sg = dict(sg, src=sg['src'].format(L=L(t)))
    return _orig_view(sg, t)


E._view = _view

TL = [seg(0.0, 5.5, f'{D}/w1_{{L}}.png', 1.0, 1.25, (0.5, 0.5), (0.52, 0.45)),
      seg(5.5, 10.0, f'{D}/s1_{{L}}.png', 1.0, 1.08, (0.5, 0.5), (0.5, 0.48), xf=0.4),
      seg(10.0, 14.0, f'{D}/w2_{{L}}.png', 1.0, 1.1, (0.5, 0.55), (0.5, 0.5), xf=0.4),
      seg(14.0, 20.0, f'{D}/s1_{{L}}.png', 1.08, 1.16, (0.45, 0.5), (0.42, 0.52), xf=0.5),
      seg(20.0, DUR, f'{D}/w1_{{L}}.png', 1.25, 1.05, (0.52, 0.45), (0.5, 0.5), xf=0.8)]
build_video(TL, DUR, 'sad2_main.mp4')

m = Mix(DUR, 83); t = m.t
m.room(0.03)
lamp_env = np.where(LAMP[np.minimum((t * FPS).astype(int), NF - 1)] == 0, 1.0, 0.45)
lamp_env = lowpass(lamp_env, 60)
m.hum(0.12, env=lamp_env * (1 - 0.8 * ssv(21.0, 23.0, t)), soft=0.8)
prev = 0
for fi in range(NF):                                       # relay ticks when the lamp state changes
    if LAMP[fi] != prev:
        kk = int(0.012 * SR); m.add_at(fi / FPS, bandpass(m.rng.normal(0, 1, kk), 2500, 8000) * np.exp(-np.linspace(0, 6, kk)) * 0.10)
    prev = LAMP[fi]
m.meow(12.2, 0.6, 420, 0.18)                               # the cat, quietly
m.thud(21.7, 0.08)
m.save('sad2.wav')
subs('sad2.ass', DUR, [(0.4, 2.9, "Ночь.", 'Default'), (3.0, 5.3, "Дверца опять приоткрыта.", 'Default'),
                       (6.0, 9.6, "Лампа мигает.", 'Default'),
                       (10.3, 13.8, "Кот сытый. Просто смотрит.", 'Default'),
                       (14.6, 19.6, "Ему тоже одиноко.", 'Default')])
final('sad2_main.mp4', 'sad2.wav', 'sad2.ass', 'shorts_sad.mp4', DUR)
sheet('shorts_sad.mp4', [2, 3.6, 7, 11, 15, 18, 20.5, 23], 'sad2_check.png')
print('done')
