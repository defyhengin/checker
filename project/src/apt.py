import os, sys, subprocess
os.environ.setdefault('ENG_W', '640'); os.environ.setdefault('ENG_H', '360'); os.environ.setdefault('ENG_TANY', '0.5')
import numpy as np
from PIL import Image
import eng
from eng import box, cyl, disc, sph, grp, obox, ss, f32, render

FPS = 30
DUR = 207.0
NF = int(DUR * FPS)
HERE = os.path.dirname(os.path.abspath(__file__))

# ---------------- materials ----------------
M = {}
_alb = []; _spec = []


def mat(name, alb, spec=0.05):
    M[name] = len(_alb); _alb.append(alb); _spec.append(spec)
    return M[name]


for nm, a, s in [
    ('floor', (0.5, 0.5, 0.5), 0.1), ('wall_h', (0.55, 0.48, 0.38), 0.0), ('wall_k', (0.55, 0.60, 0.55), 0.05),
    ('ceil', (0.6, 0.6, 0.6), 0.0), ('door', (0.35, 0.20, 0.10), 0.15), ('stair', (0.35, 0.37, 0.40), 0.0),
    ('fr_out', (0.85, 0.86, 0.86), 0.4), ('fr_in', (0.82, 0.85, 0.88), 0.2), ('glass', (0.55, 0.80, 0.85), 0.6),
    ('lemon', (0.92, 0.78, 0.12), 0.4), ('jar', (0.30, 0.45, 0.28), 0.4), ('lid', (0.55, 0.08, 0.06), 0.3),
    ('base', (0.40, 0.28, 0.16), 0.1), ('ctop', (0.25, 0.25, 0.27), 0.3), ('stove', (0.04, 0.04, 0.05), 0.8),
    ('pot', (0.55, 0.56, 0.60), 0.8), ('pot_in', (0.42, 0.43, 0.46), 0.5), ('water', (0.07, 0.10, 0.13), 1.4),
    ('bubble', (0.35, 0.40, 0.45), 1.0), ('flame', (1, 1, 1), 0.0), ('black', (0.04, 0.04, 0.04), 0.3),
    ('mw', (0.78, 0.78, 0.76), 0.3), ('mw_in', (0.72, 0.66, 0.50), 0.15), ('turn', (0.55, 0.60, 0.60), 0.9),
    ('panel', (0.12, 0.12, 0.13), 0.4), ('disp', (1, 1, 1), 0.0), ('btn', (0.35, 0.35, 0.37), 0.3),
    ('cab', (0.45, 0.32, 0.19), 0.05), ('salt', (0.86, 0.86, 0.84), 0.3), ('cap', (0.55, 0.56, 0.58), 0.9),
    ('crumb', (0.62, 0.42, 0.20), 0.0), ('table', (0.32, 0.17, 0.08), 0.1), ('plate', (0.75, 0.75, 0.72), 0.5),
    ('mug', (0.82, 0.80, 0.76), 0.35), ('tea', (0.62, 0.50, 0.30), 1.0), ('bag', (0.88, 0.85, 0.76), 0.0),
    ('string', (0.9, 0.9, 0.88), 0.0), ('tag', (0.85, 0.2, 0.15), 0.1), ('phone', (0.06, 0.06, 0.07), 0.6),
    ('screen', (1, 1, 1), 0.0), ('bulb', (1, 1, 1), 0.0), ('window', (1, 1, 1), 0.0), ('frame', (0.75, 0.75, 0.72), 0.1),
    ('switch', (0.85, 0.85, 0.82), 0.2), ('chair', (0.30, 0.18, 0.10), 0.1), ('mat', (0.25, 0.12, 0.10), 0.0),
    ('shoe', (0.20, 0.15, 0.12), 0.05), ('coat', (0.15, 0.17, 0.22), 0.0),
]:
    mat(nm, a, s)
ALB = np.array(_alb, f32); SPEC = np.array(_spec, f32)
B = {k: M[k] for k in M}


# ---------------- timeline helpers ----------------
def env(t, a, b, fa=0.15, fb=0.15):
    return float(ss(a, a + fa, t) * (1 - ss(b - fb, b, t)))


def door_angle(t, opens):
    a = 0.0
    for t0, t1, ang in opens:
        if t >= t0:
            a = a + (ang - a) * float(ss(t0, t1, t))
    return a


ENTR = [(3.5, 5.5, np.radians(95))]
FRDOOR = [(22.0, 23.5, np.radians(105)), (41.0, 42.5, 0.0), (196.0, 197.5, np.radians(105))]
CABDOOR = [(48.0, 49.5, np.radians(100))]


def flick(t, seed):
    return 1.0 - 0.06 * (np.sin(t * 37 + seed) * np.sin(t * 5.3 + seed) ** 2)


