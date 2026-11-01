import numpy as np
from PIL import Image, ImageDraw, ImageFont

PW, PH = 300, 560
F = '/usr/share/fonts/opentype/inter/Inter-'
f_big = ImageFont.truetype(F + 'SemiBold.otf', 34)
f_time = ImageFont.truetype(F + 'SemiBold.otf', 58)
f_med = ImageFont.truetype(F + 'Regular.otf', 16)
f_medb = ImageFont.truetype(F + 'SemiBold.otf', 16)
f_msg = ImageFont.truetype(F + 'Regular.otf', 18)
f_small = ImageFont.truetype(F + 'Regular.otf', 12)
f_key = ImageFont.truetype(F + 'Regular.otf', 15)
f_av = ImageFont.truetype(F + 'SemiBold.otf', 44)

CALL0, CALL1 = 4.0, 18.0
MISS = 18.0
MSG = 22.0
CHAT = 27.0
S1 = "Мам, честно, у меня"
S2 = "Да, всё хорошо"
T1 = 28.5; D1 = 0.17
P1 = T1 + len(S1) * D1 + 1.5
DEL = 0.06
P2 = P1 + len(S1) * DEL + 1.0
D2 = 0.2
SEND = P2 + len(S2) * D2 + 1.5
TYPING = (SEND + 1.9, SEND + 4.2)
OFF0, OFF1 = 44.5, 45.5
ROWS = ["йцукенгшщзх", "фывапролджэ", "ячсмитьбю"]


def ss(a, b, x):
    x = min(max((x - a) / (b - a), 0.0), 1.0); return x * x * (3 - 2 * x)


def typed_state(t):
    """text in input field, last key pressed (or None)"""
    if t < T1:
        return "", None
    if t < P1:
        n = min(len(S1), int((t - T1) / D1) + 1)
        k = S1[n - 1] if (t - T1) - (n - 1) * D1 < 0.12 else None
        return S1[:n], k
    if t < P1 + len(S1) * DEL:
        n = len(S1) - int((t - P1) / DEL) - 1
        return S1[:max(n, 0)], '⌫'
    if t < P2:
        return "", None
    if t < SEND:
        n = min(len(S2), int((t - P2) / D2) + 1)
        k = S2[n - 1] if (t - P2) - (n - 1) * D2 < 0.12 else None
        return S2[:n], k
    return "", None


def screen_level(t):
    if t < CALL0:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def wrap(d, text, font, width):
    words = text.split(' '); lines = []; cur = ''
    for w in words:
        test = (cur + ' ' + w).strip()
        if d.textlength(test, font=font) <= width:
            cur = test
        else:
            lines.append(cur); cur = w
    lines.append(cur)
    return lines


def ticks(d, x, y, n, col):
    for i in range(n):
        o = i * 5
        d.line([(x + o, y + 4), (x + 3 + o, y + 7), (x + 9 + o, y)], fill=col, width=2)


def status(d, light=(220, 220, 225)):
    d.text((16, 8), "21:47", font=f_small, fill=light)
    d.rectangle((PW - 40, 10, PW - 18, 20), outline=light, width=1)
    d.rectangle((PW - 38, 12, PW - 34, 18), fill=(220, 60, 60))


