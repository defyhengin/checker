import numpy as np
from PIL import Image, ImageDraw
from balscreen import PW, PH, f_bal, f_h, f_m, f_mb, f_s, f_btn, f_time, BG, CARD, ss, bread
import callscreen as _c

ON = 4.5
SHOP = 9.0
ADD = 12.5
CART = 13.9
PAY = 16.2
OFF0, OFF1 = 21.0, 22.0
TAPS = [(SHOP - 0.2, 150, 230), (ADD, 220, 352), (CART - 0.2, 150, 520), (PAY, 150, 500)]
CALL0, CALL1 = ON, ON + 0.6


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def status(d):
    d.text((16, 8), "03:40", font=f_s, fill=(220, 220, 225))
    d.rectangle((PW - 40, 10, PW - 18, 20), outline=(220, 220, 225), width=1)
    d.rectangle((PW - 38, 12, PW - 35, 18), fill=(220, 60, 60))


def banner(d, t, y):
    on = int(t * 3) % 2 == 0
    d.rounded_rectangle((16, y, PW - 16, y + 54), radius=14, fill=(230, 60, 60) if on else (240, 200, 60))
    d.text((PW // 2, y + 20), "−50% НА ВСЁ!", font=f_h, fill=(255, 255, 255) if on else (30, 30, 30), anchor='mm')
    d.text((PW // 2, y + 42), "только сегодня", font=f_s, fill=(255, 235, 235) if on else (60, 50, 20), anchor='mm')


def lock(t):
    a = np.linspace(0, 1, PH)[:, None, None]
    g = (np.array([16, 22, 40]) * (1 - a) + np.array([6, 6, 10]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im); status(d)
    d.text((PW // 2, 100), "03:40", font=f_time, fill=(235, 235, 240), anchor='mm')
    d.text((PW // 2, 145), "воскресенье, 1 ноября", font=f_m, fill=(190, 190, 200), anchor='mm')
    _c.card(d, 200, "Магазин у дома", "−50% на всё! Только сегодня. Успейте!", ss(ON, ON + 0.35, t))
    return im


def shop(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((24, 52), "‹", font=f_h, fill=(240, 200, 60), anchor='lm')
    d.text((44, 40), "Хлеб и выпечка", font=f_h, fill=(240, 240, 245))
    banner(d, t, 76)
    d.rounded_rectangle((16, 142, PW - 16, 400), radius=16, fill=CARD)
    d.rounded_rectangle((32, 158, PW - 32, 282), radius=12, fill=(44, 40, 36))
    bread(d, 80, 188, 140, 62)
    d.rounded_rectangle((36, 162, 92, 184), radius=8, fill=(230, 60, 60))
    d.text((64, 173), "−50%", font=f_mb, fill=(255, 255, 255), anchor='mm')
    d.text((32, 296), "Хлеб «Дарницкий», 700 г", font=f_mb, fill=(235, 235, 240))
    d.text((32, 318), "26 ₽", font=f_h, fill=(255, 90, 90))
    w = d.textlength("52 ₽", font=f_m)
    d.text((92, 325), "52 ₽", font=f_m, fill=(140, 140, 150))
    d.line((92, 334, 92 + w, 334), fill=(140, 140, 150), width=2)
    if t < ADD:
        d.rounded_rectangle((170, 356, PW - 32, 388), radius=12, fill=(240, 200, 60))
        d.text(((170 + PW - 32) // 2, 372), "В корзину", font=f_mb, fill=(20, 20, 20), anchor='mm')
    else:
        d.rounded_rectangle((170, 356, PW - 32, 388), radius=12, fill=(44, 46, 56))
        d.text(((170 + PW - 32) // 2, 372), "1 шт", font=f_mb, fill=(240, 240, 245), anchor='mm')
        k = ss(ADD, ADD + 0.3, t); y0 = int(PH - 70 * k)
        d.rounded_rectangle((16, y0 + 10, PW - 16, y0 + 54), radius=14, fill=(240, 200, 60))
        d.text((32, y0 + 32), "Корзина", font=f_btn, fill=(20, 20, 20), anchor='lm')
        d.text((PW - 32, y0 + 32), "26 ₽", font=f_btn, fill=(20, 20, 20), anchor='rm')
    return im


def cart(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((24, 52), "‹", font=f_h, fill=(240, 200, 60), anchor='lm')
    d.text((44, 40), "Корзина", font=f_h, fill=(240, 240, 245))
    banner(d, t, 76)
    d.rounded_rectangle((16, 144, PW - 16, 230), radius=14, fill=CARD)
    d.rounded_rectangle((28, 154, 96, 220), radius=10, fill=(44, 40, 36))
    bread(d, 34, 172, 56, 28)
    d.text((108, 158), "Хлеб", font=f_mb, fill=(235, 235, 240))
    d.text((108, 178), "Дарницкий, 700 г", font=f_s, fill=(140, 140, 150))
    d.text((PW - 28, 158), "26 ₽", font=f_mb, fill=(255, 90, 90), anchor='ra')
    w = d.textlength("52 ₽", font=f_s)
    d.text((PW - 28, 180), "52 ₽", font=f_s, fill=(140, 140, 150), anchor='ra')
    d.line((PW - 28 - w, 187, PW - 28, 187), fill=(140, 140, 150), width=1)
    d.line((16, 380, PW - 16, 380), fill=(40, 42, 50), width=1)
    d.text((20, 404), "Итого", font=f_h, fill=(240, 240, 245), anchor='lm')
    d.text((PW - 20, 404), "26 ₽", font=f_h, fill=(240, 240, 245), anchor='rm')
    d.text((20, 438), "Вы экономите 26 ₽", font=f_s, fill=(110, 200, 130), anchor='lm')
    d.text((20, 458), "На карте: 12 ₽", font=f_s, fill=(230, 90, 90), anchor='lm')
    d.rounded_rectangle((16, 478, PW - 16, 522), radius=14, fill=(52, 54, 62))
    d.text((PW // 2, 500), "Оплатить 26 ₽", font=f_btn, fill=(120, 120, 128), anchor='mm')
    if PAY + 0.1 <= t < PAY + 1.6:
        k = ss(PAY + 0.1, PAY + 0.3, t) * (1 - ss(PAY + 1.3, PAY + 1.6, t))
        y0 = int(-60 + 96 * k)
        d.rounded_rectangle((16, y0, PW - 16, y0 + 50), radius=14, fill=(150, 40, 40))
        d.text((32, y0 + 17), "Недостаточно средств", font=f_mb, fill=(255, 255, 255))
        d.text((32, y0 + 35), "Даже со скидкой", font=f_s, fill=(240, 200, 200))
    return im


def taps(d, t):
    for tt, x, y in TAPS:
        if tt <= t < tt + 0.35:
            k = (t - tt) / 0.35; r = 10 + 16 * k; c = int(255 * (1 - k))
            d.ellipse((x - r, y - r, x + r, y + r), outline=(c, c, c), width=2)


def draw(t):
    lv = screen_level(t)
    if lv <= 0.001:
        return None, 0.0
    im = lock(t) if t < SHOP else (shop(t) if t < CART else cart(t))
    taps(ImageDraw.Draw(im), t)
    return np.asarray(im, np.float32) / 255.0, lv
