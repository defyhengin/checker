"""«Сон» — horizontal dream film built on the apartment engine."""
import os, sys, subprocess, wave
os.environ['ENG_W'] = '640'; os.environ['ENG_H'] = '360'; os.environ['ENG_TANY'] = '0.5'
import numpy as np
from PIL import Image
import eng
from eng import render, ss, f32, box, cyl, disc, sph, cap, grp, obox, zdisc
import apt
import props

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
S1, S2, S3, S4, S5 = 14.0, 62.0, 104.0, 152.0, 174.0
DUR = 192.0
NF = int(DUR * FPS)
M = apt.M; B = apt.B

for nm, a, s_ in [('d_floor', (0.30, 0.28, 0.34), 0.2), ('d_grey', (0.45, 0.45, 0.47), 0.1), ('chicken', (0.62, 0.36, 0.14), 0.5),
                  ('apple', (0.75, 0.10, 0.10), 0.6), ('grape', (0.35, 0.12, 0.40), 0.6), ('cake', (0.92, 0.65, 0.72), 0.2),
                  ('cream', (0.96, 0.94, 0.90), 0.2), ('cloth', (0.85, 0.83, 0.78), 0.0), ('giant_in', (1, 1, 1), 0.0),
                  ('bread2', (0.72, 0.48, 0.22), 0.1), ('cheese', (0.95, 0.80, 0.30), 0.2), ('void', (0.08, 0.08, 0.1), 0.0),
                  ('pie', (0.70, 0.42, 0.18), 0.2), ('fish', (0.70, 0.72, 0.75), 0.8), ('melon', (0.15, 0.45, 0.15), 0.4), ('melon_in', (0.85, 0.15, 0.2), 0.3),
                  ('sausage', (0.55, 0.20, 0.15), 0.4), ('pancake', (0.90, 0.68, 0.32), 0.2), ('bottle', (0.10, 0.30, 0.15), 0.9), ('orange', (0.95, 0.55, 0.10), 0.5),
                  ('tomato', (0.85, 0.12, 0.08), 0.6), ('green', (0.25, 0.55, 0.15), 0.2)]:
    apt.mat(nm, a, s_)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)


def lerp3(a, b, k):
    return np.array(a, float) + (np.array(b, float) - np.array(a, float)) * k


def path(keys, t):
    for (t0, p0, g0), (t1, p1, g1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            k = float(ss(t0, t1, t))
            return lerp3(p0, p1, k), lerp3(g0, g1, k)
    return np.array(keys[-1][1], float), np.array(keys[-1][2], float)


def fade(t):
    f = float(ss(0.0, 1.5, t))
    for a, b in ((S1, S2), (S2, S3), (S3, S4)):
        f *= float(ss(a, a + 2.0, t) * (1 - ss(b - 2.0, b, t))) if a <= t < b else 1.0
    if S4 <= t < S5:
        f *= float(ss(S4, S4 + 1.0, t))
    if S5 <= t:
        f *= 1.0
    if 11.0 <= t < S1:
        f *= float(1 - ss(11.0, S1, t))
    return f


# ---------------- apartment scenes (0 and 5) ----------------
def home_prims(t):
    return (props.clock_prims() + props.bills_prims() + props.curtain_prims() + props.calendar_prims() + props.door_props(0.0)
            + props.bag_on_door(0.0) + props.inside_props() + props.sill_prims() + props.kettle_prims() + props.jacket_prims(True)
            + apt.STATIC + [box((-2.3, -0.02, 3.0), (2.3, 0.0, 7.6), M['floor'])] + apt.ENTR_DOOR(0.0) + apt.fridge(190.0)
            + apt.cabinet(0.0) + [apt.stove(190.0)] + apt.table(190.0) + apt.LAMPS)


def home_tex(mid, Px, Py, Pz, alb, nx, ny, nz, t):
    alb, nx, ny, nz = apt.tex(mid, Px, Py, Pz, alb, nx, ny, nz, t)
    alb = props.clock_tex(mid, Px, Py, Pz, alb, t)
    alb = props.bills_tex(mid, Px, Py, Pz, alb, ny)
    alb, nx, nz = props.curtain_tex(mid, Px, Py, Pz, alb, nx, nz)
    alb = props.calendar_tex(mid, Px, Py, Pz, alb, nz)
    alb = props.fridge6_tex(mid, Px, Py, Pz, alb, ny, 0.0)
    return alb, nx, ny, nz


def home_scene(t, cam, tgt, lamp):
    def bulbs(Px, Py, Pz, tt):
        out = np.zeros((Px.shape[0], 3), f32) + 0.02
        d = (Px - 0.8) ** 2 + (Py - 1.65) ** 2 + (Pz - 4.8) ** 2
        out[d < 0.01] = np.array([1.0, 0.82, 0.58], f32) * (0.03 + 5 * lamp)
        return out
    lights = [dict(p=(3.2, 2.6, 5.25), col=(0.45, 0.55, 0.85), I=0.35, att=(0.6, 0.15), dir=(-1, -0.55, 0), cos=(0.55, 0.9), shadow=False)]
    if lamp > 0.002:
        lights.append(dict(p=(0.8, 1.6, 4.8), col=(1.0, 0.82, 0.58), I=lamp, att=(0.2, 1.2), dir=(0, -1, 0), cos=(0.2, 0.75)))
    emit = {B['bulb']: bulbs, B['screen']: np.zeros(3, f32) + 0.008, B['window']: props.window_emit(t),
            B['disp']: np.array([0.06, 0.3, 0.12], f32), B['flame']: np.zeros(3, f32)}
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=home_prims(t), alb=apt.ALB, spec=apt.SPEC, tex=home_tex, post=apt.post,
                amb=0.003, exp=1.35, emit=emit, lights=lights)


