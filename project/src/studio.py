"""Studio apartment assembled from the furniture kit (fast engine)."""
import os, sys
os.environ.setdefault('ENG_W', '1280'); os.environ.setdefault('ENG_H', '720'); os.environ.setdefault('ENG_TANY', '0.5')
import numpy as np
from PIL import Image
import eng, apt
from eng import box, sph, cyl, disc, zdisc, cap, grp, f32
import furniture as F

M = apt.M
for nm, a, s_ in [('s_wall', (0.80, 0.76, 0.68), 0.0), ('s_floor', (1, 1, 1), 0.15), ('s_tile', (1, 1, 1), 0.3), ('s_ceil', (0.85, 0.85, 0.83), 0.0),
                  ('s_door', (0.45, 0.28, 0.15), 0.15), ('s_frame', (0.92, 0.92, 0.9), 0.1), ('s_win', (1, 1, 1), 0.0), ('s_lamp', (1, 1, 1), 0.0),
                  ('s_part', (0.70, 0.78, 0.80), 0.05), ('s_splash', (1, 1, 1), 0.3)]:
    apt.mat(nm, a, s_)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)

X0, X1, Z0, Z1, H = -3.0, 3.0, 0.0, 5.5, 2.6
BX, BZ = -1.0, 2.3          # bathroom partition (x = BX, z = BZ)
WIN = (1.0, 2.6, 1.0, 2.1)  # back-wall window x0, x1, y0, y1
TABLE = (1.15, 2.55)        # dining table centre


def shell():
    w = M['s_wall']; t = 0.1
    s = [box((X0 - t, -0.02, Z0), (X1 + t, 0.0, Z1), M['s_floor']),
         box((X0 - t, H, Z0 - t), (X1 + t, H + t, Z1 + t), M['s_ceil']),
         box((X0 - t, 0, Z0 - t), (X0, H, Z1 + t), w), box((X1, 0, Z0 - t), (X1 + t, H, Z1 + t), w),
         # front wall with entrance door opening x[0.2,1.1]
         box((X0, 0, Z0 - t), (0.2, H, Z0), w), box((1.1, 0, Z0 - t), (X1, H, Z0), w), box((0.2, 2.1, Z0 - t), (1.1, H, Z0), w),
         box((0.22, 0, Z0 - 0.06), (1.08, 2.08, Z0 - 0.02), M['s_door']), sph((1.0, 1.0, Z0 - 0.01), 0.025, M['f_steel']),
         # back wall with window
         box((X0, 0, Z1), (WIN[0], H, Z1 + t), w), box((WIN[1], 0, Z1), (X1, H, Z1 + t), w),
         box((WIN[0], 0, Z1), (WIN[1], WIN[2], Z1 + t), w), box((WIN[0], WIN[3], Z1), (WIN[1], H, Z1 + t), w),
         box((WIN[0], WIN[2], Z1 + 0.05), (WIN[1], WIN[3], Z1 + 0.06), M['s_win'], ns=True),
         box((WIN[0] - 0.05, WIN[2] - 0.06, Z1 - 0.12), (WIN[1] + 0.05, WIN[2], Z1 + 0.02), M['s_frame']),
         box(((WIN[0] + WIN[1]) / 2 - 0.025, WIN[2], Z1 + 0.02), ((WIN[0] + WIN[1]) / 2 + 0.025, WIN[3], Z1 + 0.05), M['s_frame']),
         # bathroom partition: wall along x=BX (door opening z[1.35,2.15]) and along z=BZ
         box((BX - 0.05, 0, Z0), (BX + 0.05, H, 1.35), M['s_part']), box((BX - 0.05, 2.1, 1.35), (BX + 0.05, H, 2.15), M['s_part']),
         box((BX - 0.05, 0, 2.15), (BX + 0.05, H, BZ + 0.05), M['s_part']),
         box((X0, 0, BZ - 0.05), (BX + 0.05, H, BZ + 0.05), M['s_part']),
         box((X0, 0.0, Z0), (BX - 0.05, 0.002, BZ - 0.05), M['s_tile']),
         # kitchen backsplash
         box((X1 - 0.02, 0.9, 1.15), (X1, 1.45, 4.5), M['s_splash']),
         # ceiling lamp + pendant over the dining table
         sph((0.0, H - 0.08, 2.9), 0.09, M['s_lamp'], ns=True), cyl(0.0, 2.9, 0.16, H - 0.06, H - 0.01, M['f_white'], M['f_white']),
         box((TABLE[0] - 0.005, 1.7, TABLE[1] - 0.005), (TABLE[0] + 0.005, H, TABLE[1] + 0.005), M['f_black'], ns=True), sph((TABLE[0], 1.62, TABLE[1]), 0.05, M['s_lamp'], ns=True),
         cyl(TABLE[0], TABLE[1], 0.16, 1.66, 1.78, M['f_lamp_b'], M['f_lamp_b'])]
    return s


