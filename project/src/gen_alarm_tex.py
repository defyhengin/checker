"""Phone screens for «Будильник «Обед»»: the ringing alarm «13:00 ОБЕД», the alarm list with «ОБЕД — завтра», and a work spreadsheet for the monitor.
Output: phone_alarm1.png, phone_alarm2.png (720×1520), monitor_work.png (1200×600)."""
from PIL import Image, ImageDraw, ImageFont
W, H = 720, 1520
F = '/usr/share/fonts/opentype/inter/Inter-%s.otf'
f = lambda w, s: ImageFont.truetype(F % w, s)
WHITE, GREY = (240, 240, 242), (150, 154, 165)

# ringing
im = Image.new('RGB', (W, H), (14, 16, 22)); d = ImageDraw.Draw(im)
for yy in range(H):
    c = int(14 + 30 * (yy / H)); d.line((0, yy, W, yy), fill=(c + 20, c, c - 4 if c > 4 else 0))
d.text((W / 2, 250), 'Будильник', font=f('Regular', 40), fill=(220, 200, 190), anchor='mm')
d.text((W / 2, 470), '13:00', font=f('SemiBold', 200), fill=WHITE, anchor='mm')
d.text((W / 2, 640), 'ОБЕД', font=f('Bold', 110), fill=(255, 196, 80), anchor='mm')
for cx, txt, col in ((190, 'Отложить', (70, 74, 88)), (530, 'Стоп', (220, 80, 60))):
    d.ellipse((cx - 120, 1080, cx + 120, 1320), fill=col)
    d.text((cx, 1200), txt, font=f('SemiBold', 40), fill=WHITE, anchor='mm')
im.save('phone_alarm1.png')

# list: the alarm moved to tomorrow
im = Image.new('RGB', (W, H), (12, 13, 17)); d = ImageDraw.Draw(im)
d.text((48, 150), 'Будильники', font=f('Bold', 64), fill=WHITE, anchor='ls')


def row(y, time, label, sub, on):
    d.rounded_rectangle((32, y, 688, y + 230), 36, fill=(30, 32, 40))
    d.text((70, y + 120), time, font=f('Regular', 104), fill=WHITE if on else (110, 112, 120), anchor='ls')
    d.text((72, y + 185), label, font=f('SemiBold', 40), fill=(255, 196, 80) if on else (110, 112, 120), anchor='ls')
    d.text((72 + f('SemiBold', 40).getlength(label) + 20, y + 185), sub, font=f('Regular', 36), fill=GREY, anchor='ls')
    col = (90, 190, 110) if on else (70, 72, 80)
    d.rounded_rectangle((540, y + 85, 650, y + 145), 30, fill=col)
    kx = 620 if on else 570
    d.ellipse((kx - 26, y + 89, kx + 26, y + 141), fill=WHITE)


row(260, '7:30', 'Подъём', 'будни', True)
row(520, '13:00', 'ОБЕД', '· завтра', True)
row(780, '19:00', 'Ужин', '', False)
im.save('phone_alarm2.png')

# monitor: a dull spreadsheet
im = Image.new('RGB', (1200, 600), (245, 246, 248)); d = ImageDraw.Draw(im)
d.rectangle((0, 0, 1200, 60), fill=(32, 120, 70))
d.text((30, 42), 'Отчёт_квартал_v7_финал(2).xlsx', font=f('SemiBold', 30), fill=WHITE, anchor='ls')
for i in range(12):
    y = 90 + i * 42
    d.line((0, y, 1200, y), fill=(210, 212, 218), width=2)
    for j, x in enumerate(range(0, 1200, 200)):
        d.line((x, 60, x, 600), fill=(210, 212, 218), width=2)
        if i > 0:
            d.text((x + 14, y + 32), f'{(i * 37 + j * 113) % 9000 + 100:,}'.replace(',', ' '), font=f('Regular', 24), fill=(60, 64, 72), anchor='ls')
        else:
            d.text((x + 14, y + 32), ('Статья', 'Янв', 'Фев', 'Мар', 'Итого', 'План')[j], font=f('SemiBold', 24), fill=(30, 30, 36), anchor='ls')
im.save('monitor_work.png')
from PIL import ImageOps
ImageOps.mirror(im).save('monitor_work_m.png')      # the monitor face maps mirrored
print('ok')
