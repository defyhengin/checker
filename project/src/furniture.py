"""Low-poly furniture kit for a small studio apartment (fast engine).

Every model is built in local coordinates: floor at y=0, centred on x=z=0, FRONT facing -z.
`place(parts, x, z, rot)` puts it in the world; rot is a multiple of 90 degrees (0..3).
"""
import numpy as np
import apt
from eng import box, cyl, disc, sph, cap, zdisc, grp, f32

_C = {
    'wood': (0.48, 0.27, 0.12), 'wood_d': (0.33, 0.18, 0.08), 'wood_l': (0.78, 0.60, 0.38), 'top_w': (0.92, 0.92, 0.90),
    'white': (0.90, 0.90, 0.88), 'black': (0.06, 0.06, 0.07), 'steel': (0.62, 0.63, 0.66), 'dark_glass': (0.08, 0.09, 0.11),
    'sofa_g': (0.38, 0.62, 0.20), 'sofa_g2': (0.30, 0.52, 0.15), 'sofa_r': (0.78, 0.38, 0.36), 'sofa_r2': (0.66, 0.30, 0.29),
    'bed_w': (0.95, 0.95, 0.93), 'blanket': (0.20, 0.33, 0.62), 'water_b': (0.18, 0.32, 0.62), 'copper': (0.72, 0.42, 0.22),
    'lamp_y': (0.95, 0.80, 0.30), 'lamp_b': (0.20, 0.45, 0.75), 'leaf': (0.25, 0.55, 0.20), 'pot_t': (0.70, 0.35, 0.20),
    'rug': (0.55, 0.20, 0.18), 'book1': (0.75, 0.15, 0.15), 'book2': (0.15, 0.40, 0.70), 'book3': (0.90, 0.75, 0.20),
    'book4': (0.20, 0.55, 0.35), 'mirror': (0.70, 0.82, 0.88), 'chair_y': (0.92, 0.78, 0.15), 'screen_f': (0.10, 0.14, 0.22),
}
_SPEC = {'top_w': 0.3, 'white': 0.25, 'steel': 0.8, 'dark_glass': 0.9, 'black': 0.4, 'mirror': 1.2, 'water_b': 0.6, 'copper': 0.7,
         'screen_f': 0.9, 'bed_w': 0.05}
FM = {}
for k, c in _C.items():
    FM[k] = apt.mat('f_' + k, c, _SPEC.get(k, 0.08))
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)


# ---------- part helpers (local coords) ----------
def B(a, b, m): return ('box', a, b, m)
def C(cx, cz, r, y0, y1, m): return ('cyl', cx, cz, r, y0, y1, m)
def D(cx, cy, cz, r, m): return ('disc', cx, cy, cz, r, m)
def S(c, r, m): return ('sph', c, r, m)
def K(a, b, r, m): return ('cap', a, b, r, m)
def Z(cx, cy, cz, r, m): return ('zdisc', cx, cy, cz, r, m)


def _rot(x, z, k):
    for _ in range(k % 4):
        x, z = -z, x
    return x, z


