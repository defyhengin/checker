import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_sad')
from bkit import *
light('moon', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 26, (0.4, 0.5, 0.95), 1.5, (0, 0, -1))
light('nfill', 'AREA', (1.0, 2.3, 1.8), 6, (0.6, 0.65, 0.9), 2.0, (0.6, -1, -0.3))
NIGHT = ((0.02, 0.025, 0.04), 1.2)
for i, lv in enumerate((1.0, 0.35, 0.0, 0.7)):
    state([], ['moon', 'nfill', 'fr1', 'fr2'], fr=24, fr_light=lv, fr_warm=0.1, world=NIGHT)
    cam((1.15, 1.5, 2.05), (2.45, 0.95, 1.5)); shoot(os.path.join(OUT, f's1_{i}.png'))
state([], ['moon', 'nfill', 'fr1', 'fr2'], fr=24, fr_light=0.6, fr_warm=0.1, world=NIGHT)
cam((1.55, 1.3, 2.2), (2.08, 1.18, 1.74), 0.45); shoot(os.path.join(OUT, 's2.png'))
