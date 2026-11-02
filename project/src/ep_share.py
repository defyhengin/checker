"""«Кот делится»: my plate is empty; after a cut there is one kibble on it. The cat (fed) sits on the guest chair and waits for me to eat.
MODE=stills: s1 empty plate (POV), s2 same with the kibble, s3 kibble close, s4 big still (plate -> cat) for the glide
MODE=anim:   36 honest frames (24 fps) of the cat blinking / tail, camera = the end crop of the glide (lens shift)
Run: EP_OUT=ep_share MODE=stills BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_share.py x 24 1080 1920
     EP_OUT=ep_share MODE=anim   BL_ENGINE=EEVEE EV_SAMPLES=16 WORLD_STR=1.0 python3 ep_share.py x 16 720 1280"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_share')
from bkit import *
MODE = os.environ.get('MODE', 'stills')
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT
BIGW, BIGH = int(os.environ.get('BIGW', '1440')), int(os.environ.get('BIGH', '2560'))

light('warm', 'AREA', (1.2, 2.3, 1.9), 30, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
light('catfill', 'POINT', (0.85, 1.0, 2.2), 6, (1.0, 0.75, 0.52), 0.2)
EVE = ((0.06, 0.055, 0.055), 1.1)
L = ['pend', 'ceilsoft', 'fill', 'win', 'warm', 'catfill']

# my empty plate + fork, in front of my chair
MP = (TXc, 0.762, TZc - 0.26)
plate(MP, 'dinner', 0.12)
M_FORK = simple_mat('fork', (0.75, 0.75, 0.77), 0.25, 1.0)
box((MP[0] - 0.165, MP[1], MP[2] - 0.08), (MP[0] - 0.152, MP[1] + 0.005, MP[2] + 0.08), M_FORK, 'dinner')
for k in range(3):
    box((MP[0] - 0.168 + k * 0.007, MP[1], MP[2] + 0.08), (MP[0] - 0.165 + k * 0.007, MP[1] + 0.005, MP[2] + 0.12), M_FORK, 'dinner')

# the single kibble (bigger than real, readable)
M_KIB = noise_mat('kibble', (0.09, 0.045, 0.018), (0.16, 0.08, 0.03), 0.55, 80)
KB = np.array((MP[0] + 0.015, MP[1] + 0.024, MP[2] + 0.01))
# a little fish-shaped kibble: flat oval body + triangular tail, lying on the plate
ellip(tuple(KB), (0.016, 0.006, 0.01), M_KIB, 'kib', 2)
bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.011, radius2=0.0, depth=0.012, location=P((KB[0] - 0.0175, KB[1], KB[2])))
o = bpy.context.object; o.rotation_euler = (0, math.radians(90), 0); o.scale = (0.5, 1, 1); o.data.materials.append(M_KIB); link(o); grp_add('kib', o)

# the cat (fed) sits on the table across from me, looking at me
CATP = np.array((TXc + 0.02, 0.762, TZc + 0.24))
kitty = Cat(CATP, yaw_to(CATP, (MP[0], 0, MP[2]), 0))
EYE = np.array((TXc, 1.22, TZc - 0.62))

S4 = (tuple(EYE), (TXc, 0.98, TZc + 0.02), 0.72)
# glide end crop (zoom, centre) on the big still — anim camera reproduces it with lens shift
ZEND, CEND = float(os.environ.get('ZEND', '1.7')), (float(os.environ.get('CX', '0.4')), float(os.environ.get('CY', '0.33')))


def look_me(k_up=0.0):
    a = kitty.look_angles(EYE); kitty.head(a[0], a[1] - k_up)


if MODE == 'stills':
    look_me(); kitty.tail(0.3)
    if want('s1'):
        state(['dinner'], L, world=EVE, exp=0.1)
        cam(tuple(EYE + np.array((0, 0.02, 0.1))), (MP[0], MP[1], MP[2]), 0.36)
        shoot(os.path.join(OUT, 's1.png'))
    if want('s2'):
        state(['dinner', 'kib'], L, world=EVE, exp=0.1)
        cam(tuple(EYE + np.array((0, 0.02, 0.1))), (MP[0], MP[1], MP[2]), 0.36)
        shoot(os.path.join(OUT, 's2.png'))
    if want('s3'):
        state(['dinner', 'cat', 'kib'], L, world=EVE, exp=0.1)
        cam((KB[0] + 0.03, KB[1] + 0.16, KB[2] - 0.2), tuple(KB), 0.22)
        shoot(os.path.join(OUT, 's3.png'))
    if want('s4'):
        sc.render.resolution_x, sc.render.resolution_y = BIGW, BIGH
        state(['dinner', 'cat', 'kib'], L, world=EVE, exp=0.1)
        cam(*S4)
        print('CAT', screen_pos(CATP + np.array((0.06, 0.36, 0))), 'PLATE', screen_pos(np.array(MP)), 'KIB', screen_pos(KB))
        shoot(os.path.join(OUT, 's4.png'))
        sc.render.resolution_x, sc.render.resolution_y = int(sys.argv[3]), int(sys.argv[4])
else:
    D = os.path.join(OUT, 'blink'); os.makedirs(D, exist_ok=True)
    state(['dinner', 'cat', 'kib'], L, world=EVE, exp=0.1)
    cam(S4[0], S4[1], S4[2] / ZEND)
    W, H = sc.render.resolution_x, sc.render.resolution_y
    co.data.shift_x = (CEND[0] - 0.5) * (W / H) * ZEND
    co.data.shift_y = -(CEND[1] - 0.5) * ZEND
    NF = int(os.environ.get('NFR', '36'))
    for fi in range(NF):
        k = [1, 0.45, 0.08, 0.08, 0.45][fi - 14] if 14 <= fi < 19 else 1.0
        kitty.blink(k)
        look_me(0.06 * math.sin(math.pi * min(fi / 30, 1)))       # a slight head tilt
        kitty.tail(0.3 + 0.25 * math.sin(2 * math.pi * fi / NF))
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
print('all done')