def L_hall(t):
    v = env(t, 10.5, 44.5, 0.05, 0.05)
    if 43.0 < t < 44.5 and np.sin(t * 41) * np.sin(t * 17) > 0.2:
        v *= 0.2
    return v


def L_kitchen(t):
    v = 0.0
    if 18.0 < t < 44.5:
        v = 1.0
        if t < 19.2 and np.sin(t * 53) * np.sin(t * 19) > -0.1:
            v = 0.15
        if 41.5 < t and np.sin(t * 47) * np.sin(t * 13) > 0.0:
            v = 0.2
        v *= flick(t, 1)
    return v


def L_fridge(t):
    a = door_angle(t, FRDOOR)
    v = float(ss(0.05, 0.4, a))
    if t > 204.6:
        v *= 0.0 if t > 205.0 else (1.0 if int(t * 20) % 2 else 0.3)
    return v


def L_flash(t):
    return env(t, 47.0, 84.0, 0.08, 0.08)


def L_flame(t):
    return env(t, 63.0, 84.0, 0.3, 0.1) * (0.85 + 0.15 * np.sin(t * 23) * np.sin(t * 7.7))


PH0 = 88.3


def L_phone(t):
    from phone import screen_on
    return screen_on(t - PH0) if 88 < t < 116 else 0.0


def L_micro(t):
    return env(t, 118.2, 136.0, 0.1, 0.05)


def L_pend(t):
    v = env(t, 138.0, 181.0, 0.05, 0.05)
    if 176.0 < t < 181.0:
        k = (t - 176) / 5
        if np.sin(t * 31) * np.sin(t * 13 + 1) > 0.6 - 0.6 * k:
            v *= 0.25
        v *= 1 - 0.4 * float(ss(179, 181, t))
    return v * flick(t, 3)


def L_stair(t):
    return 1.0 if t < 20 else 0.0


# ---------------- camera ----------------
K = [
    (0.0, (0, 1.6, -1.9), (0, 1.35, 0)), (3.5, (0, 1.6, -1.9), (0, 1.4, 0)),
    (6.0, (0, 1.6, -1.2), (0, 1.5, 1.5)), (9.0, (0, 1.6, 0.3), (0, 1.55, 3)),
    (10.0, (-0.05, 1.6, 0.45), (-0.7, 1.2, 0.65)), (11.2, (-0.05, 1.6, 0.5), (-0.7, 1.2, 0.65)),
    (12.5, (0, 1.6, 0.8), (0, 1.5, 4)), (16.5, (0, 1.6, 2.7), (-0.6, 1.45, 5)),
    (18.5, (-0.2, 1.6, 3.4), (-0.3, 2.1, 5.2)), (20.5, (-0.6, 1.6, 3.65), (-1.5, 1.25, 3.65)),
    (23.5, (-0.6, 1.55, 3.65), (-1.6, 1.2, 3.65)), (30.0, (-0.95, 1.4, 3.65), (-1.9, 1.1, 3.6)),
    (39.5, (-1.0, 1.38, 3.65), (-1.95, 1.12, 3.6)), (42.5, (-0.6, 1.6, 3.75), (-1.5, 1.3, 3.65)),
    (46.0, (-1.2, 1.6, 5.9), (-1.65, 1.75, 7.3)), (48.0, (-1.45, 1.62, 6.35), (-1.7, 1.8, 7.35)),
    (58.0, (-1.5, 1.62, 6.5), (-1.55, 1.62, 7.3)), (61.0, (-1.5, 1.62, 6.5), (-1.55, 1.62, 7.3)),
    (64.0, (-0.9, 1.6, 6.15), (-0.9, 0.95, 7.2)), (80.0, (-0.9, 1.5, 6.55), (-0.9, 1.0, 7.2)),
    (84.0, (-0.9, 1.5, 6.55), (-0.9, 1.0, 7.2)), (89.0, (0.45, 1.5, 3.95), (0.45, 0.8, 4.55)),
    (92.0, (0.45, 0.97, 4.45), (0.45, 0.8, 4.553)), (114.5, (0.45, 0.96, 4.46), (0.45, 0.8, 4.553)),
    (116.5, (-0.25, 1.55, 4.6), (0.3, 1.2, 7.0)), (119.0, (0.5, 1.55, 6.15), (0.5, 1.05, 7.2)),
    (133.0, (0.47, 1.25, 6.55), (0.47, 1.05, 7.2)), (137.0, (0.47, 1.25, 6.55), (0.47, 1.05, 7.2)),
    (139.0, (1.75, 1.55, 5.4), (1.15, 0.9, 4.6)), (141.0, (1.1, 1.45, 4.05), (1.15, 0.88, 4.6)),
    (155.0, (1.13, 1.25, 4.3), (1.15, 0.9, 4.6)), (157.5, (1.13, 1.25, 4.3), (1.15, 0.9, 4.6)),
    (161.0, (0.8, 1.2, 3.95), (0.8, 0.78, 4.8)), (176.0, (0.8, 1.05, 4.4), (0.8, 0.8, 4.8)),
    (188.0, (0.8, 1.05, 4.4), (0.8, 0.8, 4.8)), (191.0, (0.7, 1.55, 4.0), (-1.5, 1.25, 3.65)),
    (195.5, (-0.6, 1.55, 3.65), (-1.6, 1.2, 3.65)), (200.0, (-0.9, 1.42, 3.65), (-1.9, 1.1, 3.6)),
    (207.0, (-0.95, 1.4, 3.65), (-1.9, 1.1, 3.6)),
]


