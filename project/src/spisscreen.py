import numpy as np
from PIL import Image, ImageDraw
from balscreen import PW, PH, f_bal, f_h, f_m, f_mb, f_s, f_btn, f_time, BG, CARD, ss
import callscreen as _c

ON = 4.5
SUBS = 9.2
ASK = 14.0
CANCEL = 16.6
BANK = 21.2
OFF0, OFF1 = 27.5, 28.5
TAPS = [(SUBS - 0.2, 150, 230), (ASK, 150, 300), (CANCEL, 210, 352), (BANK - 0.2, 24, 52)]
CALL0, CALL1 = ON, ON + 0.6


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def status(d):
    d.text((16, 8), "03:12", font=f_s, fill=(220, 220, 225))
    d.rectangle((PW - 40, 10, PW - 18, 20), outline=(220, 220, 225), width=1)
    d.rectangle((PW - 38, 12, PW - 35, 18), fill=(220, 60, 60))


def lock(t):
    a = np.linspace(0, 1, PH)[:, None, None]
    g = (np.array([16, 22, 40]) * (1 - a) + np.array([6, 6, 10]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im); status(d)
    d.text((PW // 2, 100), "03:12", font=f_time, fill=(235, 235, 240), anchor='mm')
    d.text((PW // 2, 145), "воскресенье, 1 ноября", font=f_m, fill=(190, 190, 200), anchor='mm')
    _c.card(d, 200, "Банк", "Списание −299 ₽ · Подписка «Музыка+». Баланс: 12 ₽", ss(ON, ON + 0.35, t))
    return im


def subs(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((24, 52), "‹", font=f_h, fill=(120, 160, 230), anchor='lm')
    d.text((44, 40), "Подписки", font=f_h, fill=(240, 240, 245))
    cancelled = t >= CANCEL + 0.2
    d.rounded_rectangle((16, 90, PW - 16, 250), radius=16, fill=CARD)
    d.rounded_rectangle((30, 106, 74, 150), radius=10, fill=(200, 70, 120))
    d.polygon([(46, 116), (46, 140), (64, 128)], fill=(255, 255, 255))
    d.text((88, 108), "Музыка+", font=f_mb, fill=(240, 240, 245))
    d.text((88, 130), "299 ₽ в месяц", font=f_m, fill=(160, 160, 170))
    if not cancelled:
        d.text((30, 170), "Продлена сегодня", font=f_m, fill=(110, 200, 130))
        d.text((30, 192), "Следующее списание: 1 декабря", font=f_s, fill=(140, 140, 150))
        d.rounded_rectangle((30, 284, PW - 30, 318), radius=12, fill=(44, 46, 56))
        d.text((PW // 2, 301), "Отменить подписку", font=f_mb, fill=(230, 80, 80), anchor='mm')
    else:
        d.text((30, 170), "Подписка отменена", font=f_m, fill=(200, 200, 205))
        d.text((30, 192), "Доступ сохранится до 30 ноября", font=f_s, fill=(140, 140, 150))
        d.text((30, 212), "Списанные 299 ₽ не возвращаются", font=f_s, fill=(140, 140, 150))
    if ASK + 0.15 <= t < CANCEL + 0.2:
        k = ss(ASK + 0.15, ASK + 0.4, t)
        ov = Image.new('RGB', (PW, PH), (0, 0, 0))
        im = Image.blend(im, ov, 0.55 * k); d = ImageDraw.Draw(im)
        y0 = int(PH - 250 * k)
        d.rounded_rectangle((8, y0, PW - 8, y0 + 240), radius=18, fill=(34, 36, 44))
        d.text((PW // 2, y0 + 34), "Отменить подписку?", font=f_h, fill=(240, 240, 245), anchor='mm')
        d.text((PW // 2, y0 + 70), "Музыка, которую вы сохранили,", font=f_m, fill=(170, 170, 180), anchor='mm')
        d.text((PW // 2, y0 + 90), "станет недоступна", font=f_m, fill=(170, 170, 180), anchor='mm')
        d.rounded_rectangle((24, y0 + 120, PW // 2 - 6, y0 + 160), radius=12, fill=(60, 62, 74))
        d.text(((24 + PW // 2 - 6) // 2, y0 + 140), "Оставить", font=f_mb, fill=(240, 240, 245), anchor='mm')
        d.rounded_rectangle((PW // 2 + 6, y0 + 120, PW - 24, y0 + 160), radius=12, fill=(160, 45, 45))
        d.text(((PW // 2 + 6 + PW - 24) // 2, y0 + 140), "Отменить", font=f_mb, fill=(255, 255, 255), anchor='mm')
    return im


def bank(t):
    im = Image.new('RGB', (PW, PH), BG); d = ImageDraw.Draw(im); status(d)
    d.text((20, 40), "Главная", font=f_h, fill=(240, 240, 245))
    d.ellipse((PW - 50, 38, PW - 20, 68), fill=(60, 62, 75))
    d.rounded_rectangle((16, 86, PW - 16, 226), radius=18, fill=(36, 40, 62))
    d.text((32, 104), "Дебетовая карта", font=f_m, fill=(180, 185, 205))
    d.text((PW - 32, 104), "•• 4417", font=f_m, fill=(180, 185, 205), anchor='ra')
    d.text((32, 182), "12 ₽", font=f_bal, fill=(255, 255, 255), anchor='ls')
    d.text((32, 206), "Доступно", font=f_s, fill=(150, 155, 175))
    d.text((20, 252), "Последние операции", font=f_mb, fill=(230, 230, 235))
    ops = [("Музыка+", "сегодня", "−299 ₽"), ("Магазин у дома", "вчера", "−52 ₽"), ("Связь", "30 октября", "−450 ₽"),
           ("Метро", "28 октября", "−62 ₽"), ("Аренда", "25 октября", "−18 000 ₽")]
    for i, (n, dt, s) in enumerate(ops):
        y = 284 + i * 52
        d.ellipse((20, y, 56, y + 36), fill=(44, 46, 56))
        d.text((38, y + 18), n[0], font=f_mb, fill=(200, 200, 210), anchor='mm')
        d.text((68, y + 2), n, font=f_m, fill=(235, 235, 240))
        d.text((68, y + 21), dt, font=f_s, fill=(140, 140, 150))
        d.text((PW - 20, y + 9), s, font=f_mb, fill=(235, 235, 240), anchor='ra')
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
    im = lock(t) if t < SUBS else (subs(t) if t < BANK else bank(t))
    taps(ImageDraw.Draw(im), t)
    return np.asarray(im, np.float32) / 255.0, lv
