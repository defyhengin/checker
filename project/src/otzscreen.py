import numpy as np
from PIL import Image, ImageDraw
from balscreen import PW, PH, f_h, f_m, f_mb, f_s, f_btn, f_time, BG, CARD, ss
import callscreen as _c
from callscreen import f_msg, f_key, ROWS

ON = 4.5
OPEN = 9.0
STARS = [11.0, 11.5, 12.0, 12.5, 13.0]
TXT = "Скучаю"
T1 = 15.0; D1 = 0.35
SEND = T1 + len(TXT) * D1 + 1.6
OFF0, OFF1 = SEND + 3.6, SEND + 4.6
CALL0, CALL1 = ON, ON + 0.6
TAPS = [(OPEN - 0.2, 150, 230)] + [(s, 62 + i * 44, 268) for i, s in enumerate(STARS)] + [(SEND, 150, 500)]


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def star(d, cx, cy, r, col):
    pts = []
    for k in range(10):
        a = -np.pi / 2 + k * np.pi / 5
        rr = r if k % 2 == 0 else r * 0.45
        pts.append((cx + rr * np.cos(a), cy + rr * np.sin(a)))
    d.polygon(pts, fill=col)


def lock(t):
    a = np.linspace(0, 1, PH)[:, None, None]
    g = (np.array([16, 22, 40]) * (1 - a) + np.array([6, 6, 10]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im)
    d.text((PW // 2, 100), "00:31", font=f_time, fill=(235, 235, 240), anchor='mm')
    d.text((PW // 2, 145), "суббота, 21 ноября", font=f_m, fill=(190, 190, 200), anchor='mm')
    _c.card(d, 200, "Доставка", "Оцените ваш последний заказ. Нам важно ваше мнение!", ss(ON, ON + 0.35, t))
    return im


def review(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im)
    d.text((16, 8), "00:31", font=f_s, fill=(220, 220, 225))
    d.text((24, 52), "‹", font=f_h, fill=(240, 200, 60), anchor='lm')
    d.text((44, 40), "Ваш заказ", font=f_h, fill=(240, 240, 245))
    d.rounded_rectangle((16, 84, PW - 16, 170), radius=14, fill=CARD)
    d.ellipse((28, 98, 84, 154), fill=(200, 120, 60))
    for k in range(6):
        a = k * np.pi / 3
        d.ellipse((56 + 16 * np.cos(a) - 5, 126 + 16 * np.sin(a) - 5, 56 + 16 * np.cos(a) + 5, 126 + 16 * np.sin(a) + 5), fill=(190, 50, 40))
    d.text((96, 100), "Пицца «Маргарита»", font=f_mb, fill=(235, 235, 240))
    d.text((96, 122), "3 сентября · 389 ₽", font=f_s, fill=(150, 150, 160))
    d.text((96, 142), "Доставлен", font=f_s, fill=(110, 200, 130))
    d.text((PW // 2, 214), "Как вам заказ?", font=f_h, fill=(240, 240, 245), anchor='mm')
    for i, s in enumerate(STARS):
        on = t >= s
        star(d, 62 + i * 44, 268, 17, (250, 200, 50) if on else (70, 72, 82))
    sent = t >= SEND + 0.2
    if not sent:
        txt = ""
        if t >= T1:
            n = min(len(TXT), int((t - T1) / D1) + 1)
            txt = TXT[:n]
        d.rounded_rectangle((16, 310, PW - 16, 420), radius=12, fill=(30, 32, 40))
        if txt:
            d.text((28, 324), txt, font=f_msg, fill=(240, 240, 245))
            cx = 28 + d.textlength(txt, font=f_msg) + 2
        else:
            d.text((28, 324), "Комментарий (необязательно)", font=f_m, fill=(110, 110, 120))
            cx = 27
        if int(t * 2.2) % 2 == 0 and t >= T1 - 1:
            d.line([(cx, 324), (cx, 346)], fill=(240, 200, 60), width=2)
        ready = t >= STARS[-1]
        d.rounded_rectangle((16, 478, PW - 16, 522), radius=14, fill=(240, 200, 60) if ready else (52, 54, 62))
        d.text((PW // 2, 500), "Отправить", font=f_btn, fill=(20, 20, 20) if ready else (120, 120, 128), anchor='mm')
    else:
        k = ss(SEND + 0.2, SEND + 0.5, t)
        d.ellipse((PW // 2 - 34, 330 - 34, PW // 2 + 34, 330 + 34), outline=(110, 200, 130), width=4)
        d.line([(PW // 2 - 16, 330), (PW // 2 - 4, 344), (PW // 2 + 18, 316)], fill=(110, 200, 130), width=5)
        d.text((PW // 2, 396), "Спасибо за отзыв!", font=f_h, fill=(240, 240, 245), anchor='mm')
        d.text((PW // 2, 424), "Ждём вас снова", font=f_m, fill=(150, 150, 160), anchor='mm')
    return im


def draw(t):
    lv = screen_level(t)
    if lv <= 0.001:
        return None, 0.0
    im = lock(t) if t < OPEN else review(t)
    d = ImageDraw.Draw(im)
    for tt, x, y in TAPS:
        if tt <= t < tt + 0.3:
            k = (t - tt) / 0.3; r = 10 + 14 * k; c = int(255 * (1 - k))
            d.ellipse((x - r, y - r, x + r, y + r), outline=(c, c, c), width=2)
    return np.asarray(im, np.float32) / 255.0, lv