def raw_cam(t):
    for (t0, p0, g0), (t1, p1, g1) in zip(K, K[1:]):
        if t0 <= t <= t1:
            k = float(ss(t0, t1, t))
            return np.array(p0) + (np.array(p1) - np.array(p0)) * k, np.array(g0) + (np.array(g1) - np.array(g0)) * k
    return np.array(K[-1][1], float), np.array(K[-1][2], float)


_ts = np.arange(0, DUR + 0.1, 1 / FPS)
_ps = np.array([raw_cam(x)[0] for x in _ts])
_step = np.r_[0, np.linalg.norm(np.diff(_ps[:, [0, 2]], axis=0), axis=1)]
_dist = np.cumsum(_step)
_spd = np.convolve(_step * FPS, np.ones(9) / 9, mode='same')


def camera(t):
    p, g = raw_cam(t)
    i = min(int(round(t * FPS)), len(_ts) - 1)
    amt = min(_spd[i] / 0.9, 1.0)
    ph = _dist[i] / 0.72 * 2 * np.pi
    bob = np.array([0.012 * np.sin(ph / 2), 0.022 * abs(np.sin(ph / 2)) - 0.011, 0]) * amt
    sway = np.array([0.006 * np.sin(t * 0.7), 0.004 * np.sin(t * 0.9 + 1), 0])
    return p + bob + sway, g + bob * 0.5 + sway


FLASH_AIM = [(47.5, (-1.7, 1.8, 7.35)), (50.0, (-1.95, 1.98, 7.35)), (52.2, (-1.45, 1.98, 7.35)),
             (54.2, (-1.95, 1.66, 7.35)), (56.3, (-1.5, 1.58, 7.32)), (61.0, (-1.5, 1.58, 7.32))]


def flash_aim(t, tgt):
    if t < 47.5 or t > 61.5:
        return tgt
    for (t0, a), (t1, b) in zip(FLASH_AIM, FLASH_AIM[1:]):
        if t0 <= t <= t1:
            k = float(ss(t0, t1, t))
            return np.array(a) + (np.array(b) - np.array(a)) * k + 0.01 * np.array([np.sin(t * 6), np.sin(t * 4.7), 0])
    return tgt


# ---------------- geometry ----------------
def walls():
    W = []
    m = B
    # stairwell z[-3,0]
    W += [box((-1.5, -0.1, -3.1), (1.5, 2.7, -3.0), m['stair']), box((-1.6, -0.1, -3), (-1.5, 2.7, 0), m['stair']),
          box((1.5, -0.1, -3), (1.6, 2.7, 0), m['stair'])]
    # entrance wall with doorway x[-0.45,0.45], y<2.1
    W += [box((-1.6, -0.1, -0.1), (-0.45, 2.7, 0.0), m['wall_h']), box((0.45, -0.1, -0.1), (1.6, 2.7, 0.0), m['wall_h']),
          box((-0.45, 2.1, -0.1), (0.45, 2.7, 0.0), m['wall_h'])]
    # hallway
    W += [box((-0.8, -0.1, 0), (-0.7, 2.7, 3.0), m['wall_h']), box((0.7, -0.1, 0), (0.8, 2.7, 3.0), m['wall_h'])]
    # kitchen front wall with opening
    W += [box((-2.3, -0.1, 3.0), (-0.7, 2.7, 3.1), m['wall_k']), box((0.7, -0.1, 3.0), (2.3, 2.7, 3.1), m['wall_k']),
          box((-0.7, 2.1, 3.0), (0.7, 2.7, 3.1), m['wall_k'])]
    # kitchen sides/back
    W += [box((-2.3, -0.1, 3.0), (-2.2, 2.7, 7.6), m['wall_k']), box((2.2, -0.1, 3.0), (2.3, 2.7, 7.6), m['wall_k']),
          box((-2.3, -0.1, 7.5), (2.3, 2.7, 7.6), m['wall_k'])]
    # ceiling
    W += [box((-2.3, 2.6, -3.1), (2.3, 2.7, 7.6), m['ceil'])]
    return W


