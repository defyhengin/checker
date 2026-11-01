import numpy as np
from callscreen import *   # reuse fonts, status, lock-screen helpers
import callscreen as _c
from PIL import Image, ImageDraw

ON = 6.0
OPEN = 9.5
PLAY0, PLAY1 = 14.0, 31.0
REC0, REC1 = 32.2, 36.0
OFF0, OFF1 = 37.0, 38.0
WAVE = np.abs(np.sin(np.arange(40) * 1.7) * 0.6 + np.sin(np.arange(40) * 0.45) * 0.4) * 0.85 + 0.15
TAPS = [(OPEN - 0.2, 150, 220), (PLAY0, 40, 128), (REC0, 268, 318), (REC1, 80, 318)]
CALL0, CALL1 = 6.0, 6.6   # one short buzz


def screen_level(t):
    if t < ON:
        return 0.0
    return 1.0 - 0.75 * ss(OFF0, OFF0 + 0.3, t) - 0.25 * ss(OFF1 - 0.2, OFF1, t)


def lock(t):
    a = np.linspace(0, 1, PH)[:, None, None]
    g = (np.array([16, 22, 40]) * (1 - a) + np.array([6, 6, 10]) * a) * np.ones((1, PW, 1))
    im = Image.fromarray(g.astype(np.uint8)); d = ImageDraw.Draw(im)
    d.text((16, 8), "02:47", font=f_small, fill=(220, 220, 225))
    d.text((PW // 2, 100), "02:47", font=f_time, fill=(235, 235, 240), anchor='mm')
    d.text((PW // 2, 145), "воскресенье, 1 ноября", font=f_med, fill=(190, 190, 200), anchor='mm')
    _c.card(d, 200, "Сообщения · Мама", "Голосовое сообщение · 0:17", ss(ON, ON + 0.35, t))
    return im


def chat(t):
    im = Image.new('RGB', (PW, PH), (16, 16, 20)); d = ImageDraw.Draw(im)
    d.text((16, 8), "02:47", font=f_small, fill=(220, 220, 225))
    d.rectangle((0, 28, PW, 76), fill=(28, 28, 34))
    d.text((24, 52), "‹", font=f_big, fill=(120, 160, 230), anchor='lm')
    d.ellipse((50, 36, 82, 68), fill=(120, 110, 160)); d.text((66, 52), "М", font=f_medb, fill=(255, 255, 255), anchor='mm')
    d.text((92, 42), "Мама", font=f_medb, fill=(240, 240, 245))
    d.text((92, 62), "была в сети 2 мин назад", font=f_small, fill=(150, 150, 160))
    # earlier messages
    d.rounded_rectangle((PW - 168, 92, PW - 12, 124), radius=12, fill=(40, 92, 170))
    d.text((PW - 156, 108), "Да, всё хорошо", font=f_med, fill=(255, 255, 255), anchor='lm')
    d.text((PW / 2, 140), "Сегодня", font=f_small, fill=(130, 130, 140), anchor='mm')
    # voice bubble
    y0 = 156
    d.rounded_rectangle((12, y0, 262, y0 + 60), radius=14, fill=(48, 50, 58))
    playing = PLAY0 <= t < PLAY1
    prog = ss(PLAY0, PLAY1, t) if t >= PLAY0 else 0.0
    prog = (t - PLAY0) / (PLAY1 - PLAY0) if playing else (1.0 if t >= PLAY1 else 0.0)
    d.ellipse((22, y0 + 12, 58, y0 + 48), fill=(120, 160, 230))
    if playing:
        d.rectangle((33, y0 + 21, 38, y0 + 39), fill=(20, 20, 25)); d.rectangle((43, y0 + 21, 48, y0 + 39), fill=(20, 20, 25))
    else:
        d.polygon([(35, y0 + 20), (35, y0 + 40), (50, y0 + 30)], fill=(20, 20, 25))
    for i, h in enumerate(WAVE):
        x = 70 + i * 4.4
        hh = 3 + h * 18
        col = (200, 215, 245) if i / len(WAVE) < prog else (110, 112, 125)
        d.rectangle((x, y0 + 28 - hh / 2, x + 2.4, y0 + 28 + hh / 2), fill=col)
    secs = int(round(17 * prog)) if (playing or t >= PLAY1) else 17
    lab = f"0:{secs:02d}" if playing else "0:17"
    d.text((70, y0 + 50), lab, font=f_small, fill=(150, 150, 160), anchor='lm')
    d.text((250, y0 + 50), "02:46", font=f_small, fill=(150, 150, 160), anchor='rm')
    if t < PLAY0:
        d.ellipse((268, y0 + 4, 276, y0 + 12), fill=(120, 160, 230))
    # input / recording
    if REC0 <= t < REC1:
        d.rounded_rectangle((10, 300, PW - 52, 336), radius=18, fill=(36, 36, 44))
        if int(t * 2.5) % 2 == 0:
            d.ellipse((22, 312, 34, 324), fill=(220, 50, 50))
        rs = int(t - REC0)
        d.text((44, 318), f"0:{rs:02d}", font=f_msg, fill=(240, 240, 245), anchor='lm')
        d.text((PW - 70, 318), "‹ Отмена", font=f_med, fill=(150, 150, 160), anchor='rm')
        r = 22 + 3 * np.sin(t * 8)
        d.ellipse((PW - 28 - r, 318 - r, PW - 28 + r, 318 + r), fill=(220, 50, 50))
    else:
        d.rounded_rectangle((10, 300, PW - 52, 336), radius=18, fill=(36, 36, 44))
        d.text((24, 318), "Сообщение", font=f_msg, fill=(110, 110, 120), anchor='lm')
        d.ellipse((PW - 46, 300, PW - 10, 336), fill=(50, 50, 58))
        d.rounded_rectangle((PW - 32, 307, PW - 24, 322), radius=4, fill=(220, 220, 225))
        d.line((PW - 28, 324, PW - 28, 330), fill=(220, 220, 225), width=2)
    d.rectangle((0, 350, PW, PH), fill=(16, 16, 20))
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
    im = lock(t) if t < OPEN else chat(t)
    taps(ImageDraw.Draw(im), t)
    return np.asarray(im, np.float32) / 255.0, lv
