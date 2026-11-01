import numpy as np
from PIL import Image, ImageDraw, ImageFont

PW, PH = 300, 560
F = '/usr/share/fonts/opentype/inter/Inter-'
f_bal = ImageFont.truetype(F + 'Bold.otf', 52)
f_h = ImageFont.truetype(F + 'SemiBold.otf', 22)
f_m = ImageFont.truetype(F + 'Regular.otf', 15)
f_mb = ImageFont.truetype(F + 'SemiBold.otf', 15)
f_s = ImageFont.truetype(F + 'Regular.otf', 12)
f_btn = ImageFont.truetype(F + 'SemiBold.otf', 17)
f_time = ImageFont.truetype(F + 'SemiBold.otf', 58)

ON = 3.0
BANK1 = 4.6
SHOP = 10.0
ADD = 12.5
CART = 13.8
PAY = 17.0
REMOVE = 20.0
BANK2 = 23.2
OFF0, OFF1 = 29.0, 30.0
TAPS = [(4.4, 150, 420), (9.8, 40, 40), (ADD, 220, 352), (CART - 0.2, 150, 520), (PAY, 150, 500), (REMOVE, 196, 140), (BANK2 - 0.2, 24, 52)]

BG = (14, 15, 19)
CARD = (30, 32, 40)


def ss(a, b, x):
    x = min(max((x - a) / (b - a), 0.0), 1.0); return x * x * (3 - 2 * x)


def level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def status(d):
    d.text((16, 8), "21:52", font=f_s, fill=(220, 220, 225))
    d.rectangle((PW - 40, 10, PW - 18, 20), outline=(220, 220, 225), width=1)
    d.rectangle((PW - 38, 12, PW - 33, 18), fill=(220, 220, 225))


