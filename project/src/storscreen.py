import numpy as np
from PIL import Image, ImageDraw
from balscreen import PW, PH, f_h, f_m, f_mb, f_s, BG, ss

ON = 4.6
OFF0, OFF1 = 28.8, 29.8
# feed scroll keyframes (time, offset px)
SCROLL = [(0, 0), (9.9, 0), (11.3, 392), (13.6, 392), (15.0, 784), (25.4, 784), (26.6, 1176), (30, 1176)]
LIKES = [9.3, 12.9, 19.6, 27.6]          # double-tap like times (post index = order)
POST_H = 392
POSTS = [("katya.eats", "лучшая карбонара в городе", 214, 'pasta'),
         ("dima_fit", "завтрак чемпиона, 4 яйца", 98, 'eggs'),
         ("lena.home", "мама приготовила, как в детстве", 1203, 'pies'),
         ("food.spb", "двойной чизбургер, ночной дожор", 431, 'burger')]
TAPS = [(ON - 0.1, 150, 400)] + [(lk, 150, 200) for lk in LIKES] + [(lk + 0.12, 150, 200) for lk in LIKES]


def heart(d, cx, cy, r, col):
    d.ellipse((cx - r, cy - r * 0.9, cx, cy + r * 0.1), fill=col)
    d.ellipse((cx, cy - r * 0.9, cx + r, cy + r * 0.1), fill=col)
    d.polygon([(cx - r * 0.98, cy - r * 0.25), (cx + r * 0.98, cy - r * 0.25), (cx, cy + r * 0.95)], fill=col)


def food(d, kind, x, y, w):
    d.rectangle((x, y, x + w, y + w), fill=(70, 52, 40))
    for k in range(0, w, 18):
        d.line((x + k, y, x + k, y + w), fill=(78, 58, 45))
    cx, cy = x + w // 2, y + w // 2
    d.ellipse((cx - 110, cy - 110, cx + 110, cy + 110), fill=(235, 232, 225))
    d.ellipse((cx - 86, cy - 86, cx + 86, cy + 86), fill=(225, 222, 214))
    rng = np.random.default_rng(len(kind))
    if kind == 'pasta':
        for i in range(26):
            a = rng.random() * 6.28; rr = rng.random() * 60
            px, py = cx + rr * np.cos(a), cy + rr * np.sin(a)
            d.arc((px - 22, py - 14, px + 22, py + 14), rng.random() * 360, rng.random() * 360 + 200, fill=(240, 200, 90), width=5)
        for i in range(10):
            px, py = cx + rng.normal(0, 30), cy + rng.normal(0, 30)
            d.rectangle((px, py, px + 10, py + 6), fill=(170, 70, 60))
    elif kind == 'eggs':
        for ox, oy in ((-40, -25), (35, -30), (-30, 35), (40, 30)):
            d.ellipse((cx + ox - 34, cy + oy - 28, cx + ox + 34, cy + oy + 28), fill=(250, 250, 245))
            d.ellipse((cx + ox - 13, cy + oy - 13, cx + ox + 13, cy + oy + 13), fill=(250, 180, 40))
        d.ellipse((cx - 20, cy - 70, cx + 40, cy - 40), fill=(110, 150, 60))
    elif kind == 'pies':
        for ox, oy in ((-45, -30), (20, -45), (40, 20), (-25, 40), (-5, -5)):
            d.ellipse((cx + ox - 34, cy + oy - 20, cx + ox + 34, cy + oy + 20), fill=(205, 140, 60))
            d.ellipse((cx + ox - 24, cy + oy - 15, cx + ox + 22, cy + oy + 4), fill=(225, 165, 80))
    elif kind == 'burger':
        d.chord((cx - 70, cy - 80, cx + 70, cy + 10), 180, 360, fill=(215, 150, 70))
        d.rectangle((cx - 75, cy - 35, cx + 75, cy - 20), fill=(110, 170, 70))
        d.rectangle((cx - 72, cy - 20, cx + 72, cy), fill=(110, 60, 40))
        d.rectangle((cx - 76, cy, cx + 76, cy + 8), fill=(250, 200, 60))
        d.rectangle((cx - 72, cy + 8, cx + 72, cy + 26), fill=(110, 60, 40))
        d.rounded_rectangle((cx - 70, cy + 26, cx + 70, cy + 52), radius=12, fill=(215, 150, 70))


def feed_img():
    H = POST_H * len(POSTS) + 200
    im = Image.new('RGB', (PW, H), BG); d = ImageDraw.Draw(im)
    for i, (name, cap, likes, kind) in enumerate(POSTS):
        y = i * POST_H
        d.ellipse((12, y + 10, 40, y + 38), fill=(90 + 30 * i, 80, 140 - 20 * i))
        d.text((50, y + 24), name, font=f_mb, fill=(235, 235, 240), anchor='lm')
        d.text((PW - 16, y + 24), "···", font=f_mb, fill=(180, 180, 185), anchor='rm')
        food(d, kind, 0, y + 48, PW)
        d.text((14, y + 48 + PW + 12), cap, font=f_m, fill=(220, 220, 225))
    return im


FEED = feed_img()


def offset(t):
    for (t0, a), (t1, b) in zip(SCROLL, SCROLL[1:]):
        if t0 <= t <= t1:
            return a + (b - a) * ss(t0, t1, t)
    return SCROLL[-1][1]


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def draw(t):
    lv = screen_level(t)
    if lv <= 0.001:
        return None, 0.0
    im = Image.new('RGB', (PW, PH), BG)
    off = int(offset(t))
    im.paste(FEED.crop((0, off, PW, off + PH - 70)), (0, 70))
    d = ImageDraw.Draw(im)
    for i, (name, cap, likes, kind) in enumerate(POSTS):
        y = 70 + i * POST_H - off + 48 + PW
        liked = t >= LIKES[i] + 0.15
        if -40 < y < PH:
            heart(d, 24, y - 24 + 0, 9, (235, 60, 80) if liked else (200, 200, 205))
            d.text((44, y - 24), f"{likes + (1 if liked else 0)}", font=f_s, fill=(220, 220, 225), anchor='lm')
        if LIKES[i] + 0.12 <= t < LIKES[i] + 0.9:
            k = ss(LIKES[i] + 0.12, LIKES[i] + 0.3, t) * (1 - ss(LIKES[i] + 0.6, LIKES[i] + 0.9, t))
            heart(d, PW // 2, 70 + i * POST_H - off + 48 + PW // 2, int(30 + 20 * k), (255, 255, 255) if k > 0.05 else BG)
    d.rectangle((0, 0, PW, 70), fill=BG)
    d.text((16, 8), "04:05", font=f_s, fill=(220, 220, 225))
    d.text((16, 44), "Лента", font=f_h, fill=(240, 240, 245), anchor='lm')
    for tt, x, y in TAPS:
        if tt <= t < tt + 0.3:
            k = (t - tt) / 0.3; r = 10 + 14 * k; c = int(255 * (1 - k))
            d.ellipse((x - r, y - r, x + r, y + r), outline=(c, c, c), width=2)
    return np.asarray(im, np.float32) / 255.0, lv
CALL0, CALL1 = -1.0, -1.0
