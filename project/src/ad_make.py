from PIL import Image, ImageDraw, ImageFont
W, H = 640, 320
FB = '/usr/share/fonts/opentype/inter/Inter-Black.otf'


def burger(d, cx, cy, s):
    d.ellipse([cx-90*s, cy-70*s, cx+90*s, cy+10*s], fill=(232, 150, 50))
    for k in range(6):
        d.ellipse([cx-60*s+k*22*s, cy-50*s, cx-54*s+k*22*s, cy-45*s], fill=(255, 240, 200))
    d.polygon([(cx-95*s, cy+5*s), (cx+95*s, cy+5*s), (cx+80*s, cy+22*s), (cx-80*s, cy+22*s)], fill=(80, 170, 50))
    d.polygon([(cx-92*s, cy+15*s), (cx+92*s, cy+15*s), (cx+60*s, cy+40*s), (cx-20*s, cy+30*s)], fill=(255, 200, 30))
    d.rounded_rectangle([cx-88*s, cy+22*s, cx+88*s, cy+50*s], radius=12*s, fill=(110, 55, 25))
    d.rounded_rectangle([cx-85*s, cy+50*s, cx+85*s, cy+72*s], radius=10*s, fill=(222, 140, 45))


def F(sz): return ImageFont.truetype(FB, sz)


def ctext(d, y, t, sz, fill, stroke=None):
    f = F(sz); w = d.textlength(t, font=f)
    d.text(((W-w)/2, y), t, font=f, fill=fill, stroke_width=4 if stroke else 0, stroke_fill=stroke)


im = Image.new('RGB', (W, H), (205, 25, 30)); d = ImageDraw.Draw(im); ctext(d, 12, "БУРГЕР", 74, (255, 220, 40), (120, 0, 0)); burger(d, 320, 195, 1.2); im.save('ad_0.png')
im = Image.new('RGB', (W, H), (255, 200, 20)); d = ImageDraw.Draw(im); burger(d, 320, 140, 1.8); ctext(d, 235, "ДВОЙНОЙ СЫР!", 58, (200, 20, 20), (255, 255, 255)); im.save('ad_1.png')
im = Image.new('RGB', (W, H), (205, 25, 30)); d = ImageDraw.Draw(im); ctext(d, 22, "ВСЕГО", 56, (255, 255, 255)); ctext(d, 95, "349 ₽", 150, (255, 220, 40), (120, 0, 0)); im.save('ad_2.png')
im = Image.new('RGB', (W, H), (150, 10, 15)); d = ImageDraw.Draw(im); burger(d, 155, 140, 0.95)
d.rounded_rectangle([300, 95, 615, 195], radius=30, fill=(40, 190, 70)); f = F(46); w = d.textlength("ЗАКАЖИ", font=f); d.text((457-w/2, 120), "ЗАКАЖИ", font=f, fill=(255, 255, 255))
ctext(d, 245, "доставка за 15 минут", 32, (255, 230, 200)); im.save('ad_3.png')
im = Image.new('RGB', (W*2+10, H*2+10), 'white')
for i in range(4):
    im.paste(Image.open(f'ad_{i}.png'), ((i % 2)*(W+10), (i//2)*(H+10)))
im.save('ad_sheet.png')
