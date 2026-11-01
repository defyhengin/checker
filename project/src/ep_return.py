import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_return')
from bkit import *

MODE = os.environ.get('MODE', 'stills')
# backsplash: only behind the counters
_spl = [o for o in coll.objects if o.type == 'MESH' and o.data.materials and o.data.materials[0].name == 's_splash']
_spm = _spl[0].data.materials[0] if _spl else None
for o in _spl:
    bpy.data.objects.remove(o, do_unlink=True)
if _spm:
    mbox((2.98, 0.9, 1.9), (3.0, 1.45, 4.5), _spm, bevel=False)
# traces + wall note
M_CLEANF = simple_mat('clean_floor', (0.6, 0.42, 0.24), 0.5); M_CLEANW = simple_mat('clean_wall', (0.74, 0.72, 0.66), 0.85)
M_DUST = simple_mat('dust', (0.33, 0.3, 0.27), 0.9); M_SOCK = simple_mat('socket', (0.9, 0.9, 0.88), 0.4)
x0, x1, z0, z1 = 2.32, 2.98, 1.15, 1.85
box((x0 - 0.02, 0.0, z0 - 0.02), (x1, 0.004, z1 + 0.02), M_DUST, 'trace', False)
box((x0 + 0.01, 0.0, z0 + 0.01), (x1, 0.006, z1 - 0.01), M_CLEANF, 'trace', False)
box((2.993, 0.0, z0 + 0.02), (2.998, 1.86, z1 - 0.02), M_CLEANW, 'trace', False)
mbox((2.985, 0.25, 1.62), (2.998, 0.33, 1.7), M_SOCK)
box((2.986, 1.34, 1.38), (2.99, 1.5, 1.62), tex_mat('wnote', 'note2_tex.png', 'front_mx', 0.8), 'trace', False)
# note on the fridge door (moves with the door)
dn = mbox((2.254, 1.22, 1.36), (2.258, 1.4, 1.6), tex_mat('dnote', 'note3_tex.png', 'front_mx', 0.8), False)
bpy.context.view_layer.update(); dn.parent = hinge; dn.matrix_parent_inverse = hinge.matrix_world.inverted()

HOME = np.array((2.65, 0.0, 1.5))
PATH = [np.array(p) for p in ((0.65, 0, -1.0), (0.65, 0, -0.45), (0.66, 0, 0.12), (0.92, 0, 0.72), (1.5, 0, 1.12), (2.1, 0, 1.42), (2.65, 0, 1.5))]
HOP = 0.62   # seconds per hop (air 0.46 + ground 0.16)


def fridge_pose(t):
    """t from 0: returns pos, yaw_deg, squash"""
    nh = len(PATH) - 1
    k = min(int(t / HOP), nh - 1); u = (t - k * HOP) / HOP
    if t >= nh * HOP:
        return PATH[-1], 0.0, 1.0
    air = 0.74
    if u < air:
        s = u / air; pos = PATH[k] + (PATH[k + 1] - PATH[k]) * (s * s * (3 - 2 * s)); pos = pos.copy(); pos[1] = 0.13 * math.sin(math.pi * s)
        sq = 1.0 + 0.05 * math.sin(math.pi * s)
    else:
        s = (u - air) / (1 - air); pos = PATH[k + 1].copy(); sq = 1.0 - 0.07 * math.sin(math.pi * s)
    yaw = 90.0 if k < 3 else 90.0 * (1 - min(1, (k - 3 + min(u / air, 1)) / 3))
    return pos, yaw, sq


def set_fridge(pos, yaw, sq):
    FRIDGE.location = P(pos); FRIDGE.rotation_euler = (0, 0, math.radians(yaw)); FRIDGE.scale = (1 / math.sqrt(sq), 1 / math.sqrt(sq), sq)


light('moon', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 30, (0.4, 0.5, 0.95), 1.5, (0, 0, -1))
light('nfill', 'AREA', (1.0, 2.3, 1.8), 8, (0.6, 0.65, 0.9), 2.0, (0.6, -1, -0.3))
NIGHT = ((0.02, 0.025, 0.04), 1.3)
if MODE == 'stills':
    set_fridge(PATH[0], 90, 1.0)
    state(['trace'], ['moon', 'nfill'], world=NIGHT, exp=0.7)
    cam((1.25, 1.5, 2.65), (2.9, 0.95, 1.5)); shoot(os.path.join(OUT, 'n1.png'))
    state(['trace', 'stair'], ['moon', 'nfill', 'stair'], door=False, world=NIGHT)
    cam((0.66, 1.4, 1.9), (0.64, 0.95, -0.6)); shoot(os.path.join(OUT, 'n2.png'))
    set_fridge(PATH[-1], 0, 1.0)
    state(['trace', 'stair'], ['moon', 'nfill', 'stair'], door=False, world=NIGHT)
    cam((1.62, 1.38, 1.52), (2.256, 1.3, 1.48)); shoot(os.path.join(OUT, 'n4.png'))
    cam((0.6, 1.55, 2.9), (2.65, 0.85, 1.5)); shoot(os.path.join(OUT, 'n5.png'))
else:
    D = os.path.join(OUT, 'hop'); os.makedirs(D, exist_ok=True)
    state(['trace', 'stair'], ['moon', 'nfill', 'stair'], door=False, world=NIGHT)
    T = (len(PATH) - 1) * HOP + 0.4; N = int(T * 24)
    C = np.array((0.15, 1.5, 2.85)); yaw_s = None
    STEP = int(os.environ.get('STEP', '2'))
    for fi in range(N):
        if fi % STEP and fi != N - 1:
            continue
        t = fi / 24.0
        pos, yaw, sq = fridge_pose(t); set_fridge(pos, yaw, sq)
        tgt = pos + np.array((0, 0.85, 0))
        # smooth follow: aim slightly ahead along the path
        pos2, _, _ = fridge_pose(t + 0.25); tgt = (pos + pos2) / 2 + np.array((0, 0.85, 0))
        cam(C, tgt)
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
    print('frames', N)
