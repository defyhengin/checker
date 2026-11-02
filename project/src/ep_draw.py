"""«Холодильник рисует еду»: at night the fridge door is ajar and lit (it is drawing). In the morning there are crayon drawings on the shelves:
колбаса, сыр, торт. The cat (fed) sniffs the cake.
MODE=stills: d1 night, door ajar, light inside; d2 big still (morning, open fridge, three drawings) for the glide down the shelves
MODE=anim:   36 frames (24 fps): the cat sniffs the cake drawing on the bottom shelf (head bobs)
Run: EP_OUT=ep_draw MODE=stills BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_draw.py x 24 1080 1920
     EP_OUT=ep_draw MODE=anim   BL_ENGINE=EEVEE EV_SAMPLES=16 WORLD_STR=1.0 python3 ep_draw.py x 16 720 1280"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_draw')
from bkit import *
MODE = os.environ.get('MODE', 'stills')
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT
BIGW, BIGH = int(os.environ.get('BIGW', '1440')), int(os.environ.get('BIGH', '2560'))

# night (readable) and morning lights
light('moon', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 34, (0.45, 0.55, 1.0), 1.6, (0, 0, -1))
light('city', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.3, studio.Z1 - 0.3), 16, (1.0, 0.7, 0.45), 1.8, (0, -0.2, -1))
light('nfill', 'AREA', (0.6, 2.3, 1.9), 8, (0.62, 0.68, 0.95), 2.4, (0.6, -1, -0.3))
light('sun', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.6, studio.Z1 - 0.05), 120, (1.0, 0.86, 0.66), 1.6, (-0.3, -0.35, -1))
light('sky', 'AREA', (0.0, 2.45, 2.6), 12, (0.85, 0.9, 1.0), 3.0, (0, -1, 0))
light('wfill', 'AREA', (0.9, 1.6, 1.4), 10, (1.0, 0.9, 0.78), 1.6, (1, -0.3, 0.1))
NIGHT = ((0.03, 0.04, 0.07), 1.3)
DAY = ((0.45, 0.5, 0.58), 0.25)
NL = ['moon', 'city', 'nfill']
DL = ['sun', 'sky', 'wfill']

# three drawings standing on the shelves, leaning on the back wall (face -x)
PW, PH_ = 0.32, 0.229
DRW = []
for nm, y, z, x in (('kolbasa', 0.962, 1.5, 2.8), ('syr', 0.562, 1.5, 2.8), ('tort', 0.145, 1.48, 2.44)):
    m = tex_mat(f'dr_{nm}', f'draw_{nm}.png', 'front_mx', 0.85)
    o = box((x, y + 0.005, z - PW / 2), (x + 0.006, y + 0.005 + PH_, z + PW / 2), m, 'draw', False)
    o.rotation_euler = (0, math.radians(-8), 0)        # leaning back a little
    DRW.append((nm, np.array((x, y + 0.1, z))))
# a stub of a crayon lying on the middle shelf
M_CRAY = simple_mat('crayon', (0.85, 0.15, 0.2), 0.5)
grp_add('draw', cyl((2.5, 0.565, 1.33), 0.007, 0.006, M_CRAY, 8))
c_ = cyl((2.48, 0.569, 1.36), 0.006, 0.06, M_CRAY, 8); c_.rotation_euler = (math.radians(90), 0, math.radians(30)); grp_add('draw', c_)

# the cat (fed) in front of the open fridge, nose to the cake
CATP = np.array((2.12, 0.0, 1.66))
kitty = Cat(CATP, yaw_to(CATP, (2.44, 0, 1.48), 0))
CAKE = np.array((2.43, 0.25, 1.5))
A_CAKE = kitty.look_angles(CAKE)

if MODE == 'stills':
    if want('d1'):
        state([], NL, fr=22, fr_light=1.4, fr_warm=0.35, world=NIGHT, exp=0.45)
        cam((1.15, 1.5, 2.45), (2.3, 0.95, 1.45), 0.6)
        shoot(os.path.join(OUT, 'd1.png'))
    if want('d2'):
        sc.view_settings.look = 'AgX - Medium High Contrast'
        sc.render.resolution_x, sc.render.resolution_y = BIGW, BIGH
        kitty.head(A_CAKE[0], A_CAKE[1]); kitty.tail(0.35)
        state(['draw', 'cat'], DL, fr=105, fr_light=1.0, world=DAY, exp=0.0)
        cam((1.45, 0.92, 1.42), (2.6, 0.62, 1.52), 0.8)
        for nm, p in DRW:
            print(nm, screen_pos(p))
        print('CAT', screen_pos(CATP + np.array((0.1, 0.4, 0))))
        shoot(os.path.join(OUT, 'd2.png'))
        sc.render.resolution_x, sc.render.resolution_y = int(sys.argv[3]), int(sys.argv[4])
else:
    sc.view_settings.look = 'AgX - Medium High Contrast'
    D = os.path.join(OUT, 'sniff'); os.makedirs(D, exist_ok=True)
    state(['draw', 'cat'], DL, fr=105, fr_light=1.0, world=DAY, exp=0.0)
    cam((1.3, 0.55, 0.98), (2.22, 0.3, 1.58), 0.5)
    NF = int(os.environ.get('NFR', '36'))
    for fi in range(NF):
        t = fi / 24.0
        sniff = 0.05 * max(0.0, math.sin(2 * math.pi * t / 0.375))     # quick little nods, 2.7 per second
        kitty.head(A_CAKE[0] + 0.05 * math.sin(2 * math.pi * fi / NF), A_CAKE[1] + sniff)
        kitty.tail(0.35 + 0.3 * math.sin(2 * math.pi * fi / NF))
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
print('all done')