HALL = grp((-0.7, 0.0, 0.0), (0.7, 2.6, 3.0), [
    box((-0.7, 1.1, 0.55), (-0.68, 1.25, 0.65), B['switch']),
    box((-0.68, 0.0, 0.3), (-0.4, 0.35, 1.0), B['shoe']),
    box((-0.7, 1.55, 1.3), (-0.62, 1.6, 2.0), B['black']),
    box((-0.66, 0.9, 1.45), (-0.5, 1.55, 1.75), B['coat']),
    box((-0.45, 0.0, 0.05), (0.45, 0.012, 0.6), B['mat']),
])

LEMON = ((-1.85, 1.11, 3.55), 0.06)


def fridge(t):
    m = B
    items = [
        box((-2.2, 0.0, 3.3), (-2.15, 1.9, 4.0), m['fr_out']),
        box((-2.2, 0.0, 3.3), (-1.5, 1.9, 3.35), m['fr_out']), box((-2.2, 0.0, 3.95), (-1.5, 1.9, 4.0), m['fr_out']),
        box((-2.2, 1.85, 3.3), (-1.5, 1.9, 4.0), m['fr_out']), box((-2.2, 0.0, 3.3), (-1.5, 0.1, 4.0), m['fr_out']),
        box((-2.15, 0.1, 3.35), (-2.14, 1.85, 3.95), m['fr_in']),
        box((-2.15, 0.54, 3.35), (-1.55, 0.555, 3.95), m['glass'], ns=True),
        box((-2.15, 1.035, 3.35), (-1.55, 1.05, 3.95), m['glass'], ns=True),
        box((-2.15, 1.45, 3.35), (-1.55, 1.465, 3.95), m['glass'], ns=True),
        box((-2.05, 0.1, 3.72), (-1.95, 0.2, 3.82), m['jar']), box((-2.04, 0.2, 3.73), (-1.96, 0.22, 3.81), m['lid']),
        sph((-1.85, 1.79, 3.65), 0.03, m['bulb'], ns=True),
    ]
    if t < 182:
        items.append(sph(LEMON[0], LEMON[1], m['lemon']))
    a = door_angle(t, FRDOOR)
    door = [obox((-1.5, 3.3), (0.0, 0.0, 0.0), (0.05, 1.9, 0.7), a, m['fr_out']),
            obox((-1.5, 3.3), (0.05, 0.9, 0.6), (0.08, 1.3, 0.63), a, m['black'])]
    return [grp((-2.2, 0.0, 3.3), (-1.5, 1.9, 4.0), items)] + door


SALT = (-1.5, 7.32)


def cabinet(t):
    m = B
    items = [
        box((-2.1, 1.5, 7.45), (-1.3, 2.2, 7.5), m['cab']), box((-2.1, 2.17, 7.15), (-1.3, 2.2, 7.5), m['cab']),
        box((-2.1, 1.5, 7.15), (-1.3, 1.53, 7.5), m['cab']), box((-2.1, 1.5, 7.15), (-2.07, 2.2, 7.5), m['cab']),
        box((-1.33, 1.5, 7.15), (-1.3, 2.2, 7.5), m['cab']), box((-2.07, 1.845, 7.17), (-1.33, 1.865, 7.45), m['cab']),
        cyl(SALT[0], SALT[1], 0.03, 1.53, 1.61, m['salt'], m['salt']), disc(SALT[0], 1.61, SALT[1], 0.03, m['salt']),
        cyl(SALT[0], SALT[1], 0.026, 1.61, 1.635, m['cap'], m['cap']), disc(SALT[0], 1.635, SALT[1], 0.026, m['cap']),
        sph((-1.8, 1.869, 7.3), 0.004, m['crumb']),
    ]
    a = door_angle(t, CABDOOR)
    return [grp((-2.1, 1.5, 7.15), (-1.3, 2.2, 7.5), items),
            obox((-2.1, 7.15), (0.0, 1.5, -0.02), (0.8, 2.2, 0.0), a, m['cab']),
            obox((-2.1, 7.15), (0.7, 1.55, -0.04), (0.72, 1.7, -0.02), a, m['black'])]


rb = np.random.default_rng(5)
NB = 200
BT = 63.5 + 20 * np.sqrt(rb.random(NB)); BR = 0.14 * np.sqrt(rb.random(NB)); BA = rb.random(NB) * 2 * np.pi
BX = -0.9 + BR * np.cos(BA); BZ = 7.2 + BR * np.sin(BA); BS = 0.005 + 0.01 * rb.random(NB); BL = 0.35 + 0.4 * rb.random(NB)
WY = 1.06


