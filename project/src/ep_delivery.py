import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_delivery')
from bkit import *
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
PHD = tex_mat('phdel', 'phone_delivery.png', 'top', 0.2, emit=1.6)
TBL = ['pend', 'ceilsoft', 'fill', 'win']
state(['stair', 'bag'], ['stair', 'win'], door=False)
cam((0.66, 1.25, 0.85), (0.63, 0.22, -0.45)); shoot(os.path.join(OUT, 'd1.png'))
state(['rolls'], TBL, exp=-0.2)
cam((TXc - 0.05, 1.2, TZc - 0.55), (TR[0], TR[1] + 0.02, TR[2] + 0.01)); shoot(os.path.join(OUT, 'd2.png'))
state([], ['fr1', 'fr2', 'frfill', 'win'], fr=105, fr_warm=0.0)
cam((1.42, 1.0, 1.5), (2.6, 0.92, 1.5)); shoot(os.path.join(OUT, 'd3.png'))
state(['phone'], ['pend', 'ceilsoft', 'win', 'phone'], phone=PHD)
cam((PH[0] - 0.03, 0.95, PH[2] - 0.11), (PH[0], 0.765, PH[2] + 0.005)); shoot(os.path.join(OUT, 'd4.png'))
