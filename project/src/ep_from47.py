"""«Из 47-й» (sequel to «Гости из доставки»): a knock; on the doormat a plate of pancakes under a tea towel with a note from flat 47;
the pancakes on the table, steaming, the cat on the guest chair.
MODE=stills: k1 closed door, k2 the plate on the doormat (door open) — rendered large for the push-in to the note
MODE=anim:   36-frame steam loop over the pancakes on the table (24 fps)
Run: EP_OUT=ep_from47 MODE=stills BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_from47.py x 24 1080 1920
     EP_OUT=ep_from47 MODE=anim BL_ENGINE=EEVEE EV_SAMPLES=12 WORLD_STR=1.0 python3 ep_from47.py x 12 720 1280"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_from47')
from bkit import *
MODE = os.environ.get('MODE', 'stills')
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT
BIGW, BIGH = int(os.environ.get('BIGW', '1440')), int(os.environ.get('BIGH', '2560'))

light('warm', 'AREA', (1.2, 2.3, 1.9), 30, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
light('dfill', 'AREA', (0.65, 2.2, 1.2), 14, (1.0, 0.85, 0.7), 1.2, (0, -0.6, -1))
light('catfill', 'POINT', (1.45, 0.6, 1.7), 5, (1.0, 0.72, 0.48), 0.2)
EVE = ((0.06, 0.055, 0.055), 1.1)
TBL = ['pend', 'ceilsoft', 'fill', 'win', 'warm']

M_PAN = noise_mat('pancake', (0.86, 0.6, 0.25), (0.95, 0.75, 0.38), 0.55, 30)
M_PAN_E = noise_mat('pancake_edge', (0.7, 0.42, 0.15), (0.82, 0.55, 0.22), 0.6, 30)
M_BUT = simple_mat('butter', (0.98, 0.9, 0.55), 0.35)
M_NOTE47 = tex_mat('note47', 'note47.png', 'top180', 0.8)


def stack(c, g, n=9):
    rng = np.random.default_rng(8)
    for i in range(n):
        dx, dz = rng.uniform(-0.006, 0.006, 2)
        grp_add(g, cyl((c[0] + dx, c[1] + i * 0.007, c[2] + dz), 0.085 + rng.uniform(-0.004, 0.004), 0.007, M_PAN if i % 2 else M_PAN_E, 28))
    top = c[1] + n * 0.007
    box((c[0] - 0.015, top, c[2] - 0.012), (c[0] + 0.015, top + 0.014, c[2] + 0.012), M_BUT, g)
    return top


# ---- on the doormat: plate, pancakes, tea towel, note ----
BG_ = (0.62, 0.0, -0.5)
plate((BG_[0], 0.012, BG_[2]), 'mat', 0.13)
stack((BG_[0], 0.026, BG_[2]), 'mat', 8)
ellip((BG_[0], 0.075, BG_[2]), (0.115, 0.035, 0.115), M_CHECK, 'mat', 3)          # tea towel over the stack
box((BG_[0] - 0.085, 0.111, BG_[2] - 0.06), (BG_[0] + 0.085, 0.113, BG_[2] + 0.06), M_NOTE47, 'mat', False)

# ---- on the table ----
PL = (TXc, 0.762, TZc - 0.22)
plate(PL, 'dinner')
TOP = stack((PL[0], PL[1] + 0.014, PL[2]), 'dinner', 9)
box((PL[0] + 0.14, PL[1] + 0.0, PL[2] + 0.05), (PL[0] + 0.26, PL[1] + 0.002, PL[2] + 0.134), M_NOTE47, 'dinner', False)
CATP = np.array((0.4, 0.48, 2.55))
kitty = Cat(CATP, yaw_to(CATP, (PL[0], 0, PL[2]), 0))
kitty.head(*kitty.look_angles(np.array((PL[0], PL[1] + 0.06, PL[2])))); kitty.tail(0.3)


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


PUFFS = make_puffs(18)


def set_steam(src, ph_, rise=0.3, spread=0.06, r0=0.02, r1=0.06):
    for o, b, ph, rnd in PUFFS:
        a = (ph_ + ph) % 1.0
        pos = np.array(src) + np.array((rnd[0] * 0.04 + rnd[0] * spread * a + 0.012 * math.sin(6 * a + rnd[2] * 3), a * rise, rnd[1] * 0.04 + rnd[1] * spread * a))
        o.location = P(pos); r = r0 + (r1 - r0) * a; o.scale = (r, r, r * 1.2)
        b.inputs['Alpha'].default_value = float(0.1 * math.sin(math.pi * a) ** 1.5)


DCAM = ((1.8, 1.2, 1.75), (0.8, 0.64, 2.6), 0.6)
if MODE == 'stills':
    if want('k1'):
        state([], ['stair', 'win', 'warm', 'dfill'], door=True, world=EVE, exp=0.15)
        cam((0.65, 1.35, 1.9), (0.65, 1.05, 0.0), 0.62)
        shoot(os.path.join(OUT, 'k1.png'))
    if want('k2'):
        sc.render.resolution_x, sc.render.resolution_y = BIGW, BIGH
        state(['stair', 'mat'], ['stair', 'win', 'warm', 'dfill'], door=False, world=EVE, exp=0.2)
        cam((0.66, 1.25, 0.85), (0.63, 0.22, -0.45), 0.62)
        print('NOTE', screen_pos(np.array((BG_[0], 0.11, BG_[2]))))
        shoot(os.path.join(OUT, 'k2.png'))
        sc.render.resolution_x, sc.render.resolution_y = int(sys.argv[3]), int(sys.argv[4])
    if want('k3'):
        state(['dinner', 'cat'], TBL + ['catfill'], world=EVE, exp=0.15)
        cam(*DCAM)
        print('CAT', screen_pos(CATP + np.array((0, 0.25, 0))), 'PLATE', screen_pos(np.array(PL)))
        shoot(os.path.join(OUT, 'k3.png'))
else:
    D = os.path.join(OUT, 'steam'); os.makedirs(D, exist_ok=True)
    state(['dinner', 'cat', 'steam'], TBL + ['catfill'], world=EVE, exp=0.15)
    cam(*DCAM)
    print('CAT', screen_pos(CATP + np.array((0, 0.25, 0))), 'PLATE', screen_pos(np.array(PL)))
    N = int(os.environ.get('NFR', '36'))
    for fi in range(N):
        set_steam((PL[0], TOP + 0.02, PL[2]), fi / 36.0)
        kitty.tail(0.35 * math.sin(2 * math.pi * fi / 36)); kitty.blink([1, 0.4, 0.08, 0.4][fi - 20] if 20 <= fi < 24 else 1.0)
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
print('all done')
