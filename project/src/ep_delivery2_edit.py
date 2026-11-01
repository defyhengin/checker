"""Montage of «Гости из доставки» (18 s + card): bag at the door -> rolls on the table (cat on the guest chair) -> empty fridge -> empty table -> phone with the promo code.
Stills from ep_delivery2.py rendered at 1080x1920 so the slow push-ins stay sharp."""
from edit import *
D = 'ep_delivery2'
DUR = 18.0
X = 0.35
TL = [seg(0.0, 4.6, f'{D}/d1.png', 1.0, 2.9, (0.5, 0.5), (0.485, 0.55)),
      seg(4.6, 8.6, f'{D}/d2.png', 1.0, 1.12, (0.5, 0.5), (0.45, 0.47), xf=X),
      seg(8.6, 12.0, f'{D}/d3.png', 1.0, 1.1, (0.5, 0.5), (0.5, 0.45), xf=X),
      seg(12.0, 14.6, f'{D}/d4.png', 1.05, 1.0, (0.48, 0.5), (0.5, 0.5), xf=X),
      seg(14.6, DUR, f'{D}/d5.png', 1.05, 1.3, (0.55, 0.45), (0.6, 0.38), xf=X)]
build_video(TL, DUR, 'del_main.mp4')

m = Mix(DUR, 47); t = m.t
m.room(0.03)
m.hum(0.13)
m.knock(0.15, 0.35); m.knock(0.45, 0.3)                 # courier knocks
m.steps(1.0, 2.6, 0.6, 0.5)                              # and leaves down the stairs
m.meow(6.4, 0.6, 520, 0.14)                              # the cat (fed) is curious
m.thud(8.65, 0.25)                                       # fridge door
m.steps(12.1, 13.4, 0.6, 0.6)                            # carried it to flat 47
m.clink(14.9, 0.1, 2600); m.clink(15.05, 0.08, 3100)     # message arrives
m.save('del.wav')
subs('del.ass', DUR, [(0.4, 2.4, "Под дверью — ужин.", 'Box'), (2.6, 4.4, "Не мой.", 'Box'),
                      (5.2, 8.3, "Восемь штук.", 'Box'),
                      (9.2, 11.8, "А у меня — пусто.", 'Box'),
                      (12.5, 14.4, "Вернул.", 'Box')])
final('del_main.mp4', 'del.wav', 'del.ass', 'shorts_delivery.mp4', DUR)
sheet('shorts_delivery.mp4', [1.0, 3.5, 6.0, 8.0, 10.5, 13.3, 15.5, 17.6], 'del_check.png')
print('done')
