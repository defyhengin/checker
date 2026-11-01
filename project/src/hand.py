"""Stylised low-poly right hand built from capsules (POV)."""
import numpy as np
import apt
from eng import cap, grp, f32

apt.mat('skin', (0.88, 0.62, 0.47), 0.12)
apt.mat('sleeve', (0.13, 0.14, 0.17), 0.02)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
M = apt.M


def _n(v):
    v = np.asarray(v, float); return v / np.linalg.norm(v)


def frame(F):
    F = _n(F)
    U = _n(np.array([0, 1, 0]) - F * F[1])
    S = np.cross(F, U)
    return F, U, S


# skeleton in (f, u, s) coordinates, index fingertip at the origin
def skeleton(curl=1.0, point=1.0):
    segs = []  # (p0, p1, r, mat)
    idx = [(0, 0, 0), (-0.024, 0.004, 0), (-0.048, 0.008, 0), (-0.078, 0.012, 0)]
    # point=1 straight index, point=0 curled like the others
    if point < 1:
        k = 1 - point
        idx[0] = (-0.06 * k, -0.022 * k, 0); idx[1] = (-0.05 * k - 0.024 * point, -0.006 * k + 0.004 * point, 0)
    for a, b, r in zip(idx, idx[1:], (0.0085, 0.009, 0.0095)):
        segs.append((a, b, r, 'skin'))
    for s, r in ((0.021, 0.009), (0.040, 0.0085), (0.057, 0.0075)):
        kn = (-0.078, 0.012, s)
        j1 = (-0.078 + 0.026 * curl + 0.03 * (1 - curl), 0.012 - 0.016 * curl, s)
        tip = (-0.078 + 0.012 * curl + 0.055 * (1 - curl), -0.012 * curl + 0.012 * (1 - curl), s)
        segs += [(kn, j1, r, 'skin'), (j1, tip, r * 0.95, 'skin')]
    for s in (0.0, 0.021, 0.040, 0.057):
        segs.append(((-0.078, 0.012, s), (-0.158, 0.006, s * 0.6 + 0.012), 0.0145, 'skin'))
    segs += [((-0.15, -0.004, -0.004), (-0.12, -0.016, -0.022), 0.0098, 'skin'),
             ((-0.12, -0.016, -0.022), (-0.096, -0.022, -0.026), 0.0088, 'skin')]
    segs.append(((-0.158, 0.006, 0.028), (-0.215, 0.002, 0.03), 0.022, 'skin'))
    segs.append(((-0.205, 0.0, 0.03), (-0.52, -0.04, 0.05), 0.042, 'sleeve'))
    return segs


def hand(tip, F, curl=1.0, point=1.0):
    F, U, S = frame(F)
    tip = np.asarray(tip, float)
    prims = []
    pts = []
    for a, b, r, m in skeleton(curl, point):
        pa = tip + a[0] * F + a[1] * U + a[2] * S
        pb = tip + b[0] * F + b[1] * U + b[2] * S
        prims.append(cap(tuple(pa), tuple(pb), r, M[m]))
        pts += [pa - r, pa + r, pb - r, pb + r]
    pts = np.array(pts)
    return grp(tuple(pts.min(0)), tuple(pts.max(0)), prims)
