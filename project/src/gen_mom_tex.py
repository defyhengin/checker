"""Phone screens for «Мама прислала фото»: lock screen with the notification, the chat with the photo + «Приезжай.», and the same with my «Еду.»
Needs ep_mom/p0.png (Mum's table). Output: phone_mom_n.png, phone_mom_1.png, phone_mom_2.png (720×1520, same layout as phone_recipe.png)."""
from PIL import Image, ImageDraw, ImageFont
W, H = 720, 1520
F = '/usr/share/fonts/opentype/inter/Inter-%s.otf'
f = lambda w, s: ImageFont.truetype(F % w, s)
BG, HEAD, BUB, MINE = (17, 19, 26), (28, 31, 40), (44, 48, 60), (52, 92, 72)
WHITE, GREY, GREEN = (240, 240, 242), (150, 154, 165), (110, 200, 120)


def rr(d, box, r, fill):
    d.rounded_rectangle(box, r, fill=fill)


def photo():
    im = Image.open('ep_mom/p0.png').convert('RGB'); w, h = im.size
    return im.crop((int(0.08 * w), int(0.14 * h), int(0.94 * w), int(1.0 * h)))      # cut the room edge at the top


def header(d):
    d.rectangle((0, 0, W, 180), fill=HEAD)
    d.ellipse((32, 50, 120, 138), fill=(126, 82, 160))
    d.text((76, 94), 'М', font=f('SemiBold', 50), fill=WHITE, anchor='mm')
    d.text((150, 84), 'Мама', font=f('SemiBold', 50), fill=WHITE, anchor='ls')
    d.text((152, 132), 'в сети', font=f('Regular', 32), fill=GREEN, anchor='ls')


def chat(reply):
    im = Image.new('RGB', (W, H), BG); d = ImageDraw.Draw(im); header(d)
    y = 230
    rr(d, (36, y, 560, y + 560), 30, BUB)
    ph = photo().resize((496, 496), Image.LANCZOS)
    m = Image.new('L', ph.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, 496, 496), 22, fill=255)
    im.paste(ph, (50, y + 14), m)
    y += 590
    rr(d, (36, y, 430, y + 120), 30, BUB)
    d.text((72, y + 74), 'Приезжай.', font=f('Regular', 46), fill=WHITE, anchor='ls')
    d.text((400, y + 100), '19:42', font=f('Regular', 26), fill=GREY, anchor='rs')
    if reply:
        y += 160
        rr(d, (400, y, 684, y + 150), 30, MINE)
        d.text((436, y + 80), 'Еду.', font=f('SemiBold', 54), fill=WHITE, anchor='ls')
        d.text((656, y + 130), '19:43 ✓✓', font=f('Regular', 26), fill=(170, 210, 180), anchor='rs')
    return im


def lock():
    im = Image.new('RGB', (W, H), (20, 24, 38)); d = ImageDraw.Draw(im)
    for yy in range(H):                                   # soft gradient wallpaper
        c = int(20 + 25 * yy / H); d.line((0, yy, W, yy), fill=(c, c + 4, c + 22))
    d.text((W / 2, 300), '19:42', font=f('SemiBold', 150), fill=WHITE, anchor='mm')
    d.text((W / 2, 410), 'вторник', font=f('Regular', 40), fill=(200, 205, 220), anchor='mm')
    rr(d, (36, 560, 684, 800), 36, (230, 232, 238))
    d.ellipse((66, 600, 146, 680), fill=(126, 82, 160))
    d.text((106, 642), 'М', font=f('SemiBold', 44), fill=WHITE, anchor='mm')
    d.text((170, 632), 'Мама', font=f('SemiBold', 44), fill=(25, 25, 30), anchor='ls')
    d.text((654, 632), 'сейчас', font=f('Regular', 30), fill=(110, 110, 120), anchor='rs')
    d.text((170, 690), 'Фото', font=f('Regular', 38), fill=(60, 60, 70), anchor='ls')
    d.text((170, 750), 'Приезжай.', font=f('Regular', 38), fill=(60, 60, 70), anchor='ls')
    return im


photo().save('ep_mom/p0c.png'); lock().save('phone_mom_n.png'); chat(False).save('phone_mom_1.png'); chat(True).save('phone_mom_2.png')
print('ok')
