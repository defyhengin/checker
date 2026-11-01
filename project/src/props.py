"""Series props added episode by episode."""
import numpy as np
import apt
from eng import zdisc, box, f32

# ---- new materials
apt.mat('clock_face', (0.86, 0.84, 0.78), 0.25)
apt.mat('clock_rim', (0.10, 0.10, 0.11), 0.5)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
M = apt.M

CLOCK = (0.5, 1.85, 7.488); CR = 0.15
CLOCK_T0 = 2 * 3600 + 47 * 60 + 20   # 02:47:20


def clock_prims():
    return [zdisc(CLOCK[0], CLOCK[1], CLOCK[2], CR, M['clock_face']),
            zdisc(CLOCK[0], CLOCK[1], CLOCK[2] + 0.006, CR + 0.016, M['clock_rim'])]


def _seg_dist(px, py, dx, dy, L):
    proj = np.clip(px * dx + py * dy, -0.012, L)
    qx = px - proj * dx; qy = py - proj * dy
    return np.sqrt(qx * qx + qy * qy)


def clock_tex(mid, Px, Py, Pz, alb, t):
    m = mid == M['clock_face']
    if not m.any():
        return alb
    x = Px[m] - CLOCK[0]; y = Py[m] - CLOCK[1]
    r = np.sqrt(x * x + y * y)
    ang = np.arctan2(-x, y) % (2 * np.pi)   # clockwise from 12 as seen from the room
    a = alb[m]
    tick = (r > 0.118) & (r < 0.138) & ((ang * 12 / (2 * np.pi) + 0.5) % 1 < 0.06)
    tickm = (r > 0.128) & (r < 0.138) & ((ang * 60 / (2 * np.pi) + 0.5) % 1 < 0.12)
    a[tick | tickm] = (0.08, 0.08, 0.09)
    sec = CLOCK_T0 + int(t)
    hh = (sec / 3600) % 12; mm = (sec / 60) % 60; ss_ = sec % 60
    for ang_h, L, w, col in ((hh / 12, 0.07, 0.006, (0.06, 0.06, 0.07)), (mm / 60, 0.11, 0.004, (0.06, 0.06, 0.07)),
                             (ss_ / 60, 0.12, 0.0015, (0.75, 0.1, 0.08))):
        th = ang_h * 2 * np.pi
        d = _seg_dist(x, y, -np.sin(th), np.cos(th), L)
        a[d < w] = col
    a[r < 0.008] = (0.06, 0.06, 0.07)
    alb[m] = a
    return alb


# ---- episode 2: bills on the table
from eng import obox
from PIL import Image as _Im, ImageDraw as _Dr, ImageFont as _Ft
apt.mat('paper', (0.86, 0.85, 0.80), 0.05)
apt.mat('bill_top', (1, 1, 1), 0.05)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
BILLS = (0.40, 5.02)          # centre on the table (x, z)
BW, BD = 0.105, 0.15          # A5-ish sheet (x width, z depth)
BYAW = 0.12


def bills_prims():
    out = []
    y = apt.TY
    for i, yaw in enumerate((0.05, -0.09, 0.17, -0.03, 0.10, BYAW)):
        th = 0.0012
        m = M['bill_top'] if i == 5 else M['paper']
        dx = 0.004 * np.sin(i * 2.1); dz = 0.004 * np.cos(i * 1.7)
        out.append(obox((BILLS[0] + dx, BILLS[1] + dz), (-BW / 2, y, -BD / 2), (BW / 2, y + th, BD / 2), yaw, m))
        y += th
    return out


