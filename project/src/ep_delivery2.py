import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_delivery2')
from bkit import *
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT
light('warm', 'AREA', (1.2, 2.3, 1.9), 30, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
EVE = ((0.06, 0.055, 0.055), 1.1)
# fed cat with a full bowl near the table
CATP = np.array((1.95, 0.0, 3.15))
kitty = Cat(CATP, 0.0)
BOWLP = (2.2, 0.022, 3.35)
bowl(BOWLP, 'cat')
M_KIB = simple_mat('kibble', (0.42, 0.24, 0.1), 0.7)
rng = np.random.default_rng(3)
for i in range(16):
    a = rng.uniform(0, 2 * math.pi); r = rng.uniform(0, 0.05)
    ellip((BOWLP[0] + r * math.cos(a), 0.05 + rng.uniform(0, 0.012), BOWLP[2] + r * math.sin(a)), (0.012, 0.009, 0.012), M_KIB, 'cat', 1)
M_PAPER = noise_mat('paperbag', (0.62, 0.45, 0.28), (0.68, 0.5, 0.32), 0.9, 40)
BG_ = (0.62, 0.0, -0.5)
box((BG_[0] - 0.15, 0.0, BG_[2] - 0.085), (BG_[0] + 0.15, 0.38, BG_[2] + 0.085), M_PAPER, 'bag')
box((BG_[0] - 0.14, 0.03, BG_[2] + 0.085), (BG_[0] + 0.14, 0.36, BG_[2] + 0.086), tex_mat('bagf', 'bag_front.png', 'front_pz', 0.85), 'bag', False)
for sx in (-1, 1):
    bpy.ops.mesh.primitive_torus_add(major_radius=0.05, minor_radius=0.005, location=P((BG_[0] + sx * 0.06, 0.38, BG_[2])))
    o = bpy.context.object; o.rotation_euler = (math.radians(90), 0, 0); o.data.materials.append(M_PAPER); link(o); grp_add('bag', o)
# rolls tray on the table
M_TRAY = simple_mat('tray', (0.03, 0.03, 0.03), 0.3); M_NORI = simple_mat('nori', (0.04, 0.07, 0.04), 0.6)
M_RICE = noise_mat('rice', (0.95, 0.94, 0.9), (0.85, 0.84, 0.8), 0.7, 120); M_SALM = simple_mat('salmon', (0.95, 0.45, 0.25), 0.4)
M_CUC = simple_mat('cuc', (0.4, 0.7, 0.25), 0.4); M_GING = simple_mat('ginger', (0.95, 0.7, 0.65), 0.5); M_WAS = simple_mat('wasabi', (0.5, 0.75, 0.2), 0.6)
M_STICK = simple_mat('sticks', (0.82, 0.68, 0.45), 0.6)
TR = (TXc, 0.762, TZc - 0.1)
box((TR[0] - 0.14, TR[1], TR[2] - 0.1), (TR[0] + 0.14, TR[1] + 0.012, TR[2] + 0.1), M_TRAY, 'rolls')
for r in range(2):
    for c in range(4):
        x = TR[0] - 0.09 + c * 0.05; z = TR[2] - 0.045 + r * 0.055
        grp_add('rolls', cyl((x, TR[1] + 0.012, z), 0.022, 0.028, M_NORI, 16))
        grp_add('rolls', cyl((x, TR[1] + 0.04, z), 0.019, 0.001, M_RICE, 16))
        grp_add('rolls', cyl((x, TR[1] + 0.0405, z), 0.008, 0.001, M_SALM if (r + c) % 2 else M_CUC, 12))
ellip((TR[0] + 0.115, TR[1] + 0.02, TR[2] - 0.05), (0.022, 0.012, 0.02), M_GING, 'rolls', 2)
ellip((TR[0] + 0.115, TR[1] + 0.02, TR[2] + 0.04), (0.012, 0.01, 0.012), M_WAS, 'rolls', 2)
for dz in (-0.004, 0.004):
    box((TR[0] - 0.12, TR[1] + 0.012, TR[2] + 0.12 + dz), (TR[0] + 0.12, TR[1] + 0.018, TR[2] + 0.125 + dz), M_STICK, 'rolls')
PHD = tex_mat('phdel', 'phone_delivery.png', 'top', 0.25, emit=1.6)
TBL = ['pend', 'ceilsoft', 'fill', 'win', 'warm']
def put_cat(pos, look):
    global CATP
    CATP = np.array(pos, float); kitty.root.location = P(tuple(CATP))
    kitty.root.rotation_euler = (0, 0, yaw_to(CATP, (look[0], 0, look[2]), 0))
    bpy.context.view_layer.update()
    kitty.head(*kitty.look_angles(np.array(look, float))); kitty.tail(0.3)
def look_at_rolls():
    put_cat((0.4, SEAT, 2.55), (TR[0], TR[1], TR[2]))
SEAT = float(os.environ.get('SEAT', '0.46'))
DCAM = ((1.8, 1.2, 1.75), (0.8, 0.64, 2.6), 0.6)
if want('d1'):
    state(['stair', 'bag'], ['stair', 'win', 'warm'], door=False, exp=0.2)
    cam((0.66, 1.25, 0.85), (0.63, 0.22, -0.45)); shoot(os.path.join(OUT, 'd1.png'))
if want('d2'):
    look_at_rolls()
    state(['rolls', 'cat'], TBL, exp=0.15)
    cam(*DCAM); print('CAT', screen_pos(CATP + np.array((0, 0.25, 0)))); shoot(os.path.join(OUT, 'd2.png'))
if want('d3'):
    state(['cat'], ['fr1', 'fr2', 'frfill', 'win', 'warm', 'pend'], fr=105, fr_warm=0.0)
    put_cat((2.05, 0.0, 1.55), (2.6, 0.9, 1.5))
    cam((0.75, 1.25, 0.55), (2.45, 0.85, 1.6), 0.6); print('CAT3', screen_pos(CATP + np.array((0, 0.25, 0)))); shoot(os.path.join(OUT, 'd3.png'))
if want('d4'):
    look_at_rolls()
    state(['cat'], TBL, exp=0.15)
    cam(*DCAM); print('CAT', screen_pos(CATP + np.array((0, 0.25, 0)))); shoot(os.path.join(OUT, 'd4.png'))
if want('d5'):
    state(['phone'], ['ceilsoft', 'win', 'warm'], phone=PHD, exp=0.15)
    cam((PH[0] - 0.005, 1.02, PH[2] - 0.05), (PH[0], 0.765, PH[2] + 0.003), 0.4); shoot(os.path.join(OUT, 'd5.png'))
print('all done')
