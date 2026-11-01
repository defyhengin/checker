import sys, os, subprocess
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
W, H = 360, 640
FPS, DUR = 30, 15.0
NF = int(FPS * DUR)
f32 = np.float32
INF = f32(1e9)

xs = (np.arange(W) + 0.5) / W * 2 - 1
ys = 1 - (np.arange(H) + 0.5) / H * 2
PX, PY = np.meshgrid(xs, ys)
PX = PX.ravel().astype(f32)
PY = PY.ravel().astype(f32)
N = W * H
TANX = 0.58
TANY = TANX * H / W
VIG = np.clip(1 - 0.42 * (0.5 * PX ** 2 + 0.5 * PY ** 2), 0, 1).reshape(H, W, 1).astype(f32)

# ---- scene -------------------------------------------------------------
WALLS = [
    ((-1.15, -0.1, 0.0), (-1.0, 3.1, 1.4)),
    ((1.0, -0.1, 0.0), (1.15, 3.1, 1.4)),
    ((-1.15, -0.1, 0.0), (1.15, 0.0, 1.4)),
    ((-1.15, 3.0, 0.0), (1.15, 3.1, 1.4)),
    ((-1.15, -0.1, 1.3), (1.15, 3.1, 1.4)),
]
JAR = ((-0.8, 0.0, 0.85), (-0.55, 0.3, 1.1))
LID = ((-0.78, 0.3, 0.87), (-0.57, 0.35, 1.08))
BOXES = WALLS + [JAR, LID]
SHELVES = [
    ((-1.0, 0.97, 0.06), (1.0, 1.0, 1.3)),
    ((-1.0, 1.77, 0.06), (1.0, 1.8, 1.3)),
    ((-1.0, 2.5, 0.06), (1.0, 2.53, 1.3)),
]
LEMON = ((0.25, 1.128, 0.6), 0.13)
LAMP_POS = (0.0, 2.92, 0.35)
LAMP_R = 0.045
LCOL = np.array([0.88, 0.96, 1.0], f32)

TAB = np.zeros((110, 3), f32)
TAB[0:5] = (0.80, 0.83, 0.86)
TAB[5] = (0.30, 0.45, 0.28)
TAB[6] = (0.55, 0.08, 0.06)
TAB[50] = (0.12, 0.12, 0.13)
TAB[100] = (0.95, 0.80, 0.10)
TAB[101] = (0.70, 0.85, 1.00)
TAB[102] = (1.0, 1.0, 1.0)


def ss(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)


def flick(t):
    v = 1.0 - 0.04 * np.sin(t * 37) * np.sin(t * 5.3) ** 2
    for a, b in [(2.2, 2.34), (7.1, 7.24), (7.38, 7.44)]:
        if a <= t <= b:
            v *= 0.25
    if t > 11.5:
        k = min((t - 11.5) / 2.5, 1.0)
        on = np.sin(t * 31) * np.sin(t * 13 + 1) > (0.6 - 0.5 * k)
        v *= 1.0 - 0.75 * (1.0 if on else 0.0)
        v *= 1.0 - 0.5 * ss(12.5, 14.0, t)
    if t > 14.0:
        v *= np.exp(-(t - 14.0) * 30)
    return float(v)


def drop_pos(t):
    per = 3.6
    ph = (t - 1.0) % per
    fall = 0.55
    if t < 1.0 or ph > fall:
        return (-0.3, -10.0, 0.7)
    y = 1.76 - 0.5 * 4.86 * ph * ph
    return (-0.3, y, 0.7)


def camera(t):
    z = -3.2 + 3.2 * ss(2.5, 13.2, t)
    y = 1.55 - 0.22 * ss(5, 13, t)
    x = 0.02 * np.sin(0.8 * t) + 0.12 * ss(8, 13.5, t)
    k = ss(7, 13, t)
    tgt = np.array([0.0 + 0.22 * k, 1.45 - 0.35 * k, 1.0 - 0.4 * k])
    return np.array([x, y, z]), tgt


