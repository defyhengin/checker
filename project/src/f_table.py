import sys, os, subprocess
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 640, 360
FPS = 30
DUR = float(os.environ.get('ENG_DUR', 15.0)); STRETCH = 15.0 / DUR
NF = int(round(FPS * DUR))
f32 = np.float32
INF = f32(1e9)

xs = (np.arange(W) + 0.5) / W * 2 - 1
ys = 1 - (np.arange(H) + 0.5) / H * 2
PX, PY = np.meshgrid(xs, ys)
PX = PX.ravel().astype(f32); PY = PY.ravel().astype(f32)
N = W * H
TANX = 0.62
TANY = TANX * H / W
VIG = np.clip(1 - 0.5 * (0.45 * PX ** 2 + 0.7 * PY ** 2), 0, 1).reshape(H, W, 1).astype(f32)

TY = 0.80  # table top
BOXES = [  # (min, max, mat)
    ((-1.2, 0.75, -0.7), (1.2, TY, 0.7), 2),
    ((-1.1, 0.0, -0.6), (-1.0, 0.75, -0.5), 3),
    ((1.0, 0.0, -0.6), (1.1, 0.75, -0.5), 3),
    ((-1.1, 0.0, 0.5), (-1.0, 0.75, 0.6), 3),
    ((1.0, 0.0, 0.5), (1.1, 0.75, 0.6), 3),
    ((-0.47, TY, -0.12), (-0.44, TY + 0.008, 0.16), 5),   # fork handle
    ((-0.475, TY, -0.2), (-0.435, TY + 0.008, -0.12), 5),  # fork head
    ((0.44, TY, -0.16), (0.47, TY + 0.008, 0.16), 5),     # knife
    ((-5, -0.1, 3.0), (5, 5, 3.1), 1),                    # back wall
]
PLATE_C = (0.0, TY + 0.012, 0.0); PLATE_R = 0.32
MUG_C = (0.62, -0.22); MUG_R = 0.075; MUG_Y = (TY, TY + 0.17)
BULB_R = 0.05
CRUMBS = [((0.02, TY + 0.019, -0.01), 0.009), ((0.031, TY + 0.016, -0.004), 0.006), ((0.012, TY + 0.016, -0.003), 0.005)]

MAT = np.zeros((16, 3), f32)
MAT[0] = (0.12, 0.10, 0.09)
MAT[1] = (0.16, 0.14, 0.13)
MAT[2] = (0.30, 0.15, 0.07)
MAT[3] = (0.30, 0.17, 0.09)
MAT[4] = (0.62, 0.62, 0.60)
MAT[5] = (0.70, 0.70, 0.72)
MAT[6] = (0.55, 0.12, 0.10)
MAT[7] = (0.20, 0.05, 0.04)
MAT[8] = (1, 1, 1)
MAT[9] = (0.05, 0.05, 0.05)
MAT[10] = (0.62, 0.42, 0.20)
LCOL = np.array([1.0, 0.82, 0.58], f32)


def ss(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)


def flick(t):
    v = 1.0 - 0.04 * np.sin(t * 37) * np.sin(t * 5.3) ** 2
    for a, b in [(4.6, 4.72), (8.3, 8.42), (8.55, 8.6)]:
        if a <= t <= b:
            v *= 0.3
    if t > 11.8:
        k = min((t - 11.8) / 2.2, 1.0)
        on = np.sin(t * 31) * np.sin(t * 13 + 1) > (0.6 - 0.5 * k)
        v *= 1.0 - 0.7 * (1.0 if on else 0.0)
        v *= 1.0 - 0.45 * ss(12.8, 14.0, t)
    if t > 14.0:
        v *= np.exp(-(t - 14.0) * 30)
    return float(v)


def lamp(t):
    return (0.05 * np.sin(t * 0.9), 1.72, 0.03 * np.sin(t * 0.7 + 1))


def camera(t):
    k = ss(1.0, 13.4, t)
    pos = np.array([-0.35 + 0.37 * k, 1.35 + 0.0 * k, -2.7 + 2.2 * k])
    tgt = np.array([0.0, 0.95 - 0.14 * k, -0.02 * k])
    pos[0] += 0.012 * np.sin(t * 0.6)
    return pos, tgt


