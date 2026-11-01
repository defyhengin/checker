"""Montage of «Из 47-й» (17 s + card): knock -> plate of pancakes with a note on the doormat (push-in to the note) -> pancakes on the table, the cat on the guest chair.
Echoes «Гости из доставки»: «Под дверью — ужин. / Не мой.» -> «Под дверью — ужин. / Мой.» -> «Вернули.»"""
from edit import *
D = 'ep_from47'
DUR = 17.0
T2, T3 = 3.4, 9.8
TL = [seg(0.0, T2, f'{D}/k1.png', 1.0, 1.08),
      seg(T2, T3, f'{D}/k2.png', 1.3, 3.6, (0.5, 0.5), (0.493, 0.522), xf=0.35),
      seg(T3, DUR, f'{D}/k3.png', 1.0, 1.35, (0.5, 0.5), (0.6, 0.47), xf=0.4)]
build_video(TL, DUR, 'k47_main.mp4')
m = Mix(DUR, 47)
m.room(0.03)
m.hum(0.12)
m.knock(0.35, 0.4); m.knock(0.62, 0.35); m.knock(0.9, 0.38)
m.steps(1.4, 2.8, 0.6, 0.4)                     # the neighbour walks away
m.clink(T3 + 0.2, 0.08, 1800)
m.meow(12.6, 0.6, 520, 0.12)
m.purr(13.5, DUR - 0.2, 0.25)
m.save('k47.wav')
subs('k47.ass', DUR, [(0.7, 3.1, "Стук.", 'Box'),
                      (4.0, 5.9, "Под дверью — ужин.", 'Box'), (6.2, 7.6, "Мой.", 'Box'),
                      (11.0, 16.7, "Добро возвращается.", 'Box')])
final('k47_main.mp4', 'k47.wav', 'k47.ass', 'shorts_from47.mp4', DUR)
sheet('shorts_from47.mp4', [1.0, 4.5, 6.5, 8.5, 9.5, 11.5, 14.0, 16.5], 'k47_check.png')
print('done')