def place(parts, X, Z_, rot=0):
    out = []
    lo = np.array([1e9] * 3); hi = -lo
    for p in parts:
        kind = p[0]
        if kind == 'box':
            (x0, y0, z0), (x1, y1, z1), m = p[1], p[2], p[3]
            ax, az = _rot(x0, z0, rot); bx, bz = _rot(x1, z1, rot)
            a = (min(ax, bx) + X, y0, min(az, bz) + Z_); b = (max(ax, bx) + X, y1, max(az, bz) + Z_)
            out.append(box(a, b, FM[m])); lo = np.minimum(lo, a); hi = np.maximum(hi, b)
        elif kind == 'cyl':
            cx, cz = _rot(p[1], p[2], rot)
            out.append(cyl(cx + X, cz + Z_, p[3], p[4], p[5], FM[p[6]], FM[p[6]]))
            out.append(disc(cx + X, p[5], cz + Z_, p[3], FM[p[6]]))
            lo = np.minimum(lo, (cx + X - p[3], p[4], cz + Z_ - p[3])); hi = np.maximum(hi, (cx + X + p[3], p[5], cz + Z_ + p[3]))
        elif kind == 'disc':
            cx, cz = _rot(p[1], p[3], rot)
            out.append(disc(cx + X, p[2], cz + Z_, p[4], FM[p[5]]))
            lo = np.minimum(lo, (cx + X - p[4], p[2] - 0.01, cz + Z_ - p[4])); hi = np.maximum(hi, (cx + X + p[4], p[2] + 0.01, cz + Z_ + p[4]))
        elif kind == 'sph':
            (x, y, z), r = p[1], p[2]
            cx, cz = _rot(x, z, rot)
            out.append(sph((cx + X, y, cz + Z_), r, FM[p[3]]))
            lo = np.minimum(lo, (cx + X - r, y - r, cz + Z_ - r)); hi = np.maximum(hi, (cx + X + r, y + r, cz + Z_ + r))
        elif kind == 'cap':
            (ax, ay, az), (bx, by, bz), r = p[1], p[2], p[3]
            ax, az = _rot(ax, az, rot); bx, bz = _rot(bx, bz, rot)
            out.append(cap((ax + X, ay, az + Z_), (bx + X, by, bz + Z_), r, FM[p[4]]))
            for q in ((ax + X, ay, az + Z_), (bx + X, by, bz + Z_)):
                lo = np.minimum(lo, np.array(q) - r); hi = np.maximum(hi, np.array(q) + r)
        elif kind == 'zdisc':   # only valid for rot 0 / 2 (faces stay along z)
            cx, cz = _rot(p[1], p[3], rot)
            out.append(zdisc(cx + X, p[2], cz + Z_, p[4], FM[p[5]]))
            lo = np.minimum(lo, (cx + X - p[4], p[2] - p[4], cz + Z_ - 0.01)); hi = np.maximum(hi, (cx + X + p[4], p[2] + p[4], cz + Z_ + 0.01))
    return [grp(tuple(lo - 0.01), tuple(hi + 0.01), out)]


def knob(x, y, z, m='steel'): return S((x, y, z), 0.012, m)


# ---------- kitchen ----------
def fridge():
    w, d, h = 0.70, 0.66, 1.85
    return [B((-w / 2, 0.04, -d / 2), (w / 2, h, d / 2), 'white'), B((-w / 2 + 0.02, 0, -d / 2 + 0.04), (w / 2 - 0.02, 0.04, d / 2), 'black'),
            B((-w / 2 + 0.01, 1.22, -d / 2 - 0.004), (w / 2 - 0.01, 1.235, -d / 2), 'steel'),
            B((w / 2 - 0.09, 1.35, -d / 2 - 0.05), (w / 2 - 0.07, 1.6, -d / 2), 'steel'),
            B((w / 2 - 0.09, 0.75, -d / 2 - 0.05), (w / 2 - 0.07, 1.1, -d / 2), 'steel')]


def base_cabinet(w=0.6):
    d, h = 0.6, 0.86
    p = [B((-w / 2, 0.08, -d / 2 + 0.02), (w / 2, h, d / 2), 'wood'), B((-w / 2 + 0.02, 0, -d / 2 + 0.06), (w / 2 - 0.02, 0.08, d / 2), 'wood_d'),
         B((-w / 2 - 0.01, h, -d / 2 - 0.01), (w / 2 + 0.01, h + 0.04, d / 2), 'top_w')]
    if w > 0.45:
        p += [B((-w / 2 + 0.02, 0.1, -d / 2), (-0.005, h - 0.04, -d / 2 + 0.02), 'wood_d'), B((0.005, 0.1, -d / 2), (w / 2 - 0.02, h - 0.04, -d / 2 + 0.02), 'wood_d'),
              knob(-0.04, h - 0.15, -d / 2 - 0.01), knob(0.04, h - 0.15, -d / 2 - 0.01)]
    else:
        p += [B((-w / 2 + 0.02, 0.1, -d / 2), (w / 2 - 0.02, h - 0.04, -d / 2 + 0.02), 'wood_d'), knob(w / 2 - 0.07, h - 0.15, -d / 2 - 0.01)]
    return p


