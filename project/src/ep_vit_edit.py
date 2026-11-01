import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from edit import *
from film import lowpass, bandpass, ssv
D = 'ep_vit'; DUR = 34.0


def silhouette():
    im = Image.new('L', (OW, OH), 0); d = ImageDraw.Draw(im)
    cx = OW * 0.5
    d.ellipse([cx - 95, OH * 0.47 - 125, cx + 95, OH * 0.47 + 120], fill=255)          # head
    d.rectangle([cx - 40, OH * 0.55, cx + 40, OH * 0.62], fill=255)                     # neck
    d.rounded_rectangle([cx - 300, OH * 0.6, cx + 300, OH * 1.05], radius=150, fill=255)  # shoulders
    return np.asarray(im.filter(ImageFilter.GaussianBlur(18)), np.float32)[..., None] / 255


SIL = silhouette()
yy, xx = np.mgrid[0:OH, 0:OW]
FOG = np.exp(-(((xx - OW * 0.5) / 150) ** 2 + ((yy - OH * 0.62) / 90) ** 2))[..., None].astype(np.float32)


def breath(t):
    return 0.28 * max(0.0, np.sin(2 * np.pi * t / 3.2)) ** 2


def ov_lit(out, t):
    out = out * (1 - 0.42 * SIL)
    b = breath(t); return out * (1 - b * FOG) + 210 * b * FOG


def ov_dark(out, t):
    out = out + SIL * np.array((34, 24, 16), np.float32) * 0.9
    b = breath(t); return out * (1 - b * FOG) + 120 * b * FOG


TL = [seg(0.0, 4.5, f'{D}/a1.png', 1.0, 1.4, (0.5, 0.5), (0.5, 0.47)),
      seg(4.5, 11.0, f'{D}/a2_wide.png', 1.0, 1.0, (0.18, 0.5), (0.82, 0.5), xf=0.4, ease=True),
      seg(11.0, 15.5, f'{D}/a3.png', 1.0, 1.08, (0.5, 0.5), (0.5, 0.52), xf=0.3),
      seg(15.5, 21.5, f'{D}/a4.png', 1.02, 1.1, (0.5, 0.5), (0.5, 0.5), xf=0.4, overlay=ov_lit),
      seg(21.5, 23.5, f'{D}/a6_0.png', 1.0, 1.01, xf=0.4),
      seg(23.5, 25.0, f'{D}/a6_1.png', 1.01, 1.02),
      seg(25.0, 26.5, f'{D}/a6_2.png', 1.02, 1.03),
      seg(26.5, 28.0, f'{D}/a6_3.png', 1.03, 1.04),
      seg(28.0, DUR, f'{D}/a7.png', 1.02, 1.12, (0.5, 0.5), (0.5, 0.5), xf=0.6, overlay=ov_dark)]
build_video(TL, DUR, 'vit_main.mp4')

m = Mix(DUR, 53); t = m.t
wind = lowpass(m.rng.normal(0, 1, m.n), 400); wind = wind / np.abs(wind).max()
m.out += wind * 0.05 * (0.7 + 0.3 * np.sin(2 * np.pi * t / 7.0)) * m.fade()
m.steps(0.4, 4.4, 0.55, 1.0)
lit = (1 - ssv(26.45, 26.6, t))
m.hum(0.1, env=lit * (0.55 + 0.45 * ssv(4.0, 6.0, t)), muffle=220)          # the shop fridges, through the glass
k = int(0.12 * SR); tm = np.arange(k) / SR
m.add_at(7.4, np.sin(2 * np.pi * 2900 * tm) * np.exp(-tm * 30) * 0.03)          # distant scanner beep
for at in (23.5, 25.0, 26.5):
    kk = int(0.03 * SR); m.add_at(at, bandpass(m.rng.normal(0, 1, kk), 1500, 6000) * np.exp(-np.linspace(0, 6, kk)) * 0.5)
for a, b in ((15.5, 21.5), (28.0, DUR)):
    for at in np.arange(a + 0.6, b, 3.2):
        m.noise_burst(at, 1.0, 300, 1800, 0.05)
m.save('vit.wav')
subs('vit.ass', DUR, [(0.3, 3.8, "23:40.", 'Default'), (5.0, 8.4, "Хлеб. Лапша. Гречка.", 'Box'), (8.7, 10.9, "Там тепло.", 'Box'),
                      (11.6, 15.3, "12 ₽.", 'Box'), (16.2, 21.3, "Между нами — стекло.", 'Box'), (26.7, 27.9, "Закрыто.", 'Default'),
                      (30.0, 33.8, "Пора домой.", 'Default')])
final('vit_main.mp4', 'vit.wav', 'vit.ass', 'shorts_vitrina.mp4', DUR)
sheet('shorts_vitrina.mp4', [2, 6, 9.5, 13, 18, 24, 27, 31], 'vit_check.png')
print('done')