def lock(t):
    a = np.linspace(0, 1, PH)[:, None, None]
    g = (np.array([16, 22, 40]) * (1 - a) + np.array([6, 6, 10]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im); status(d)
    d.text((PW // 2, 100), "21:52", font=f_time, fill=(235, 235, 240), anchor='mm')
    d.text((PW // 2, 145), "суббота, 31 октября", font=f_m, fill=(190, 190, 200), anchor='mm')
    d.text((PW // 2, 500), "Проведите вверх, чтобы открыть", font=f_s, fill=(160, 160, 170), anchor='mm')
    return im


def bank(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((20, 40), "Главная", font=f_h, fill=(240, 240, 245))
    d.ellipse((PW - 50, 38, PW - 20, 68), fill=(60, 62, 75))
    d.rounded_rectangle((16, 86, PW - 16, 226), radius=18, fill=(36, 40, 62))
    d.text((32, 104), "Дебетовая карта", font=f_m, fill=(180, 185, 205))
    d.text((PW - 32, 104), "•• 4417", font=f_m, fill=(180, 185, 205), anchor='ra')
    d.text((32, 182), "47 ₽", font=f_bal, fill=(255, 255, 255), anchor='ls')
    d.text((32, 206), "Доступно", font=f_s, fill=(150, 155, 175))
    d.text((20, 252), "Последние операции", font=f_mb, fill=(230, 230, 235))
    ops = [("Связь", "вчера", "−450 ₽"), ("Магазин у дома", "вчера", "−189 ₽"), ("Метро", "28 октября", "−62 ₽"),
           ("Аренда", "25 октября", "−18 000 ₽"), ("Зарплата", "25 октября", "+19 500 ₽")]
    for i, (n, dt, s) in enumerate(ops):
        y = 284 + i * 52
        d.ellipse((20, y, 56, y + 36), fill=(44, 46, 56))
        d.text((38, y + 18), n[0], font=f_mb, fill=(200, 200, 210), anchor='mm')
        d.text((68, y + 2), n, font=f_m, fill=(235, 235, 240))
        d.text((68, y + 21), dt, font=f_s, fill=(140, 140, 150))
        d.text((PW - 20, y + 9), s, font=f_mb, fill=(110, 200, 130) if s.startswith('+') else (235, 235, 240), anchor='ra')
    return im


def bread(d, x, y, w, h):
    d.rounded_rectangle((x, y, x + w, y + h), radius=int(h * 0.35), fill=(150, 95, 50))
    d.rounded_rectangle((x + 4, y + 3, x + w - 4, y + h * 0.55), radius=int(h * 0.3), fill=(175, 115, 62))
    for k in range(3):
        cx = x + w * (0.3 + 0.2 * k)
        d.line([(cx - 4, y + 6), (cx + 4, y + h * 0.4)], fill=(120, 72, 35), width=2)


def shop(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((24, 52), "‹", font=f_h, fill=(240, 200, 60), anchor='lm')
    d.text((44, 40), "Хлеб и выпечка", font=f_h, fill=(240, 240, 245))
    d.rounded_rectangle((16, 80, PW - 16, 112), radius=12, fill=(30, 32, 40))
    d.text((32, 96), "Поиск", font=f_m, fill=(120, 120, 130), anchor='lm')
    d.rounded_rectangle((16, 128, PW - 16, 380), radius=16, fill=CARD)
    d.rounded_rectangle((32, 144, PW - 32, 270), radius=12, fill=(44, 40, 36))
    bread(d, 80, 175, 140, 62)
    d.text((32, 284), "Хлеб «Дарницкий», 700 г", font=f_mb, fill=(235, 235, 240))
    d.text((32, 306), "52 ₽", font=f_h, fill=(255, 255, 255))
    added = t >= ADD
    if not added:
        d.rounded_rectangle((170, 336, PW - 32, 368), radius=12, fill=(240, 200, 60))
        d.text(((170 + PW - 32) // 2, 352), "В корзину", font=f_mb, fill=(20, 20, 20), anchor='mm')
    else:
        d.rounded_rectangle((170, 336, PW - 32, 368), radius=12, fill=(44, 46, 56))
        d.text((186, 352), "−", font=f_btn, fill=(240, 240, 245), anchor='mm')
        d.text(((170 + PW - 32) // 2, 352), "1", font=f_mb, fill=(240, 240, 245), anchor='mm')
        d.text((PW - 48, 352), "+", font=f_btn, fill=(240, 240, 245), anchor='mm')
        k = ss(ADD, ADD + 0.3, t)
        y0 = int(PH - 70 * k)
        d.rounded_rectangle((16, y0 + 10, PW - 16, y0 + 54), radius=14, fill=(240, 200, 60))
        d.text((32, y0 + 32), "Корзина", font=f_btn, fill=(20, 20, 20), anchor='lm')
        d.text((PW - 32, y0 + 32), "52 ₽", font=f_btn, fill=(20, 20, 20), anchor='rm')
    return im


def cart(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((24, 52), "‹", font=f_h, fill=(240, 200, 60), anchor='lm')
    d.text((44, 40), "Корзина", font=f_h, fill=(240, 240, 245))
    removed = t >= REMOVE + 0.15
    if not removed:
        d.rounded_rectangle((16, 90, PW - 16, 190), radius=14, fill=CARD)
        d.rounded_rectangle((28, 102, 104, 178), radius=10, fill=(44, 40, 36))
        bread(d, 36, 124, 60, 30)
        d.text((116, 104), "Хлеб", font=f_mb, fill=(235, 235, 240))
        d.text((116, 124), "Дарницкий, 700 г", font=f_s, fill=(140, 140, 150))
        d.rounded_rectangle((116, 146, 228, 176), radius=10, fill=(44, 46, 56))
        d.text((136, 161), "−", font=f_btn, fill=(240, 240, 245), anchor='mm')
        d.text((172, 161), "1", font=f_mb, fill=(240, 240, 245), anchor='mm')
        d.text((208, 161), "+", font=f_btn, fill=(240, 240, 245), anchor='mm')
        d.text((PW - 28, 104), "52 ₽", font=f_mb, fill=(240, 240, 245), anchor='ra')
        d.line((16, 420, PW - 16, 420), fill=(40, 42, 50), width=1)
        d.text((20, 446), "Итого", font=f_h, fill=(240, 240, 245), anchor='lm')
        d.text((PW - 20, 446), "52 ₽", font=f_h, fill=(240, 240, 245), anchor='rm')
        d.rounded_rectangle((16, 478, PW - 16, 522), radius=14, fill=(240, 200, 60))
        d.text((PW // 2, 500), "Оплатить 52 ₽", font=f_btn, fill=(20, 20, 20), anchor='mm')
        if PAY + 0.2 <= t < REMOVE - 0.4:
            k = ss(PAY + 0.2, PAY + 0.45, t) * (1 - ss(REMOVE - 0.8, REMOVE - 0.4, t))
            y0 = int(-60 + 96 * k)
            d.rounded_rectangle((16, y0, PW - 16, y0 + 50), radius=14, fill=(150, 40, 40))
            d.text((32, y0 + 17), "Недостаточно средств", font=f_mb, fill=(255, 255, 255))
            d.text((32, y0 + 35), "На карте 47 ₽", font=f_s, fill=(240, 200, 200))
    else:
        d.ellipse((PW // 2 - 40, 170, PW // 2 + 40, 250), outline=(70, 72, 82), width=3)
        d.line((PW // 2 - 18, 210, PW // 2 + 18, 210), fill=(70, 72, 82), width=3)
        d.text((PW // 2, 290), "В корзине пусто", font=f_h, fill=(220, 220, 225), anchor='mm')
        d.text((PW // 2, 318), "Добавьте товары из каталога", font=f_m, fill=(140, 140, 150), anchor='mm')
        d.rounded_rectangle((16, 478, PW - 16, 522), radius=14, fill=(44, 46, 56))
        d.text((PW // 2, 500), "Перейти в каталог", font=f_btn, fill=(200, 200, 205), anchor='mm')
    return im


def taps(d, t):
    for tt, x, y in TAPS:
        if tt <= t < tt + 0.35:
            k = (t - tt) / 0.35
            r = 10 + 16 * k
            c = int(255 * (1 - k))
            d.ellipse((x - r, y - r, x + r, y + r), outline=(c, c, c), width=2)


def draw(t):
    lv = level(t)
    if lv <= 0.001:
        return None, 0.0
    if t < BANK1:
        im = lock(t)
    elif t < SHOP:
        im = bank(t)
    elif t < CART:
        im = shop(t)
    elif t < BANK2:
        im = cart(t)
    else:
        im = bank(t)
    taps(ImageDraw.Draw(im), t)
    return np.asarray(im, np.float32) / 255.0, lv
