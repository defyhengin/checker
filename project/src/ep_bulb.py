"""«Свет в холодильнике перегорел»: night; I open the fridge — dark inside. The lamp flickers once: the shelves are empty. Dark again.
Nothing changed. The cat (fed) sits beside the fridge, its eyes glowing.
Stills (1080×1920): n1 closed fridge + cat, n2 open dark, n3 open lit (same camera; flicker is cut in the edit)
Run: EP_OUT=ep_bulb BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_bulb.py x 24 1080 1920"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_bulb')
from bkit import *
WANT = [s for s in os.environ.get('SHOTS', '').split(',') if s]
want = lambda n: not WANT or n in WANT

light('moon', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 34, (0.45, 0.55, 1.0), 1.6, (0, 0, -1))
light('city', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.3, studio.Z1 - 0.3), 16, (1.0, 0.7, 0.45), 1.8, (0, -0.2, -1))
light('nfill', 'AREA', (0.6, 2.3, 1.9), 8, (0.62, 0.68, 0.95), 2.4, (0.6, -1, -0.3))
light('kfill', 'AREA', (1.2, 2.2, 1.4), 7, (0.6, 0.66, 0.95), 1.6, (1, -1, 0))
light('catfill', 'POINT', (1.65, 0.7, 2.35), 3, (0.75, 0.82, 1.0), 0.25)
NIGHT = ((0.03, 0.04, 0.07), 1.3)
EXP = 0.45
BASE = ['moon', 'city', 'nfill', 'kfill', 'catfill']

CATP = np.array((1.97, 0.0, 2.0))
kitty = Cat(CATP, 0.0)
kitty.root.rotation_euler = (0, 0, yaw_to(CATP, (1.2, 0, 1.6), 0))
kitty.tail(0.3)
EYE = np.array((0.5, 1.5, 1.15))


def look(p):
    kitty.head(*kitty.look_angles(np.array(p)))


if want('n1'):
    look(EYE)
    state(['cat'], BASE, fr=0, world=NIGHT, exp=EXP)
    cam(tuple(EYE), (2.35, 0.72, 1.8), 0.62)
    print('CAT', screen_pos(CATP + np.array((0, 0.3, 0))))
    shoot(os.path.join(OUT, 'n1.png'))
for nm, lv in (('n2', 0.0), ('n3', 4.0)):
    if want(nm):
        look((0.62, 1.5, 1.2))
        state(['cat'], BASE if lv > 0 else [b for b in BASE if b != 'kfill'], fr=105, fr_light=lv, fr_warm=0.0, world=NIGHT, exp=EXP)
        cam((0.62, 1.5, 1.2), (2.4, 0.72, 1.8), 0.62)
        print('CAT', screen_pos(CATP + np.array((0, 0.3, 0))))
        shoot(os.path.join(OUT, f'{nm}.png'))
print('all done')
