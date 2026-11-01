"""«Стиралка»: 100 roubles found in the jeans after the wash.
w1 cat watches the running washer; w2 jeans on the washer, a note peeks out of the pocket; w3 the note unfolded (close);
w4 (big, for the glide) the note pinned on the clothes drier, cat below in the sun.
Run: EP_OUT=ep_wash BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_wash.py x 24 1080 1920   (SHOTS=w1,w2 to limit; W4 size via BIGW/BIGH)"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_wash')
from bkit import *
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT

# daytime: warm sun through the window + soft sky fill
light('sun', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.6, studio.Z1 - 0.05), 120, (1.0, 0.86, 0.66), 1.6, (-0.3, -0.35, -1))
light('sky', 'AREA', (0.0, 2.45, 2.6), 12, (0.85, 0.9, 1.0), 3.0, (0, -1, 0))
light('wfill', 'AREA', (0.4, 1.6, 1.6), 8, (1.0, 0.9, 0.78), 1.6, (-1, -0.3, -1))
DAY = ((0.45, 0.5, 0.58), 0.25)
try:
    sc.view_settings.look = os.environ.get('LOOK', 'AgX - Medium High Contrast')
except Exception as e:
    print('look', e)
L = ['sun', 'sky', 'wfill']
EXP = float(os.environ.get('EXPO', '0.0'))

WX, WZ = -0.45, 0.32           # washer centre; front faces +z, door centre y 0.38
TOP = 0.85
M_DEN = tex_mat('denim', 'denim.png', 'top', 0.9)
M_SEAM = simple_mat('seam', (0.75, 0.55, 0.25), 0.8)
M_RIV = simple_mat('rivet', (0.75, 0.6, 0.35), 0.3, 1.0)
M_NOTE = tex_mat('note100', 'note100.png', 'top180', 0.7)
M_NOTEV = tex_mat('note100v', 'note100.png', 'front_pz', 0.7)
M_NOTEB = simple_mat('noteback', (0.72, 0.8, 0.74), 0.7)

# ---- jeans folded on the washer, note peeking out of the back pocket ----
J0, J1 = (WX - 0.2, TOP, WZ - 0.17), (WX + 0.2, TOP + 0.07, WZ + 0.17)
box(J0, J1, M_DEN, 'jeans')
box((J0[0] + 0.01, J1[1], J0[2] + 0.03), (J1[0] - 0.01, J1[1] + 0.003, J0[2] + 0.034), M_SEAM, 'jeans', False)
PK0, PK1 = (WX - 0.02, J1[1], WZ - 0.06), (WX + 0.15, J1[1] + 0.006, WZ + 0.11)     # back pocket patch
box(PK0, PK1, M_DEN, 'jeans', False)
for (a, b) in (((PK0[0], PK1[2] - 0.004), (PK1[0], PK1[2])), ((PK0[0], PK0[2]), (PK0[0] + 0.004, PK1[2])), ((PK1[0] - 0.004, PK0[2]), (PK1[0], PK1[2]))):
    box((a[0], PK1[1], a[1]), (b[0], PK1[1] + 0.002, b[1]), M_SEAM, 'jeans', False)
for rx in (PK0[0] + 0.006, PK1[0] - 0.006):
    grp_add('jeans', cyl((rx, PK1[1] + 0.002, PK0[2] + 0.006), 0.005, 0.003, M_RIV, 12))
# folded note sticking out of the pocket opening (towards -z), tilted up
box((WX + 0.01, PK1[1] + 0.001, PK0[2] - 0.035), (WX + 0.11, PK1[1] + 0.005, PK0[2] + 0.03), M_NOTE, 'jeans', False)

# ---- the note, unfolded flat on the washer top ----
NW, NH = 0.15, 0.065
box((WX - NW / 2, TOP, WZ - NH / 2), (WX + NW / 2, TOP + 0.002, WZ + NH / 2), M_NOTE, 'note_flat', False)

# ---- clothes drier with laundry and the note on a peg ----
DX, DZ = -0.35, 3.0
M_DR = simple_mat('drier', (0.85, 0.86, 0.88), 0.3, 0.8)
M_T1 = noise_mat('towel', (0.85, 0.55, 0.45), (0.8, 0.5, 0.4), 0.95, 60)
M_T2 = noise_mat('tshirt', (0.92, 0.9, 0.86), (0.86, 0.84, 0.8), 0.9, 40)
M_PEG = simple_mat('peg', (0.95, 0.75, 0.2), 0.4)
BARY = 0.95
for sx in (-0.45, 0.45):
    for sz in (-0.22, 0.22):
        grp_add('drier', cyl((DX + sx, 0.0, DZ + sz), 0.008, BARY, M_DR, 8))
for sz in (-0.22, -0.11, 0.0, 0.11, 0.22):
    box((DX - 0.47, BARY, DZ + sz - 0.006), (DX + 0.47, BARY + 0.012, DZ + sz + 0.006), M_DR, 'drier', False)
box((DX - 0.4, 0.55, DZ - 0.23), (DX - 0.02, BARY, DZ - 0.215), M_T1, 'drier', False)      # towel hanging on the near bar side
box((DX - 0.4, 0.55, DZ + 0.215), (DX - 0.02, BARY, DZ + 0.23), M_T1, 'drier', False)
box((DX + 0.05, 0.62, DZ + 0.105), (DX + 0.42, BARY, DZ + 0.12), M_T2, 'drier', False)
# the note: hangs from the near-camera bar (+z side), face towards +z
NZ = DZ + 0.235
box((DX + 0.12 - NW / 2, BARY - NH - 0.01, NZ), (DX + 0.12 + NW / 2, BARY - 0.01, NZ + 0.002), M_NOTEV, 'drier', False)
box((DX + 0.115, BARY - 0.03, NZ + 0.002), (DX + 0.128, BARY + 0.02, NZ + 0.012), M_PEG, 'drier', False)

# laundry visible through the door glass
M_LAUN = tex_mat('laundry', 'laundry.png', 'top', 0.15)
bpy.ops.mesh.primitive_circle_add(vertices=40, radius=0.158, fill_type='NGON', location=P((WX, 0.38, WZ + 0.307)))
o = bpy.context.object; o.rotation_euler = (math.radians(90), 0, 0); o.data.materials.append(M_LAUN); link(o); grp_add('laun', o)
# ---- cat (fed), position per shot ----
CATP = np.array((WX + 0.1, 0.0, WZ + 0.65))
kitty = Cat(CATP, 0.0)


def put_cat(pos, look, tail=0.3):
    c = np.array(pos, float); kitty.root.location = P(tuple(c))
    kitty.root.rotation_euler = (0, 0, yaw_to(c, (look[0], 0, look[2]), 0)); bpy.context.view_layer.update()
    kitty.head(*kitty.look_angles(np.array(look, float))); kitty.tail(tail)
    return c


if want('w1'):
    c = put_cat((WX - 0.12, 0.0, WZ + 0.72), (WX, 0.38, WZ + 0.3))
    state(['cat', 'laun'], L, world=DAY, exp=EXP)
    cam((WX + 0.7, 0.7, WZ + 1.5), (WX - 0.05, 0.38, WZ + 0.35), 0.6)
    print('CAT', screen_pos(c + np.array((0, 0.25, 0))), 'DOOR', screen_pos(np.array((WX, 0.38, WZ + 0.3))))
    shoot(os.path.join(OUT, 'w1.png'))
if want('w2'):
    state(['jeans'], L, world=DAY, exp=EXP)
    cam((WX + 0.05, TOP + 0.5, WZ + 0.45), (WX + 0.06, TOP + 0.02, WZ - 0.05), 0.55)
    shoot(os.path.join(OUT, 'w2.png'))
if want('w3'):
    state(['note_flat'], L, world=DAY, exp=EXP)
    cam((WX, TOP + 0.3, WZ + 0.08), (WX, TOP, WZ), 0.55)
    shoot(os.path.join(OUT, 'w3.png'))
if want('w4'):
    c = put_cat((DX + 0.12, 0.0, DZ + 0.55), (DX + 0.12, BARY - 0.04, NZ), 0.5)
    state(['drier', 'cat'], L, world=DAY, exp=EXP)
    cam((DX + 0.45, 1.05, DZ + 1.9), (DX + 0.1, 0.55, DZ + 0.2), 0.62)
    print('CAT4', screen_pos(c + np.array((0, 0.25, 0))), 'NOTE', screen_pos(np.array((DX + 0.12, BARY - 0.045, NZ))))
    shoot(os.path.join(OUT, 'w4.png'))
print('all done')
