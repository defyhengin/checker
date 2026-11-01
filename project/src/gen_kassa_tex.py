"""Textures for the «Касса» episode: shelf price tags, promo wobbler, register screen."""
import os
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__)); SH = os.path.join(HERE, 'shop') if os.path.isdir(os.path.join(HERE, 'shop')) else os.path.join(HERE, '..', 'shop')
FB = '/usr/share/fonts/opentype/inter/Inter-Black.otf'
FM = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
FR = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'


def font(p, s):
    return ImageFont.truetype(p, s)


def centered(d, xy, txt, f, fill):
    b = d.textbbox((0, 0), txt, font=f)
    d.text((xy[0] - (b[0] + b[2]) / 2, xy[1] - (b[1] + b[3]) / 2), txt, font=f, fill=fill)


def tag(price, name, red=False, old=None):
    im = Image.new('RGB', (320, 200), (250, 250, 246)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 319, 199], outline=(60, 60, 60), width=4)
    d.rectangle([0, 0, 319, 26], fill=(205, 40, 40) if red else (40, 40, 44))
    centered(d, (160, 14), name, font(FM, 18), (255, 255, 255))
    centered(d, (160, 108), f'{price} ₽', font(FB, 92), (205, 30, 30) if red else (20, 20, 22))
    if old:
        centered(d, (160, 176), f'было {old} ₽', font(FR, 22), (110, 110, 110))
    return im


def promo():
    im = Image.new('RGB', (360, 360), (255, 214, 20)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 359, 359], outline=(200, 30, 30), width=14)
    centered(d, (180, 62), 'АКЦИЯ', font(FB, 64), (200, 30, 30))
    centered(d, (180, 160), '2', font(FB, 120), (30, 30, 30))
    centered(d, (180, 262), 'по цене 1', font(FB, 58), (30, 30, 30))
    centered(d, (180, 326), 'при покупке пары', font(FR, 22), (90, 60, 10))
    return im


def regscreen():
    im = Image.new('RGB', (400, 240), (6, 20, 12)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 399, 239], outline=(60, 160, 100), width=4)
    d.text((24, 18), 'ЛАПША БП 90г', font=font(FM, 30), fill=(120, 230, 160))
    d.text((24, 62), '1 шт', font=font(FM, 28), fill=(120, 230, 160))
    d.text((24, 112), 'ИТОГО', font=font(FM, 34), fill=(120, 230, 160))
    b = d.textbbox((0, 0), '29 ₽', font=font(FB, 96))
    d.text((376 - b[2], 134), '29 ₽', font=font(FB, 96), fill=(190, 255, 215))
    return im


def pack():
    im = Image.new('RGB', (256, 320), (240, 150, 20)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 255, 60], fill=(200, 40, 30)); d.rectangle([0, 260, 255, 319], fill=(200, 40, 30))
    centered(d, (128, 30), 'БЫСТРО', font(FB, 30), (255, 240, 200))
    centered(d, (128, 150), 'ЛАПША', font(FB, 56), (255, 250, 230))
    d.ellipse([78, 190, 178, 250], fill=(255, 235, 170)); d.rectangle([78, 190, 178, 220], fill=(240, 150, 20))
    d.ellipse([78, 178, 178, 206], fill=(255, 235, 170), outline=(120, 60, 10), width=3)
    centered(d, (128, 290), '90 г', font(FM, 28), (255, 240, 200))
    return im


if __name__ == '__main__':
    pack().save(os.path.join(SH, 'pack_lapsha.png'))
    for price, name, red, old in ((389, 'СЫР', 0, 0), (459, 'КОФЕ', 0, 0), (329, 'ВЕТЧИНА', 0, 0), (214, 'ТВОРОГ', 0, 0), (178, 'МАСЛО', 0, 0),
                                  (96, 'КРУПА', 0, 0), (74, 'МАКАРОНЫ', 0, 0), (38, 'ХЛЕБЦЫ', 0, 0), (29, 'ЛАПША БП', 1, 58), (22, 'СУХАРИ', 0, 0)):
        tag(price, name, red, old or None).save(os.path.join(SH, f'tag_{price}.png'))
    promo().save(os.path.join(SH, 'promo.png'))
    regscreen().save(os.path.join(SH, 'reg_29.png'))
    print('ok')
