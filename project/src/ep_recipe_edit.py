import os
import numpy as np
from edit import *
D = 'ep_recipe'; DUR = 19.0
sd = os.path.join(D, 'potseq'); os.makedirs(sd, exist_ok=True)
N = int(7.0 * 24)
for i in range(N):
    dst = os.path.join(sd, f'f_{i:04d}.png')
    if os.path.exists(dst): os.remove(dst)
    os.link(os.path.join(D, 'pot', f'f_{i % 36:04d}.png'), dst)
TL = [seg(0.0, 4.0, f'{D}/r1.png', 1.0, 1.12, (0.5, 0.5), (0.5, 0.45)),
      seg(4.0, 5.5, f'{D}/r2_0.png', 1.0, 1.02, xf=0.3),
      seg(5.5, 7.5, f'{D}/r2_1.png', 1.02, 1.04, xf=0.3),
      seg(7.5, 9.5, f'{D}/r2_2.png', 1.04, 1.06, xf=0.3),
      seg(9.5, 12.0, f'{D}/r2_3.png', 1.06, 1.09, xf=0.3),
      seg(12.0, DUR, (sd, N), 1.0, 1.0, seq=True, xf=0.4)]
build_video(TL, DUR, 'recipe_main.mp4')
m = Mix(DUR, 41); t = m.t
m.room(); m.hum(0.12)
k = int(0.25 * SR); tm = np.arange(k) / SR
m.add_at(0.25, (np.sin(2 * np.pi * 1320 * tm) + 0.5 * np.sin(2 * np.pi * 1760 * tm)) * np.exp(-tm * 12) * 0.12)   # message ding
for at in (5.5, 7.5, 9.5):
    m.knock(at, 0.35)
from film import bandpass, lowpass
bub = bandpass(m.rng.normal(0, 1, m.n), 700, 2500); bub = bub / np.abs(bub).max()
am = (np.sin(2 * np.pi * 7 * t + 2 * np.sin(2 * np.pi * 1.1 * t)) > 0.4).astype(float)
m.out += bub * am * 0.12 * ssv(12.0, 12.6, t) * (1 - ssv(DUR - 0.3, DUR + 0.3, t))
m.save('recipe.wav')
subs('recipe.ass', DUR, [(0.4, 3.8, "Мама прислала рецепт.", 'Box'), (5.6, 7.4, "Картошка — одна.", 'Box'),
                         (7.6, 9.4, "Лук — есть.", 'Box'), (9.6, 11.9, "Морковка — нашлась!", 'Box'),
                         (12.6, 15.0, "20 минут.", 'Box'), (15.4, 18.8, "Получилось.\nПочти как у тебя.", 'Box')])
final('recipe_main.mp4', 'recipe.wav', 'recipe.ass', 'shorts_recipe.mp4', DUR)
sheet('shorts_recipe.mp4', [1.5, 6.5, 10.5, 13, 17], 'recipe_check.png')
print('done')
