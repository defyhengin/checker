import subprocess, sys, os
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1280, 720
FPS = 30
DUR = 28.0
F = '/usr/share/fonts/opentype/inter/Inter-'
FT = ImageFont.truetype(F + 'Bold.otf', 26)
FI = ImageFont.truetype(F + 'Regular.otf', 19)
FIB = ImageFont.truetype(F + 'Bold.otf', 19)
FTOT = ImageFont.truetype(F + 'Bold.otf', 30)
FS = ImageFont.truetype(F + 'Bold.otf', 14)
PW, PH = 300, 560
ITEMS = [("Макароны, 450 г", 149, 4.0), ("Сервисный сбор", 99, 9.0), ("Доставка", 299, 10.4),
         ("Упаковка", 49, 11.8), ("Повышенный спрос", 154, 13.2), ("Чаевые курьеру", 149, 14.6)]
rng = np.random.default_rng(4)


def ss(a, b, x):
    x = min(max((x - a) / (b - a), 0.0), 1.0); return x * x * (3 - 2 * x)


def total(t):
    s = 0.0
    for _, p, at in ITEMS:
        s += p * ss(at, at + 0.5, t)
    return int(round(s))


def screen_on(t):
    v = ss(0.5, 0.8, t) * (1 - ss(25.4, 26.3, t))
    if 24.3 < t < 25.4 and int(t * 6) % 2 == 0:
        v *= 0.85
    return v


def draw_screen(t):
    im = Image.new('RGB', (PW, PH), (245, 245, 247))
    d = ImageDraw.Draw(im)
    d.text((16, 10), "21:47", font=FS, fill=(30, 30, 30))
    bat_red = t > 20 and int(t * 2) % 2 == 0
    d.rectangle((PW - 52, 11, PW - 22, 24), outline=(30, 30, 30), width=2)
    d.rectangle((PW - 50, 13, PW - 47, 22), fill=(220, 40, 40))
    d.text((PW - 82, 10), "1%", font=FS, fill=(220, 40, 40) if bat_red or t <= 20 else (30, 30, 30))
    d.text((18, 44), "Корзина", font=FT, fill=(20, 20, 20))
    y = 96
    for name, p, at in ITEMS:
        a = ss(at, at + 0.35, t)
        if a <= 0:
            continue
        off = int((1 - a) * 18)
        col = tuple(int(245 + (c - 245) * a) for c in (35, 35, 40))
        red = tuple(int(245 + (c - 245) * a) for c in (200, 40, 40))
        d.text((20 + off, y), name, font=FI, fill=col)
        d.text((PW - 20 + off, y), f"{p} ₽", font=FIB, fill=red if p != 149 or name.startswith("Чаевые") else col, anchor='ra')
        d.line((20, y + 34, PW - 20, y + 34), fill=(225, 225, 228), width=1)
        y += 46
    d.line((20, 400, PW - 20, 400), fill=(200, 200, 205), width=2)
    d.text((20, 414), "Итого", font=FTOT, fill=(20, 20, 20))
    d.text((PW - 20, 414), f"{total(t)} ₽", font=FTOT, fill=(20, 20, 20), anchor='ra')
    d.rounded_rectangle((20, 480, PW - 20, 530), radius=14, fill=(40, 170, 90))
    d.text((PW // 2, 505), f"Оплатить {total(t)} ₽", font=FIB, fill=(255, 255, 255), anchor='mm')
    return im


def frame(t, base_bg):
    on = screen_on(t)
    scr = draw_screen(t)
    scr = Image.blend(Image.new('RGB', (PW, PH), (8, 8, 10)), scr, on)
    ph = Image.new('RGB', (PW + 24, PH + 24), (14, 14, 16))
    mask = Image.new('L', ph.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, ph.size[0] - 1, ph.size[1] - 1), radius=34, fill=255)
    ph.paste(scr, (12, 12))
    zoom = 1.0 + 0.09 * ss(0.0, DUR, t)
    sw = int(ph.size[0] * zoom); sh = int(ph.size[1] * zoom)
    phz = ph.resize((sw, sh), Image.BILINEAR); mz = mask.resize((sw, sh), Image.BILINEAR)
    bg = base_bg.copy()
    glow = Image.new('L', (W, H), 0)
    cx = W // 2 + int(6 * np.sin(t * 0.5)); cy = 330 + int(4 * np.sin(t * 0.7))
    ImageDraw.Draw(glow).ellipse((cx - sw, cy - sh * 0.8, cx + sw, cy + sh * 0.8), fill=int(70 * on))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    bg = Image.composite(Image.new('RGB', (W, H), (120, 140, 170)), bg, glow)
    bg.paste(phz, (cx - sw // 2, cy - sh // 2), mz)
    a = np.asarray(bg, np.float32) / 255
    a = a + rng.normal(0, 0.012, (H, W, 1))
    a *= min(1.0, t / 0.4)
    return (np.clip(a, 0, 1) * 255).astype(np.uint8)


def main(out):
    yy, xx = np.mgrid[0:H, 0:W]
    v = np.clip(1 - 0.6 * (((xx - W / 2) / (W / 2)) ** 2 * 0.5 + ((yy - H / 2) / (H / 2)) ** 2), 0, 1)
    base = Image.fromarray((np.stack([v * 10, v * 9, v * 9], -1)).astype(np.uint8))
    if len(sys.argv) > 2:
        for tt in sys.argv[2:]:
            Image.fromarray(frame(float(tt), base)).save(f'phone_prev_{tt}.png')
        return
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                          '-r', str(FPS), '-i', '-', '-vf', 'format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast',
                          '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), out + '.tmp.mp4'], stdin=subprocess.PIPE)
    for fi in range(int(DUR * FPS)):
        p.stdin.write(frame(fi / FPS, base).tobytes())
    p.stdin.close()
    if p.wait() == 0:
        os.rename(out + '.tmp.mp4', out); print('done phone')


if __name__ == "__main__":
    main(sys.argv[1])