def call_screen(t):
    im = Image.new('RGB', (PW, PH))
    a = np.linspace(0, 1, PH)[:, None, None]
    grad = (np.array([28, 30, 44]) * (1 - a) + np.array([10, 10, 16]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(grad.astype(np.uint8))
    d = ImageDraw.Draw(im)
    status(d)
    d.text((PW // 2, 70), "входящий вызов", font=f_med, fill=(170, 170, 180), anchor='mm')
    pulse = 0.5 + 0.5 * np.sin((t - CALL0) * 4)
    r = 50 + 6 * pulse
    d.ellipse((PW / 2 - r, 165 - r, PW / 2 + r, 165 + r), outline=(90, 90, 110), width=2)
    d.ellipse((PW / 2 - 46, 119, PW / 2 + 46, 211), fill=(120, 110, 160))
    d.text((PW // 2, 165), "М", font=f_av, fill=(255, 255, 255), anchor='mm')
    d.text((PW // 2, 255), "Мама", font=f_big, fill=(255, 255, 255), anchor='mm')
    d.text((PW // 2, 290), "мобильный", font=f_med, fill=(160, 160, 170), anchor='mm')
    for cx, col, lab in ((75, (220, 60, 60), "Отклонить"), (225, (50, 190, 90), "Принять")):
        rr = 30 + (3 * pulse if lab == "Принять" else 0)
        d.ellipse((cx - rr, 460 - rr, cx + rr, 460 + rr), fill=col)
        d.text((cx, 507), lab, font=f_small, fill=(200, 200, 205), anchor='mm')
    d.line([(65, 455), (85, 465)], fill=(255, 255, 255), width=4)
    d.line([(215, 465), (235, 455)], fill=(255, 255, 255), width=4)
    return im


def card(d, y, title, body, slide):
    x = int(12 + (1 - slide) * 300)
    lines = wrap(d, body, f_medb, PW - 50)
    h = 38 + 22 * len(lines)
    d.rounded_rectangle((x, y, x + PW - 24, y + h), radius=14, fill=(52, 54, 64))
    d.text((x + 12, y + 10), title, font=f_small, fill=(170, 170, 180))
    d.text((x + PW - 36, y + 10), "сейчас", font=f_small, fill=(150, 150, 160), anchor='ra')
    for i, ln in enumerate(lines):
        d.text((x + 12, y + 28 + 22 * i), ln, font=f_medb, fill=(240, 240, 245))
    return h


def lock_screen(t):
    a = np.linspace(0, 1, PH)[:, None, None]
    grad = (np.array([16, 22, 40]) * (1 - a) + np.array([6, 6, 10]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(grad.astype(np.uint8)); d = ImageDraw.Draw(im)
    status(d)
    d.text((PW // 2, 100), "21:47", font=f_time, fill=(235, 235, 240), anchor='mm')
    d.text((PW // 2, 145), "суббота, 31 октября", font=f_med, fill=(190, 190, 200), anchor='mm')
    y = 200
    if t >= MSG:
        h = card(d, y, "Сообщения · Мама", "Ты там нормально питаешься?", ss(MSG, MSG + 0.35, t))
        y += h + 10 * ss(MSG, MSG + 0.35, t)
    card(d, y, "Телефон", "Пропущенный вызов: Мама", ss(MISS, MISS + 0.35, t))
    return im


def chat_screen(t):
    im = Image.new('RGB', (PW, PH), (16, 16, 20)); d = ImageDraw.Draw(im)
    status(d)
    d.rectangle((0, 28, PW, 76), fill=(28, 28, 34))
    d.text((24, 52), "‹", font=f_big, fill=(120, 160, 230), anchor='lm')
    d.ellipse((50, 36, 82, 68), fill=(120, 110, 160)); d.text((66, 52), "М", font=f_medb, fill=(255, 255, 255), anchor='mm')
    d.text((92, 42), "Мама", font=f_medb, fill=(240, 240, 245))
    typing = TYPING[0] < t < TYPING[1]
    sub = "печатает" + "." * (int(t * 3) % 4) if typing else "в сети"
    d.text((92, 62), sub, font=f_small, fill=(120, 160, 230) if typing else (150, 150, 160))
    # mom bubble
    lines = wrap(d, "Ты там нормально питаешься?", f_msg, 190)
    bh = 16 + 24 * len(lines) + 14
    d.rounded_rectangle((12, 100, 228, 100 + bh), radius=14, fill=(48, 50, 58))
    for i, ln in enumerate(lines):
        d.text((24, 108 + 24 * i), ln, font=f_msg, fill=(240, 240, 245))
    d.text((216, 100 + bh - 8), "21:48", font=f_small, fill=(150, 150, 160), anchor='rs')
    # my bubble
    if t >= SEND:
        k = ss(SEND, SEND + 0.25, t)
        y0 = 100 + bh + 14 + int((1 - k) * 30)
        w = d.textlength(S2, font=f_msg) + 80
        d.rounded_rectangle((PW - 12 - w, y0, PW - 12, y0 + 46), radius=14, fill=(40, 92, 170))
        d.text((PW - w, y0 + 10), S2, font=f_msg, fill=(255, 255, 255))
        d.text((PW - 40, y0 + 38), "21:49", font=f_small, fill=(200, 215, 240), anchor='rs')
        ticks(d, PW - 34, y0 + 30, 2 if t > SEND + 1.0 else 1, (200, 225, 255) if t > SEND + 2.5 else (170, 190, 220))
    # input
    txt, key = typed_state(t)
    d.rounded_rectangle((10, 300, PW - 52, 336), radius=18, fill=(36, 36, 44))
    if txt:
        tw = d.textlength(txt, font=f_msg)
        shown = txt
        while d.textlength(shown, font=f_msg) > PW - 90:
            shown = shown[1:]
        d.text((24, 318), shown, font=f_msg, fill=(240, 240, 245), anchor='lm')
        cx = 24 + d.textlength(shown, font=f_msg) + 2
    else:
        d.text((24, 318), "Сообщение", font=f_msg, fill=(110, 110, 120), anchor='lm')
        cx = 23
    if int(t * 2.2) % 2 == 0 and t < SEND:
        d.line([(cx, 306), (cx, 330)], fill=(120, 160, 230), width=2)
    d.ellipse((PW - 46, 300, PW - 10, 336), fill=(40, 92, 170) if txt else (50, 50, 58))
    d.polygon([(PW - 36, 310), (PW - 18, 318), (PW - 36, 326)], fill=(255, 255, 255))
    # keyboard
    d.rectangle((0, 350, PW, PH), fill=(30, 30, 36))
    kl = key.lower() if key else None
    for r, row in enumerate(ROWS):
        n = len(row); kw = (PW - 8) / 11
        x0 = (PW - n * kw) / 2
        for i, ch in enumerate(row):
            x = x0 + i * kw; y = 362 + r * 46
            on = kl == ch
            d.rounded_rectangle((x + 2, y, x + kw - 2, y + 38), radius=5, fill=(110, 110, 125) if on else (62, 62, 72))
            d.text((x + kw / 2, y + 19), ch, font=f_key, fill=(235, 235, 240), anchor='mm')
    sp_on = key == ' '; bs_on = key == '⌫'; pu_on = key in (',', '.')
    d.rounded_rectangle((8, 500, 64, 538), radius=5, fill=(48, 48, 56))
    d.text((36, 519), "?123", font=f_small, fill=(220, 220, 225), anchor='mm')
    d.rounded_rectangle((68, 500, 92, 538), radius=5, fill=(110, 110, 125) if pu_on else (62, 62, 72))
    d.text((80, 519), ",", font=f_key, fill=(235, 235, 240), anchor='mm')
    d.rounded_rectangle((96, 500, 236, 538), radius=5, fill=(110, 110, 125) if sp_on else (62, 62, 72))
    d.rounded_rectangle((240, 500, 292, 538), radius=5, fill=(110, 110, 125) if bs_on else (48, 48, 56))
    d.text((266, 519), "⌫", font=f_key, fill=(235, 235, 240), anchor='mm')
    return im


def draw(t):
    """returns (image as float array 0..1, brightness level)"""
    lvl = screen_level(t)
    if lvl <= 0.001:
        return None, 0.0
    if t < CALL1:
        im = call_screen(t)
    elif t < CHAT:
        im = lock_screen(t)
    else:
        im = chat_screen(t)
    return np.asarray(im, np.float32) / 255.0, lvl