def stove(t):
    m = B
    items = [box((-1.2, 0.9, 6.95), (-0.6, 0.905, 7.45), m['stove']),
             cyl(-0.9, 7.2, 0.17, 0.905, 1.12, m['pot'], m['pot_in']), disc(-0.9, WY, 7.2, 0.168, m['water']),
             box((-1.12, 1.08, 7.18), (-1.07, 1.095, 7.22), m['black']), box((-0.73, 1.08, 7.18), (-0.68, 1.095, 7.22), m['black'])]
    if L_flame(t) > 0.01:
        items += [sph((-0.9 + 0.185 * np.cos(a), 0.91, 7.2 + 0.185 * np.sin(a)), 0.011, m['flame'], ns=True)
                  for a in np.linspace(0, 2 * np.pi, 18, endpoint=False)]
    ph = (t - BT) / BL
    for i in np.nonzero((ph > 0) & (ph < 1))[0]:
        rad = BS[i] * np.sin(np.pi * ph[i]) ** 0.5
        if rad > 0.002:
            items.append(sph((BX[i], WY, BZ[i]), float(rad), m['bubble']))
    return grp((-1.2, 0.9, 6.95), (-0.6, 1.13, 7.45), items)


MWX, MWZ = 0.5, 7.2


def micro():
    m = B
    raw = [((-0.3, 0.9, -0.2), (0.3, 0.93, 0.2), 'mw'), ((-0.3, 1.19, -0.2), (0.3, 1.22, 0.2), 'mw'),
           ((-0.3, 0.93, -0.2), (-0.27, 1.19, 0.2), 'mw'), ((0.12, 0.93, -0.2), (0.3, 1.19, 0.2), 'panel'),
           ((-0.27, 0.93, 0.18), (0.12, 1.19, 0.2), 'mw_in'), ((-0.27, 0.93, -0.2), (-0.24, 1.19, -0.17), 'black'),
           ((0.09, 0.93, -0.2), (0.12, 1.19, -0.17), 'black'), ((-0.24, 1.16, -0.2), (0.09, 1.19, -0.17), 'black'),
           ((-0.24, 0.93, -0.2), (0.09, 0.96, -0.17), 'black'), ((-0.24, 0.93, -0.17), (0.09, 0.931, 0.18), 'mw_in'),
           ((0.16, 1.05, -0.204), (0.2, 1.08, -0.2), 'btn'), ((0.22, 1.05, -0.204), (0.26, 1.08, -0.2), 'btn'),
           ((0.16, 1.0, -0.204), (0.2, 1.03, -0.2), 'btn'), ((0.22, 1.0, -0.204), (0.26, 1.03, -0.2), 'btn')]
    items = [box((a[0] + MWX, a[1], a[2] + MWZ), (b[0] + MWX, b[1], b[2] + MWZ), m[n]) for a, b, n in raw]
    items.append(box((0.15 + MWX, 1.12, -0.205 + MWZ), (0.27 + MWX, 1.16, -0.2 + MWZ), m['disp'], ns=True))
    items.append(disc(-0.075 + MWX, 0.945, MWZ, 0.12, m['turn']))
    return grp((-0.3 + MWX, 0.9, -0.205 + MWZ), (0.3 + MWX, 1.22, 0.2 + MWZ), items)


COUNTER = [box((-1.5, 0.0, 6.9), (1.0, 0.86, 7.5), B['base']), box((-1.5, 0.86, 6.88), (1.0, 0.9, 7.5), B['ctop'])]

TY = 0.8
PLATE = (0.8, TY + 0.008, 4.8); PR = 0.13
MUG = (1.15, 4.6); MR = 0.045; MTOP = TY + 0.1; TEAY = TY + 0.08
PHONE = (0.4125, 0.4875, 4.475, 4.625)


def bag_y(t):
    if t < 140.0 or t > 156.5:
        return TEAY + 0.03
    ph = (t - 140.0) % 2.9
    return TEAY + 0.03 - 0.07 * np.sin(np.pi * min(ph / 1.6, 1.0)) ** 2