def sink_cabinet():
    p = base_cabinet(0.7)
    p += [B((-0.24, 0.80, -0.2), (0.24, 0.905, 0.16), 'steel'), B((-0.21, 0.83, -0.17), (0.21, 0.906, 0.13), 'dark_glass'),
          C(0.0, 0.22, 0.018, 0.9, 1.12, 'steel'), K((0.0, 1.12, 0.22), (0.0, 1.12, 0.06), 0.014, 'steel'), K((0.0, 1.12, 0.06), (0.0, 1.05, 0.06), 0.012, 'steel')]
    return p


def stove():
    w, d, h = 0.6, 0.6, 0.86
    p = [B((-w / 2, 0.08, -d / 2 + 0.02), (w / 2, h, d / 2), 'white'), B((-w / 2 + 0.02, 0, -d / 2 + 0.06), (w / 2 - 0.02, 0.08, d / 2), 'black'),
         B((-w / 2, h, -d / 2), (w / 2, h + 0.03, d / 2), 'black'),
         B((-w / 2 + 0.04, 0.16, -d / 2 - 0.005), (w / 2 - 0.04, 0.62, -d / 2 + 0.02), 'dark_glass'),
         B((-w / 2 + 0.06, 0.66, -d / 2 - 0.03), (w / 2 - 0.06, 0.68, -d / 2), 'steel')]
    for bx, bz, r in ((-0.14, -0.13, 0.08), (0.14, -0.13, 0.065), (-0.14, 0.14, 0.065), (0.14, 0.14, 0.08)):
        p.append(D(bx, h + 0.032, bz, r, 'steel')); p.append(D(bx, h + 0.034, bz, r * 0.55, 'black'))
    for kx in (-0.2, -0.07, 0.07, 0.2):
        p.append(knob(kx, 0.78, -d / 2 - 0.01, 'black'))
    return p


def pot():
    return [C(0, 0, 0.11, 0.0, 0.14, 'steel'), K((-0.16, 0.12, 0), (-0.11, 0.12, 0), 0.012, 'black'), K((0.11, 0.12, 0), (0.16, 0.12, 0), 0.012, 'black')]


def wall_cabinet(w=0.6):
    d, y0, y1 = 0.34, 1.45, 2.15
    return [B((-w / 2, y0, -d / 2), (w / 2, y1, d / 2), 'wood'), B((-w / 2 + 0.02, y0 + 0.02, -d / 2 - 0.02), (-0.005, y1 - 0.02, -d / 2), 'wood_d'),
            B((0.005, y0 + 0.02, -d / 2 - 0.02), (w / 2 - 0.02, y1 - 0.02, -d / 2), 'wood_d'),
            knob(-0.04, y0 + 0.12, -d / 2 - 0.03), knob(0.04, y0 + 0.12, -d / 2 - 0.03)]


def range_hood():
    p = []
    for i, (hw, hd) in enumerate(((0.32, 0.26), (0.26, 0.21), (0.2, 0.17), (0.14, 0.13))):
        y = 1.55 + i * 0.07
        p.append(B((-hw, y, -hd + 0.05), (hw, y + 0.07, hd + 0.05), 'copper'))
    p.append(B((-0.11, 1.83, -0.06), (0.11, 2.4, 0.16), 'copper'))
    return p


def microwave():
    return [B((-0.25, 0, -0.18), (0.25, 0.29, 0.18), 'white'), B((-0.21, 0.04, -0.185), (0.08, 0.25, -0.18), 'dark_glass'),
            B((0.11, 0.04, -0.185), (0.22, 0.25, -0.18), 'black'), B((0.13, 0.2, -0.19), (0.2, 0.23, -0.185), 'screen_f')]


def kettle():
    return [C(0, 0, 0.08, 0.0, 0.02, 'black'), C(0, 0, 0.065, 0.02, 0.21, 'steel'), S((0, 0.215, 0), 0.015, 'black'),
            K((0.06, 0.18, 0), (0.1, 0.18, 0), 0.01, 'black'), K((0.1, 0.18, 0), (0.1, 0.05, 0), 0.01, 'black'),
            K((-0.06, 0.15, 0), (-0.11, 0.19, 0), 0.01, 'steel')]


