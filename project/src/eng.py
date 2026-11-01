import sys, os, subprocess
import numpy as np
from PIL import Image, ImageFilter

np.seterr(all='ignore')
HERE = os.path.dirname(os.path.abspath(__file__))
f32 = np.float32
INF = f32(1e9)
W = int(os.environ.get('ENG_W', 360)); H = int(os.environ.get('ENG_H', 640))
FPS = 30
DUR = float(os.environ.get('ENG_DUR', 15.0)); STRETCH = 15.0 / DUR
NF = int(round(FPS * DUR))
OUT = os.environ.get('ENG_OUT', '720:1280')
TANY_FIX = os.environ.get('ENG_TANY')
SUF = os.environ.get('ENG_SUF', '')
xs = (np.arange(W) + 0.5) / W * 2 - 1
ys = 1 - (np.arange(H) + 0.5) / H * 2
PX, PY = np.meshgrid(xs, ys)
PX = PX.ravel().astype(f32); PY = PY.ravel().astype(f32)
N = W * H
VIG = np.clip(1 - 0.5 * ((0.45 * PX ** 2 + 0.7 * PY ** 2) if W > H else (0.7 * PX ** 2 + 0.45 * PY ** 2)), 0, 1).reshape(H, W, 1).astype(f32)
rng = np.random.default_rng(11)


def ss(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1)
    return x * x * (3 - 2 * x)


def lerp(a, b, k):
    return tuple(a[i] + (b[i] - a[i]) * k for i in range(len(a)))


def hashn(x, y):
    v = np.sin(x * 12.9898 + y * 78.233) * 43758.5453
    return v - np.floor(v)


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


def disc_t(O, D, cx, cy, cz, r):
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
    return np.where(h1, t1, INF).astype(f32), np.where(h2 & ~h1, t2, INF).astype(f32)


def box(a, b, m, ns=False): return dict(k='box', a=a, b=b, m=m, ns=ns)
def cyl(cx, cz, r, y0, y1, mo, mi, ns=False): return dict(k='cyl', cx=cx, cz=cz, r=r, y0=y0, y1=y1, mo=mo, mi=mi, ns=ns)
def disc(cx, cy, cz, r, m, ns=False): return dict(k='disc', cx=cx, cy=cy, cz=cz, r=r, m=m, ns=ns)
def sph(c, r, m, ns=False): return dict(k='sph', c=c, r=r, m=m, ns=ns)
def cap(a, b, r, m, ns=False): return dict(k='cap', a=a, b=b, r=r, m=m, ns=ns)
def zdisc(cx, cy, cz, r, m, ns=False): return dict(k='zdisc', cx=cx, cy=cy, cz=cz, r=r, m=m, ns=ns)
def grp(a, b, items): return dict(k='grp', a=a, b=b, items=items, ns=False)
def obox(pivot, a, b, yaw, m, ns=False): return dict(k='obox', p=pivot, a=a, b=b, yaw=yaw, m=m, ns=ns)


