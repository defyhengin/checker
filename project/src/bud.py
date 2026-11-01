import os, sys, subprocess, wave
os.environ['ENG_W'] = '360'; os.environ['ENG_H'] = '640'; os.environ['ENG_TANY'] = '0.75'
import numpy as np
from PIL import Image
import eng
from eng import render, ss, f32
import apt
import budscreen as cs
import props

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
DUR = 44.0
OPEN = (np.radians(105))
apt.FRDOOR = [(205.5, 206.6, np.radians(105)), (208.2, 209.4, 0.0)]
props.CLOCK_T0 = 6 * 3600 + 40 * 60


def entr(t):
    return 0.0 if t > 31.5 else float(ss(27.5, 29.0, t)) * np.radians(95)
NF = int(DUR * FPS)
B = apt.B
PHONE0 = (0.5875, 0.6625, 4.40, 4.55)
PCX, PCZ = 0.625, 4.475

K = [
    (0.0, (0.78, 0.98, 4.12), (0.64, 0.8, 4.47)), (4.8, (0.78, 0.98, 4.12), (0.64, 0.8, 4.47)),
    (7.0, (0.8, 1.6, 3.95), (2.2, 1.45, 5.25)), (8.2, (0.8, 1.6, 3.95), (2.2, 1.45, 5.25)),
    (11.5, (-0.2, 1.6, 6.3), (-0.25, 1.0, 7.2)), (12.6, (-0.2, 1.6, 6.3), (-0.25, 1.0, 7.2)),
    (15.2, (-0.6, 1.6, 3.65), (-1.5, 1.3, 3.65)), (19.2, (-0.6, 1.58, 3.66), (-1.6, 1.15, 3.65)),
    (22.5, (0.0, 1.6, 2.5), (-0.7, 1.3, 2.0)), (24.2, (0.0, 1.6, 2.4), (-0.7, 1.25, 2.0)),
    (27.0, (0.0, 1.6, 0.9), (0.0, 1.4, -1.0)), (29.2, (0.0, 1.6, 0.6), (0.0, 1.4, -1.0)),
    (31.49, (0.0, 1.6, -0.6), (0.0, 1.4, -2.0)), (31.5, (1.95, 1.55, 6.95), (0.6, 0.9, 4.5)),
    (44.0, (1.9, 1.52, 6.9), (0.6, 0.88, 4.5)),
]


def camera(t):
    for (t0, p0, g0), (t1, p1, g1) in zip(K, K[1:]):
        if t0 <= t <= t1:
            k = float(ss(t0, t1, t))
            p = np.array(p0) + (np.array(p1) - np.array(p0)) * k
            g = np.array(g0) + (np.array(g1) - np.array(g0)) * k
            break
    else:
        p, g = np.array(K[-1][1]), np.array(K[-1][2])
    br = np.array([0.0015 * np.sin(t * 0.8), 0.002 * np.sin(t * 1.3), 0])
    return p + br, g + br * 0.6


def vibrating(t):
    if not (cs.CALL0 <= t < cs.CALL1):
        return False
    return ((t - cs.CALL0) % 1.6) < 1.0


def pend(t):
    return 0.0
    v = 0.32 * (1.0 - 0.05 * np.sin(t * 37) * np.sin(t * 5.3) ** 2)
    if t > 29.5:
        k = min((t - 29.5) / 2.0, 1)
        if np.sin(t * 31) * np.sin(t * 13 + 1) > 0.6 - 0.6 * k:
            v *= 0.2
    if t > 31.5:
        v *= np.exp(-(t - 31.5) * 30)
    return float(v)


_cache = {}


def screen(t):
    key = round(t * FPS)
    if key not in _cache:
        if len(_cache) > 3:
            _cache.clear()
        _cache[key] = cs.draw(t)
    return _cache[key]