# ---------- dining ----------
def dining_table():
    p = [B((-0.6, 0.72, -0.4), (0.6, 0.76, 0.4), 'wood_l')]
    for x in (-0.54, 0.5):
        for z in (-0.34, 0.3):
            p.append(B((x, 0, z), (x + 0.04, 0.72, z + 0.04), 'wood'))
    return p


def chair():
    p = [B((-0.21, 0.44, -0.2), (0.21, 0.48, 0.2), 'wood_l')]
    for x in (-0.2, 0.16):
        for z in (-0.19, 0.15):
            p.append(B((x, 0, z), (x + 0.04, 0.44, z + 0.04), 'wood'))
    p += [B((-0.2, 0.48, 0.15), (-0.16, 0.95, 0.19), 'wood'), B((0.16, 0.48, 0.15), (0.2, 0.95, 0.19), 'wood'),
          B((-0.18, 0.88, 0.155), (0.18, 0.93, 0.185), 'wood'), B((-0.18, 0.72, 0.155), (0.18, 0.76, 0.185), 'wood')]
    return p


# ---------- living ----------
def sofa(seats=3, col='sofa_g'):
    col2 = col + '2'
    sw = 0.62; w = seats * sw + 0.36; d = 0.88
    x0 = -w / 2
    p = [B((x0, 0.05, -d / 2), (-x0, 0.4, d / 2), col2), B((x0 + 0.05, 0, -d / 2 + 0.05), (-x0 - 0.05, 0.05, d / 2 - 0.05), 'black'),
         B((x0, 0.05, -d / 2), (x0 + 0.18, 0.66, d / 2), col), B((-x0 - 0.18, 0.05, -d / 2), (-x0, 0.66, d / 2), col),
         B((x0 + 0.18, 0.4, d / 2 - 0.22), (-x0 - 0.18, 0.9, d / 2), col2)]
    for i in range(seats):
        a = x0 + 0.18 + i * sw
        p.append(B((a + 0.01, 0.4, -d / 2 + 0.02), (a + sw - 0.01, 0.52, d / 2 - 0.22), col))
        p.append(B((a + 0.02, 0.52, d / 2 - 0.34), (a + sw - 0.02, 0.88, d / 2 - 0.2), col))
    return p


def coffee_table():
    return [B((-0.5, 0.36, -0.28), (0.5, 0.42, 0.28), 'wood'), B((-0.46, 0.08, -0.24), (0.46, 0.11, 0.24), 'wood_d'),
            B((-0.48, 0, -0.26), (-0.42, 0.36, -0.2), 'wood_d'), B((0.42, 0, -0.26), (0.48, 0.36, -0.2), 'wood_d'),
            B((-0.48, 0, 0.2), (-0.42, 0.36, 0.26), 'wood_d'), B((0.42, 0, 0.2), (0.48, 0.36, 0.26), 'wood_d')]


def tv_stand():
    p = [B((-0.8, 0.05, -0.22), (0.8, 0.45, 0.22), 'wood'), B((-0.78, 0, -0.2), (0.78, 0.05, 0.2), 'black'),
         B((-0.76, 0.1, -0.225), (-0.02, 0.4, -0.22), 'wood_d'), B((0.02, 0.1, -0.225), (0.76, 0.4, -0.22), 'wood_d'),
         B((-0.06, 0.45, -0.06), (0.06, 0.5, 0.06), 'black'), B((-0.02, 0.5, -0.01), (0.02, 0.6, 0.02), 'black'),
         B((-0.58, 0.58, -0.03), (0.58, 1.24, 0.0), 'black'), B((-0.56, 0.6, -0.035), (0.56, 1.22, -0.03), 'screen_f'),
         B((-0.74, 0.45, -0.08), (-0.64, 0.75, 0.04), 'black'), B((0.64, 0.45, -0.08), (0.74, 0.75, 0.04), 'black')]
    return p