def table(t):
    m = B
    items = [box((0.2, TY - 0.04, 4.3), (1.4, TY, 5.3), m['table'])]
    for lx, lz in ((0.25, 4.35), (1.3, 4.35), (0.25, 5.2), (1.3, 5.2)):
        items.append(box((lx, 0, lz), (lx + 0.05, TY - 0.04, lz + 0.05), m['table']))
    items += [disc(PLATE[0], PLATE[1], PLATE[2], PR, m['plate']),
              sph((0.81, TY + 0.014, 4.79), 0.0055, m['crumb']), sph((0.817, TY + 0.012, 4.794), 0.004, m['crumb']),
              cyl(MUG[0], MUG[1], MR, TY, MTOP, m['mug'], m['mug']), disc(MUG[0], TEAY, MUG[1], MR - 0.002, m['tea']),
              box((MUG[0] + MR - 0.003, TY + 0.025, MUG[1] - 0.006), (MUG[0] + MR + 0.03, TY + 0.033, MUG[1] + 0.006), m['mug']),
              box((MUG[0] + MR - 0.003, TY + 0.075, MUG[1] - 0.006), (MUG[0] + MR + 0.03, TY + 0.083, MUG[1] + 0.006), m['mug']),
              box((MUG[0] + MR + 0.022, TY + 0.025, MUG[1] - 0.006), (MUG[0] + MR + 0.03, TY + 0.083, MUG[1] + 0.006), m['mug']),
              box((PHONE[0], TY, PHONE[2]), (PHONE[1], TY + 0.009, PHONE[3]), m['phone']),
              box((PHONE[0] + 0.004, TY + 0.009, PHONE[2] + 0.006), (PHONE[1] - 0.004, TY + 0.0095, PHONE[3] - 0.006), m['screen'], ns=True)]
    by = bag_y(t); bx = MUG[0] + 0.004 * np.sin(t * 1.3)
    items += [box((bx - 0.02, by, MUG[1] - 0.004), (bx + 0.02, by + 0.045, MUG[1] + 0.004), m['bag']),
              box((bx - 0.0008, by + 0.045, MUG[1] - 0.0008), (bx + 0.0008, by + 0.17, MUG[1] + 0.0008), m['string'], ns=True),
              box((bx - 0.012, by + 0.17, MUG[1] - 0.0015), (bx + 0.012, by + 0.2, MUG[1] + 0.0015), m['tag'])]
    tg = grp((0.2, 0.0, 4.3), (1.4, TY + 0.35, 5.3), items)
    chair = grp((0.6, 0.0, 3.68), (1.0, 1.0, 4.15), [
        box((0.6, 0.45, 3.75), (1.0, 0.5, 4.15), m['chair']), box((0.6, 0.5, 3.68), (1.0, 1.0, 3.73), m['chair']),
        box((0.62, 0, 3.77), (0.66, 0.45, 3.81), m['chair']), box((0.94, 0, 3.77), (0.98, 0.45, 3.81), m['chair']),
        box((0.62, 0, 4.09), (0.66, 0.45, 4.13), m['chair']), box((0.94, 0, 4.09), (0.98, 0.45, 4.13), m['chair'])])
    return [tg, chair]


LAMPS = [sph((0, 2.5, 1.5), 0.06, B['bulb'], ns=True), sph((0, 2.48, 5.2), 0.07, B['bulb'], ns=True),
         sph((0.8, 1.65, 4.8), 0.045, B['bulb'], ns=True), sph((0, 2.45, -1.8), 0.06, B['bulb'], ns=True),
         box((0.795, 1.68, 4.795), (0.805, 2.6, 4.805), B['black'], ns=True)]
WINDOW = [box((2.19, 1.0, 4.5), (2.2, 2.0, 6.0), B['window'], ns=True),
          box((2.18, 1.48, 4.5), (2.19, 1.52, 6.0), B['frame']), box((2.18, 1.0, 5.23), (2.19, 2.0, 5.27), B['frame'])]

STATIC = walls() + [HALL] + COUNTER + [micro()] + WINDOW
ENTR_DOOR = lambda a: [obox((0.45, 0.0), (-0.9, 0.0, 0.0), (0.0, 2.1, 0.05), a, B['door']),
                       obox((0.45, 0.0), (-0.82, 0.95, 0.05), (-0.72, 0.99, 0.08), a, B['cap'])]


# ---------------- textures ----------------
from phone import draw_screen, PW, PH
_scr_cache = {}


def screen_img(tp):
    key = round(tp * 30)
    if key not in _scr_cache:
        if len(_scr_cache) > 4:
            _scr_cache.clear()
        _scr_cache[key] = np.asarray(draw_screen(tp), f32) / 255.0
    return _scr_cache[key]


