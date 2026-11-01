import numpy as np
from PIL import Image, ImageDraw, ImageFont
from balscreen import PW, PH, f_h, f_m, f_s, f_btn, ss

ON = 0.8
STOP = 4.6
OFF0, OFF1 = STOP + 0.4, STOP + 1.0
CALL0, CALL1 = ON, STOP          # vibrate while ringing
TAPS = [(STOP, 150, 470)]
f_big = ImageFont.truetype('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf', 76)


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def draw(t):
    lv = screen_level(t)
    if lv <= 0.001:
        return None, 0.0
    a = np.linspace(0, 1, PH)[:, None, None]
    g = (np.array([60, 40, 50]) * (1 - a) + np.array([14, 12, 20]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im)
    d.text((PW // 2, 70), "Будильник", font=f_m, fill=(220, 210, 215), anchor='mm')
    pulse = 1.0 + 0.04 * np.sin(t * 9)
    d.text((PW // 2, 160), "06:40", font=f_big, fill=(250, 245, 245), anchor='mm')
    d.text((PW // 2, 214), "Встать. Работа.", font=f_m, fill=(200, 190, 195), anchor='mm')
    r = int(44 * pulse)
    d.ellipse((PW // 2 - r, 470 - r, PW // 2 + r, 470 + r), fill=(235, 90, 70))
    d.text((PW // 2, 470), "Стоп", font=f_btn, fill=(255, 255, 255), anchor='mm')
    d.rounded_rectangle((70, 370, PW - 70, 404), radius=17, fill=(70, 60, 70))
    d.text((PW // 2, 387), "Отложить на 5 мин", font=f_s, fill=(220, 210, 215), anchor='mm')
    for tt, x, y in TAPS:
        if tt <= t < tt + 0.3:
            k = (t - tt) / 0.3; rr = 10 + 14 * k; c = int(255 * (1 - k))
            d.ellipse((x - rr, y - rr, x + rr, y + rr), outline=(c, c, c), width=2)
    return np.asarray(im, np.float32) / 255.0, lv