def trace(O, D, prims, shadow=False):
    n = D[0].shape[0]
    inv = inv_of(D)
    best = np.full(n, INF, f32); mid = np.full(n, -1, np.int16)
    nx = np.zeros(n, f32); ny = np.zeros(n, f32); nz = np.zeros(n, f32)

    def take(tt, m, nn):
        nonlocal best, mid, nx, ny, nz
        msk = tt < best
        if not msk.any():
            return
        best = np.where(msk, tt, best); mid = np.where(msk, m, mid)
        nx = np.where(msk, nn[0], nx); ny = np.where(msk, nn[1], ny); nz = np.where(msk, nn[2], nz)

    for p in prims:
        if shadow and p['ns']:
            continue
        k = p['k']
        if k == 'box':
            tt, ax = box_hit(O, inv, p['a'], p['b'])
            take(tt, p['m'], (np.where(ax == 0, -np.sign(D[0]), 0), np.where(ax == 1, -np.sign(D[1]), 0),
                              np.where(ax == 2, -np.sign(D[2]), 0)))
        elif k == 'sph':
            c = p['c']; r = p['r']
            tt = sph_t(O, D, c, r)
            take(tt, p['m'], ((O[0] + D[0] * tt - c[0]) / r, (O[1] + D[1] * tt - c[1]) / r, (O[2] + D[2] * tt - c[2]) / r))
        elif k == 'disc':
            take(disc_t(O, D, p['cx'], p['cy'], p['cz'], p['r']), p['m'], (0, -np.sign(D[1]), 0))
        elif k == 'cap':
            a = p['a']; b = p['b']; r = p['r']
            bax, bay, baz = b[0] - a[0], b[1] - a[1], b[2] - a[2]
            oax, oay, oaz = O[0] - a[0], O[1] - a[1], O[2] - a[2]
            baba = bax * bax + bay * bay + baz * baz
            bard = bax * D[0] + bay * D[1] + baz * D[2]
            baoa = bax * oax + bay * oay + baz * oaz
            rdoa = D[0] * oax + D[1] * oay + D[2] * oaz
            oaoa = oax * oax + oay * oay + oaz * oaz
            qa = baba - bard * bard
            qb = baba * rdoa - baoa * bard
            qc = baba * oaoa - baoa * baoa - r * r * baba
            h = qb * qb - qa * qc
            hs = np.sqrt(np.maximum(h, 0))
            tb = (-qb - hs) / np.where(np.abs(qa) < 1e-9, 1e-9, qa)
            yb = baoa + tb * bard
            body = (h >= 0) & (yb > 0) & (yb < baba) & (tb > 1e-3)
            # caps
            ocx = np.where(yb <= 0, oax, O[0] - b[0]); ocy = np.where(yb <= 0, oay, O[1] - b[1]); ocz = np.where(yb <= 0, oaz, O[2] - b[2])
            b2 = D[0] * ocx + D[1] * ocy + D[2] * ocz
            c2 = ocx * ocx + ocy * ocy + ocz * ocz - r * r
            h2 = b2 * b2 - c2
            tc = -b2 - np.sqrt(np.maximum(h2, 0))
            capok = (h >= 0) & ~body & (h2 > 0) & (tc > 1e-3)
            tt = np.where(body, tb, np.where(capok, tc, INF)).astype(f32)
            px = O[0] + D[0] * tt - a[0]; py = O[1] + D[1] * tt - a[1]; pz = O[2] + D[2] * tt - a[2]
            hh = np.clip((px * bax + py * bay + pz * baz) / baba, 0, 1)
            take(tt, p['m'], ((px - bax * hh) / r, (py - bay * hh) / r, (pz - baz * hh) / r))
        elif k == 'zdisc':
            t_ = (p['cz'] - O[2]) / D[2]
            x_ = O[0] + D[0] * t_ - p['cx']; y_ = O[1] + D[1] * t_ - p['cy']
            ok = (t_ > 1e-3) & (x_ * x_ + y_ * y_ < p['r'] ** 2) & np.isfinite(t_)
            take(np.where(ok, t_, INF).astype(f32), p['m'], (0, 0, -np.sign(D[2])))
        elif k == 'grp':
            bmin, bmax = p['a'], p['b']
            t1x = (bmin[0] - O[0]) * inv[0]; t2x = (bmax[0] - O[0]) * inv[0]
            t1y = (bmin[1] - O[1]) * inv[1]; t2y = (bmax[1] - O[1]) * inv[1]
            t1z = (bmin[2] - O[2]) * inv[2]; t2z = (bmax[2] - O[2]) * inv[2]
            tn = np.maximum(np.maximum(np.minimum(t1x, t2x), np.minimum(t1y, t2y)), np.minimum(t1z, t2z))
            tf = np.minimum(np.minimum(np.maximum(t1x, t2x), np.maximum(t1y, t2y)), np.maximum(t1z, t2z))
            idx = np.nonzero((tf > np.maximum(tn, 0)) & (tn < best))[0]
            if idx.size == 0:
                continue
            sb, sm, sx, sy, sz = trace(tuple(np.broadcast_to(o, n)[idx] for o in O), tuple(d[idx] for d in D), p['items'], shadow)
            upd = sb < best[idx]
            ii = idx[upd]
            if ii.size:
                best = best.copy(); mid = mid.copy(); nx = nx.copy(); ny = ny.copy(); nz = nz.copy()
                best[ii] = sb[upd]; mid[ii] = sm[upd]; nx[ii] = sx[upd]; ny[ii] = sy[upd]; nz[ii] = sz[upd]
        elif k == 'obox':
            px, pz = p['p']; c = np.cos(p['yaw']); s_ = np.sin(p['yaw'])
            ox = O[0] - px; oz = O[2] - pz
            Ol = (ox * c - oz * s_, O[1], ox * s_ + oz * c)
            Dl = (D[0] * c - D[2] * s_, D[1], D[0] * s_ + D[2] * c)
            tt, ax = box_hit(Ol, inv_of(Dl), p['a'], p['b'])
            lnx = np.where(ax == 0, -np.sign(Dl[0]), 0); lny = np.where(ax == 1, -np.sign(Dl[1]), 0)
            lnz = np.where(ax == 2, -np.sign(Dl[2]), 0)
            take(tt, p['m'], (lnx * c + lnz * s_, lny, -lnx * s_ + lnz * c))
        elif k == 'cyl':
            to, ti = cyl_t(O, D, p['cx'], p['cz'], p['r'], p['y0'], p['y1'])
            r = p['r']
            hx = (O[0] + D[0] * to - p['cx']) / r; hz = (O[2] + D[2] * to - p['cz']) / r
            take(to, p['mo'], (hx, 0, hz))
            hx = (O[0] + D[0] * ti - p['cx']) / r; hz = (O[2] + D[2] * ti - p['cz']) / r
            take(ti, p['mi'], (-hx, 0, -hz))
    return best, mid, nx, ny, nz


