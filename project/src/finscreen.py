import numpy as np
from PIL import Image, ImageDraw
from callscreen import (PW, PH, f_big, f_time, f_med, f_medb, f_msg, f_small, f_key, ROWS, wrap, ticks, ss)
import callscreen as _c

ON = 4.5
MSG2 = 5.3
OPEN = 10.0
T1 = 19.0; D1 = 0.45; S1 = "Мам"
DEL0 = 23.5; DEL = 0.25
OFF0, OFF1 = 30.0, 31.0
CALL0, CALL1 = ON, ON + 0.6
TAPS = [(OPEN - 0.2, 150, 230)]


def typed_state(t):
    if t < T1:
        return "", None
    if t < DEL0:
        n = min(len(S1), int((t - T1) / D1) + 1)
        k = S1[n - 1] if (t - T1) - (n - 1) * D1 < 0.12 else None
        return S1[:n], k
    if t < DEL0 + len(S1) * DEL:
        n = len(S1) - int((t - DEL0) / DEL) - 1
        return S1[:max(n, 0)], '⌫'
    return "", None


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def lock(t):
    a = np.linspace(0, 1, PH)[:, None, None]
    g = (np.array([16, 22, 40]) * (1 - a) + np.array([6, 6, 10]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im)
    d.text((PW // 2, 100), "23:58", font=f_time, fill=(235, 235, 240), anchor='mm')
    d.text((PW // 2, 145), "вторник, 24 ноября", font=f_med, fill=(190, 190, 200), anchor='mm')
    y = 200
    if t >= MSG2:
        h = _c.card(d, y, "Сообщения · Мама", "Скинула тебе 1000, не спорь.", ss(MSG2, MSG2 + 0.35, t))
        y += h + 10 * ss(MSG2, MSG2 + 0.35, t)
    _c.card(d, y, "Банк", "Поступление +1 000 ₽ от Мама", ss(ON, ON + 0.35, t))
    return im


def chat(t):
    im = Image.new('RGB', (PW, PH), (16, 16, 20)); d = ImageDraw.Draw(im)
    d.text((16, 8), "23:59", font=f_small, fill=(220, 220, 225))
    d.rectangle((0, 28, PW, 76), fill=(28, 28, 34))
    d.text((24, 52), "‹", font=f_big, fill=(120, 160, 230), anchor='lm')
    d.ellipse((50, 36, 82, 68), fill=(120, 110, 160)); d.text((66, 52), "М", font=f_medb, fill=(255, 255, 255), anchor='mm')
    d.text((92, 42), "Мама", font=f_medb, fill=(240, 240, 245))
    d.text((92, 62), "в сети", font=f_small, fill=(150, 150, 160))
    d.rounded_rectangle((PW - 168, 86, PW - 12, 114), radius=12, fill=(40, 92, 170))
    d.text((PW - 156, 100), "Да, всё хорошо", font=f_med, fill=(255, 255, 255), anchor='lm')
    d.text((PW / 2, 128), "Сегодня", font=f_small, fill=(130, 130, 140), anchor='mm')
    y = 142
    for msg in ("Скинула тебе 1000, не спорь.", "И купи себе нормальной еды."):
        lines = wrap(d, msg, f_msg, 200)
        bh = 14 + 24 * len(lines) + 12
        d.rounded_rectangle((12, y, 236, y + bh), radius=14, fill=(48, 50, 58))
        for i, ln in enumerate(lines):
            d.text((24, y + 8 + 24 * i), ln, font=f_msg, fill=(240, 240, 245))
        d.text((226, y + bh - 6), "23:57", font=f_small, fill=(150, 150, 160), anchor='rs')
        y += bh + 8
    txt, key = typed_state(t)
    d.rounded_rectangle((10, 300, PW - 52, 336), radius=18, fill=(36, 36, 44))
    if txt:
        d.text((24, 318), txt, font=f_msg, fill=(240, 240, 245), anchor='lm')
        cx = 24 + d.textlength(txt, font=f_msg) + 2
    else:
        d.text((24, 318), "Сообщение", font=f_msg, fill=(110, 110, 120), anchor='lm')
        cx = 23
    if int(t * 2.2) % 2 == 0:
        d.line([(cx, 306), (cx, 330)], fill=(120, 160, 230), width=2)
    d.ellipse((PW - 46, 300, PW - 10, 336), fill=(40, 92, 170) if txt else (50, 50, 58))
    d.polygon([(PW - 36, 310), (PW - 18, 318), (PW - 36, 326)], fill=(255, 255, 255))
    d.rectangle((0, 350, PW, PH), fill=(30, 30, 36))
    kl = key.lower() if key else None
    for r, row in enumerate(ROWS):
        n = len(row); kw = (PW - 8) / 11; x0 = (PW - n * kw) / 2
        for i, ch in enumerate(row):
            x = x0 + i * kw; yy = 362 + r * 46
            d.rounded_rectangle((x + 2, yy, x + kw - 2, yy + 38), radius=5, fill=(110, 110, 125) if kl == ch else (62, 62, 72))
            d.text((x + kw / 2, yy + 19), ch, font=f_key, fill=(235, 235, 240), anchor='mm')
    d.rounded_rectangle((96, 500, 236, 538), radius=5, fill=(62, 62, 72))
    d.rounded_rectangle((240, 500, 292, 538), radius=5, fill=(110, 110, 125) if key == '⌫' else (48, 48, 56))
    d.text((266, 519), "⌫", font=f_key, fill=(235, 235, 240), anchor='mm')
    return im


def draw(t):
    lv = screen_level(t)
    if lv <= 0.001:
        return None, 0.0
    im = lock(t) if t < OPEN else chat(t)
    d = ImageDraw.Draw(im)
    for tt, x, y in TAPS:
        if tt <= t < tt + 0.3:
            k = (t - tt) / 0.3; r = 10 + 14 * k; c = int(255 * (1 - k))
            d.ellipse((x - r, y - r, x + r, y + r), outline=(c, c, c), width=2)
    return np.asarray(im, np.float32) / 255.0, lv