def furniture():
    P = []
    put = lambda fn, x, z, r=0, y=0.0: P.extend(F.place(_lift(fn(), y), x, z, r))
    # bathroom
    put(F.bathtub, -2.05, 0.45, 1)
    put(F.toilet, -2.7, 1.85, 1)
    put(F.bath_sink, -2.75, 1.05, 1)
    # kitchen along the right wall, fronts face -x
    put(F.fridge, 2.65, 1.5, 3)
    put(F.base_cabinet, 2.7, 2.2, 3); put(F.sink_cabinet, 2.7, 2.85, 3); put(F.stove, 2.7, 3.5, 3); put(F.base_cabinet, 2.7, 4.15, 3)
    put(F.wall_cabinet, 2.83, 2.2, 3); put(F.wall_cabinet, 2.83, 2.85, 3); put(F.wall_cabinet, 2.83, 4.15, 3)
    put(F.range_hood, 2.75, 3.5, 3)
    put(F.microwave, 2.72, 2.2, 3, 0.9); put(F.kettle, 2.75, 4.05, 3, 0.9); put(F.pot, 2.66, 3.36, 3, 0.92)
    # dining (moved away from the fridge)
    put(F.dining_table, TABLE[0], TABLE[1]); put(F.chair, TABLE[0] - 0.8, TABLE[1], 1); put(F.chair, TABLE[0], TABLE[1] - 0.6, 2)
    # living: red sofa where the TV stood
    put(F.rug, 0.3, 4.1)
    put(lambda: F.sofa(2, 'sofa_r'), 0.25, 5.04)
    # sleeping
    put(F.bed, -2.2, 4.45)
    put(F.nightstand, -1.22, 5.22)
    put(F.plant, -2.72, 2.7)
    # work corner by the window
    put(F.desk, 1.95, 5.12); put(F.office_chair, 1.95, 4.5, 2)
    # entrance: wardrobe where the bookshelf was, washer where the wardrobe was
    put(F.wardrobe, 2.45, 0.32, 2)
    put(F.washer, -0.45, 0.32, 2)
    return P


def _lift(parts, y):
    if not y:
        return parts
    out = []
    for p in parts:
        k = p[0]
        if k in ('box',):
            out.append((k, (p[1][0], p[1][1] + y, p[1][2]), (p[2][0], p[2][1] + y, p[2][2]), p[3]))
        elif k == 'sph':
            out.append((k, (p[1][0], p[1][1] + y, p[1][2]), p[2], p[3]))
        elif k == 'cap':
            out.append((k, (p[1][0], p[1][1] + y, p[1][2]), (p[2][0], p[2][1] + y, p[2][2]), p[3], p[4]))
        elif k == 'cyl':
            out.append((k, p[1], p[2], p[3], p[4] + y, p[5] + y, p[6]))
        elif k in ('disc', 'zdisc'):
            out.append((k, p[1], p[2] + y, p[3], p[4], p[5]))
        else:
            out.append(p)
    return out


def tex(mid, Px, Py, Pz, alb, nx, ny, nz, t):
    m = mid == M['s_floor']
    if m.any():
        plank = np.floor(Px / 0.18)
        g = 0.82 + 0.1 * np.sin(Pz * 9 + plank * 3.1) + 0.08 * ((plank % 3) - 1) / 1.0
        seam = ((Px / 0.18) % 1) < 0.03
        c = np.array([0.55, 0.36, 0.20], f32)
        alb[m] = c * np.where(seam, 0.6, g)[m][:, None]
    for key, sz, base in (('s_tile', 0.3, (0.78, 0.82, 0.84)), ('s_splash', 0.15, (0.85, 0.88, 0.86))):
        m = mid == M[key]
        if m.any():
            a = Px if key == 's_tile' else Pz
            gr = ((a / sz) % 1 < 0.05) | (((Pz if key == 's_tile' else Py) / sz) % 1 < 0.05)
            alb[m] = np.array(base, f32) * np.where(gr, 0.6, 1.0)[m][:, None]
    return alb, nx, ny, nz