def render(sc, t):
    cam = np.array(sc['cam'], f32); tgt = np.array(sc['tgt'], f32)
    if TANY_FIX:
        tany = float(TANY_FIX); tanx = tany * W / H
    else:
        tanx = sc.get('tanx', 0.4); tany = tanx * H / W
    f = tgt - cam; f /= np.linalg.norm(f)
    r = np.cross(f, [0, 1, 0]); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    Dx = f[0] + PX * tanx * r[0] + PY * tany * u[0]
    Dy = f[1] + PX * tanx * r[1] + PY * tany * u[1]
    Dz = f[2] + PX * tanx * r[2] + PY * tany * u[2]
    nr = np.sqrt(Dx * Dx + Dy * Dy + Dz * Dz)
    D = ((Dx / nr).astype(f32), (Dy / nr).astype(f32), (Dz / nr).astype(f32))
    O = tuple(np.full(N, c, f32) for c in cam)
    prims = sc['prims']
    best, mid, nx, ny, nz = trace(O, D, prims)
    hit = best < INF
    bc = np.where(hit, best, 0)
    Px = O[0] + D[0] * bc; Py = O[1] + D[1] * bc; Pz = O[2] + D[2] * bc
    ALB = sc['alb']; SPEC = sc['spec']
    mc = np.clip(mid, 0, len(ALB) - 1)
    alb = ALB[mc].copy(); spw = SPEC[mc]
    if 'tex' in sc:
        alb, nx, ny, nz = sc['tex'](mid, Px, Py, Pz, alb, nx, ny, nz, t)
    emit = sc.get('emit', {})
    emask = np.zeros(N, bool)
    for m in emit:
        emask |= mid == m
    col = alb * sc.get('amb', 0.004)
    for L in sc['lights']:
        if L['I'] <= 1e-4:
            continue
        Lp = L['p']
        Lx = Lp[0] - Px; Ly = Lp[1] - Py; Lz = Lp[2] - Pz
        d2 = Lx * Lx + Ly * Ly + Lz * Lz + 1e-6
        dist = np.sqrt(d2)
        ld = (Lx / dist, Ly / dist, Lz / dist)
        ndl = np.clip(nx * ld[0] + ny * ld[1] + nz * ld[2], 0, 1)
        att = L.get('att', (0.3, 1.0))
        fac = L['I'] / (att[0] + d2 * att[1])
        if L.get('dir') is not None:
            d = np.array(L['dir'], f32); d /= np.linalg.norm(d)
            cosang = -(ld[0] * d[0] + ld[1] * d[1] + ld[2] * d[2])
            fac = fac * ss(L['cos'][0], L['cos'][1], cosang)
        sh = np.ones(N, f32)
        if L.get('shadow', True):
            idx = np.nonzero(hit & ~emask & (fac * ndl > 2e-4))[0]
            if idx.size:
                Os = (Px[idx] + nx[idx] * 2e-3, Py[idx] + ny[idx] * 2e-3, Pz[idx] + nz[idx] * 2e-3)
                st = trace(Os, (ld[0][idx], ld[1][idx], ld[2][idx]), prims, True)[0]
                sh[idx] = np.where(st < dist[idx], 0.0, 1.0)
        lc = np.array(L['col'], f32)
        col = col + alb * (ndl * sh * fac)[:, None] * lc
        hx = ld[0] - D[0]; hy = ld[1] - D[1]; hz = ld[2] - D[2]
        hn = np.sqrt(hx * hx + hy * hy + hz * hz) + 1e-6
        ndh = np.clip((nx * hx + ny * hy + nz * hz) / hn, 0, 1)
        col = col + (spw * ndh ** 60 * sh * fac * (ndl > 0))[:, None] * lc
    for m, c in emit.items():
        mk = mid == m
        if callable(c):
            if mk.any():
                col[mk] = c(Px[mk], Py[mk], Pz[mk], t)
        else:
            col[mk] = c
    col[~hit] = sc.get('bg', 0.003)
    if 'post' in sc:
        col = sc['post'](col, D, cam, best, t)
    col = 1 - np.exp(-col * sc.get('exp', 1.3))
    img = (np.clip(col, 0, 1) ** (1 / 2.2)).reshape(H, W, 3).astype(f32)
    b = (np.clip(img - 0.62, 0, 1) * 255).astype(np.uint8)
    bl = Image.fromarray(b).resize((W // 4, H // 4), Image.BILINEAR).filter(ImageFilter.GaussianBlur(3))
    bl = np.asarray(bl.resize((W, H), Image.BILINEAR), f32) / 255.0
    img = img + bl * 1.2
    img = img * VIG + rng.normal(0, 0.012, (H, W, 1)).astype(f32)
    img *= ss(0, 0.5, t)
    return (np.clip(img, 0, 1) * 255).astype(np.uint8)


def main(build, name):
    mode = sys.argv[1]
    if mode == 'preview':
        import time
        for s in sys.argv[2:]:
            fi = int(s); t0 = time.time()
            Image.fromarray(render(build(fi / FPS * STRETCH), fi / FPS * STRETCH)).resize((W * 2, H * 2), Image.LANCZOS).save(
                os.path.join(HERE, f'{name}{SUF}_prev_{fi}.png'))
            print(fi, round(time.time() - t0, 2), 's')
    elif mode == 'seg':
        k = int(sys.argv[2]); nseg = int(sys.argv[3])
        per = NF // nseg; a = k * per; b = NF if k == nseg - 1 else (k + 1) * per
        tmp = os.path.join(HERE, f'{name}{SUF}_seg{k}_tmp.mp4'); out = os.path.join(HERE, f'{name}{SUF}_seg{k}.mp4')
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                              '-r', str(FPS), '-i', '-', '-vf', f'scale={OUT}:flags=lanczos,format=yuv420p',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp],
                             stdin=subprocess.PIPE)
        for fi in range(a, b):
            p.stdin.write(render(build(fi / FPS * STRETCH), fi / FPS * STRETCH).tobytes())
        p.stdin.close()
        if p.wait() == 0:
            os.rename(tmp, out); print('done', name, k)