def tex(mid, Px, Py, Pz, alb, nx, ny, nz, t):
    fl = mid == B['floor']
    if fl.any():
        hall = fl & (Pz < 3.0) & (Pz > 0)
        kit = fl & (Pz >= 3.0)
        plank = 0.75 + 0.2 * np.sin(Px * 30 + 2 * np.sin(Pz * 2)) * 0.3 + 0.15 * ((np.floor(Px * 6) % 2) - 0.5)
        alb[hall] = np.array([0.38, 0.24, 0.13], f32) * plank[hall][:, None]
        chk = ((np.floor(Px / 0.3) + np.floor(Pz / 0.3)) % 2)
        alb[kit] = np.array([0.42, 0.42, 0.40], f32) * (0.55 + 0.45 * chk[kit])[:, None]
        out = fl & (Pz <= 0)
        alb[out] = (0.28, 0.28, 0.29)
    wk = (mid == B['wall_k']) & (Pz > 7.45) & (Py > 0.9) & (Py < 1.5)
    if wk.any():
        g = ((Px * 7) % 1 < 0.05) | ((Py * 7) % 1 < 0.05)
        alb[wk] = np.where(g[wk][:, None], 0.35, 0.82) * np.array([0.9, 0.92, 0.9], f32)
    wd = (mid == B['door']) | (mid == B['table']) | (mid == B['cab']) | (mid == B['base'])
    if wd.any():
        g = 0.85 + 0.12 * np.sin((Px + Pz) * 40 + 4 * np.sin(Py * 3))
        alb[wd] *= g[wd][:, None]
    pm = mid == B['plate']
    if pm.any():
        rx = Px - PLATE[0]; rz = Pz - PLATE[2]
        rr = np.sqrt(rx * rx + rz * rz) + 1e-6
        tilt = np.where((rr > 0.08) & (rr < 0.105), -0.5, np.where(rr >= 0.105, 0.45, 0.0))
        pnx = rx / rr * tilt; pnz = rz / rr * tilt
        l = np.sqrt(pnx ** 2 + 1 + pnz ** 2)
        nx = np.where(pm, pnx / l, nx); ny = np.where(pm, 1 / l, ny); nz = np.where(pm, pnz / l, nz)
        ring = pm & (np.abs(rr - 0.118) < 0.003)
        alb[ring] = (0.25, 0.32, 0.42)
    tu = mid == B['turn']
    if tu.any():
        ang = np.arctan2(Pz - MWZ, Px - (MWX - 0.075)) - max(0.0, min(t, 136.0) - 118.2) * 1.1
        alb[tu] *= np.where(((ang % (2 * np.pi / 3)) < 0.18)[tu], 0.55, 1.0)[:, None]
    wm = mid == B['water']
    if wm.any():
        amp = 0.02 + 0.12 * float(ss(65, 75, t)) * (t < 84)
        a1 = np.sin(Px * 47 + t * 9) * np.cos(Pz * 41 - t * 7); a2 = np.cos(Px * 39 - t * 8) * np.sin(Pz * 53 + t * 10)
        qx = np.where(wm, amp * a1, nx); qz = np.where(wm, amp * a2, nz); qy = np.where(wm, 1.0, ny)
        l = np.sqrt(qx * qx + qy * qy + qz * qz); nx, ny, nz = qx / l, qy / l, qz / l
    tm = mid == B['tea']
    if tm.any():
        rr = np.sqrt((Px - MUG[0]) ** 2 + (Pz - MUG[1]) ** 2) + 1e-6
        amp = 0.06 * np.exp(-(((t - 140.0) % 2.9) - 0.9) ** 2 * 6) * (140 < t < 157)
        w = np.sin(rr * 260 - t * 18) * amp
        qx = np.where(tm, (Px - MUG[0]) / rr * w, nx); qz = np.where(tm, (Pz - MUG[1]) / rr * w, nz); qy = np.where(tm, 1.0, ny)
        l = np.sqrt(qx * qx + qy * qy + qz * qz); nx, ny, nz = qx / l, qy / l, qz / l
    return alb, nx, ny, nz


def post(col, D, cam, best, t):
    tz = (MWZ - 0.2 - cam[2]) / D[2]
    hx = cam[0] + D[0] * tz; hy = cam[1] + D[1] * tz
    win = (tz > 0) & (best > tz) & (hx > MWX - 0.24) & (hx < MWX + 0.09) & (hy > 0.96) & (hy < 1.16)
    col[win] = col[win] * 0.55 + 0.01
    return col


def screen_emit(t):
    on = L_phone(t)

    def f(Px, Py, Pz, tt):
        if on <= 0.001:
            return np.zeros((Px.shape[0], 3), f32) + 0.01
        img = screen_img(t - PH0)
        x0, x1 = PHONE[0] + 0.004, PHONE[1] - 0.004; z0, z1 = PHONE[2] + 0.006, PHONE[3] - 0.006
        u = np.clip((x1 - Px) / (x1 - x0), 0, 0.999); v = np.clip((z1 - Pz) / (z1 - z0), 0, 0.999)
        h, w, _ = img.shape
        return img[(v * h).astype(int), (u * w).astype(int)] * (0.62 * on) + 0.01
    return f