def bookshelf():
    w, d, h = 0.8, 0.3, 1.8
    p = [B((-w / 2, 0, d / 2 - 0.02), (w / 2, h, d / 2), 'wood_d'), B((-w / 2, 0, -d / 2), (-w / 2 + 0.03, h, d / 2), 'wood'),
         B((w / 2 - 0.03, 0, -d / 2), (w / 2, h, d / 2), 'wood'), B((-w / 2, h - 0.03, -d / 2), (w / 2, h, d / 2), 'wood')]
    rng = np.random.default_rng(4)
    for i, y in enumerate((0.0, 0.42, 0.84, 1.26)):
        p.append(B((-w / 2, y, -d / 2), (w / 2, y + 0.03, d / 2), 'wood'))
        x = -w / 2 + 0.05
        while x < w / 2 - 0.12 and not (i == 3 and x > 0):
            bw = 0.03 + 0.03 * rng.random(); bh = 0.24 + 0.1 * rng.random()
            p.append(B((x, y + 0.03, -d / 2 + 0.04), (x + bw, y + 0.03 + bh, d / 2 - 0.04), 'book' + str(1 + rng.integers(4))))
            x += bw + 0.004
    return p


def floor_lamp():
    return [C(0, 0, 0.16, 0, 0.03, 'black'), C(0, 0, 0.015, 0.03, 1.45, 'black'), C(0, 0, 0.2, 1.42, 1.72, 'lamp_y')]


def plant(h=0.7):
    p = [C(0, 0, 0.13, 0, 0.26, 'pot_t'), D(0, 0.24, 0, 0.12, 'wood_d')]
    rng = np.random.default_rng(int(h * 100))
    for i in range(7):
        a = rng.random() * 6.28; r = 0.05 + 0.1 * rng.random(); y = 0.35 + (h - 0.35) * rng.random()
        p.append(S((r * np.cos(a), y, r * np.sin(a)), 0.09 + 0.05 * rng.random(), 'leaf'))
    p.append(K((0, 0.25, 0), (0, h - 0.05, 0), 0.015, 'wood_d'))
    return p


def rug():
    return [B((-1.0, 0, -0.7), (1.0, 0.012, 0.7), 'rug'), B((-0.9, 0.012, -0.6), (0.9, 0.014, 0.6), 'sofa_r2')]


# ---------- sleeping ----------
def bed():
    w, l = 1.5, 2.05
    p = [B((-w / 2 - 0.04, 0, -l / 2), (w / 2 + 0.04, 0.32, l / 2), 'wood'),
         B((-w / 2 - 0.05, 0, l / 2 - 0.06), (w / 2 + 0.05, 1.0, l / 2 + 0.02), 'wood'),
         B((-w / 2, 0.32, -l / 2 + 0.02), (w / 2, 0.52, l / 2 - 0.06), 'bed_w'),
         B((-w / 2 - 0.01, 0.4, -l / 2 + 0.02), (w / 2 + 0.01, 0.56, l / 2 - 0.62), 'blanket'),
         B((-w / 2 + 0.08, 0.52, l / 2 - 0.5), (-0.04, 0.64, l / 2 - 0.12), 'bed_w'),
         B((0.04, 0.52, l / 2 - 0.5), (w / 2 - 0.08, 0.64, l / 2 - 0.12), 'bed_w')]
    for x in (-w / 2 - 0.04, w / 2 - 0.02):
        p.append(B((x, 0, -l / 2), (x + 0.06, 0.1, -l / 2 + 0.06), 'wood_d'))
    return p


def nightstand(lamp=True):
    p = [B((-0.24, 0.04, -0.2), (0.24, 0.52, 0.2), 'wood'), B((-0.22, 0.28, -0.205), (0.22, 0.5, -0.2), 'wood_d'),
         B((-0.22, 0.06, -0.205), (0.22, 0.26, -0.2), 'wood_d'), knob(0, 0.39, -0.215), knob(0, 0.16, -0.215),
         B((-0.22, 0, -0.18), (0.22, 0.04, 0.18), 'wood_d')]
    if lamp:
        p += [C(0.06, 0.04, 0.06, 0.52, 0.54, 'black'), C(0.06, 0.04, 0.012, 0.54, 0.78, 'black'), C(0.06, 0.04, 0.11, 0.72, 0.9, 'book1')]
    return p


