"""Честный пиксель-арт: кадр 180x320, палитра 20 цветов, без сглаживания, увеличение x6."""
from PIL import Image, ImageDraw, ImageFont
import random, math

W, H, S = 180, 320, 6
P = {  # палитра
    'sky0': (11, 14, 40), 'sky1': (22, 30, 66), 'sky2': (38, 50, 92),
    'star': (220, 228, 255), 'moon': (232, 236, 220), 'moonS': (170, 178, 190),
    'tree0': (20, 30, 62), 'tree1': (13, 19, 42), 'ink': (6, 8, 18),
    'water0': (20, 32, 70), 'water1': (10, 16, 38), 'shine': (120, 140, 190),
    'pad': (34, 84, 76), 'padD': (20, 52, 48), 'moss': (46, 96, 80), 'mossD': (28, 62, 54),
    'fur': (110, 96, 122), 'furD': (72, 62, 84), 'furL': (160, 146, 170), 'ear': (206, 142, 160),
    'eye': (255, 200, 107), 'eyeD': (200, 130, 50), 'pupil': (8, 6, 10), 'white': (245, 245, 235),
    'frog': (80, 140, 74), 'frogD': (46, 92, 44), 'sac': (214, 227, 168),
    'glow': (255, 214, 140), 'lamp': (255, 200, 116), 'cat': (40, 26, 18), 'mouth': (26, 10, 18),
}
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


