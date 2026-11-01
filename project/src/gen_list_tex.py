"""Textures for «Список покупок»: the shopping list on the fridge (plain and with a tick next to «корм»), cat-food pack label."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np
F = '/usr/share/fonts/opentype/inter/'
HAND = ImageFont.truetype(F + 'InterDisplay-MediumItalic.otf', 70)
HEAD = ImageFont.truetype(F + 'InterDisplay-MediumItalic.otf', 78)
W, H = 520, 680


def note(tick):
    im = Image.new('RGB', (W, H), (246, 240, 214)); d = ImageDraw.Draw(im)
    for y in range(150, H, 105):
        d.line([(20, y + 72), (W - 20, y + 72)], fill=(196, 206, 226), width=2)
    ink = (38, 58, 120)
    d.text((40, 30), 'Купить:', font=HEAD, fill=ink)
    for i, w in enumerate(['хлеб', 'молоко', 'яйца', 'корм']):
        d.text((70, 160 + i * 105), '— ' + w, font=HAND, fill=ink)
    if tick:
        y = 160 + 3 * 105 + 40; x = 360
        d.line([(x, y), (x + 30, y + 34), (x + 95, y - 50)], fill=(40, 140, 70), width=13, joint='curve')
    im = im.filter(ImageFilter.GaussianBlur(0.5))
    im.save('note_list_ok.png' if tick else 'note_list.png')


note(False); note(True)

# cat food pack front
im = Image.new('RGB', (400, 560), (230, 120, 40)); d = ImageDraw.Draw(im)
d.rectangle([0, 360, 400, 560], fill=(250, 220, 150))
d.ellipse([110, 380, 290, 540], fill=(240, 150, 60))
d.text((200, 120), 'КОРМ', font=ImageFont.truetype(F + 'Inter-Black.otf', 100), fill=(255, 255, 255), anchor='mm')
d.text((200, 220), 'для кошек', font=ImageFont.truetype(F + 'Inter-Bold.otf', 44), fill=(255, 240, 220), anchor='mm')
d.text((200, 300), 'с курицей', font=ImageFont.truetype(F + 'Inter-Regular.otf', 36), fill=(255, 240, 220), anchor='mm')
im.save('korm.png')
print('ok')