# ---------------- scene per frame ----------------
def build(t):
    cam, tgt = camera(t)
    prims = STATIC + ENTR_DOOR(door_angle(t, ENTR)) + fridge(t) + cabinet(t) + [stove(t)] + table(t) + LAMPS
    lights = []
    hl = L_hall(t); kl = L_kitchen(t); fr = L_fridge(t); fla = L_flash(t); flm = L_flame(t); ph = L_phone(t)
    mi = L_micro(t); pe = L_pend(t); st = L_stair(t)
    if st > 0:
        lights.append(dict(p=(0, 2.35, -1.8), col=(1.0, 0.8, 0.55), I=0.55 * st, att=(0.3, 0.5)))
    if hl > 0:
        lights.append(dict(p=(0, 2.42, 1.5), col=(1.0, 0.85, 0.65), I=0.8 * hl, att=(0.3, 0.35)))
    if kl > 0:
        lights.append(dict(p=(0, 2.4, 5.2), col=(0.95, 0.95, 0.9), I=1.0 * kl, att=(0.4, 0.3)))
    if fr > 0:
        lights.append(dict(p=(-1.85, 1.74, 3.65), col=(0.85, 0.95, 1.0), I=1.1 * fr, att=(0.05, 0.9)))
    if fla > 0:
        lp = cam + np.array([0.06, -0.12, 0.0])
        a = flash_aim(t, tgt)
        lights.append(dict(p=tuple(lp), col=(0.95, 0.97, 1.0), I=(1.3 if t < 61 else 0.6) * fla, att=(0.1, 1.0),
                           dir=tuple(a - lp), cos=(0.9, 0.975)))
    if flm > 0:
        lights.append(dict(p=(-0.9, 0.95, 7.2), col=(0.3, 0.5, 1.0), I=0.1 * flm, att=(0.03, 3.0), shadow=False))
    if ph > 0:
        lights.append(dict(p=(0.45, 0.9, 4.55), col=(0.8, 0.9, 1.0), I=0.035 * ph, att=(0.01, 3.0), shadow=False))
    if mi > 0:
        lights.append(dict(p=(MWX + 0.05, 1.17, MWZ + 0.12), col=(1.0, 0.82, 0.5), I=0.25 * mi, att=(0.02, 4.0)))
    if pe > 0:
        lights.append(dict(p=(0.8, 1.6, 4.8), col=(1.0, 0.82, 0.58), I=0.9 * pe, att=(0.2, 1.2), dir=(0, -1, 0), cos=(0.2, 0.75)))
    lights.append(dict(p=(3.2, 2.6, 5.25), col=(0.45, 0.55, 0.85), I=0.35, att=(0.6, 0.15), dir=(-1, -0.55, 0), cos=(0.55, 0.9), shadow=False))
    disp = 1.0 if t < 136 else (1.0 if int((t - 136) * 2.5) % 2 == 0 else 0.15)
    emit = {B['bulb']: None, B['flame']: np.array([0.35, 0.6, 1.6], f32) * flm,
            B['disp']: np.array([0.25, 1.2, 0.45], f32) * disp, B['window']: np.array([0.05, 0.08, 0.16], f32),
            B['screen']: screen_emit(t)}

    def bulbs(Px, Py, Pz, tt):
        out = np.zeros((Px.shape[0], 3), f32) + 0.02
        for (c, lv, col) in (((0, 2.5, 1.5), hl, (1.0, 0.85, 0.65)), ((0, 2.48, 5.2), kl, (1, 1, 0.95)),
                             ((0.8, 1.65, 4.8), pe, (1.0, 0.82, 0.58)), ((0, 2.45, -1.8), st, (1.0, 0.8, 0.55)),
                             ((-1.85, 1.79, 3.65), fr, (0.85, 0.95, 1.0))):
            d = (Px - c[0]) ** 2 + (Py - c[1]) ** 2 + (Pz - c[2]) ** 2
            msk = d < 0.01
            out[msk] = np.array(col, f32) * (0.03 + 5 * lv)
        return out
    emit[B['bulb']] = bulbs
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=prims, alb=ALB, spec=SPEC, tex=tex, post=post,
                amb=0.004, exp=1.35, emit=emit, lights=lights)


def main():
    mode = sys.argv[1]
    if mode == 'preview':
        import time
        for s in sys.argv[2:]:
            t = float(s); t0 = time.time()
            Image.fromarray(render(build(t), t)).save(os.path.join(HERE, f'apt_prev_{s}.png'))
            print(s, round(time.time() - t0, 2), 's', flush=True)
    elif mode == 'chunk':
        k = int(sys.argv[2]); n = int(sys.argv[3])
        per = NF // n; a = k * per; b = NF if k == n - 1 else (k + 1) * per
        out = os.path.join(HERE, f'apt_c{k:02d}.mp4')
        if os.path.exists(out):
            return
        tmp = out + '.tmp.mp4'
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{eng.W}x{eng.H}',
                              '-r', str(FPS), '-i', '-', '-vf', 'scale=1280:720:flags=lanczos,format=yuv420p',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp],
                             stdin=subprocess.PIPE)
        for fi in range(a, b):
            t = fi / FPS
            p.stdin.write(render(build(t), t).tobytes())
        p.stdin.close()
        if p.wait() == 0:
            os.rename(tmp, out); print('chunk', k, flush=True)


if __name__ == '__main__':
    main()