K0 = [(0.0, (0.8, 1.22, 3.95), (0.8, 0.8, 4.8)), (6.0, (0.8, 1.12, 4.15), (0.8, 0.8, 4.8)), (14.0, (0.8, 0.96, 4.35), (0.8, 0.8, 4.8))]
K5 = [(S5, (0.8, 0.92, 4.38), (0.8, 0.8, 4.82)), (S5 + 3.0, (0.8, 1.05, 4.2), (0.8, 0.8, 4.8)), (S5 + 6.0, (0.8, 1.22, 3.95), (0.95, 1.4, 6.5)),
      (S5 + 10.0, (0.8, 1.22, 3.95), (0.55, 1.75, 7.49)), (S5 + 13.5, (0.8, 1.2, 3.97), (0.8, 0.8, 4.8)), (DUR, (0.8, 1.14, 4.1), (0.8, 0.8, 4.8))]


# ---------------- scene 1: corridor of identical kitchens ----------------
MOD = 5.0


def kitchen_module(z0, i):
    m = M
    items = [box((-2.0, 0, z0), (-1.4, 0.86, z0 + 3.2), m['base']), box((-2.0, 0.86, z0), (-1.38, 0.9, z0 + 3.2), m['ctop']),
             box((1.3, 0, z0 + 1.0), (2.0, 1.9, z0 + 1.7), m['fr_out']), box((1.28, 0.9, z0 + 1.5), (1.3, 1.3, z0 + 1.53), m['black']),
             box((-1.25, 0.76, z0 + 2.2), (-0.35, 0.8, z0 + 3.1), m['table']),
             box((-1.2, 0, z0 + 2.25), (-1.15, 0.76, z0 + 2.3), m['table']), box((-0.45, 0, z0 + 3.0), (-0.4, 0.76, z0 + 3.05), m['table']),
             disc(-0.8, 0.808, z0 + 2.65, 0.13, m['plate']), sph((-0.79, 0.814, z0 + 2.64), 0.0055, m['crumb']),
             sph((-0.8, 1.75, z0 + 2.65), 0.045, m['bulb'], ns=True),
             box((-2.0, 0, z0 + 3.4), (-1.3, 1.9, z0 + 4.1), m['fr_out'])]
    if i % 2 == 0:
        items.append(zdisc(0.0, 2.1, z0 + 4.95, 0.18, m['clock_face']))
    return grp((-2.05, 0, z0), (2.05, 2.2, z0 + MOD), items)