def wardrobe():
    w, d, h = 1.1, 0.58, 2.05
    return [B((-w / 2, 0.06, -d / 2 + 0.02), (w / 2, h, d / 2), 'wood'), B((-w / 2 + 0.02, 0, -d / 2 + 0.06), (w / 2 - 0.02, 0.06, d / 2), 'wood_d'),
            B((-w / 2 + 0.03, 0.1, -d / 2), (-0.005, h - 0.04, -d / 2 + 0.02), 'wood_d'), B((0.005, 0.1, -d / 2), (w / 2 - 0.03, h - 0.04, -d / 2 + 0.02), 'wood_d'),
            B((-0.06, 0.95, -d / 2 - 0.03), (-0.04, 1.25, -d / 2), 'steel'), B((0.04, 0.95, -d / 2 - 0.03), (0.06, 1.25, -d / 2), 'steel')]


# ---------- work ----------
def desk():
    p = [B((-0.7, 0.72, -0.35), (0.7, 0.76, 0.35), 'wood'), B((-0.68, 0, -0.33), (-0.62, 0.72, 0.33), 'wood_d'),
         B((0.3, 0, -0.33), (0.68, 0.72, 0.33), 'wood_d'), B((0.32, 0.4, -0.335), (0.66, 0.7, -0.33), 'wood'), knob(0.49, 0.6, -0.345),
         B((-0.62, 0.3, 0.3), (0.3, 0.7, 0.33), 'wood_d'),
         B((-0.06, 0.76, 0.08), (0.06, 0.78, 0.18), 'black'), B((-0.015, 0.78, 0.12), (0.015, 0.95, 0.14), 'black'),
         B((-0.32, 0.9, 0.09), (0.32, 1.24, 0.12), 'black'), B((-0.3, 0.92, 0.085), (0.3, 1.22, 0.09), 'screen_f'),
         B((-0.22, 0.76, -0.2), (0.2, 0.775, -0.06), 'black'), B((0.3, 0.76, -0.2), (0.36, 0.775, -0.1), 'black'),
         B((0.42, 0.76, -0.05), (0.62, 1.2, 0.28), 'black'), B((0.44, 1.05, -0.055), (0.6, 1.08, -0.05), 'steel')]
    return p


def office_chair():
    p = []
    for a in np.linspace(0, 2 * np.pi, 5, endpoint=False):
        p.append(K((0, 0.06, 0), (0.28 * np.cos(a), 0.05, 0.28 * np.sin(a)), 0.02, 'black'))
        p.append(S((0.28 * np.cos(a), 0.03, 0.28 * np.sin(a)), 0.03, 'black'))
    p += [C(0, 0, 0.03, 0.06, 0.44, 'steel'), B((-0.25, 0.44, -0.24), (0.25, 0.52, 0.24), 'chair_y'),
          B((-0.22, 0.56, 0.2), (0.22, 1.05, 0.27), 'chair_y'), B((-0.04, 0.48, 0.2), (0.04, 0.6, 0.26), 'black'),
          B((-0.29, 0.6, -0.15), (-0.25, 0.64, 0.12), 'black'), B((0.25, 0.6, -0.15), (0.29, 0.64, 0.12), 'black'),
          B((-0.28, 0.52, 0.0), (-0.26, 0.6, 0.03), 'black'), B((0.26, 0.52, 0.0), (0.28, 0.6, 0.03), 'black')]
    return p