def inv_of(D):
    return tuple((1.0 / np.where(np.abs(d) < 1e-6, 1e-6, d)).astype(f32) for d in D)


def box_hit(O, inv, bmin, bmax):
    t1x = (bmin[0] - O[0]) * inv[0]; t2x = (bmax[0] - O[0]) * inv[0]
    t1y = (bmin[1] - O[1]) * inv[1]; t2y = (bmax[1] - O[1]) * inv[1]
    t1z = (bmin[2] - O[2]) * inv[2]; t2z = (bmax[2] - O[2]) * inv[2]
    lox = np.minimum(t1x, t2x); loy = np.minimum(t1y, t2y); loz = np.minimum(t1z, t2z)
    tn = np.maximum(np.maximum(lox, loy), loz)
    tf = np.minimum(np.minimum(np.maximum(t1x, t2x), np.maximum(t1y, t2y)), np.maximum(t1z, t2z))
    hit = (tf > tn) & (tn > 1e-3)
    ax = np.where((lox >= loy) & (lox >= loz), 0, np.where(loy >= loz, 1, 2)).astype(np.int8)
    return np.where(hit, tn, INF).astype(f32), ax


def sph_t(O, D, c, r):
    ox = O[0] - c[0]; oy = O[1] - c[1]; oz = O[2] - c[2]
    b = ox * D[0] + oy * D[1] + oz * D[2]
    disc = b * b - (ox * ox + oy * oy + oz * oz - r * r)
    t = -b - np.sqrt(np.maximum(disc, 0))
    return np.where((disc > 0) & (t > 1e-3), t, INF).astype(f32)


def disc_t(O, D, cy, cx, cz, r):
    with np.errstate(divide='ignore', invalid='ignore'):
        t = (cy - O[1]) / D[1]
    x = O[0] + D[0] * t - cx; z = O[2] + D[2] * t - cz
    ok = (t > 1e-3) & (x * x + z * z < r * r) & np.isfinite(t)
    return np.where(ok, t, INF).astype(f32)


def cyl_t(O, D, cx, cz, r, y0, y1):
    ox = O[0] - cx; oz = O[2] - cz
    a = D[0] * D[0] + D[2] * D[2] + 1e-9
    b = ox * D[0] + oz * D[2]
    c = ox * ox + oz * oz - r * r
    disc = b * b - a * c
    sq = np.sqrt(np.maximum(disc, 0))
    t1 = (-b - sq) / a; t2 = (-b + sq) / a
    y1h = O[1] + D[1] * t1; y2h = O[1] + D[1] * t2
    h1 = (disc > 0) & (t1 > 1e-3) & (y1h > y0) & (y1h < y1)
    h2 = (disc > 0) & (t2 > 1e-3) & (y2h > y0) & (y2h < y1)
    to = np.where(h1, t1, INF).astype(f32)
    ti = np.where(h2 & ~h1, t2, INF).astype(f32)
    return to, ti


