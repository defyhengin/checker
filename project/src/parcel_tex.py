from PIL import Image, ImageDraw, ImageFont
HB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-BoldOblique.ttf'
IB = '/usr/share/fonts/opentype/inter/Inter-Bold.otf'
IR = '/usr/share/fonts/opentype/inter/Inter-Regular.otf'
CARD = (172, 128, 82)
# box top: marker writing
im = Image.new('RGB', (800, 560), CARD); d = ImageDraw.Draw(im)
d.rectangle([360, 0, 440, 560], fill=(196, 168, 120))           # tape
f = ImageFont.truetype(HB, 96); d.text((60, 120), "ОТ МАМЫ", font=f, fill=(25, 25, 40))
f2 = ImageFont.truetype(HB, 52); d.text((90, 330), "ХРУПКОЕ! ↑↑", font=f2, fill=(150, 20, 20))
im.save('box_top.png')
# box side
im = Image.new('RGB', (800, 560), CARD); d = ImageDraw.Draw(im)
d.text((70, 140), "ОТ МАМЫ", font=f, fill=(25, 25, 40)); d.text((110, 340), "ХРУПКОЕ ↑↑", font=f2, fill=(150, 20, 20))
im.save('box_side.png')
# note
im = Image.new('RGB', (700, 500), (246, 243, 232)); d = ImageDraw.Draw(im)
for y in range(70, 500, 62): d.line([(25, y), (675, y)], fill=(200, 210, 228), width=2)
f = ImageFont.truetype(HB, 58)
d.text((40, 30), "Ешь нормально.", font=f, fill=(30, 40, 120)); d.text((40, 150), "Позвони,", font=f, fill=(30, 40, 120))
d.text((40, 220), "как получишь.", font=f, fill=(30, 40, 120)); d.text((380, 370), "Мама ♥", font=f, fill=(150, 30, 50))
im.save('note_mom.png')
# phone call screen
for sec in (3, 4, 5):
    im = Image.new('RGB', (360, 760), (18, 22, 30)); d = ImageDraw.Draw(im)
    for y in range(760):
        c = int(18 + 30 * (1 - y / 760)); d.line([(0, y), (360, y)], fill=(c, c + 6, c + 18))
    d.ellipse([110, 150, 250, 290], fill=(120, 80, 140)); fa = ImageFont.truetype(IB, 80); w = d.textlength("М", font=fa); d.text((180 - w / 2, 170), "М", font=fa, fill=(255, 255, 255))
    fb = ImageFont.truetype(IB, 56); w = d.textlength("Мама", font=fb); d.text((180 - w / 2, 320), "Мама", font=fb, fill=(255, 255, 255))
    fc = ImageFont.truetype(IR, 34); t = f"00:0{sec}"; w = d.textlength(t, font=fc); d.text((180 - w / 2, 400), t, font=fc, fill=(190, 200, 210))
    d.ellipse([140, 600, 220, 680], fill=(220, 50, 50))
    im.save(f'phone_{sec}.png')
print('ok')
