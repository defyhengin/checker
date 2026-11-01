import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_catfridge')
from bkit import *
light('moon', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 22, (0.4, 0.5, 0.95), 1.5, (0, 0, -1))
light('warm', 'AREA', (1.2, 2.3, 1.9), 22, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
light('catfill', 'POINT', (1.45, 0.6, 1.7), 6, (1.0, 0.72, 0.48), 0.2)
EVE = ((0.05, 0.045, 0.045), 1.0)
CATP = np.array((1.88, 0.0, 1.5))
kitty = Cat(CATP, 0.0)
A_FR = kitty.look_angles(np.array((2.3, 1.15, 1.5)))
CB = np.array((1.62, 0.3, 1.88))
A_CAM = kitty.look_angles(CB)
D1 = os.path.join(OUT, 'a'); D2 = os.path.join(OUT, 'b'); os.makedirs(D1, exist_ok=True); os.makedirs(D2, exist_ok=True)
state(['cat'], ['moon', 'warm', 'catfill'], world=EVE)
cam((1.08, 0.55, 1.42), (2.3, 0.72, 1.5))
for fi in range(30):
    kitty.head(*A_FR); kitty.tail(0.4 * math.sin(2 * math.pi * fi / 30)); shoot(os.path.join(D1, f'f_{fi:04d}.png'))
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
    shoot(os.path.join(D2, f'f_{fi:04d}.png'))