def trace(O, D, with_bulb, L=None):
    n = D[0].shape[0]
    inv = inv_of(D)
    best = np.full(n, INF, f32); mid = np.full(n, -1, np.int8)
    nx = np.zeros(n, f32); ny = np.zeros(n, f32); nz = np.zeros(n, f32)

    def take(tt, m_id, nn):
        nonlocal best, mid, nx, ny, nz
        m = tt < best
        best = np.where(m, tt, best); mid = np.where(m, m_id, mid)
        nx = np.where(m, nn[0], nx); ny = np.where(m, nn[1], ny); nz = np.where(m, nn[2], nz)

    for bmin, bmax, mat in BOXES:
        tt, ax = box_hit(O, inv, bmin, bmax)
        take(tt, mat, (np.where(ax == 0, -np.sign(D[0]), 0), np.where(ax == 1, -np.sign(D[1]), 0),
                       np.where(ax == 2, -np.sign(D[2]), 0)))
    with np.errstate(divide='ignore', invalid='ignore'):
        tf = -O[1] / D[1]
    tf = np.where((D[1] < -1e-5) & (tf > 0), tf, INF).astype(f32)
    take(tf, 0, (0, 1, 0))
    take(disc_t(O, D, PLATE_C[1], PLATE_C[0], PLATE_C[2], PLATE_R), 4, (0, 1, 0))
    for cc, cr in CRUMBS:
        tt = sph_t(O, D, cc, cr)
        take(tt, 10, ((O[0] + D[0] * tt - cc[0]) / cr, (O[1] + D[1] * tt - cc[1]) / cr, (O[2] + D[2] * tt - cc[2]) / cr))
    to, ti = cyl_t(O, D, MUG_C[0], MUG_C[1], MUG_R, MUG_Y[0], MUG_Y[1])
    px = O[0] + D[0] * to - MUG_C[0]; pz = O[2] + D[2] * to - MUG_C[1]
    take(to, 6, (px / MUG_R, 0, pz / MUG_R))
    px = O[0] + D[0] * ti - MUG_C[0]; pz = O[2] + D[2] * ti - MUG_C[1]
    take(ti, 7, (-px / MUG_R, 0, -pz / MUG_R))
    take(disc_t(O, D, MUG_Y[0] + 0.015, MUG_C[0], MUG_C[1], MUG_R), 7, (0, 1, 0))
    if with_bulb:
        take(sph_t(O, D, L, BULB_R), 8, (0, 1, 0))
        cmin = (L[0] - 0.006, L[1] + BULB_R * 0.8, L[2] - 0.006); cmax = (L[0] + 0.006, 4.0, L[2] + 0.006)
        tt, _ = box_hit(O, inv, cmin, cmax)
        take(tt, 9, (0, 0, -1))
    return best, mid, nx, ny, nz


rng = np.random.default_rng(3)


def hashn(x, y):
    v = np.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return v - np.floor(v)


