"""«Будильник «Обед»»: day, I work at the desk; the phone on the desk rings «13:00 ОБЕД». I switch it off and move it to tomorrow.
The cat (fed) has its lunch on time.
MODE=stills: a1 desk POV (monitor with a spreadsheet, the phone ringing), a2 phone close (ringing), a3 phone close (alarm list: «ОБЕД · завтра»)
MODE=anim:   30-frame eating loop (24 fps), the cat at its full bowl by the entrance, daylight
Run: EP_OUT=ep_alarm MODE=stills BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_alarm.py x 24 1080 1920
     EP_OUT=ep_alarm MODE=anim   BL_ENGINE=EEVEE EV_SAMPLES=16 WORLD_STR=1.0 python3 ep_alarm.py x 16 720 1280"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_alarm')
from bkit import *
MODE = os.environ.get('MODE', 'stills')
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT

light('sun', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.6, studio.Z1 - 0.05), 120, (1.0, 0.86, 0.66), 1.6, (-0.3, -0.35, -1))
light('sky', 'AREA', (0.0, 2.45, 2.6), 12, (0.85, 0.9, 1.0), 3.0, (0, -1, 0))
light('wfill', 'AREA', (0.4, 1.6, 1.6), 8, (1.0, 0.9, 0.78), 1.6, (-1, -0.3, -1))
light('dfill', 'AREA', (1.9, 1.9, 4.3), 10, (1.0, 0.92, 0.82), 1.2, (0, -1, 0.6))
light('catfill', 'POINT', (1.45, 0.6, 1.0), 4, (1.0, 0.85, 0.7), 0.2)
DAY = ((0.45, 0.5, 0.58), 0.25)
try:
    sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception as e:
    print('look', e)
L = ['sun', 'sky', 'wfill', 'dfill']

# ---- the desk: phone lying left of the keyboard, spreadsheet on the monitor ----
DX, DZ = 1.95, 5.12
PHC = (DX - 0.42, 0.76, DZ - 0.18)
M_PB = simple_mat('ph_body', (0.03, 0.03, 0.035), 0.25, 0.3)
box((PHC[0] - 0.038, PHC[1], PHC[2] - 0.078), (PHC[0] + 0.038, PHC[1] + 0.009, PHC[2] + 0.078), M_PB, 'desk')
A1 = tex_mat('ph_al1', 'phone_alarm1.png', 'top', 0.9, emit=1.8)
A2 = tex_mat('ph_al2', 'phone_alarm2.png', 'top', 0.9, emit=1.8)
SCR = box((PHC[0] - 0.034, PHC[1] + 0.009, PHC[2] - 0.072), (PHC[0] + 0.034, PHC[1] + 0.0095, PHC[2] + 0.072), A1, 'desk', False)
MON = tex_mat('monwork', os.environ.get('MONTEX', 'monitor_work_m.png'), 'front_pz', 0.4, emit=1.2)
box((DX - 0.3, 0.92, DZ + 0.08), (DX + 0.3, 1.22, DZ + 0.084), MON, 'desk', False)
# a mug of plain water on the desk
M_MUG = simple_mat('mug', (0.25, 0.45, 0.7), 0.35)
grp_add('desk', cyl((DX + 0.33, 0.76, DZ - 0.2), 0.04, 0.09, M_MUG))

# ---- the cat at its full bowl, by the entrance ----
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
A_BOWL = kitty.look_angles(BOWLP + np.array((0, 0.03, 0)))
EYE = (1.62, 0.52, 1.62)
LOOKC = (BOWLP + CATP) / 2 + np.array((0.05, 0.15, 0.0))

if MODE == 'stills':
    if want('a1'):
        SCR.data.materials[0] = A1
        state(['desk'], L, world=DAY, exp=0.0)
        cam((DX - 0.2, 1.25, DZ - 0.8), (DX - 0.24, 0.84, DZ - 0.02), 0.62)
        print('PHONE', screen_pos(np.array(PHC)))
        shoot(os.path.join(OUT, 'a1.png'))
    for nm, mt in (('a2', A1), ('a3', A2)):
        if want(nm):
            SCR.data.materials[0] = mt
            state(['desk'], L, world=DAY, exp=-0.3)
            cam((PHC[0] - 0.005, 0.99, PHC[2] - 0.045), (PHC[0], 0.765, PHC[2] + 0.004), 0.36)
            shoot(os.path.join(OUT, f'{nm}.png'))
else:
    D = os.path.join(OUT, 'eat'); os.makedirs(D, exist_ok=True)
    state(['cat'], L + ['catfill'], world=DAY, exp=0.0)
    cam(EYE, tuple(LOOKC), 0.62)
    NL = int(os.environ.get('NFR', '30'))
    for fi in range(NL):
        t = fi / 24.0
        bob = 0.22 * max(0.0, math.sin(2 * math.pi * t / 0.625))
        kitty.head(A_BOWL[0], A_BOWL[1] + bob); kitty.tail(0.45 * math.sin(2 * math.pi * fi / 30)); kitty.blink(1.0)
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
print('all done')