def corridor_prims(t, camz):
    first = int(max(0, (camz - 6) // MOD))
    out = [box((-2.1, -0.02, -5), (2.1, 0.0, 200), m_) for m_ in (M['d_floor'],)]
    out += [box((-2.2, 0, -5), (-2.05, 2.6, 200), M['wall_k']), box((2.05, 0, -5), (2.2, 2.6, 200), M['wall_k']),
            box((-2.2, 2.6, -5), (2.2, 2.7, 200), M['ceil'])]
    for i in range(first, first + 8):
        out.append(kitchen_module(i * MOD, i))
    return out


K1 = [(S1, (0.0, 1.6, -2.0), (0.0, 1.5, 6.0)), (S2, (0.0, 1.6, 44.0), (0.0, 1.5, 54.0))]


def corridor_scene(t):
    cam, tgt = path(K1, t)
    ph = (cam[2] / 0.72) * np.pi
    cam = cam + np.array([0.012 * np.sin(ph), 0.02 * abs(np.sin(ph)), 0])
    tgt = tgt + np.array([0.6 * np.sin((t - S1) * 0.35), 0.15 * np.sin((t - S1) * 0.5), 0])
    lights = []
    base = int(cam[2] // MOD)
    for i in range(base, base + 3):
        lights.append(dict(p=(-0.8, 1.7, i * MOD + 2.65), col=(1.0, 0.82, 0.58), I=0.7, att=(0.2, 0.9), dir=(0, -1, 0), cos=(0.1, 0.7),
                           shadow=(i == base + 1)))
    lights.append(dict(p=tuple(cam + np.array([0, 0.3, 0])), col=(0.6, 0.5, 0.9), I=0.12, att=(0.5, 0.3), shadow=False))

    def bulbs(Px, Py, Pz, tt):
        return np.zeros((Px.shape[0], 3), f32) + np.array([1.0, 0.82, 0.58], f32) * 3.0

    def post(col, D, c, best, tt):
        d = np.minimum(best, 60.0)
        f = np.exp(-d * 0.055)[:, None]
        return col * f + np.array([0.05, 0.03, 0.09], f32) * (1 - f)

    sc = dict(cam=tuple(cam), tgt=tuple(tgt), prims=corridor_prims(t, cam[2]), alb=apt.ALB, spec=apt.SPEC,
              tex=lambda mid, Px, Py, Pz, alb, nx, ny, nz, tt: (props.clock_tex(mid, Px + props.CLOCK[0], Py - 2.1 + props.CLOCK[1], Pz, _chk(mid, Px, Pz, alb), tt * 40.0), nx, ny, nz),
              post=post, amb=0.01, exp=1.4, emit={B['bulb']: bulbs}, lights=lights, bg=0.0)
    return sc


def _chk(mid, Px, Pz, alb):
    m = mid == M['d_floor']
    if m.any():
        c = (np.floor(Px / 0.5) + np.floor(Pz / 0.5)) % 2
        alb[m] *= (0.6 + 0.4 * c[m])[:, None]
    return alb


# ---------------- scene 2: hall of giant fridges ----------------
GIANTS = [(-14, 10), (13, 14), (-12, 32), (15, 34), (0, 58)]
GW, GD, GH = 6.0, 5.0, 22.0


def giant(x, z):
    hw = GW / 2; zf = z - GD / 2
    return [grp((x - hw - 0.1, 0, zf - 0.8), (x + hw + 0.1, GH, z + GD / 2), [
        box((x - hw, 0, zf), (x + hw, GH, z + GD / 2), M['fr_out']),
        box((x - hw, GH * 0.66, zf - 0.06), (x + hw, GH * 0.66 + 0.12, zf), M['black']),
        box((x + hw - 0.9, GH * 0.4, zf - 0.7), (x + hw - 0.5, GH * 0.6, zf), M['black']),
        box((x + hw - 0.9, GH * 0.72, zf - 0.7), (x + hw - 0.5, GH * 0.82, zf), M['black'])])]


def giant_open(t):
    x, z = GIANTS[-1]
    hw = GW / 2; zf = z - GD / 2
    yaw = float(ss(S2 + 22, S2 + 31, t)) * np.radians(100)
    inner = [box((x - hw, 0, zf + 0.05), (x + hw, 0.5, z + GD / 2), M['fr_in']),
             box((x - hw, GH - 0.5, zf + 0.05), (x + hw, GH, z + GD / 2), M['fr_out']),
             box((x - hw, 0, z + GD / 2 - 0.1), (x + hw, GH, z + GD / 2), M['giant_in']),
             box((x - hw, 0, zf), (x - hw + 0.25, GH, z + GD / 2), M['fr_out']),
             box((x + hw - 0.25, 0, zf), (x + hw, GH, z + GD / 2), M['fr_out'])]
    for yy in (5.0, 9.5, 14.5):
        inner.append(box((x - hw + 0.25, yy, zf + 0.2), (x + hw - 0.25, yy + 0.15, z + GD / 2 - 0.1), M['fr_in']))
    inner.append(sph((x + 1.2, 9.65 + 0.32, z), 0.32, M['lemon']))
    door = [obox((x - hw, zf), (0.0, 0.0, -0.5), (GW, GH, 0.0), -yaw, M['fr_out']),
            obox((x - hw, zf), (GW - 0.9, GH * 0.4, -1.2), (GW - 0.5, GH * 0.6, -0.5), -yaw, M['black'])]
    return inner + door, yaw


SCALE_PROPS = [box((1.6, 0, 16.0), (2.3, 1.9, 16.7), M['fr_out']), box((1.58, 0.9, 16.5), (1.6, 1.3, 16.53), M['black']),
               box((-2.6, 0.76, 22.0), (-1.6, 0.8, 22.9), M['table']), box((-2.55, 0, 22.05), (-2.5, 0.76, 22.1), M['table']),
               box((-1.7, 0, 22.8), (-1.65, 0.76, 22.85), M['table']), disc(-2.1, 0.808, 22.45, 0.13, M['plate'])]


K2 = [(S2, (0.0, 1.6, -6.0), (0.0, 6.0, 20.0)), (S2 + 12, (1.0, 1.6, 12.0), (-4.0, 10.0, 30.0)),
      (S2 + 22, (0.3, 1.6, 26.0), (0.0, 9.0, 58.0)), (S2 + 32, (0.1, 1.6, 32.0), (0.0, 10.0, 58.0)),
      (S3, (0.0, 1.6, 36.0), (0.0, 10.5, 58.0))]


def giants_scene(t):
    cam, tgt = path(K2, t)
    ph = (cam[2] / 0.72) * np.pi
    cam = cam + np.array([0.01 * np.sin(ph), 0.02 * abs(np.sin(ph)), 0])
    prims = [box((-60, -0.02, -20), (60, 0.0, 120), M['d_floor'])] + SCALE_PROPS
    for x, z in GIANTS[:-1]:
        prims += giant(x, z)
    op, yaw = giant_open(t)
    prims += op
    gx, gz = GIANTS[-1]
    glow = float(ss(S2 + 22, S2 + 30, t))
    lights = [dict(p=(0, 30, 20), col=(0.55, 0.6, 0.9), I=3.0, att=(1.0, 0.004), shadow=True),
              dict(p=tuple(cam + np.array([0, 1.0, 0])), col=(0.7, 0.6, 1.0), I=0.15, att=(0.5, 0.3), shadow=False)]
    if glow > 0:
        lights.append(dict(p=(gx, GH / 2, gz), col=(0.85, 0.95, 1.0), I=60.0 * glow, att=(1.0, 0.08), shadow=False))
        lights.append(dict(p=(gx, GH * 0.5, gz - GD / 2 - 1.0), col=(0.85, 0.95, 1.0), I=25.0 * glow, att=(1.0, 0.05), dir=(0, -0.35, -1), cos=(0.3, 0.7), shadow=True))

    def post(col, D, c, best, tt):
        d = np.minimum(best, 120.0)
        f = np.exp(-d * 0.018)[:, None]
        return col * f + np.array([0.07, 0.05, 0.12], f32) * (1 - f)

    def chk(mid, Px, Py, Pz, alb, nx, ny, nz, tt):
        m = mid == M['d_floor']
        if m.any():
            cc = (np.floor(Px / 1.0) + np.floor(Pz / 1.0)) % 2
            alb[m] *= (0.6 + 0.4 * cc[m])[:, None]
        return alb, nx, ny, nz
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=prims, alb=apt.ALB, spec=apt.SPEC, tex=chk, post=post, amb=0.02, exp=1.3,
                emit={M['giant_in']: np.array([1.0, 1.0, 1.05], f32) * (0.15 + 3.0 * glow)}, lights=lights, bg=0.0)


# ---------------- scene 3: the banquet that runs away ----------------
_KINDS = ['chicken', 'cake', 'bread', 'apples', 'pie', 'fish', 'grapes', 'melon', 'cheese', 'sausage', 'pancakes', 'bottle', 'oranges', 'salad']
FOOD = []
for _r in range(13):
    for _c, _x in enumerate((-0.44, 0.0, 0.44)):
        FOOD.append((_KINDS[(_r * 3 + _c * 5) % len(_KINDS)], _x + 0.04 * np.sin(_r * 1.7 + _c), 0.3 + _r * 0.44))


def table_z0(t, camz):
    return camz + 2.0 - max(0.0, camz + 1.5) * 0.04


def food_item(kind, x, y, z, grey):
    if grey:
        s = {'chicken': 0.13, 'bread': 0.1, 'apples': 0.09, 'cake': 0.14, 'grapes': 0.08, 'cheese': 0.09}.get(kind, 0.1)
        return [box((x - s, y, z - s), (x + s, y + s * 1.4, z + s), M['d_grey'])]
    if kind == 'chicken':
        return [disc(x, y + 0.005, z, 0.17, M['plate']), sph((x, y + 0.08, z), 0.1, M['chicken']), sph((x + 0.06, y + 0.07, z + 0.05), 0.07, M['chicken']),
                cap((x - 0.08, y + 0.07, z + 0.02), (x - 0.16, y + 0.1, z + 0.06), 0.025, M['chicken']), cap((x - 0.16, y + 0.1, z + 0.06), (x - 0.18, y + 0.11, z + 0.07), 0.018, M['cream'])]
    if kind == 'bread':
        return [cap((x - 0.12, y + 0.05, z), (x + 0.12, y + 0.05, z), 0.06, M['bread2'])]
    if kind == 'apples':
        return [disc(x, y + 0.005, z, 0.13, M['plate'])] + [sph((x + dx, y + 0.05, z + dz), 0.045, M['apple']) for dx, dz in ((0, 0), (0.06, 0.04), (-0.05, 0.05), (0.02, -0.06))]
    if kind == 'cake':
        return [cyl(x, z, 0.14, y, y + 0.12, M['cake'], M['cake']), disc(x, y + 0.12, z, 0.14, M['cream'])] + \
               [cyl(x + 0.07 * np.cos(a), z + 0.07 * np.sin(a), 0.006, y + 0.12, y + 0.18, M['cream'], M['cream']) for a in (0, 2.1, 4.2)] + \
               [sph((x + 0.07 * np.cos(a), y + 0.19, z + 0.07 * np.sin(a)), 0.009, M['flame'], ns=True) for a in (0, 2.1, 4.2)]
    if kind == 'grapes':
        return [sph((x + dx, y + 0.03 + dy, z + dz), 0.025, M['grape']) for dx, dy, dz in
                ((0, 0, 0), (0.04, 0, 0.02), (-0.03, 0, 0.03), (0.01, 0.035, 0.01), (0.02, 0, -0.04), (-0.02, 0.035, -0.02))]
    if kind == 'cheese':
        return [box((x - 0.08, y, z - 0.06), (x + 0.08, y + 0.07, z + 0.06), M['cheese']), box((x + 0.02, y, z - 0.09), (x + 0.12, y + 0.05, z - 0.03), M['cheese'])]
    if kind == 'pie':
        return [disc(x, y + 0.005, z, 0.16, M['plate']), cyl(x, z, 0.13, y, y + 0.05, M['pie'], M['pie']), disc(x, y + 0.05, z, 0.13, M['pie'])]
    if kind == 'fish':
        return [disc(x, y + 0.005, z, 0.17, M['plate']), cap((x - 0.11, y + 0.04, z), (x + 0.09, y + 0.04, z), 0.035, M['fish']),
                cap((x + 0.09, y + 0.04, z), (x + 0.14, y + 0.05, z + 0.03), 0.012, M['fish']), cap((x + 0.09, y + 0.04, z), (x + 0.14, y + 0.05, z - 0.03), 0.012, M['fish'])]
    if kind == 'melon':
        return [sph((x, y + 0.1, z), 0.11, M['melon']), sph((x + 0.12, y + 0.03, z + 0.08), 0.04, M['melon_in'])]
    if kind == 'sausage':
        return [disc(x, y + 0.005, z, 0.14, M['plate'])] + [cap((x - 0.09, y + 0.025, z + dz), (x + 0.09, y + 0.025, z + dz), 0.02, M['sausage']) for dz in (-0.05, 0.0, 0.05)]
    if kind == 'pancakes':
        return [disc(x, y + 0.005, z, 0.15, M['plate'])] + [cyl(x, z, 0.1, y + 0.01 + 0.012 * i, y + 0.02 + 0.012 * i, M['pancake'], M['pancake']) for i in range(6)] + \
               [disc(x, y + 0.092, z, 0.1, M['pancake'])]
    if kind == 'bottle':
        return [cyl(x, z, 0.035, y, y + 0.2, M['bottle'], M['bottle']), cyl(x, z, 0.013, y + 0.2, y + 0.3, M['bottle'], M['bottle'])]
    if kind == 'oranges':
        return [sph((x + dx, y + 0.045, z + dz), 0.045, M['orange']) for dx, dz in ((0, 0), (0.07, 0.03), (-0.06, 0.04), (0.02, -0.07))]
    if kind == 'salad':
        return [cyl(x, z, 0.11, y, y + 0.06, M['cream'], M['cream'])] + [sph((x + dx, y + 0.07, z + dz), 0.03, M['green']) for dx, dz in ((0, 0), (0.05, 0.03), (-0.04, 0.04), (0.03, -0.05))] + \
               [sph((x - 0.03, y + 0.08, z - 0.02), 0.022, M['tomato']), sph((x + 0.05, y + 0.08, z - 0.01), 0.02, M['tomato'])]
    return []


K3 = [(S3, (0.0, 1.4, -1.5), (0.0, 0.85, 2.5)), (S3 + 46, (0.0, 1.3, 11.0), (0.0, 0.82, 14.0)), (S4, (0.0, 1.28, 11.4), (0.0, 0.8, 14.0))]


def banquet_scene(t):
    cam, tgt = path(K3, t)
    ph = (cam[2] / 0.72) * np.pi
    cam = cam + np.array([0.012 * np.sin(ph), 0.018 * abs(np.sin(ph)), 0])
    z0 = table_z0(t, cam[2])
    L = 6.0
    prims = [box((-30, -0.02, -20), (30, 0.0, 80), M['void']),
             box((-0.7, 0.72, z0), (0.7, 0.76, z0 + L), M['cloth']),
             box((-0.65, 0, z0 + 0.1), (-0.6, 0.72, z0 + 0.15), M['table']), box((0.6, 0, z0 + 0.1), (0.65, 0.72, z0 + 0.15), M['table']),
             box((-0.65, 0, z0 + L - 0.15), (-0.6, 0.72, z0 + L - 0.1), M['table']), box((0.6, 0, z0 + L - 0.15), (0.65, 0.72, z0 + L - 0.1), M['table'])]
    for kind, dx, dz in FOOD:
        z = z0 + dz
        thr = 1.6 + max(0.0, t - (S3 + 9.0)) * 0.12 + 0.25 * np.sin(dz * 3.1 + dx * 7)
        grey = (z - cam[2]) < thr
        prims += food_item(kind, dx, 0.76, z, grey)
    lights = [dict(p=(0.0, 2.2, z0 + 1.5), col=(1.0, 0.78, 0.5), I=1.6, att=(0.3, 0.5), dir=(0, -1, 0.1), cos=(0.3, 0.8)),
              dict(p=(0.0, 2.2, z0 + 4.0), col=(1.0, 0.78, 0.5), I=1.4, att=(0.3, 0.5), dir=(0, -1, -0.1), cos=(0.3, 0.8), shadow=False),
              dict(p=tuple(cam + np.array([0, 0.5, 0])), col=(0.5, 0.45, 0.8), I=0.08, att=(0.5, 0.3), shadow=False)]

    def post(col, D, c, best, tt):
        d = np.minimum(best, 60.0)
        f = np.exp(-d * 0.05)[:, None]
        return col * f + np.array([0.03, 0.015, 0.045], f32) * (1 - f)
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=prims, alb=apt.ALB, spec=apt.SPEC, post=post, amb=0.015, exp=1.35,
                emit={M['flame']: np.array([1.6, 1.0, 0.4], f32)}, lights=lights, bg=0.0)


# ---------------- scene 4: falling ----------------
rf = np.random.default_rng(7)
FLOAT = [(rf.uniform(-2.2, 2.2), rf.uniform(-46, 2), rf.uniform(-2.2, 2.2), rf.integers(0, 4), rf.uniform(0, 6.28)) for _ in range(190)]


def fall_scene(t):
    k = t - S4
    cy = -k * 1.8 - 0.06 * k * k
    ang = k * 0.5
    cam = np.array([0.0, cy, 0.0])
    tgt = cam + np.array([np.sin(ang) * 1.0, -1.6, np.cos(ang) * 1.0])
    prims = []
    for x, y, z, kind, ph in FLOAT:
        if abs(y - cy) > 14:
            continue
        yy = y + 0.3 * np.sin(k + ph)
        if kind == 0:
            prims.append(cap((x - 0.12, yy, z), (x + 0.12, yy + 0.05, z + 0.03), 0.012, M['cap']))
        elif kind == 1:
            prims.append(sph((x, yy, z), 0.14, M['plate']))
        elif kind == 2:
            prims.append(obox((x, z), (-0.04, yy, -0.08), (0.04, yy + 0.01, 0.08), k * 2 + ph, M['screen']))
        else:
            prims.append(cyl(x, z, 0.06, yy, yy + 0.1, M['mug'], M['mug']))
    prims.append(zdisc(0.0, cy - 6, 3.0, 1.2, M['clock_face']))
    lights = [dict(p=tuple(cam + np.array([0, 2.0, 0])), col=(0.7, 0.6, 1.0), I=1.2, att=(0.3, 0.2), shadow=False),
              dict(p=tuple(cam + np.array([0, -8.0, 0])), col=(1.0, 0.4, 0.3), I=1.5, att=(0.3, 0.05), shadow=False)]

    def scr(Px, Py, Pz, tt):
        on = (np.sin(tt * 9 + Px * 5) > 0)
        return np.where(on[:, None], np.array([0.9, 0.15, 0.15], f32), np.array([0.15, 0.02, 0.02], f32)).astype(f32)

    def post(col, D, c, best, tt):
        d = np.minimum(best, 40.0)
        f = np.exp(-d * 0.08)[:, None]
        return col * f + np.array([0.02, 0.01, 0.035], f32) * (1 - f)

    def tex(mid, Px, Py, Pz, alb, nx, ny, nz, tt):
        return props.clock_tex(mid, Px - 0.0 + props.CLOCK[0], Py - (cy - 6) + props.CLOCK[1], Pz, alb, tt * 60), nx, ny, nz
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=prims, alb=apt.ALB, spec=apt.SPEC, post=post, tex=tex, amb=0.03, exp=1.3,
                emit={M['screen']: scr}, lights=lights, bg=0.0)


