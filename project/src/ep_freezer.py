"""«Морозилка»: the fridge is empty, but in the freezer there is one dumpling, frozen since summer. It becomes dinner — for one.
MODE=stills: z1 big still (open fridge, glide up to the freezer), z2 the dumpling in the frost (close),
             z4 plate on the table (the cat beside its full bowl)
MODE=anim:   36-frame steam loop over the plate (24 fps)
Run: EP_OUT=ep_freezer MODE=stills BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_freezer.py x 24 1080 1920
     EP_OUT=ep_freezer MODE=anim BL_ENGINE=EEVEE EV_SAMPLES=12 WORLD_STR=1.0 python3 ep_freezer.py x 12 720 1280"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_freezer')
from bkit import *
MODE = os.environ.get('MODE', 'stills')
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT
BIGW, BIGH = int(os.environ.get('BIGW', '1440')), int(os.environ.get('BIGH', '2560'))

light('warm', 'AREA', (1.2, 2.3, 1.9), 30, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
light('frz', 'POINT', (2.45, 1.62, 1.5), 4, (0.75, 0.88, 1.0), 0.1)
light('catfill', 'POINT', (1.45, 0.6, 1.7), 5, (1.0, 0.72, 0.48), 0.2)
EVE = ((0.06, 0.055, 0.055), 1.1)
TBL = ['pend', 'ceilsoft', 'fill', 'win', 'warm']

# ---- freezer compartment at the top of the fridge, frosted, open front ----
M_FROST = noise_mat('frost', (0.66, 0.78, 0.9), (0.85, 0.92, 0.98), 0.6, 90)
M_ICE = simple_mat('ice', (0.8, 0.9, 1.0), 0.15)
FY0, FY1, FX0, FX1, FZ0, FZ1 = 1.4, 1.74, 2.42, 2.9, 1.24, 1.76
box((FX0, FY0, FZ0), (FX1, FY0 + 0.025, FZ1), M_FROST, 'frz')           # floor
box((FX0, FY1 - 0.025, FZ0), (FX1, FY1, FZ1), M_FROST, 'frz')           # roof
box((FX1 - 0.025, FY0, FZ0), (FX1, FY1, FZ1), M_FROST, 'frz')           # back
box((FX0, FY0, FZ0), (FX1, FY1, FZ0 + 0.025), M_FROST, 'frz')           # sides
box((FX0, FY0, FZ1 - 0.025), (FX1, FY1, FZ1), M_FROST, 'frz')
rng = np.random.default_rng(11)
for i in range(14):                                                         # frost lumps / icicles
    x = rng.uniform(FX0 + 0.2, FX1 - 0.05); z = rng.uniform(FZ0 + 0.04, FZ1 - 0.04)
    ellip((x, FY0 + 0.025, z), (rng.uniform(0.012, 0.03), rng.uniform(0.004, 0.01), rng.uniform(0.012, 0.03)), M_FROST, 'frz', 1)
for i in range(7):
    x = rng.uniform(FX0 + 0.04, FX1 - 0.06); z = rng.uniform(FZ0 + 0.05, FZ1 - 0.05)
    ellip((x, FY1 - 0.04, z), (0.008, rng.uniform(0.02, 0.04), 0.008), M_ICE, 'frz', 1)
# the dumpling: half-moon body + pinched crest, frosted
M_DOUGH = noise_mat('dough', (0.86, 0.72, 0.48), (0.93, 0.83, 0.62), 0.55, 50)
M_DOUGH_W = noise_mat('dough_warm', (0.95, 0.88, 0.72), (0.99, 0.94, 0.82), 0.4, 50)


def dumpling(c, m, g, rot=0.4):
    b = ellip(c, (0.04, 0.018, 0.027), m, g, 2, (0, 0, rot))
    ellip((c[0], c[1] + 0.014, c[2]), (0.037, 0.008, 0.007), m, g, 2, (0, 0, rot))
    return b


DP = (FX0 + 0.12, FY0 + 0.042, 1.5)
dumpling(DP, M_DOUGH, 'frz')
M_RIME = simple_mat('rime', (0.92, 0.96, 1.0), 0.8)
for i in range(14):
    a = rng.uniform(0, 2 * math.pi)
    ellip((DP[0] + 0.022 * math.cos(a), DP[1] + 0.006 + rng.uniform(0, 0.01), DP[2] + 0.015 * math.sin(a)), (0.003, 0.0015, 0.003), M_RIME, 'frz', 1)

# ---- dinner on the table ----
PL = (TXc, 0.762, TZc - 0.22)
plate(PL, 'dinner')
dumpling((PL[0], PL[1] + 0.03, PL[2]), M_DOUGH_W, 'dinner', 0.2)
M_FORK = simple_mat('fork', (0.75, 0.75, 0.77), 0.25, 1.0)
box((PL[0] + 0.16, PL[1], PL[2] - 0.09), (PL[0] + 0.175, PL[1] + 0.006, PL[2] + 0.09), M_FORK, 'dinner')

# cat (fed) by its full bowl, looking at the plate
CATP = np.array((0.4, 0.48, 2.55))
kitty = Cat(CATP, yaw_to(CATP, (PL[0], 0, PL[2]), 0))
BOWLP = (1.95, 0.022, 3.25); bowl(BOWLP, 'dinner')
M_KIB = simple_mat('kibble', (0.42, 0.24, 0.1), 0.7)
for i in range(18):
    a = rng.uniform(0, 2 * math.pi); r = rng.uniform(0, 0.055)
    ellip((BOWLP[0] + r * math.cos(a), 0.072 + rng.uniform(0, 0.016) * (1 - r / 0.06), BOWLP[2] + r * math.sin(a)), (0.012, 0.009, 0.012), M_KIB, 'dinner', 1)
kitty.head(*kitty.look_angles(np.array((PL[0], PL[1] + 0.05, PL[2])))); kitty.tail(0.3)

# steam
def make_puffs(n):
    out = []
    for i in range(n):
        m = bpy.data.materials.new(f'st{i}'); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.9, 0.92, 0.95, 1)
        b.inputs['Emission Color'].default_value = (1, 0.95, 0.9, 1); b.inputs['Emission Strength'].default_value = 0.4; b.inputs['Roughness'].default_value = 1.0
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            m.blend_method = 'BLEND'
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
        o = bpy.context.object; o.data.materials.append(m); link(o); bpy.ops.object.shade_smooth(); grp_add('steam', o)
        out.append((o, b, i / n, np.random.default_rng(i + 7).uniform(-1, 1, 3)))
    return out


PUFFS = make_puffs(16)


def set_steam(src, ph_, rise=0.26, spread=0.05, r0=0.018, r1=0.055):
    for o, b, ph, rnd in PUFFS:
        a = (ph_ + ph) % 1.0
        pos = np.array(src) + np.array((rnd[0] * 0.02 + rnd[0] * spread * a + 0.012 * math.sin(6 * a + rnd[2] * 3), a * rise, rnd[1] * 0.02 + rnd[1] * spread * a))
        o.location = P(pos); r = r0 + (r1 - r0) * a; o.scale = (r, r, r * 1.2)
        b.inputs['Alpha'].default_value = float(0.1 * math.sin(math.pi * a) ** 1.5)


DCAM = ((1.8, 1.2, 1.75), (0.8, 0.64, 2.6), 0.6)
if MODE == 'stills':
    if want('z1'):
        sc.render.resolution_x, sc.render.resolution_y = BIGW, BIGH
        state(['frz'], ['fr1', 'fr2', 'frfill', 'win', 'warm', 'frz'], fr=105, fr_warm=0.0, world=EVE, exp=0.0)
        cam((1.05, 1.15, 1.5), (2.6, 1.05, 1.5), 0.7)
        print('DUMP', screen_pos(np.array(DP)), 'FRZ', screen_pos(np.array((FX0, FY0 + 0.15, 1.5))))
        shoot(os.path.join(OUT, 'z1.png'))
        sc.render.resolution_x, sc.render.resolution_y = int(sys.argv[3]), int(sys.argv[4])
    if want('z2'):
        state(['frz'], ['fr1', 'fr2', 'frfill', 'frz'], fr=105, fr_warm=0.0, world=EVE, exp=-0.7)
        cam((DP[0] - 0.32, DP[1] + 0.12, DP[2] - 0.03), DP, 0.3)
        shoot(os.path.join(OUT, 'z2.png'))
    if want('z4'):
        state(['dinner', 'cat'], TBL + ['catfill'], world=EVE, exp=0.1)
        cam(*DCAM)
        print('CAT', screen_pos(CATP + np.array((0, 0.25, 0))), 'PLATE', screen_pos(np.array(PL)))
        shoot(os.path.join(OUT, 'z4.png'))
else:
    D = os.path.join(OUT, 'steam'); os.makedirs(D, exist_ok=True)
    state(['dinner', 'cat', 'steam'], TBL + ['catfill'], world=EVE, exp=0.1)
    cam(*DCAM)
    for fi in range(36):
        set_steam((PL[0], PL[1] + 0.05, PL[2]), fi / 36.0)
        kitty.tail(0.35 * math.sin(2 * math.pi * fi / 36))
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
print('all done')