def box_hit(O, inv, bmin, bmax):
    t1x = (bmin[0] - O[0]) * inv[0]; t2x = (bmax[0] - O[0]) * inv[0]
    t1y = (bmin[1] - O[1]) * inv[1]; t2y = (bmax[1] - O[1]) * inv[1]
    t1z = (bmin[2] - O[2]) * inv[2]; t2z = (bmax[2] - O[2]) * inv[2]
    lox = np.minimum(t1x, t2x); hix = np.maximum(t1x, t2x)
    loy = np.minimum(t1y, t2y); hiy = np.maximum(t1y, t2y)
    loz = np.minimum(t1z, t2z); hiz = np.maximum(t1z, t2z)
    tn = np.maximum(np.maximum(lox, loy), loz)
    tf = np.minimum(np.minimum(hix, hiy), hiz)
    hit = (tf > tn) & (tn > 1e-3)
    t = np.where(hit, tn, INF).astype(f32)
    ax = np.where((lox >= loy) & (lox >= loz), 0, np.where(loy >= loz, 1, 2)).astype(np.int8)
    return t, ax


def sph_t(O, D, c, r):
    ox = O[0] - c[0]; oy = O[1] - c[1]; oz = O[2] - c[2]
    b = ox * D[0] + oy * D[1] + oz * D[2]
    cc = ox * ox + oy * oy + oz * oz - r * r
    disc = b * b - cc
    t = -b - np.sqrt(np.maximum(disc, 0))
    return np.where((disc > 0) & (t > 1e-3), t, INF).astype(f32)


def inv_of(D):
    return tuple((1.0 / np.where(np.abs(d) < 1e-6, 1e-6, d)).astype(f32) for d in D)


def hashn(x, y, z):
    v = np.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453
    return v - np.floor(v)


rng = np.random.default_rng(7)