_rw = np.random.default_rng(12)
_LIT = _rw.random((6, 8)) < 0.35


def window_emit(Px, Py, Pz, t):
    u = (Px - WIN[0]) / (WIN[1] - WIN[0]); v = (Py - WIN[2]) / (WIN[3] - WIN[2])
    col = np.zeros((Px.shape[0], 3), f32) + np.array([0.02, 0.035, 0.08], f32) + np.array([0.03, 0.03, 0.05], f32) * v[:, None]
    bld = (v < 0.8) & (u > 0.06) & (u < 0.8)
    col[bld] = (0.012, 0.012, 0.018)
    gu = (u - 0.08) / 0.7 * 8; gv = (0.76 - v) / 0.7 * 6
    iu = np.clip(gu.astype(int), 0, 7); iv = np.clip(gv.astype(int), 0, 5)
    ins = bld & (gu > 0) & (gv > 0) & ((gu % 1) > 0.25) & ((gu % 1) < 0.75) & ((gv % 1) > 0.3) & ((gv % 1) < 0.75)
    col[ins & _LIT[iv, iu]] = (0.55, 0.40, 0.2)
    col[ins & ~_LIT[iv, iu]] = (0.02, 0.022, 0.03)
    return col


def lamp_emit(Px, Py, Pz, t):
    return np.zeros((Px.shape[0], 3), f32) + np.array([1.0, 0.85, 0.6], f32) * 4.0


PRIMS = None


def scene(cam, tgt, mood='evening'):
    global PRIMS
    if PRIMS is None:
        PRIMS = shell() + furniture()
    lights = [dict(p=(0.0, H - 0.2, 2.9), col=(1.0, 0.88, 0.7), I=1.1, att=(0.5, 0.35)),
              dict(p=(TABLE[0], 1.58, TABLE[1]), col=(1.0, 0.8, 0.55), I=0.55, att=(0.2, 1.0), dir=(0, -1, 0), cos=(0.2, 0.75), shadow=False),
              dict(p=(-2.0, H - 0.25, 1.15), col=(0.9, 0.95, 1.0), I=0.6, att=(0.3, 0.8)),
              dict(p=(1.8, 1.6, 6.5), col=(0.45, 0.55, 0.85), I=0.4, att=(0.5, 0.1), dir=(0, -0.4, -1), cos=(0.4, 0.85), shadow=False)]
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=PRIMS, alb=apt.ALB, spec=apt.SPEC, tex=tex, amb=0.06, exp=1.3,
                emit={M['s_win']: window_emit, M['s_lamp']: lamp_emit}, lights=lights, bg=0.0)


VIEWS = {
    'v1_vhod': ((0.65, 1.6, 0.35), (-0.6, 1.0, 4.6)),
    'v2_kuhnya': ((0.0, 1.6, 2.2), (2.9, 1.0, 3.0)),
    'v3_gostinaya': ((2.25, 1.6, 3.55), (-1.3, 0.75, 4.1)),
    'v4_krovat': ((0.9, 1.6, 2.2), (-2.4, 0.7, 4.7)),
    'v5_okno': ((-0.4, 1.5, 2.6), (1.8, 1.2, 5.5)),
    'v6_vannaya': ((-1.15, 1.6, 2.05), (-2.6, 0.7, 0.4)),
}

if __name__ == '__main__':
    names = sys.argv[1:] or list(VIEWS)
    for n in names:
        if n == 'plan':
            os.environ['ENG_TANY'] = '0.5'
            global_prims = shell()[3:] if False else None
            sc = scene((0.0, 9.0, 2.75 - 0.001), (0.0, 0.0, 2.75))
            sc['prims'] = [p for i, p in enumerate(PRIMS) if i != 1]   # drop the ceiling
            sc['amb'] = 0.25
            img = eng.render(sc, 1.0)
        else:
            cam, tgt = VIEWS[n]
            img = eng.render(scene(cam, tgt), 1.0)
        Image.fromarray(img).save(f'st_{n}.png'); print(n, flush=True)
