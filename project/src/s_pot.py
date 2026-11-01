import numpy as np
from eng import box, cyl, disc, sph, ss, lerp, main, f32

ALB = np.array([(0.06, 0.06, 0.07), (0.55, 0.56, 0.60), (0.42, 0.43, 0.46), (0.07, 0.10, 0.13),
                (0.35, 0.40, 0.45), (0.05, 0.05, 0.05), (0.55, 0.58, 0.55), (1, 1, 1)], f32)
SPEC = np.array([0.4, 0.8, 0.5, 1.4, 1.0, 0.3, 0.2, 0.0], f32)

STATIC = [
    box((-0.7, 0.85, -0.45), (0.7, 0.9, 0.45), 0),
    box((-3, 0.0, 0.6), (3, 3, 0.65), 6),
    cyl(0.0, 0.0, 0.2, 0.9, 1.15, 1, 2),
    disc(0.0, 1.08, 0.0, 0.199, 3),
    box((-0.29, 1.10, -0.025), (-0.2, 1.125, 0.025), 5),
    box((0.2, 1.10, -0.025), (0.29, 1.125, 0.025), 5),
]
FLAMES = [sph((0.215 * np.cos(a), 0.905, 0.215 * np.sin(a)), 0.013, 7, ns=True)
          for a in np.linspace(0, 2 * np.pi, 22, endpoint=False)]

r = np.random.default_rng(5)
NB = 170
BT = 1.5 + 12.5 * np.sqrt(r.random(NB))
BR = 0.17 * np.sqrt(r.random(NB)); BA = r.random(NB) * 2 * np.pi
BX = BR * np.cos(BA); BZ = BR * np.sin(BA)
BS = 0.006 + 0.012 * r.random(NB)
BL = 0.35 + 0.4 * r.random(NB)


def power(t):
    v = 1.0 - 0.03 * np.sin(t * 37) * np.sin(t * 5.3) ** 2
    if 6.2 <= t <= 6.32:
        v *= 0.3
    if t > 12.4:
        k = min((t - 12.4) / 1.6, 1)
        if np.sin(t * 31) * np.sin(t * 13 + 1) > 0.6 - 0.5 * k:
            v *= 0.3
    if t > 14.0:
        v *= np.exp(-(t - 14) * 30)
    return float(v)


def bubbles(t):
    out = []
    ph = (t - BT) / BL
    for i in np.nonzero((ph > 0) & (ph < 1))[0]:
        rad = BS[i] * np.sin(np.pi * ph[i]) ** 0.5
        if rad > 0.002:
            out.append(sph((BX[i], 1.08, BZ[i]), float(rad), 4))
    return out


def tex(mid, Px, Py, Pz, alb, nx, ny, nz, t):
    w = mid == 6
    gx = (Px * 7) % 1; gy = (Py * 7) % 1
    grout = (gx < 0.04) | (gy < 0.04)
    alb[w] *= np.where(grout, 0.4, 1.0)[w][:, None]
    m = mid == 3
    amp = 0.03 + 0.12 * float(ss(2, 10, t))
    px = np.sin(Px * 47 + t * 9) * np.cos(Pz * 41 - t * 7) + 0.5 * np.sin((Px + Pz) * 90 - t * 15)
    pz = np.cos(Px * 39 - t * 8) * np.sin(Pz * 53 + t * 10) + 0.5 * np.cos((Px - Pz) * 85 + t * 13)
    qx = np.where(m, amp * px, nx); qz = np.where(m, amp * pz, nz); qy = np.where(m, 1.0, ny)
    l = np.sqrt(qx * qx + qy * qy + qz * qz)
    return alb, qx / l, qy / l, qz / l


def build(t):
    k = float(ss(0.8, 13.5, t))
    cam = lerp((0.05, 1.42, -1.35), (0.0, 1.66, -0.3), k)
    tgt = lerp((0.0, 1.0, 0.05), (0.0, 1.07, 0.04), k)
    pw = power(t)
    fl = pw * (0.85 + 0.15 * np.sin(t * 23) * np.sin(t * 7.7))
    return dict(cam=cam, tgt=tgt, tanx=0.42, prims=STATIC + FLAMES + bubbles(t), alb=ALB, spec=SPEC, tex=tex,
                amb=0.003, exp=1.35, emit={7: np.array([0.35, 0.6, 1.6], f32) * fl},
                lights=[dict(p=(0.0, 1.9, 0.1), col=(1.0, 0.85, 0.65), I=1.4 * pw, att=(0.3, 0.8),
                             dir=(0, -1, -0.05), cos=(0.55, 0.9)),
                        dict(p=(0.0, 0.93, 0.0), col=(0.3, 0.5, 1.0), I=0.12 * fl, att=(0.03, 3.0), shadow=False)])


if __name__ == '__main__':
    main(build, 'pot')