def render(fi):
    t = fi / FPS * STRETCH
    I = 1.25 * flick(t)
    L = lamp(t)
    cam, tgt = camera(t)
    f = tgt - cam; f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    Dx = f[0] + PX * TANX * r[0] + PY * TANY * u[0]
    Dy = f[1] + PX * TANX * r[1] + PY * TANY * u[1]
    Dz = f[2] + PX * TANX * r[2] + PY * TANY * u[2]
    nr = np.sqrt(Dx * Dx + Dy * Dy + Dz * Dz)
    D = ((Dx / nr).astype(f32), (Dy / nr).astype(f32), (Dz / nr).astype(f32))
    O = tuple(np.full(N, c, f32) for c in cam)

    best, mid, nx, ny, nz = trace(O, D, True, L)
    hit = best < INF
    bc = np.where(hit, best, 0)
    Px = O[0] + D[0] * bc; Py = O[1] + D[1] * bc; Pz = O[2] + D[2] * bc

    alb = MAT[np.clip(mid, 0, 15)].copy()
    # wood grain on table top
    wm = mid == 2
    g = 0.85 + 0.15 * np.sin(Pz * 40 + 3 * np.sin(Px * 3)) + 0.06 * hashn(np.floor(Px * 200), np.floor(Pz * 9))
    alb[wm] *= g[wm][:, None]
    fl = mid == 0
    plank = 0.8 + 0.2 * hashn(np.floor(Px * 4), 1.0) * (np.abs((Px * 4) % 1 - 0.5) < 0.48)
    alb[fl] *= plank[fl][:, None]
    # plate: fake rim normals + inner ring
    pm = mid == 4
    rx = Px - PLATE_C[0]; rz = Pz - PLATE_C[2]
    rr = np.sqrt(rx * rx + rz * rz) + 1e-6
    tilt = np.where((rr > 0.2) & (rr < 0.26), -0.55, np.where(rr >= 0.26, 0.45, 0.0))
    tilt = np.where(rr > 0.305, 1.2, tilt)
    pnx = rx / rr * tilt; pnz = rz / rr * tilt; pny = np.ones_like(rr)
    pl = np.sqrt(pnx * pnx + pny * pny + pnz * pnz)
    nx = np.where(pm, pnx / pl, nx); ny = np.where(pm, pny / pl, ny); nz = np.where(pm, pnz / pl, nz)
    ring = (np.abs(rr - 0.29) < 0.005)
    alb[pm & ring] = (0.25, 0.32, 0.42)

    Lx = L[0] - Px; Ly = L[1] - Py; Lz = L[2] - Pz
    d2 = Lx * Lx + Ly * Ly + Lz * Lz + 1e-6
    dist = np.sqrt(d2)
    ld = (Lx / dist, Ly / dist, Lz / dist)
    ndl = np.clip(nx * ld[0] + ny * ld[1] + nz * ld[2], 0, 1)

    idx = np.nonzero(hit & (mid != 8) & (mid != 9))[0]
    sh = np.ones(N, f32)
    if idx.size:
        Os = (Px[idx] + nx[idx] * 3e-3, Py[idx] + ny[idx] * 3e-3, Pz[idx] + nz[idx] * 3e-3)
        Ds = (ld[0][idx], ld[1][idx], ld[2][idx])
        st, _, _, _, _ = trace(Os, Ds, False)
        sh[idx] = np.where(st < dist[idx], 0.0, 1.0)

    atten = 1.0 / (0.25 + d2 * 1.1)
    # lamp shade: light mostly goes down
    cone = np.clip(-ld[1] * -1, 0, 1)  # ld points to lamp; down-facing points have ld[1]>0
    cone = ss(0.25, 0.75, ld[1])
    amb = 0.05 * I * cone / (1 + d2)
    lum = (I * ndl * sh * atten * (0.08 + 0.92 * cone) + amb + 0.012)[:, None]
    col = alb * lum * LCOL
    vx, vy, vz = -D[0], -D[1], -D[2]
    hx = ld[0] + vx; hy = ld[1] + vy; hz = ld[2] + vz
    hn = np.sqrt(hx * hx + hy * hy + hz * hz) + 1e-6
    ndh = np.clip((nx * hx + ny * hy + nz * hz) / hn, 0, 1)
    spw = np.where(mid == 5, 0.9, np.where(mid == 4, 0.5, np.where(mid == 6, 0.35, np.where(mid == 2, 0.08, 0.0))))
    col += (spw * ndh ** 60 * sh * I * atten * cone)[:, None] * LCOL
    bm = mid == 8
    col[bm] = LCOL * (0.05 + 6.0 * I / 1.25)
    col[~hit] = 0.003

    col = 1 - np.exp(-col * 1.3)
    img = (np.clip(col, 0, 1) ** (1 / 2.2)).reshape(H, W, 3)
    b = (np.clip(img - 0.62, 0, 1) * 255).astype(np.uint8)
    bl = Image.fromarray(b).resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(3))
    bl = np.asarray(bl.resize((W, H), Image.BILINEAR), f32) / 255.0
    img = img + bl * 1.2
    img = img * VIG + rng.normal(0, 0.012, (H, W, 1)).astype(f32)
    img *= ss(0, 0.6, t)
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


def main():
    mode = sys.argv[1]
    if mode == 'preview':
        import time
        for s in sys.argv[2:]:
            fi = int(s); t0 = time.time()
            Image.fromarray(render(fi)).resize((W * 2, H * 2), Image.LANCZOS).save(os.path.join(HERE, f'crh_prev_{fi}.png'))
            print(fi, round(time.time() - t0, 2), 's')
    elif mode == 'seg':
        k = int(sys.argv[2]); nseg = int(sys.argv[3])
        per = NF // nseg; a = k * per; b = NF if k == nseg - 1 else (k + 1) * per
        tmp = os.path.join(HERE, f'crh_seg{k}_tmp.mp4'); out = os.path.join(HERE, f'crh_seg{k}.mp4')
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                              '-r', str(FPS), '-i', '-', '-vf', 'scale=1280:720:flags=lanczos,format=yuv420p',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', tmp],
                             stdin=subprocess.PIPE)
        for fi in range(a, b):
            p.stdin.write(render(fi).tobytes())
        p.stdin.close()
        if p.wait() == 0:
            os.rename(tmp, out); print('done', k)


main()
