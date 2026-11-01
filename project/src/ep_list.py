"""«Список покупок»: shopping list on the fridge, money for one item only — the tick goes next to «корм», the cat eats.
MODE=stills: l1 (big still for the glide: kitchen -> fridge note), l2 note close, l3 same with the tick, l5 cat + bowl + new pack still
MODE=anim:   30-frame eating loop at 24 fps (looped in the edit)
Run: EP_OUT=ep_list MODE=stills BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_list.py x 24 1080 1920
     EP_OUT=ep_list MODE=anim   BL_ENGINE=EEVEE EV_SAMPLES=16 WORLD_STR=1.0 python3 ep_list.py x 16 720 1280"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_list')
from bkit import *
MODE = os.environ.get('MODE', 'stills')
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT
BIGW, BIGH = int(os.environ.get('BIGW', '1440')), int(os.environ.get('BIGH', '2560'))

light('warm', 'AREA', (1.2, 2.3, 1.9), 30, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
light('kfill', 'AREA', (1.3, 1.9, 1.5), 14, (1.0, 0.86, 0.7), 1.2, (1, -0.4, 0))
light('catfill', 'POINT', (1.45, 0.6, 1.7), 5, (1.0, 0.72, 0.48), 0.2)
EVE = ((0.06, 0.055, 0.055), 1.1)
L = ['pend', 'ceilsoft', 'win', 'warm', 'kfill']

# ---- the list on the fridge door (door front x = 2.26, faces -x) ----
FXN = 2.256
NA, NB = (FXN - 0.002, 1.2, 1.32), (FXN, 1.46, 1.52)
note_m = tex_mat('nlist', 'note_list.png', 'front_mx', 0.8); note_ok = tex_mat('nlist_ok', 'note_list_ok.png', 'front_mx', 0.8)
NOTE = box(NA, NB, note_m, 'list', False)
M_MAG = simple_mat('magnet', (0.8, 0.12, 0.1), 0.35)
o = cyl((FXN - 0.008, 1.445, 1.42), 0.016, 0.012, M_MAG, 20); o.rotation_euler = (0, math.radians(90), 0)
grp_add('list', o)
NC = np.array((FXN, 1.33, 1.42))

# ---- the cat (fed) with a full bowl and the new pack ----
CATP = np.array((1.78, 0.0, 0.78))
kitty = Cat(CATP, yaw_to(CATP, (1.3, 0, 0.82), 0))
th = kitty.root.rotation_euler.z
BOWLP = CATP + np.array((math.cos(th), 0.0, -math.sin(th))) * 0.19
BOWLP[1] = 0.022
bowl(tuple(BOWLP), 'cat')
M_KIB = simple_mat('kibble', (0.42, 0.24, 0.1), 0.7)
rng = np.random.default_rng(3)
for i in range(22):
    a = rng.uniform(0, 2 * math.pi); r = rng.uniform(0, 0.055)
    ellip((BOWLP[0] + r * math.cos(a), 0.072 + rng.uniform(0, 0.018) * (1 - r / 0.06), BOWLP[2] + r * math.sin(a)), (0.012, 0.009, 0.012), M_KIB, 'cat', 1)
PK = (BOWLP[0] - 0.12, BOWLP[2] - 0.2)
M_PACK = tex_mat('korm', 'korm.png', 'front_pz', 0.5)
M_PACKS = simple_mat('korm_side', (0.86, 0.45, 0.15), 0.5)
box((PK[0] - 0.06, 0.0, PK[1] - 0.06), (PK[0] + 0.06, 0.2, PK[1]), M_PACKS, 'cat')
box((PK[0] - 0.058, 0.005, PK[1]), (PK[0] + 0.058, 0.195, PK[1] + 0.001), M_PACK, 'cat', False)
A_BOWL = kitty.look_angles(BOWLP + np.array((0, 0.03, 0)))
EYE = (1.62, 0.52, 1.62)
LOOKC = (BOWLP + CATP) / 2 + np.array((0.05, 0.15, 0.0))

if MODE == 'stills':
    if want('l1'):
        sc.render.resolution_x, sc.render.resolution_y = BIGW, BIGH
        kitty.head(A_BOWL[0], A_BOWL[1]); kitty.tail(0.3)
        state(['list'], L, world=EVE, exp=0.1)
        cam((0.95, 1.2, 0.75), (2.2, 0.95, 1.55), 0.62)
        print('NOTE', screen_pos(NC))
        shoot(os.path.join(OUT, 'l1.png'))
        sc.render.resolution_x, sc.render.resolution_y = int(sys.argv[3]), int(sys.argv[4])
    for nm, mat in (('l2', note_m), ('l3', note_ok)):
        if want(nm):
            NOTE.data.materials[0] = mat
            state(['list'], L, world=EVE, exp=0.1)
            cam((1.78, 1.34, 1.42), (FXN, 1.33, 1.42), 0.55)
            shoot(os.path.join(OUT, f'{nm}.png'))
    if want('l5'):
        kitty.head(A_BOWL[0], A_BOWL[1]); kitty.tail(0.3)
        state(['cat'], L + ['catfill'], world=EVE, exp=0.1)
        cam(EYE, tuple(LOOKC), 0.62)
        print('CAT', screen_pos(CATP + np.array((0, 0.25, 0))), 'PACK', screen_pos(np.array((PK[0], 0.1, PK[1]))))
        shoot(os.path.join(OUT, 'l5.png'))
else:
    D = os.path.join(OUT, 'eat'); os.makedirs(D, exist_ok=True)
    state(['cat'], L + ['catfill'], world=EVE, exp=0.1)
    cam(EYE, tuple(LOOKC), 0.62)
    NL = 30
    for fi in range(NL):
        t = fi / 24.0
        bob = 0.22 * max(0.0, math.sin(2 * math.pi * t / 0.625))
        kitty.head(A_BOWL[0], A_BOWL[1] + bob); kitty.tail(0.45 * math.sin(2 * math.pi * fi / NL)); kitty.blink(1.0)
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
print('all done')