def build(t):
    yaw = apt.door_angle(190.0 + t, apt.FRDOOR)
    fr_open = float(ss(0.05, 0.4, yaw))
    dx = 0.0012 * np.sin(t * 190) if vibrating(t) else 0.0
    dz = 0.0008 * np.sin(t * 150) if vibrating(t) else 0.0
    apt.PHONE = (PHONE0[0] + dx, PHONE0[1] + dx, PHONE0[2] + dz, PHONE0[3] + dz)
    ph = apt.PHONE
    cam, tgt = camera(t)
    if vibrating(t):
        cam = cam + np.array([0.0004 * np.sin(t * 170), 0.0003 * np.sin(t * 210), 0])
    prims = props.clock_prims() + props.bills_prims() + props.curtain_prims() + props.calendar_prims() + props.door_props(yaw) + props.bag_on_door(yaw) + props.inside_props() + props.sill_prims() + props.kettle_prims() + props.jacket_prims(t < 25.0) + apt.STATIC + apt.ENTR_DOOR(entr(t)) + apt.fridge(190.0 + t) + apt.cabinet(0.0) + [apt.stove(190.0)] + apt.table(190.0) + apt.LAMPS
    img, lvl = screen(t)
    glow = 0.0 if img is None else float(img.mean()) * lvl
    pe = pend(t)

    def scr(Px, Py, Pz, tt):
        if img is None:
            return np.zeros((Px.shape[0], 3), f32) + 0.008
        x0, x1 = ph[0] + 0.004, ph[1] - 0.004; z0, z1 = ph[2] + 0.006, ph[3] - 0.006
        u = np.clip((x1 - Px) / (x1 - x0), 0, 0.999); v = np.clip((z1 - Pz) / (z1 - z0), 0, 0.999)
        h, w, _ = img.shape
        return img[(v * h).astype(int), (u * w).astype(int)] * (0.62 * lvl) + 0.008

    def bulbs(Px, Py, Pz, tt):
        out = np.zeros((Px.shape[0], 3), f32) + 0.02
        d = (Px - 0.8) ** 2 + (Py - 1.65) ** 2 + (Pz - 4.8) ** 2
        out[d < 0.01] = np.array([1.0, 0.82, 0.58], f32) * (0.03 + 5 * pe)
        return out

    lights = [dict(p=(3.6, 1.7, 5.25), col=(1.0, 0.72, 0.55), I=0.6, att=(0.6, 0.12), dir=(-1, -0.18, 0), cos=(0.35, 0.85)),
              dict(p=(0.0, 2.4, 5.0), col=(0.55, 0.62, 0.8), I=0.18, att=(1.0, 0.1), shadow=False)]
    if 27.0 < t < 31.5:
        lights.append(dict(p=(0, 2.35, -1.8), col=(1.0, 0.8, 0.55), I=0.55, att=(0.3, 0.5)))
    if pe > 0.002:
        lights.append(dict(p=(0.8, 1.6, 4.8), col=(1.0, 0.82, 0.58), I=pe, att=(0.2, 1.2), dir=(0, -1, 0), cos=(0.2, 0.75)))
    if fr_open > 0:
        lights.append(dict(p=(-1.85, 1.74, 3.65), col=(0.85, 0.95, 1.0), I=0.4 * fr_open, att=(0.08, 1.4)))
    if glow > 0.001:
        lights.append(dict(p=(PCX, 0.86, PCZ), col=(0.75, 0.82, 1.0), I=0.05 * glow, att=(0.005, 4.0), shadow=False))
    emit = {B['bulb']: bulbs, B['screen']: scr, B['window']: props.window_dawn(t), props.M['ind']: np.array([0.2, 0.5, 1.4], f32) * (1.0 if 12.0 < t < 36.0 else 0.0),
            B['disp']: np.array([0.06, 0.3, 0.12], f32), B['flame']: np.zeros(3, f32)}
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=prims, alb=apt.ALB, spec=apt.SPEC, tex=lambda mid, Px, Py, Pz, alb, nx, ny, nz, tt: (lambda r: (lambda a_, n_: (props.fridge6_tex(mid, Px, Py, Pz, props.calendar_tex(mid, Px, Py, Pz, a_, r[3]), r[2], apt.door_angle(190.0 + tt, apt.FRDOOR)), n_[0], r[2], n_[1]))(props.bag_tex(mid, Px, Py, Pz, props.bills_tex(mid, Px, Py, Pz, props.clock_tex(mid, Px, Py, Pz, r[0], tt), r[2])), props.curtain_tex(mid, Px, Py, Pz, r[0], r[1], r[3])[1:]))(apt.tex(mid, Px, Py, Pz, alb, nx, ny, nz, tt)), post=apt.post,
                amb=0.02, exp=1.35, emit=emit, lights=lights)


# ---------------- audio ----------------
SR = 44100
CARD = 3.5
TOTAL = DUR + CARD