# ---------- bathroom ----------
def bathtub():
    w, l, h = 0.75, 1.7, 0.56
    t = 0.07
    # hollow, empty tub: bottom slab + four walls
    p = [B((-w / 2, 0.1, -l / 2), (w / 2, 0.2, l / 2), 'white'),
         B((-w / 2, 0.1, -l / 2), (-w / 2 + t, h, l / 2), 'white'), B((w / 2 - t, 0.1, -l / 2), (w / 2, h, l / 2), 'white'),
         B((-w / 2 + t, 0.1, -l / 2), (w / 2 - t, h, -l / 2 + t + 0.01), 'white'), B((-w / 2 + t, 0.1, l / 2 - t - 0.01), (w / 2 - t, h, l / 2), 'white'),
         D(0.0, 0.201, -l / 2 + 0.25, 0.025, 'steel')]
    for x in (-w / 2 + 0.06, w / 2 - 0.06):
        for z in (-l / 2 + 0.1, l / 2 - 0.1):
            p.append(S((x, 0.06, z), 0.06, 'steel'))
    p += [C(0, l / 2 - 0.05, 0.02, h, h + 0.22, 'steel'), K((0, h + 0.22, l / 2 - 0.05), (0, h + 0.2, l / 2 - 0.22), 0.016, 'steel')]
    return p


def toilet():
    return [C(0, -0.05, 0.19, 0.0, 0.38, 'white'), D(0, 0.381, -0.05, 0.15, 'mirror'), C(0, -0.05, 0.2, 0.38, 0.42, 'wood_l'),
            B((-0.2, 0.38, 0.12), (0.2, 0.8, 0.28), 'white'), B((-0.21, 0.8, 0.11), (0.21, 0.83, 0.29), 'white'),
            S((0.12, 0.84, 0.2), 0.02, 'steel')]


def bath_sink():
    p = [B((-0.3, 0.12, -0.22), (0.3, 0.8, 0.22), 'water_b'), B((-0.28, 0.16, -0.225), (-0.01, 0.76, -0.22), 'lamp_b'),
         B((0.01, 0.16, -0.225), (0.28, 0.76, -0.22), 'lamp_b'), B((-0.32, 0.8, -0.24), (0.32, 0.86, 0.22), 'white'),
         B((-0.2, 0.83, -0.16), (0.2, 0.861, 0.1), 'mirror'), C(0, 0.15, 0.015, 0.86, 1.0, 'steel'),
         K((0, 1.0, 0.15), (0, 1.0, 0.04), 0.012, 'steel'), knob(-0.03, 0.46, -0.235), knob(0.03, 0.46, -0.235),
         B((-0.27, 1.05, 0.2), (0.27, 1.75, 0.22), 'mirror'), B((-0.29, 1.03, 0.21), (0.29, 1.77, 0.225), 'white')]
    return p


def washer():
    return [B((-0.3, 0, -0.3), (0.3, 0.85, 0.3), 'white'), B((-0.3, 0.72, -0.305), (0.3, 0.85, -0.3), 'top_w'),
            Z(0, 0.38, -0.302, 0.2, 'steel'), Z(0, 0.38, -0.304, 0.16, 'dark_glass'),
            B((0.1, 0.76, -0.31), (0.24, 0.8, -0.305), 'screen_f'), S((-0.18, 0.78, -0.31), 0.025, 'steel')]


CATALOG = [
    ('Холодильник', fridge), ('Шкафчик', base_cabinet), ('Мойка', sink_cabinet), ('Плита', stove), ('Навесной шкаф', wall_cabinet),
    ('Вытяжка', range_hood), ('Микроволновка', microwave), ('Чайник', kettle), ('Кастрюля', pot),
    ('Стол', dining_table), ('Стул', chair), ('Диван', lambda: sofa(3, 'sofa_g')), ('Диванчик', lambda: sofa(2, 'sofa_r')),
    ('Журнальный стол', coffee_table), ('ТВ-тумба', tv_stand), ('Стеллаж', bookshelf), ('Торшер', floor_lamp), ('Цветок', plant), ('Ковёр', rug),
    ('Кровать', bed), ('Тумбочка', nightstand), ('Шкаф', wardrobe), ('Стол рабочий', desk), ('Кресло', office_chair),
    ('Ванна', bathtub), ('Унитаз', toilet), ('Раковина', bath_sink), ('Стиральная машина', washer),
]