# ---------------- dispatcher ----------------
def build(t):
    if t < S1:
        cam, tgt = path(K0, t)
        lamp = 0.32 * (1 - 0.6 * float(ss(8.0, 13.0, t)))
        sc = home_scene(t, cam, tgt, lamp)
    elif t < S2:
        sc = corridor_scene(t)
    elif t < S3:
        sc = giants_scene(t)
    elif t < S4:
        sc = banquet_scene(t)
    elif t < S5:
        sc = fall_scene(t)
    else:
        cam, tgt = path(K5, t)
        props.CLOCK_T0 = 3 * 3600 + 12 * 60 - int(S5)
        sc = home_scene(t, cam, tgt, 0.32)
    f = fade(t)
    old = sc.get('post')

    def post(col, D, c, best, tt):
        if old is not None:
            col = old(col, D, c, best, tt)
        return col * f
    sc['post'] = post
    return sc


def frame(t):
    img = render(build(t), t)
    if S5 <= t < S5 + 0.25:   # waking flash
        k = 1 - (t - S5) / 0.25
        img = np.clip(img.astype(np.float32) + 255 * k, 0, 255).astype(np.uint8)
    return img


def main():
    mode = sys.argv[1]
    if mode == 'preview':
        for s in sys.argv[2:]:
            Image.fromarray(frame(float(s))).save(os.path.join(HERE, f'dr_prev_{s}.png'))
    elif mode == 'chunk':
        k = int(sys.argv[2]); n = int(sys.argv[3])
        per = NF // n; a = k * per; b = NF if k == n - 1 else (k + 1) * per
        out = os.path.join(HERE, f'dr_c{k:02d}.mp4')
        if os.path.exists(out):
            return
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{eng.W}x{eng.H}', '-r', str(FPS),
                              '-i', '-', '-vf', 'scale=1280:720:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast',
                              '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), out + '.tmp.mp4'], stdin=subprocess.PIPE)
        for fi in range(a, b):
            p.stdin.write(frame(fi / FPS).tobytes())
        p.stdin.close()
        if p.wait() == 0:
            os.rename(out + '.tmp.mp4', out); print('chunk', k, flush=True)


if __name__ == '__main__':
    main()
