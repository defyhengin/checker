import numpy as np
from eng import box, cyl, disc, ss, lerp, main, f32

ALB = np.array([(0.30, 0.15, 0.07), (0.16, 0.14, 0.13), (0.85, 0.84, 0.80), (0.70, 0.68, 0.64),
                (0.66, 0.55, 0.34), (0.88, 0.85, 0.76), (0.9, 0.9, 0.88), (0.85, 0.2, 0.15)], f32)
SPEC = np.array([0.08, 0.0, 0.35, 0.2, 1.2, 0.0, 0.0, 0.1], f32)
TY = 0.80
MR = 0.085; MY1 = TY + 0.19; WY = TY + 0.15

STATIC = [
    box((-1.2, 0.75, -0.7), (1.2, TY, 0.7), 0),
    box((-5, 0.0, 2.0), (5, 5, 2.1), 1),
    cyl(0.0, 0.0, MR, TY, MY1, 2, 3),
    disc(0.0, WY, 0.0, MR - 0.002, 4),
    box((MR - 0.005, TY + 0.05, -0.012), (MR + 0.055, TY + 0.065, 0.012), 2),
    box((MR - 0.005, TY + 0.145, -0.012), (MR + 0.055, TY + 0.16, 0.012), 2),
    box((MR + 0.04, TY + 0.05, -0.012), (MR + 0.055, TY + 0.16, 0.012), 2),
    box((0.2, TY, -0.15), (0.24, TY + 0.003, 0.05), 6),
]


def bag_y(t):
    if t < 1.5 or t > 13.4:
        return WY + 0.06
    ph = (t - 1.5) % 1.7
    return WY + 0.06 - 0.11 * np.sin(np.pi * min(ph / 1.0, 1.0)) ** 2


def power(t):
    v = 1.0 - 0.03 * np.sin(t * 37) * np.sin(t * 5.3) ** 2
    if 7.4 <= t <= 7.5:
        v *= 0.3
    if t > 12.6:
        k = min((t - 12.6) / 1.4, 1)
        if np.sin(t * 31) * np.sin(t * 13 + 1) > 0.6 - 0.5 * k:
            v *= 0.3
    if t > 14.0:
        v *= np.exp(-(t - 14) * 30)
    return float(v)


def tex(mid, Px, Py, Pz, alb, nx, ny, nz, t):
    w = mid == 0
    g = 0.85 + 0.15 * np.sin(Pz * 40 + 3 * np.sin(Px * 3))
    alb[w] *= g[w][:, None]
    m = mid == 4
    by = bag_y(t)
    amp = 0.02 + 0.08 * np.exp(-((t - 1.5) % 1.7 - 0.5) ** 2 * 8) * (1.5 < t < 13.4)
    rr = np.sqrt(Px * Px + Pz * Pz) + 1e-6
    wave = np.sin(rr * 160 - t * 18) * amp
    qx = np.where(m, Px / rr * wave, nx); qz = np.where(m, Pz / rr * wave, nz); qy = np.where(m, 1.0, ny)
    l = np.sqrt(qx * qx + qy * qy + qz * qz)
    return alb, qx / l, qy / l, qz / l


def build(t):
    by = bag_y(t)
    bx = 0.01 * np.sin(t * 1.3)
    dyn = [box((bx - 0.028, by, -0.006), (bx + 0.028, by + 0.065, 0.006), 5),
           box((bx - 0.001, by + 0.065, -0.001), (bx + 0.001, 1.6, 0.001), 6, ns=True),
           box((bx - 0.018, by + 0.16, -0.002), (bx + 0.018, by + 0.2, 0.002), 7)]
    k = float(ss(0.6, 13.3, t))
    cam = lerp((-0.25, 1.25, -1.05), (-0.05, 1.12, -0.36), k)
    tgt = lerp((0.0, 0.95, 0.0), (0.0, 0.98, 0.0), k)
    pw = power(t)
    return dict(cam=cam, tgt=tgt, tanx=0.42, prims=STATIC + dyn, alb=ALB, spec=SPEC, tex=tex, amb=0.003, exp=1.35,
                lights=[dict(p=(0.25, 1.7, -0.2), col=(1.0, 0.82, 0.58), I=1.3 * pw, att=(0.25, 1.1),
                             dir=(-0.2, -1, 0.15), cos=(0.4, 0.8))])


if __name__ == '__main__':
    main(build, 'tea')