def _bill_img():
    W_, H_ = 210, 300
    im = _Im.new('RGB', (W_, H_), (232, 230, 222)); d = _Dr.Draw(im)
    fb = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 17)
    fr = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-Regular.otf', 11)
    fbig = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 26)
    d.text((14, 14), "КВИТАНЦИЯ", font=fb, fill=(30, 30, 35))
    d.text((14, 36), "за жилищно-коммунальные услуги", font=fr, fill=(70, 70, 75))
    for k in range(9):
        yy = 64 + k * 16
        d.line((14, yy, W_ - 14, yy), fill=(190, 188, 180))
        d.rectangle((14, yy + 4, 14 + (60 + 37 * k) % 110, yy + 10), fill=(150, 150, 150))
        d.rectangle((W_ - 50, yy + 4, W_ - 14, yy + 10), fill=(150, 150, 150))
    d.rectangle((10, 216, W_ - 10, 286), outline=(200, 40, 40), width=3)
    d.text((W_ // 2, 232), "Оплатить до 05.11", font=fr, fill=(200, 40, 40), anchor='mm')
    d.text((W_ // 2, 262), "4 870 ₽", font=fbig, fill=(30, 30, 35), anchor='mm')
    return np.asarray(im, f32) / 255.0


BILL_IMG = _bill_img()


def bills_tex(mid, Px, Py, Pz, alb, ny):
    m = (mid == M['bill_top']) & (ny > 0.5)
    if not m.any():
        return alb
    x = Px[m] - BILLS[0]; z = Pz[m] - BILLS[1]
    c, s = np.cos(BYAW), np.sin(BYAW)
    lx = x * c - z * s; lz = x * s + z * c
    u = np.clip((BW / 2 - lx) / BW, 0, 0.999)      # camera-right is world -x
    v = np.clip((BD / 2 - lz) / BD, 0, 0.999)      # far edge (+z) = top of the sheet
    h, w, _ = BILL_IMG.shape
    alb[m] = BILL_IMG[(v * h).astype(int), (u * w).astype(int)]
    return alb


# ---- episode 3: empty plastic bag hanging on the fridge handle
apt.mat('bag_pl', (1, 1, 1), 0.35)
apt.mat('bag_h', (0.86, 0.86, 0.84), 0.3)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
BAG = dict(x0=-1.405, x1=-1.395, z0=3.80, z1=4.04, y0=0.60, y1=1.04)


def bag_prims():
    b = BAG
    return [box((b['x0'], b['y0'], b['z0']), (b['x1'], b['y1'], b['z1']), M['bag_pl']),
            box((b['x0'] - 0.002, b['y1'], b['z0'] + 0.01), (b['x1'] + 0.002, 1.27, b['z0'] + 0.025), M['bag_h']),
            box((b['x0'] - 0.002, b['y1'], b['z1'] - 0.025), (b['x1'] + 0.002, 1.27, b['z1'] - 0.01), M['bag_h']),
            box((b['x0'] - 0.002, 1.25, b['z0'] + 0.01), (b['x1'] + 0.002, 1.27, b['z1'] - 0.01), M['bag_h'])]


def _bag_img():
    W_, H_ = 240, 440
    rng_ = np.random.default_rng(3)
    base = np.ones((H_, W_, 3), f32) * np.array([0.93, 0.93, 0.91], f32)
    wr = np.cumsum(rng_.normal(0, 1, (H_, W_)), axis=0)
    wr = (wr - wr.mean()) / (wr.std() + 1e-6)
    sm = np.asarray(_Im.fromarray(((wr * 25) + 128).clip(0, 255).astype(np.uint8)).resize((W_ // 8, H_ // 8)).resize((W_, H_), _Im.BICUBIC), f32) / 255
    base *= (0.82 + 0.3 * sm)[:, :, None]
    im = _Im.fromarray((base.clip(0, 1) * 255).astype(np.uint8)); d = _Dr.Draw(im)
    fb = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 22)
    d.ellipse((80, 120, 160, 200), outline=(200, 35, 35), width=6)
    d.arc((98, 140, 142, 184), 20, 160, fill=(200, 35, 35), width=6)
    d.ellipse((102, 145, 110, 153), fill=(200, 35, 35)); d.ellipse((130, 145, 138, 153), fill=(200, 35, 35))
    d.text((W_ // 2, 240), "СПАСИБО", font=fb, fill=(200, 35, 35), anchor='mm')
    d.text((W_ // 2, 268), "ЗА ПОКУПКУ", font=fb, fill=(200, 35, 35), anchor='mm')
    return np.asarray(im, f32) / 255.0


BAG_IMG = _bag_img()


def bag_tex(mid, Px, Py, Pz, alb):
    m = mid == M['bag_pl']
    if not m.any():
        return alb
    b = BAG
    u = np.clip((b['z1'] - Pz[m]) / (b['z1'] - b['z0']), 0, 0.999)
    v = np.clip((b['y1'] - Py[m]) / (b['y1'] - b['y0']), 0, 0.999)
    h, w, _ = BAG_IMG.shape
    alb[m] = BAG_IMG[(v * h).astype(int), (u * w).astype(int)]
    return alb


# ---- episode 4: curtains + night city outside the window
apt.mat('curtain', (0.42, 0.16, 0.14), 0.0)
apt.mat('rod', (0.3, 0.3, 0.32), 0.6)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
WIN = dict(z0=4.5, z1=6.0, y0=1.0, y1=2.0)


def curtain_prims():
    return [box((2.13, 0.95, 4.22), (2.16, 2.32, 4.62), M['curtain']),
            box((2.13, 0.95, 5.88), (2.16, 2.32, 6.28), M['curtain']),
            box((2.12, 2.32, 4.15), (2.17, 2.35, 6.35), M['rod'])]


def curtain_tex(mid, Px, Py, Pz, alb, nx, nz):
    m = mid == M['curtain']
    if not m.any():
        return alb, nx, nz
    f = np.sin(Pz * 95) * 0.5 + np.sin(Pz * 41 + 1) * 0.3
    alb[m] *= (0.75 + 0.25 * f[m])[:, None]
    nz = np.where(m, f * 0.5, nz)
    l = np.sqrt(nx * nx + nz * nz) + 1e-6
    return alb, np.where(m, nx / l, nx), np.where(m, nz / l, nz)


_rw = np.random.default_rng(12)
_COLS, _ROWS = 9, 7
_LIT = _rw.random((_ROWS, _COLS)) < 0.32
_TINT = _rw.random((_ROWS, _COLS))
_OFF_AT = {(2, 3): 33.2, (4, 6): 35.0, (1, 1): 31.0}


def window_emit(t):
    def f(Px, Py, Pz, tt):
        u = (Pz - WIN['z0']) / (WIN['z1'] - WIN['z0']); v = (Py - WIN['y0']) / (WIN['y1'] - WIN['y0'])
        col = np.zeros((Px.shape[0], 3), f32)
        sky = np.array([0.02, 0.035, 0.08], f32) + np.array([0.03, 0.03, 0.05], f32) * v[:, None]
        col[:] = sky
        bld = (v < 0.78) & (u > 0.08) & (u < 0.86)
        col[bld] = (0.012, 0.012, 0.018)
        gu = (u - 0.1) / 0.74 * _COLS; gv = (0.74 - v) / 0.7 * _ROWS
        iu = np.floor(gu).astype(int); iv = np.floor(gv).astype(int)
        inside = bld & (gu > 0) & (gv > 0) & (iu < _COLS) & (iv < _ROWS) & ((gu % 1) > 0.25) & ((gu % 1) < 0.75) & ((gv % 1) > 0.3) & ((gv % 1) < 0.75)
        iu_c = np.clip(iu, 0, _COLS - 1); iv_c = np.clip(iv, 0, _ROWS - 1)
        lit = _LIT[iv_c, iu_c].copy()
        for (r, c), at in _OFF_AT.items():
            if tt >= at:
                lit &= ~((iv_c == r) & (iu_c == c))
        on = inside & lit
        warm = np.where(_TINT[iv_c, iu_c] > 0.3, 1.0, 0.0)
        c_on = np.stack([0.95 * np.ones_like(u), 0.70 + 0.1 * warm, 0.35 + 0.35 * (1 - warm)], -1).astype(f32) * 0.55
        col[on] = c_on[on]
        dark = inside & ~lit
        col[dark] = (0.02, 0.022, 0.03)
        frame_ = (np.abs(u - 0.5) < 0.012) | (np.abs(v - 0.5) < 0.012)
        col[frame_] = (0.02, 0.02, 0.02)
        return col
    return f


# ---- episode 5: wall calendar, days crossed out until payday
apt.mat('calendar', (1, 1, 1), 0.05)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
CAL = dict(x0=1.20, x1=1.50, y0=1.48, y1=2.06, z=7.488)


def calendar_prims():
    c = CAL
    return [box((c['x0'], c['y0'], c['z']), (c['x1'], c['y1'], 7.5), M['calendar']),
            box((c['x0'] + 0.13, c['y1'], c['z'] + 0.004), (c['x0'] + 0.17, c['y1'] + 0.02, 7.5), M['rod'])]


def _cal_img():
    W_, H_ = 300, 580
    im = _Im.new('RGB', (W_, H_), (236, 234, 228)); d = _Dr.Draw(im)
    # picture: winter landscape
    for y in range(0, 230):
        k = y / 230
        d.line((10, 10 + y, W_ - 10, 10 + y), fill=(int(120 + 60 * k), int(150 + 50 * k), int(190 + 30 * k)))
    d.polygon([(10, 200), (90, 120), (160, 190), (220, 140), (290, 200), (290, 240), (10, 240)], fill=(235, 240, 245))
    for tx in (40, 70, 230, 260):
        d.polygon([(tx, 230), (tx + 12, 180), (tx + 24, 230)], fill=(40, 80, 60))
    fb = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-Bold.otf', 26)
    fs = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf', 13)
    fd = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf', 16)
    d.text((W_ // 2, 268), "НОЯБРЬ 2026", font=fb, fill=(40, 40, 45), anchor='mm')
    days = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"]
    cw = (W_ - 20) / 7
    for i, dd in enumerate(days):
        d.text((10 + cw * i + cw / 2, 304), dd, font=fs, fill=(200, 40, 40) if i >= 5 else (90, 90, 95), anchor='mm')
    # 1 Nov 2026 is a Sunday
    col = 6; row = 0
    for day in range(1, 31):
        cx = 10 + cw * col + cw / 2; cy = 334 + row * 42
        d.text((cx, cy), str(day), font=fd, fill=(200, 40, 40) if col >= 5 else (40, 40, 45), anchor='mm')
        if day <= 18:
            d.line((cx - 13, cy - 13, cx + 13, cy + 13), fill=(190, 30, 30), width=3)
            d.line((cx - 13, cy + 13, cx + 13, cy - 13), fill=(190, 30, 30), width=3)
        if day == 25:
            d.ellipse((cx - 19, cy - 19, cx + 19, cy + 19), outline=(190, 30, 30), width=3)
            d.text((cx, cy + 22), "ЗП", font=fs, fill=(190, 30, 30), anchor='mm')
        col += 1
        if col == 7:
            col = 0; row += 1
    return np.asarray(im, f32) / 255.0


CAL_IMG = _cal_img()


def calendar_tex(mid, Px, Py, Pz, alb, nz):
    m = (mid == M['calendar']) & (nz < -0.5)
    if not m.any():
        return alb
    c = CAL
    u = np.clip((c['x1'] - Px[m]) / (c['x1'] - c['x0']), 0, 0.999)
    v = np.clip((c['y1'] - Py[m]) / (c['y1'] - c['y0']), 0, 0.999)
    h, w, _ = CAL_IMG.shape
    alb[m] = CAL_IMG[(v * h).astype(int), (u * w).astype(int)]
    return alb


# ---- episode 6: magnets + note on the fridge door, empty container and old receipt inside
apt.mat('note', (1, 1, 1), 0.02)
apt.mat('magnet_r', (0.80, 0.15, 0.12), 0.5)
apt.mat('magnet_y', (0.90, 0.75, 0.15), 0.5)
apt.mat('magnet_b', (0.15, 0.35, 0.75), 0.5)
apt.mat('container', (0.70, 0.78, 0.82), 0.8)
apt.mat('receipt', (1, 1, 1), 0.02)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
FPIV = (-1.5, 3.3)
NOTE = dict(z0=0.16, z1=0.36, y0=1.36, y1=1.62)
RCPT = dict(x0=-1.80, x1=-1.64, z0=3.58, z1=3.70, y=1.051)


def _local(Px, Pz, yaw):
    ox = Px - FPIV[0]; oz = Pz - FPIV[1]
    c, s = np.cos(yaw), np.sin(yaw)
    return ox * c - oz * s, ox * s + oz * c


def door_props(yaw):
    n = NOTE
    return [obox(FPIV, (0.05, n['y0'], n['z0']), (0.053, n['y1'], n['z1']), yaw, M['note']),
            obox(FPIV, (0.05, n['y1'] - 0.03, 0.24), (0.062, n['y1'] - 0.005, 0.27), yaw, M['magnet_r']),
            obox(FPIV, (0.05, 1.72, 0.45), (0.064, 1.77, 0.5), yaw, M['magnet_y']),
            obox(FPIV, (0.05, 1.12, 0.40), (0.064, 1.16, 0.46), yaw, M['magnet_b']),
            obox(FPIV, (0.05, 1.50, 0.52), (0.062, 1.535, 0.555), yaw, M['magnet_r'])]


def bag_on_door(yaw):
    # bag defined in door-local coordinates so it swings with the door
    return [obox(FPIV, (0.095, 0.60, 0.50), (0.105, 1.04, 0.74), yaw, M['bag_pl']),
            obox(FPIV, (0.093, 1.04, 0.51), (0.107, 1.27, 0.525), yaw, M['bag_h']),
            obox(FPIV, (0.093, 1.04, 0.715), (0.107, 1.27, 0.73), yaw, M['bag_h']),
            obox(FPIV, (0.093, 1.25, 0.51), (0.107, 1.27, 0.73), yaw, M['bag_h'])]


def inside_props():
    r = RCPT
    return [box((-2.08, 1.05, 3.40), (-1.86, 1.12, 3.66), M['container']),
            box((-2.085, 1.12, 3.395), (-1.855, 1.13, 3.665), M['container']),
            box((r['x0'], 1.05, r['z0']), (r['x1'], r['y'], r['z1']), M['receipt'])]


def _note_img():
    im = _Im.new('RGB', (200, 260), (250, 240, 150)); d = _Dr.Draw(im)
    fh = _Ft.truetype('/usr/share/fonts/opentype/inter/Inter-SemiBold.otf', 22)
    for i, (txt, done) in enumerate((("КУПИТЬ:", False), ("хлеб", True), ("молоко", True), ("яйца", True), ("гречка", True), ("что-нибудь", False))):
        y = 22 + i * 38
        d.text((16, y), txt, font=fh, fill=(40, 40, 120))
        if done:
            w = d.textlength(txt, font=fh)
            d.line((14, y + 15, 18 + w, y + 13), fill=(40, 40, 120), width=3)
    return np.asarray(im, f32) / 255.0


def _rcpt_img():
    im = _Im.new('RGB', (180, 260), (245, 244, 238)); d = _Dr.Draw(im)
    fm = _Ft.truetype('/usr/share/fonts/truetype/liberation/LiberationMono-Bold.ttf', 15)
    fs = _Ft.truetype('/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', 13)
    lines = [("МАГАЗИН У ДОМА", fm), ("кассовый чек", fs), ("", fs), ("Хлеб       52.00", fs), ("Молоко     89.00", fs),
             ("----------------", fs), ("ИТОГО     141.00", fm), ("", fs), ("19.10.2026  18:42", fs), ("Спасибо за покупку!", fs)]
    for i, (t_, f_) in enumerate(lines):
        d.text((90, 20 + i * 23), t_, font=f_, fill=(50, 50, 55), anchor='mt')
    return np.asarray(im, f32) / 255.0


NOTE_IMG = _note_img(); RCPT_IMG = _rcpt_img()


def fridge6_tex(mid, Px, Py, Pz, alb, ny, yaw):
    m = mid == M['note']
    if m.any():
        lx, lz = _local(Px[m], Pz[m], yaw)
        n = NOTE
        u = np.clip((n['z1'] - lz) / (n['z1'] - n['z0']), 0, 0.999); v = np.clip((n['y1'] - Py[m]) / (n['y1'] - n['y0']), 0, 0.999)
        h, w, _ = NOTE_IMG.shape
        alb[m] = NOTE_IMG[(v * h).astype(int), (u * w).astype(int)]
    m = mid == M['bag_pl']
    if m.any():
        lx, lz = _local(Px[m], Pz[m], yaw)
        u = np.clip((0.74 - lz) / 0.24, 0, 0.999); v = np.clip((1.04 - Py[m]) / 0.44, 0, 0.999)
        h, w, _ = BAG_IMG.shape
        alb[m] = BAG_IMG[(v * h).astype(int), (u * w).astype(int)]
    m = (mid == M['receipt']) & (ny > 0.5)
    if m.any():
        r = RCPT
        u = np.clip((r['z1'] - Pz[m]) / (r['z1'] - r['z0']), 0, 0.999); v = np.clip((Px[m] - r['x0']) / (r['x1'] - r['x0']), 0, 0.999)
        h, w, _ = RCPT_IMG.shape
        alb[m] = RCPT_IMG[(v * h).astype(int), (u * w).astype(int)]
    return alb


# ---- episode 7: window sill with a dried-out flower in a pot
from eng import cyl, disc, sph, cap, grp
apt.mat('sill', (0.80, 0.80, 0.78), 0.2)
apt.mat('pot_tc', (0.62, 0.30, 0.18), 0.15)
apt.mat('soil', (0.18, 0.12, 0.08), 0.0)
apt.mat('dry', (0.42, 0.33, 0.18), 0.05)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
POT = (2.07, 5.05)


def sill_prims():
    px, pz = POT
    y0 = 1.0
    stem = [(px, y0 + 0.11, pz), (px + 0.004, y0 + 0.2, pz + 0.01), (px - 0.02, y0 + 0.27, pz + 0.03), (px - 0.06, y0 + 0.25, pz + 0.07)]
    out = [box((1.98, 0.96, 4.45), (2.2, 1.0, 6.05), M['sill']),
           cyl(px, pz, 0.06, y0, y0 + 0.12, M['pot_tc'], M['pot_tc']), cyl(px, pz, 0.066, y0 + 0.1, y0 + 0.125, M['pot_tc'], M['pot_tc']),
           disc(px, y0 + 0.11, pz, 0.058, M['soil'])]
    for a, b in zip(stem, stem[1:]):
        out.append(cap(a, b, 0.0035, M['dry']))
    for a, b in (((px + 0.003, y0 + 0.17, pz + 0.005), (px - 0.035, y0 + 0.14, pz - 0.02)),
                 ((px - 0.01, y0 + 0.235, pz + 0.02), (px + 0.03, y0 + 0.2, pz + 0.05)),
                 ((px - 0.05, y0 + 0.255, pz + 0.06), (px - 0.07, y0 + 0.21, pz + 0.08))):
        out.append(cap(a, b, 0.008, M['dry']))
    out += [cap((px - 0.11, 1.003, pz - 0.04), (px - 0.13, 1.003, pz - 0.08), 0.005, M['dry']),
            cap((px - 0.02, 1.003, pz + 0.13), (px + 0.01, 1.003, pz + 0.16), 0.005, M['dry'])]
    return [grp((1.98, 0.96, 4.45), (2.2, 1.35, 6.05), out)]


# ---- episode 8: morning — kettle, jacket in the hallway, dawn outside
apt.mat('kettle', (0.85, 0.85, 0.83), 0.6)
apt.mat('kettle_d', (0.15, 0.15, 0.16), 0.4)
apt.mat('ind', (1, 1, 1), 0.0)
apt.mat('jacket', (0.20, 0.27, 0.20), 0.05)
apt.ALB = np.array(apt._alb, f32); apt.SPEC = np.array(apt._spec, f32)
KET = (-0.25, 7.2)


def kettle_prims():
    x, z = KET; y = 0.9
    return [grp((x - 0.13, y, z - 0.1), (x + 0.11, y + 0.24, z + 0.1), [
        cyl(x, z, 0.085, y, y + 0.018, M['kettle_d'], M['kettle_d']), disc(x, y + 0.018, z, 0.085, M['kettle_d']),
        cyl(x, z, 0.068, y + 0.018, y + 0.2, M['kettle'], M['kettle']), disc(x, y + 0.2, z, 0.068, M['kettle']),
        sph((x, y + 0.205, z), 0.014, M['kettle_d']),
        cap((x + 0.06, y + 0.17, z), (x + 0.1, y + 0.17, z), 0.009, M['kettle_d']),
        cap((x + 0.1, y + 0.17, z), (x + 0.1, y + 0.05, z), 0.009, M['kettle_d']),
        cap((x + 0.1, y + 0.05, z), (x + 0.062, y + 0.05, z), 0.009, M['kettle_d']),
        cap((x - 0.06, y + 0.14, z), (x - 0.11, y + 0.18, z), 0.01, M['kettle']),
        sph((x + 0.07, y + 0.035, z - 0.03), 0.006, M['ind'], ns=True)])]


def jacket_prims(present=True):
    if not present:
        return []
    jx0, jx1 = -0.69, -0.58
    return [grp((-0.7, 0.8, 1.75), (-0.5, 1.62, 2.3), [
        box((jx0, 0.92, 1.85), (jx1, 1.52, 2.2), M['jacket']),
        sph((-0.64, 1.55, 2.025), 0.07, M['jacket']),
        cap((-0.62, 1.48, 1.84), (-0.63, 0.95, 1.80), 0.04, M['jacket']),
        cap((-0.62, 1.48, 2.21), (-0.63, 0.95, 2.25), 0.04, M['jacket']),
        box((jx1 - 0.002, 0.95, 2.02), (jx1 + 0.002, 1.5, 2.03), M['kettle_d'])])]


def window_dawn(t):
    def f(Px, Py, Pz, tt):
        u = (Pz - WIN['z0']) / (WIN['z1'] - WIN['z0']); v = (Py - WIN['y0']) / (WIN['y1'] - WIN['y0'])
        lo = np.array([1.0, 0.55, 0.32], f32) * 0.55; hi = np.array([0.35, 0.45, 0.65], f32) * 0.5
        col = lo[None, :] * (1 - v[:, None]) + hi[None, :] * v[:, None]
        bld = (v < 0.78) & (u > 0.08) & (u < 0.86)
        col[bld] = (0.05, 0.05, 0.07)
        gu = (u - 0.1) / 0.74 * _COLS; gv = (0.74 - v) / 0.7 * _ROWS
        iu = np.clip(np.floor(gu).astype(int), 0, _COLS - 1); iv = np.clip(np.floor(gv).astype(int), 0, _ROWS - 1)
        inside = bld & (gu > 0) & (gv > 0) & ((gu % 1) > 0.25) & ((gu % 1) < 0.75) & ((gv % 1) > 0.3) & ((gv % 1) < 0.75)
        lit = (_TINT[iv, iu] > 0.85)
        col[inside & lit] = (0.55, 0.42, 0.22)
        col[inside & ~lit] = (0.09, 0.09, 0.12)
        frame_ = (np.abs(u - 0.5) < 0.012) | (np.abs(v - 0.5) < 0.012)
        col[frame_] = (0.03, 0.03, 0.03)
        return col
    return f