def make_audio():
    from film import lowpass, bandpass, ssv
    rng = np.random.default_rng(8)
    n = int(TOTAL * SR); t = np.arange(n) / SR; out = np.zeros(n)

    def add_at(at, sig):
        i0 = int(at * SR); m = min(len(sig), n - i0)
        if m > 0:
            out[i0:i0 + m] += sig[:m]

    def click(at, amp=0.3, dur=0.015):
        k = int(dur * SR); add_at(at, rng.normal(0, 1, k) * np.exp(-np.linspace(0, 6, k)) * amp)

    fade = ssv(0, 1.5, t) * (1 - ssv(34.5, DUR, t))
    room = lowpass(rng.normal(0, 1, n), 180); out += room / np.abs(room).max() * 0.03 * fade
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 300); hum += pk / np.abs(pk).max() * 0.12
    out += hum * 0.07 * fade
    tv = np.arange(int(0.6 * SR)) / SR
    buzz = (np.sign(np.sin(2 * np.pi * 170 * tv)) * 0.6 + np.sin(2 * np.pi * 340 * tv) * 0.3)
    buzz = lowpass(buzz, 900) * ssv(0, 0.03, tv) * (1 - ssv(0.55, 0.6, tv))
    add_at(cs.ON, buzz / np.abs(buzz).max() * 0.3)
    # clock ticks every second
    tk = int(0.012 * SR)
    tick = bandpass(rng.normal(0, 1, tk * 4), 1500, 6000)[:tk] * np.exp(-np.arange(tk) / (0.002 * SR))
    tick = tick / np.abs(tick).max()
    for sec in range(int(TOTAL - CARD)):
        add_at(sec + 0.5, tick * (0.10 if sec % 2 else 0.08))
    for tt, _, _ in cs.TAPS:
        click(tt, 0.12, 0.008)
    click(cs.OFF1 - 0.1, 0.25, 0.02)
    click(15.5, 0.3, 0.03); click(19.3, 0.45, 0.04)
    # pendant flicker + off
    buzzl = np.sin(2 * np.pi * 100 * t) * 0.04 + np.sin(2 * np.pi * 200 * t) * 0.02
    tc = np.arange(0, DUR, 0.02)
    fl = np.zeros(len(tc))
    out += buzzl * np.interp(t, tc, fl)
    th = lowpass(rng.normal(0, 1, int(0.4 * SR)), 140) * np.exp(-np.arange(int(0.4 * SR)) / (0.05 * SR))
    add_at(31.7, th / np.abs(th).max() * 0.45)
    # alarm beeps
    for k_ in range(int((cs.STOP - cs.ON) / 0.5)):
        at = cs.ON + k_ * 0.5
        m_ = int(0.18 * SR); tm_ = np.arange(m_) / SR
        add_at(at, (np.sin(2 * np.pi * 1320 * tm_) + 0.5 * np.sin(2 * np.pi * 1760 * tm_)) * 0.12 * (1 - tm_ / 0.18))
    # kettle: switch, rising boil, switch off
    click(12.0, 0.4, 0.015)
    ket = bandpass(rng.normal(0, 1, n), 200, 2200); ket /= np.abs(ket).max()
    out += ket * 0.12 * ssv(12.5, 35.5, t) * (1 - ssv(35.9, 36.2, t))
    click(36.0, 0.45, 0.02)
    # footsteps while walking
    for st in list(np.arange(5.6, 8.0, 0.55)) + list(np.arange(8.6, 11.6, 0.55)) + list(np.arange(12.8, 15.2, 0.55)) + list(np.arange(19.6, 22.5, 0.55)) + list(np.arange(24.5, 27.0, 0.55)) + list(np.arange(29.3, 31.3, 0.55)):
        s_ = lowpass(rng.normal(0, 1, int(0.15 * SR)), 220) * np.exp(-np.arange(int(0.15 * SR)) / (0.03 * SR))
        add_at(st, s_ / np.abs(s_).max() * 0.18)
    # jacket rustle, door
    rs = bandpass(rng.normal(0, 1, int(0.9 * SR)), 1500, 7000) * np.sin(np.pi * np.arange(int(0.9 * SR)) / int(0.9 * SR))
    add_at(24.6, rs / np.abs(rs).max() * 0.07)
    click(27.4, 0.5, 0.03)
    out = out / np.abs(out).max() * 0.8
    with wave.open('bud.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    import assemble
    hdr = assemble.HDR.replace("Style: Link,Liberation Mono,34,", "Style: Link,Liberation Mono,28,")
    ev = assemble.typed(19.6, 24.0, "Позавтракаю на работе.", 'Default', 0.06)
    T = DUR
    ev += assemble.typed(T + 0.3, T + 3.5, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(T + 0.9, T + 3.5, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('bud.ass', 'w').write(hdr + "\n".join(ev) + "\n")


def final():
    chunks = [f'bud_c{k}.mp4' for k in range(4)]
    open('bud_list.txt', 'w').write("".join(f"file '{f}'\n" for f in chunks + ['card_da.mp4']))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'bud_list.txt', '-c', 'copy', 'bud_base.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'bud_base.mp4', '-i', 'bud.wav', '-vf', 'subtitles=bud.ass,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k',
                    '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_budilnik_tmp.mp4'], check=True)
    os.rename('shorts_budilnik_tmp.mp4', 'shorts_budilnik.mp4')


def main():
    mode = sys.argv[1]
    if mode == 'preview':
        for s in sys.argv[2:]:
            t = float(s)
            Image.fromarray(render(build(t), t)).resize((360, 640)).save(os.path.join(HERE, f'bud_prev_{s}.png'))
    elif mode == 'chunk':
        k = int(sys.argv[2]); nch = 4
        per = NF // nch; a = k * per; b = NF if k == nch - 1 else (k + 1) * per
        out = os.path.join(HERE, f'bud_c{k}.mp4')
        tmp = out + '.tmp.mp4'
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{eng.W}x{eng.H}',
                              '-r', str(FPS), '-i', '-', '-vf', 'scale=720:1280:flags=lanczos,format=yuv420p',
                              '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp],
                             stdin=subprocess.PIPE)
        for fi in range(a, b):
            t = fi / FPS
            p.stdin.write(render(build(t), t).tobytes())
        p.stdin.close()
        if p.wait() == 0:
            os.rename(tmp, out); print('chunk', k, flush=True)
    elif mode == 'prep':
        make_audio(); make_ass(); print('prep ok')
    elif mode == 'final':
        final(); print('final ok')


if __name__ == '__main__':
    main()
