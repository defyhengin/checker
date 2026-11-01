"""«Холодильник грустит» v2: brighter night, several angles, every angle rendered in 4 lamp states for a real flicker in montage.
Run: EP_OUT=ep_sad2 BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_sad2.py x 24 720 1280   (SHOTS=w1,w2 to limit)"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_sad2')
from bkit import *

WANT = [s for s in os.environ.get('SHOTS', '').split(',') if s]
want = lambda n: not WANT or n in WANT

# night, but readable: moonlight through the window, warm city glow, soft blue fill
light('moon', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 34, (0.45, 0.55, 1.0), 1.6, (0, 0, -1))
light('city', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.3, studio.Z1 - 0.3), 16, (1.0, 0.7, 0.45), 1.8, (0, -0.2, -1))
light('nfill', 'AREA', (0.6, 2.3, 1.9), 8, (0.62, 0.68, 0.95), 2.4, (0.6, -1, -0.3))
light('catfill', 'POINT', (1.7, 0.6, 2.6), 3, (0.75, 0.82, 1.0), 0.25)
NIGHT = ((0.03, 0.04, 0.07), 1.3)
EXP = 0.45
BASE = ['moon', 'city', 'nfill', 'fr1', 'fr2']
LV = (2.2, 0.5, 0.0, 1.4)          # lamp states: on / dim / off / half

# the cat: fed, sits beside the fridge looking at the ajar door; full bowl next to the table
CATP = np.array((1.9, 0.0, 2.1))
kitty = Cat(CATP, 0.0)
BOWLP = (1.55, 0.022, 2.35)
bowl(BOWLP, 'cat')
M_KIB = simple_mat('kibble', (0.42, 0.24, 0.1), 0.7)
rng = np.random.default_rng(3)
for i in range(16):
    a = rng.uniform(0, 2 * math.pi); r = rng.uniform(0, 0.05)
    ellip((BOWLP[0] + r * math.cos(a), 0.05 + rng.uniform(0, 0.012), BOWLP[2] + r * math.sin(a)), (0.012, 0.009, 0.012), M_KIB, 'cat', 1)
kitty.root.rotation_euler = (0, 0, yaw_to(CATP, (2.3, 0, 1.85), 0))
kitty.head(*kitty.look_angles(np.array((2.3, 1.1, 1.85))))
kitty.tail(0.3)


def take(name, pos, tgt, tany, levels=LV, groups=('cat',), fr=24, extra=()):
    if not want(name):
        return
    cam(pos, tgt, tany)
    for i, lv in enumerate(levels):
        state(list(groups), BASE + list(extra), fr=fr, fr_light=lv, fr_warm=0.05, world=NIGHT, exp=EXP)
        shoot(os.path.join(OUT, f'{name}_{i}.png'))


# w1: wide, from the desk by the window: dark room, cold wedge of light from the fridge, cat beside it
take('w1', (-0.4, 1.45, 4.9), (2.2, 0.55, 1.8), 0.6)
# w2: low, at cat level: the cat looks up at the door
take('w2', (1.8, 0.38, 3.25), (2.05, 0.5, 1.95), 0.5, extra=('catfill',))
# c1: into the gap: empty shelves and the lamp
take('c1', (1.55, 1.3, 2.2), (2.08, 1.18, 1.74), 0.45, groups=())
# s1: the classic three-quarter view of the ajar door (as in v1, now lit)
take('s1', (1.15, 1.5, 2.05), (2.45, 0.95, 1.5), 0.62)
# d1: door front close-up for the tear (lamp on / off)
# take('d1', (1.7, 1.38, 1.15), (2.25, 1.3, 1.62), 0.4, levels=(1.4, 0.0), groups=())
print('all done')
