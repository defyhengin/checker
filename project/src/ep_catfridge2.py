"""«Кот и холодильник»: the cat sits in front of the closed fridge and waits.
MODE=big   -> one large still for the camera glide (cat from behind, closed fridge)
MODE=anim  -> 84 honest frames at 24 fps: low camera beside the cat, it turns its head to us and back
Run: EP_OUT=ep_catfridge2 MODE=big BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_catfridge2.py x 24 2400 1800
     EP_OUT=ep_catfridge2 MODE=anim BL_ENGINE=EEVEE EV_SAMPLES=12 WORLD_STR=1.0 python3 ep_catfridge2.py x 12 720 1280"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_catfridge2')
from bkit import *
MODE = os.environ.get('MODE', 'big')
# evening: warm ceiling light + cool window, readable
light('moon', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 30, (0.45, 0.55, 1.0), 1.6, (0, 0, -1))
light('warm', 'AREA', (1.2, 2.3, 1.9), 40, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
light('catfill', 'POINT', (1.45, 0.6, 1.7), 6, (1.0, 0.72, 0.48), 0.2)
EVE = ((0.06, 0.055, 0.055), 1.1)
CATP = np.array((1.88, 0.0, 1.5))
kitty = Cat(CATP, 0.0)
FR_PT = np.array((2.3, 1.15, 1.5))
A_FR = kitty.look_angles(FR_PT)
CB = np.array((1.62, 0.3, 1.88))
A_CAM = kitty.look_angles(CB)
state(['cat'], ['moon', 'warm', 'catfill', 'pend'], world=EVE, exp=0.35)
if MODE == 'big':
    kitty.head(*A_FR); kitty.tail(0.35)
    POS = tuple(float(x) for x in os.environ.get('POS', '0.9,1.0,0.35').split(',')); TGT = tuple(float(x) for x in os.environ.get('TGT', '2.1,0.55,1.5').split(','))
    cam(POS, TGT, float(os.environ.get('TANY', '0.5')))
    print({'cat': screen_pos(CATP + np.array((0, 0.3, 0))), 'fridge': screen_pos(np.array((2.27, 1.0, 1.5)))})
    shoot(os.path.join(OUT, 'big.png'), force=True)
else:
    D = os.path.join(OUT, 'turn'); os.makedirs(D, exist_ok=True)
    cam(CB, (2.3, 0.62, 1.42))
    for fi in range(84):
        if fi < 12:
            s = 0.0
        elif fi < 30:
            k = (fi - 12) / 18; s = k * k * (3 - 2 * k)
        elif fi < 58:
            s = 1.0
        elif fi < 76:
            k = (fi - 58) / 18; s = 1 - k * k * (3 - 2 * k)
        else:
            s = 0.0
        kitty.head(A_FR[0] + (A_CAM[0] - A_FR[0]) * s, A_FR[1] + (A_CAM[1] - A_FR[1]) * s)
        kitty.tail(0.4 * math.sin(2 * math.pi * fi / 30)); kitty.blink([1, 0.4, 0.08, 0.4][fi - 42] if 42 <= fi < 46 else 1.0)
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
print('all done')
