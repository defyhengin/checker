import numpy as np
from PIL import Image, ImageDraw, ImageFont
from balscreen import PW, PH, f_bal, f_h, f_m, f_mb, f_s, BG, ss

ON = 6.3
CALC = 11.4
KEYS = [(12.4, '4'), (13.0, '7'), (13.7, '÷'), (14.5, '6'), (15.4, '=')]
OFF0, OFF1 = 21.0, 22.0
CALL0, CALL1 = -1.0, -1.0
f_disp = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Regular.otf', 54)
f_key = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-Regular.otf', 26)
GRID = [['C', '±', '%', '÷'], ['7', '8', '9', '×'], ['4', '5', '6', '−'], ['1', '2', '3', '+'], ['0', '', ',', '=']]


def key_xy(k):
    for r, row in enumerate(GRID):
        if k in row:
            c = row.index(k)
            return 38 + c * 75, 236 + r * 68
    return 150, 300


TAPS = [(ON - 0.1, 150, 400), (CALC - 0.2, 150, 450)] + [(t, *key_xy(k)) for t, k in KEYS]


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def status(d):
    d.text((16, 8), "01:15", font=f_s, fill=(220, 220, 225))


def bank(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((20, 40), "Главная", font=f_h, fill=(240, 240, 245))
    d.rounded_rectangle((16, 86, PW - 16, 226), radius=18, fill=(36, 40, 62))
    d.text((32, 104), "Дебетовая карта", font=f_m, fill=(180, 185, 205))
    d.text((PW - 32, 104), "•• 4417", font=f_m, fill=(180, 185, 205), anchor='ra')
    d.text((32, 182), "47 ₽", font=f_bal, fill=(255, 255, 255), anchor='ls')
    d.text((32, 206), "Доступно", font=f_s, fill=(150, 155, 175))
    d.rounded_rectangle((16, 244, PW - 16, 300), radius=14, fill=(30, 32, 40))
    d.text((32, 262), "Следующее поступление", font=f_s, fill=(150, 155, 175))
    d.text((32, 282), "Зарплата · 25 ноября", font=f_mb, fill=(110, 200, 130))
    return im


def calc(t):
    im = Image.new('RGB', (PW, PH), (0, 0, 0)); d = ImageDraw.Draw(im); status(d)
    expr = ""
    for kt, k in KEYS:
        if t >= kt:
            expr = "7,833333" if k == '=' else (expr + k)
    if expr:
        shown = expr.replace('÷', ' ÷ ')
        if '=' not in [k for kt, k in KEYS if t >= kt]:
            pass
        d.text((PW - 20, 170), shown, font=f_disp, fill=(255, 255, 255), anchor='rs')
    else:
        d.text((PW - 20, 170), "0", font=f_disp, fill=(255, 255, 255), anchor='rs')
    pressed = None
    for kt, k in KEYS:
        if kt <= t < kt + 0.18:
            pressed = k
    for r, row in enumerate(GRID):
        for c, k in enumerate(row):
            if k == '':
                continue
            x, y = 38 + c * 75, 236 + r * 68
            wide = k == '0'
            op = k in '÷×−+='
            base = (255, 160, 10) if op else ((90, 90, 95) if k in 'C±%' else (50, 50, 55))
            if k == pressed:
                base = tuple(min(255, v + 70) for v in base)
            if wide:
                d.rounded_rectangle((x - 30, y - 30, x + 105, y + 30), radius=30, fill=base)
                d.text((x, y), k, font=f_key, fill=(255, 255, 255), anchor='mm')
            else:
                d.ellipse((x - 30, y - 30, x + 30, y + 30), fill=base)
                d.text((x, y), k, font=f_key, fill=(255, 255, 255), anchor='mm')
    return im


def draw(t):
    lv = screen_level(t)
    if lv <= 0.001:
        return None, 0.0
    im = bank(t) if t < CALC else calc(t)
    d = ImageDraw.Draw(im)
    for tt, x, y in TAPS:
        if tt <= t < tt + 0.3:
            k = (t - tt) / 0.3; r = 10 + 14 * k; c = int(255 * (1 - k))
            d.ellipse((x - r, y - r, x + r, y + r), outline=(c, c, c), width=2)
    return np.asarray(im, np.float32) / 255.0, lv
