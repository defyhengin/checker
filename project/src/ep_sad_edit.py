"""Montage of «Холодильник грустит» (24 s + card): flickering lamp through the ajar door, close-up, a tear drawn as an overlay."""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from edit import *
from film import lowpass, bandpass, ssv
D = 'ep_sad'; DUR = 24.0
TA, TB = 12.5, 19.0          # tear starts / reaches the bottom


def ov_tear(out, t):
    if t < TA:
        return out
    u = min(1.0, (t - TA) / (TB - TA)); u = u * u * (3 - 2 * u)
    cx, y0, y1 = OW * 0.29, OH * 0.30, OH * 0.80
    y = y0 + (y1 - y0) * u
    im = Image.new('L', (OW, OH), 0); d = ImageDraw.Draw(im)
    d.rounded_rectangle([cx - 2.5, y0, cx + 2.5, y], radius=2, fill=70)                       # wet trail
    r = 11
    d.polygon([(cx, y - r * 2.4), (cx - r * 0.85, y - r * 0.5), (cx + r * 0.85, y - r * 0.5)], fill=255)
    d.ellipse([cx - r, y - r * 1.5, cx + r, y + r * 0.5], fill=255)
    m = np.asarray(im.filter(ImageFilter.GaussianBlur(1.4)), np.float32)[..., None] / 255
    hi = Image.new('L', (OW, OH), 0); ImageDraw.Draw(hi).ellipse([cx - r * 0.55, y - r * 1.2, cx - r * 0.1, y - r * 0.55], fill=255)
    h = np.asarray(hi.filter(ImageFilter.GaussianBlur(1.0)), np.float32)[..., None] / 255
    tint = np.array((150, 185, 225), np.float32)
    return out * (1 - 0.55 * m) + tint * 0.55 * m + 90 * h


TL = [seg(0.0, 4.6, f'{D}/s1_0.png', 1.0, 1.08, (0.5, 0.5), (0.5, 0.48)),
      seg(4.6, 5.1, f'{D}/s1_1.png', 1.08, 1.08),
      seg(5.1, 5.7, f'{D}/s1_0.png', 1.08, 1.09),
      seg(5.7, 6.3, f'{D}/s1_2.png', 1.09, 1.09),
      seg(6.3, 6.8, f'{D}/s1_3.png', 1.09, 1.1),
      seg(6.8, 7.5, f'{D}/s1_1.png', 1.1, 1.1),
      seg(7.5, 10.0, f'{D}/s1_0.png', 1.1, 1.14, (0.5, 0.48), (0.5, 0.46)),
      seg(10.0, 20.0, f'{D}/s2.png', 1.0, 1.1, (0.5, 0.5), (0.45, 0.52), xf=0.6, overlay=ov_tear),
      seg(20.0, DUR, f'{D}/s1_2.png', 1.1, 1.0, (0.5, 0.48), (0.5, 0.5), xf=1.2)]
build_video(TL, DUR, 'sad_main.mp4')

m = Mix(DUR, 83); t = m.t
m.room(0.03)
lamp = np.ones_like(t)
for a, b in ((4.6, 5.1), (5.7, 6.3), (6.8, 7.5)):
    lamp *= 1 - 0.6 * ((t > a) & (t < b))
m.hum(0.12, env=lamp * (1 - 0.7 * ssv(19.0, 22.5, t)), soft=0.8)           # the hum gets slower and quieter
for at in (4.6, 5.7, 6.8):
    m.knock(at, 0.10)                                                      # relay clicks with the lamp
for at in (12.5, 15.6, 18.7):
    k = int(0.06 * SR); tm = np.arange(k) / SR
    m.add_at(at + 0.3, np.sin(2 * np.pi * 1900 * tm) * np.exp(-tm * 70) * 0.05)    # quiet drip
m.thud(19.0, 0.08)
m.save('sad.wav')
subs('sad.ass', DUR, [(0.4, 3.4, "Дверца приоткрыта.", 'Default'), (3.6, 4.5, "Лампа мигает.", 'Default'),
                      (7.9, 9.8, "Он не включается.", 'Default'), (10.4, 12.3, "Он просто светит.", 'Default'),
                      (13.0, 17.0, "Ему тоже одиноко.", 'Default'),
                      (20.6, 23.6, "Выключаю свет.", 'Default')])
final('sad_main.mp4', 'sad.wav', 'sad.ass', 'shorts_sad.mp4', DUR)
sheet('shorts_sad.mp4', [2, 5, 9, 11, 14, 17, 19, 22], 'sad_check.png')
print('done')