def frame(close=False, jaw=0.0, sac=0.0, sub=None):
    im = Image.new('RGB', (W, H)); px = im.load(); d = ImageDraw.Draw(im)
    hy = 150
    # небо с упорядоченным дизерингом
    for y in range(hy):
        for x in range(W):
            v = y / hy * 2 + BAYER[y % 4][x % 4] / 16 - 0.5
            px[x, y] = P['sky0'] if v < 0.5 else P['sky1'] if v < 1.4 else P['sky2']
    rnd = random.Random(3)
    for _ in range(40):
        x, y = rnd.randrange(W), rnd.randrange(hy - 30); px[x, y] = P['star']
    if not close:
        d.ellipse([128, 20, 150, 42], fill=P['moon']); d.point([(134, 27), (135, 27), (142, 34), (141, 35)], fill=P['moonS'])
    # ели (ступенчатые)
    def spruce(x, base, h, col):
        for i in range(h):
            w = int((i / h) * h * 0.32) + (1 if (i % 6) > 3 else 0)
            d.line([x - w, base - h + i, x + w, base - h + i], fill=col)
    for i in range(14): spruce(rnd.randrange(-5, W + 5), hy, rnd.randrange(34, 56), P['tree0'])
    for i in range(12): spruce(rnd.randrange(-5, W + 5), hy + 2, rnd.randrange(24, 40), P['tree1'])
    # будка с окном (Морзе)
    if not close:
        d.polygon([(22, hy), (22, hy - 10), (30, hy - 17), (38, hy - 10), (38, hy)], fill=P['ink'])
        d.rectangle([29, hy - 9, 31, hy - 7], fill=P['lamp'])
    # вода
    for y in range(hy, H):
        for x in range(W):
            v = (y - hy) / (H - hy) * 2 + BAYER[y % 4][x % 4] / 16 - 0.5
            px[x, y] = P['water0'] if v < 0.9 else P['water1']
    if not close:
        for i in range(8):
            y = hy + 4 + i * 5; w = 10 - i
            d.line([139 - w, y, 139 + w, y], fill=P['shine'])
    # камыши
    for i in range(12):
        x = rnd.randrange(W); h = rnd.randrange(10, 24)
        d.line([x, hy + 2, x, hy + 2 - h], fill=P['ink'])
    sc = 2.4 if close else 1.0
    cx, gy = (90, 230) if close else (115, 196)
    if not close:
        # кувшинки и лягушка
        for (x, y, rx, ry) in [(48, 205, 22, 5), (20, 235, 16, 4), (150, 228, 14, 4), (80, 262, 26, 6)]:
            d.ellipse([x - rx, y - ry, x + rx, y + ry], fill=P['pad'], outline=P['padD'])
        fx, fy = 48, 201
        d.ellipse([fx - 7, fy - 5, fx + 7, fy + 3], fill=P['frog'], outline=P['frogD'])
        d.rectangle([fx - 5, fy - 8, fx - 3, fy - 6], fill=P['frog']); d.rectangle([fx + 3, fy - 8, fx + 5, fy - 6], fill=P['frog'])
        d.point([(fx - 4, fy - 7), (fx + 4, fy - 7)], fill=P['pupil'])
    # кочка
    d.ellipse([cx - 34 * sc, gy - 4 * sc, cx + 34 * sc, gy + 14 * sc], fill=P['moss'], outline=P['mossD'])
    for i in range(int(20 * sc)):
        x = cx + rnd.uniform(-28, 28) * sc; y = gy + rnd.uniform(0, 8) * sc
        px[int(x), int(min(H - 1, y))] = P['mossD']
    # --- подражатель ---
    def E(x0, y0, x1, y1, f, o=P['ink']):
        d.ellipse([cx + x0 * sc, gy + y0 * sc, cx + x1 * sc, gy + y1 * sc], fill=f, outline=o)
    d.line([cx + 6 * sc, gy + 1 * sc, cx + 22 * sc, gy + 2 * sc, cx + 28 * sc, gy - 8 * sc], fill=P['furD'], width=max(1, int(2 * sc)))
    E(-10, -24, 10, 0, P['fur'])                          # тело
    E(-6, -18, 6, -2, P['furL'], None)                    # брюшко
    for s in (-1, 1):                                     # уши
        E(s * 12 - 6, -44, s * 12 + 6, -30, P['fur'])
        E(s * 12 - 3, -41, s * 12 + 3, -33, P['ear'], None)
    E(-13, -42, 13, -20, P['fur'])                        # голова
    if sac > 0:
        E(-6 * sac, -22, 6 * sac, -14, P['sac'])
    for s in (-1, 1):                                     # глаза
        E(s * 6 - 5, -38, s * 6 + 5, -28, P['eye'], P['eyeD'])
        if jaw < 0.5:
            E(s * 6 - 2 - 1.5, -35, s * 6 + 2 - 1.5, -31, P['pupil'], None)
            px[int(cx + (s * 6 - 3) * sc), int(gy - 35 * sc)] = P['white']
    # рот
    if jaw > 0:
        mw, mh = 4 + 9 * jaw, 2 + 16 * jaw
        top = -26
        d.ellipse([cx - mw * sc, gy + top * sc, cx + mw * sc, gy + (top + mh) * sc], fill=P['mouth'], outline=P['ink'])
        n = 14
        for i in range(n):  # зубки
            a = 2 * math.pi * i / n
            x = cx + math.cos(a) * mw * sc * 0.85; y = gy + (top + mh / 2) * sc + math.sin(a) * mh / 2 * sc * 0.85
            d.rectangle([x - 1, y - 1, x, y + 1], fill=P['white'])
    else:
        d.line([cx - 2 * sc, gy - 24 * sc, cx + 2 * sc, gy - 24 * sc], fill=P['mouth'])
    # светлячки с «пиксельным» ореолом
    if not close:
        for (x, y) in [(70, 120), (100, 140), (160, 170), (30, 165), (130, 110)]:
            for r, c in [(3, P['tree0']), (2, P['eyeD']), (1, P['glow'])]:
                d.rectangle([x - r // 2, y - r // 2, x + r // 2, y + r // 2], fill=c)
            px[x, y] = P['white']
    # субтитр пиксельным шрифтом
    if sub:
        f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 9)
        d.fontmode = '1'
        y = 62
        for line in sub.split('\n'):
            w = d.textlength(line, font=f)
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                d.text(((W - w) / 2 + dx, y + dy), line, font=f, fill=P['ink'])
            d.text(((W - w) / 2, y), line, font=f, fill=P['white'])
            y += 12
    return im.resize((W * S, H * S), Image.NEAREST)


a = frame(sub='Это подражатель. Он\nповторяет всё, что слышит.')
b = frame(sac=1.0, sub='Кваканье лягушки.')
c = frame(close=True, jaw=1.0, sub='Даже этот.')
for name, im in [('px_wide.png', a), ('px_frog.png', b), ('px_jaw.png', c)]:
    im.save('/tmp/px/' + name)
sheet = Image.new('RGB', (W * 3 * 2, H * 2))
for i, im in enumerate([a, b, c]):
    sheet.paste(im.resize((W * 2, H * 2), Image.NEAREST), (i * W * 2, 0))
sheet.save('/tmp/px/pixelart_compare.png')
print('ok')
