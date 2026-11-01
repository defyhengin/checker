"""Textures for «Стиралка»: a generic (non-replica) 100-rouble note, slightly faded after the wash; denim."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
F = '/usr/share/fonts/opentype/inter/'
W, H = 600, 260
rng = np.random.default_rng(5)
im = Image.new('RGB', (W, H), (196, 214, 200))
d = ImageDraw.Draw(im)
# soft guilloche-like bands
for i in range(0, W, 6):
    c = 186 + int(10 * np.sin(i / 23))
    d.line([(i, 0), (i + 40, H)], fill=(c - 8, c + 6, c - 4), width=2)
d.rectangle([10, 10, W - 10, H - 10], outline=(70, 110, 95), width=4)
d.ellipse([360, 40, 560, 220], fill=(214, 226, 214), outline=(90, 125, 108), width=3)
fb = ImageFont.truetype(F + 'Inter-Bold.otf', 120); fs = ImageFont.truetype(F + 'Inter-SemiBold.otf', 34)
d.text((40, 30), '100', font=fb, fill=(46, 92, 78))
d.text((44, 170), 'СТО РУБЛЕЙ', font=fs, fill=(46, 92, 78))
d.text((420, 100), '100', font=ImageFont.truetype(F + 'Inter-Bold.otf', 54), fill=(90, 130, 112))
a = np.asarray(im, np.float32)
# washed: faded, wrinkles
wr = np.zeros((H, W), np.float32)
for _ in range(9):
    x0 = rng.uniform(0, W); ang = rng.uniform(-0.6, 0.6)
    xs = np.arange(W)[None, :]; ys = np.arange(H)[:, None]
    dist = np.abs((xs - x0) - (ys - H / 2) * ang)
    wr += np.exp(-dist / 3.0) * rng.uniform(0.08, 0.18)
a = a * (1 - wr[..., None]) + 255 * 0.12
a = a * 0.9 + np.array([200, 210, 205]) * 0.1
Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.6)).save('note100.png')

# denim
Wd = 512
n = rng.normal(0, 1, (Wd, Wd)).astype(np.float32)
tw = np.sin((np.arange(Wd)[None, :] + np.arange(Wd)[:, None]) * 0.9) * 0.5
v = 0.55 + 0.08 * n + 0.06 * tw
den = np.stack([0.20 * v, 0.33 * v, 0.62 * v], -1) * 255 * 1.4
Image.fromarray(np.clip(den, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7)).save('denim.png')
print('ok')