def render(fi):
    t = fi / FPS
    I = 2.6 * flick(t)
    cam, tgt = camera(t)
    cam = cam.astype(f32)
    f = tgt - cam; f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    Dx = f[0] + PX * TANX * r[0] + PY * TANY * u[0]
    Dy = f[1] + PX * TANX * r[1] + PY * TANY * u[1]
    Dz = f[2] + PX * TANX * r[2] + PY * TANY * u[2]
    nrm = np.sqrt(Dx * Dx + Dy * Dy + Dz * Dz)
    Dx = (Dx / nrm).astype(f32); Dy = (Dy / nrm).astype(f32); Dz = (Dz / nrm).astype(f32)
    D = (Dx, Dy, Dz)
    inv = inv_of(D)

    best = np.full(N, INF, f32)
    bid = np.full(N, -1, np.int16)
    bax = np.zeros(N, np.int8)
    for k, (bmin, bmax) in enumerate(BOXES):
        tt, ax = box_hit(cam, inv, bmin, bmax)
        m = tt < best
        best = np.where(m, tt, best); bid = np.where(m, k, bid); bax = np.where(m, ax, bax)
    # floor
    with np.errstate(divide='ignore', invalid='ignore'):
        tf = (-0.1 - cam[1]) / Dy
    tf = np.where((Dy < -1e-5) & (tf > 0), tf, INF).astype(f32)
    m = tf < best
    best = np.where(m, tf, best); bid = np.where(m, 50, bid)
    # spheres
    dpos = drop_pos(t)
    spheres = [(100, LEMON[0], LEMON[1]), (101, dpos, 0.03), (102, LAMP_POS, LAMP_R)]
    for sid, c, rad in spheres:
        tt = sph_t(cam, D, c, rad)
        m = tt < best
        best = np.where(m, tt, best); bid = np.where(m, sid, bid)

    hit = best < INF
    bc = np.where(hit, best, 0).astype(f32)
    Px = cam[0] + Dx * bc; Py = cam[1] + Dy * bc; Pz = cam[2] + Dz * bc
    nx = np.where(bax == 0, -np.sign(Dx), 0).astype(f32)
    ny = np.where(bax == 1, -np.sign(Dy), 0).astype(f32)
    nz = np.where(bax == 2, -np.sign(Dz), 0).astype(f32)
    isf = bid == 50
    nx[isf] = 0; ny[isf] = 1; nz[isf] = 0
    for sid, c, rad in spheres:
        m = bid == sid
        if m.any():
            nx[m] = (Px[m] - c[0]) / rad; ny[m] = (Py[m] - c[1]) / rad; nz[m] = (Pz[m] - c[2]) / rad

    alb = TAB[np.clip(bid, 0, 109)].copy()
    chk = (np.floor(Px / 0.7) + np.floor(Pz / 0.7)) % 2
    alb[isf] = (0.10 + 0.07 * chk[isf])[:, None]
    wm = bid < 5
    spk = 0.92 + 0.14 * hashn(np.floor(Px * 70), np.floor(Py * 70), np.floor(Pz * 70))
    alb[wm] *= spk[wm][:, None]

    # lighting
    Lx = LAMP_POS[0] - Px; Ly = LAMP_POS[1] - Py; Lz = LAMP_POS[2] - Pz
    d2 = Lx * Lx + Ly * Ly + Lz * Lz + 1e-6
    dist = np.sqrt(d2)
    ldx = Lx / dist; ldy = Ly / dist; ldz = Lz / dist
    ndl = np.clip(nx * ldx + ny * ldy + nz * ldz, 0, 1)

    Ox = Px + nx * 2e-3; Oy = Py + ny * 2e-3; Oz = Pz + nz * 2e-3
    invL = inv_of((ldx, ldy, ldz))
    sh = np.ones(N, f32)
    for bmin, bmax in (JAR, LID):
        tt, _ = box_hit((Ox, Oy, Oz), invL, bmin, bmax)
        sh = np.where(tt < dist, 0, sh)
    for bmin, bmax in SHELVES:
        tt, _ = box_hit((Ox, Oy, Oz), invL, bmin, bmax)
        sh = np.where(tt < dist, sh * 0.55, sh)
    for c, rad in (LEMON, (dpos, 0.03)):
        tt = sph_t((Ox, Oy, Oz), (ldx, ldy, ldz), c, rad)
        sh = np.where(tt < dist, 0, sh)
    fi_ = np.nonzero(isf)[0]
    if fi_.size:
        Os = (Ox[fi_], Oy[fi_], Oz[fi_])
        iv = tuple(a[fi_] for a in invL)
        dd = dist[fi_]
        blocked = np.zeros(fi_.size, bool)
        for bmin, bmax in WALLS:
            tt, _ = box_hit(Os, iv, bmin, bmax)
            blocked |= tt < dd
        sh[fi_] = np.where(blocked, 0, sh[fi_])

    atten = 1.0 / (0.6 + d2 * 0.8)
    fill = 0.10 * I / (1.0 + d2)
    lum = (I * ndl * sh * atten + fill + 0.025)[:, None]
    col = alb * lum * LCOL
    # specular on jar/lid/lemon/drop
    vx, vy, vz = -Dx, -Dy, -Dz
    hx = ldx + vx; hy = ldy + vy; hz = ldz + vz
    hn = np.sqrt(hx * hx + hy * hy + hz * hz) + 1e-6
    ndh = np.clip((nx * hx + ny * hy + nz * hz) / hn, 0, 1)
    specm = ((bid == 5) | (bid == 6) | (bid == 100) | (bid == 101)) & hit
    col += (specm * (ndh ** 40) * sh * I * atten * 0.6)[:, None] * LCOL
    # lamp
    lm = bid == 102
    col[lm] = LCOL * (0.03 + 5.0 * (I / 2.6))
    col[~hit] = 0.004

    # glass shelves (translucent layer in front)
    st = np.full(N, INF, f32)
    sax = np.zeros(N, np.int8)
    for bmin, bmax in SHELVES:
        tt, ax = box_hit(cam, inv, bmin, bmax)
        m = tt < st
        st = np.where(m, tt, st); sax = np.where(m, ax, sax)
    sm = st < best
    idx = np.nonzero(sm)[0]
    if idx.size:
        s = st[idx]
        px = cam[0] + Dx[idx] * s; py = cam[1] + Dy[idx] * s; pz = cam[2] + Dz[idx] * s
        a = sax[idx]
        snx = np.where(a == 0, -np.sign(Dx[idx]), 0); sny = np.where(a == 1, -np.sign(Dy[idx]), 0)
        snz = np.where(a == 2, -np.sign(Dz[idx]), 0)
        lx = LAMP_POS[0] - px; ly = LAMP_POS[1] - py; lz = LAMP_POS[2] - pz
        dd2 = lx * lx + ly * ly + lz * lz + 1e-6
        dd = np.sqrt(dd2)
        sndl = np.clip((snx * lx + sny * ly + snz * lz) / dd, 0, 1)
        cosv = np.abs(snx * Dx[idx] + sny * Dy[idx] + snz * Dz[idx])
        alpha = 0.16 + 0.55 * (1 - cosv) ** 2
        alpha = np.where(a == 2, 0.8, alpha)
        edge = np.where(a == 2, 0.9, 0.12)
        tint = np.array([0.45, 0.85, 0.92], f32)
        lsh = np.ones(idx.size, f32)
        ldn = (lx / dd, ly / dd, lz / dd)
        tl = sph_t((px + snx * 2e-3, py + sny * 2e-3, pz + snz * 2e-3), ldn, LEMON[0], LEMON[1])
        lsh = np.where(tl < dd, 0.25, 1.0)
        lumS = (I * (sndl * 0.9 * lsh + edge) / (0.6 + dd2 * 0.8))[:, None]
        scol = tint * lumS
        col[idx] = col[idx] * (1 - alpha[:, None]) + scol * alpha[:, None]

    # post
    col = 1 - np.exp(-col * 1.5)
    col = np.clip(col, 0, 1) ** (1 / 2.2)
    img = col.reshape(H, W, 3)
    # bloom
    b = (np.clip(img - 0.6, 0, 1) * 255).astype(np.uint8)
    bl = Image.fromarray(b).resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(2.5))
    bl = np.asarray(bl.resize((W, H), Image.BILINEAR), f32) / 255.0
    img = img + bl * 1.1
    img = img * VIG
    img = img + rng.normal(0, 0.012, (H, W, 1)).astype(f32)
    fade = ss(0, 0.5, t)
    img = img * fade
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


def main():
    mode = sys.argv[1]
    if mode == 'preview':
        import time
        for s in sys.argv[2:]:
            fi = int(s)
            t0 = time.time()
            fr = render(fi)
            Image.fromarray(fr).resize((W * 2, H * 2), Image.LANCZOS).save(os.path.join(HERE, f'prev_{fi}.png'))
            print(fi, round(time.time() - t0, 2), 's')
    elif mode == 'seg':
        k = int(sys.argv[2]); nseg = int(sys.argv[3])
        per = NF // nseg
        a = k * per
        b = NF if k == nseg - 1 else (k + 1) * per
        tmp = os.path.join(HERE, f'seg{k}_tmp.mp4')
        out = os.path.join(HERE, f'seg{k}.mp4')
        p = subprocess.Popen(
            ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS),
             '-i', '-', '-vf', 'scale=720:1280:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast',
             '-crf', '18', '-pix_fmt', 'yuv420p', tmp], stdin=subprocess.PIPE)
        for fi in range(a, b):
            p.stdin.write(render(fi).tobytes())
        p.stdin.close()
        if p.wait() == 0:
            os.rename(tmp, out)
            print('done', k)


main()
