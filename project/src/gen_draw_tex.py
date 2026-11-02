"""Crayon drawings the fridge made at night: колбаса, сыр, торт — wobbly strokes on lined paper, with a childish caption.
Output: draw_kolbasa.png, draw_syr.png, draw_tort.png (840×600, landscape)."""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
W, H = 840, 600
rng = np.random.default_rng(4)
FONT = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 64)


def paper():
    im = Image.new('RGB', (W, H), (246, 242, 230)); d = ImageDraw.Draw(im)
    for y in range(60, H, 46):
        d.line((0, y, W, y), fill=(200, 215, 235), width=2)
    d.line((70, 0, 70, H), fill=(235, 170, 170), width=2)
    return im, d


def wob(pts, amp=3.0):
    return [(x + rng.normal(0, amp), y + rng.normal(0, amp)) for x, y in pts]


def crayon_poly(d, pts, col, fill=None, w=9):
    if fill is not None:
        d.polygon(pts, fill=fill)
        for k in range(160):                                   # scribbled crayon fill
            i, j = rng.integers(0, len(pts), 2)
            a, b = pts[i], pts[j]
            d.line((a, b), fill=tuple(int(c * rng.uniform(0.88, 1.0)) for c in fill), width=5)
        d.polygon(pts, outline=None)
    for k in range(2):
        q = wob(pts, 2.5)
        d.line(q + [q[0]], fill=col, width=w, joint='curve')


def ellipse_pts(cx, cy, rx, ry, n=40, a0=0.0):
    return [(cx + rx * math.cos(a0 + 2 * math.pi * i / n), cy + ry * math.sin(a0 + 2 * math.pi * i / n)) for i in range(n)]


def caption(d, txt, col):
    x = 120
    for ch in txt:
        d.text((x, 520 + rng.normal(0, 5)), ch, font=FONT, fill=col, anchor='ls'); x += FONT.getlength(ch) + 6


def finish(im, name):
    im = im.filter(ImageFilter.GaussianBlur(0.6))
    im.save(name)


# --- колбаса: a fat pink log with fat dots and tied ends
im, d = paper()
body = ellipse_pts(420, 250, 280, 95)
crayon_poly(d, body, (150, 50, 60), (226, 120, 130))
for i in range(14):
    x, y = rng.uniform(220, 620), rng.uniform(200, 300)
    d.ellipse((x - 10, y - 8, x + 10, y + 8), fill=(250, 235, 230))
for sx in (-1, 1):
    x0 = 420 + sx * 280
    d.line(wob([(x0, 250), (x0 + sx * 40, 220), (x0 + sx * 55, 260)]), fill=(120, 80, 40), width=7)
caption(d, 'КОЛБАСА', (190, 40, 50))
finish(im, 'draw_kolbasa.png')

# --- сыр: yellow wedge with holes
im, d = paper()
wedge = [(170, 380), (690, 380), (690, 230), (170, 330)]
top = [(170, 330), (690, 230), (560, 140)]
crayon_poly(d, wedge, (180, 120, 10), (250, 205, 60))
crayon_poly(d, top, (180, 120, 10), (255, 225, 110))
for x, y, r in ((300, 340, 26), (450, 320, 20), (600, 300, 30), (520, 360, 14), (380, 365, 12)):
    crayon_poly(d, ellipse_pts(x, y, r, r * 0.8, 16), (170, 110, 10), (225, 170, 40), 5)
caption(d, 'СЫР', (200, 140, 0))
finish(im, 'draw_syr.png')

# --- торт: two layers, cream, a cherry and a candle
im, d = paper()
crayon_poly(d, [(200, 420), (640, 420), (640, 300), (200, 300)], (90, 50, 20), (160, 95, 50))
crayon_poly(d, [(240, 300), (600, 300), (600, 200), (240, 200)], (90, 50, 20), (235, 160, 180))
for x in range(250, 600, 50):
    crayon_poly(d, ellipse_pts(x + 15, 205, 28, 18, 14), (210, 200, 190), (250, 248, 240), 4)
crayon_poly(d, [(410, 195), (430, 195), (430, 105), (410, 105)], (60, 90, 170), (120, 160, 235), 5)
crayon_poly(d, ellipse_pts(420, 88, 12, 22, 14), (230, 130, 0), (255, 200, 40), 4)
crayon_poly(d, ellipse_pts(330, 185, 18, 18, 14), (140, 0, 20), (210, 20, 40), 5)
caption(d, 'ТОРТ', (170, 70, 120))
finish(im, 'draw_tort.png')
print('ok')
