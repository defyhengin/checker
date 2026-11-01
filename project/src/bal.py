import os, sys, subprocess, wave
os.environ['ENG_W'] = '360'; os.environ['ENG_H'] = '640'; os.environ['ENG_TANY'] = '0.75'
import numpy as np
from PIL import Image
import eng
from eng import render, ss, f32
import apt
import balscreen as cs

HERE = os.path.dirname(os.path.abspath(__file__))
FPS = 30
DUR = 37.0
NF = int(DUR * FPS)
B = apt.B
PHONE0 = (0.5875, 0.6625, 4.40, 4.55)
PCX, PCZ = 0.625, 4.475

K = [
    (0.0, (0.8, 1.22, 3.95), (0.72, 0.8, 4.75)), (2.8, (0.8, 1.22, 3.95), (0.72, 0.8, 4.75)),
    (5.2, (0.625, 0.925, 4.415), (0.625, 0.8, 4.478)), (28.6, (0.623, 0.918, 4.422), (0.625, 0.8, 4.478)),
    (32.5, (0.8, 1.16, 4.03), (0.72, 0.8, 4.72)), (37.0, (0.8, 1.18, 4.0), (0.72, 0.8, 4.74)),
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
    return False


def pend(t):
    v = 0.32 * (1.0 - 0.05 * np.sin(t * 37) * np.sin(t * 5.3) ** 2)
    if t > 32.0:
        k = min((t - 32.0) / 2.0, 1)
        if np.sin(t * 31) * np.sin(t * 13 + 1) > 0.6 - 0.6 * k:
            v *= 0.2
    if t > 34.0:
        v *= np.exp(-(t - 34.0) * 30)
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
    dx = 0.0012 * np.sin(t * 190) if vibrating(t) else 0.0
    dz = 0.0008 * np.sin(t * 150) if vibrating(t) else 0.0
    apt.PHONE = (PHONE0[0] + dx, PHONE0[1] + dx, PHONE0[2] + dz, PHONE0[3] + dz)
    ph = apt.PHONE
    cam, tgt = camera(t)
    if vibrating(t):
        cam = cam + np.array([0.0004 * np.sin(t * 170), 0.0003 * np.sin(t * 210), 0])
    prims = apt.STATIC + apt.ENTR_DOOR(0.0) + apt.fridge(190.0) + apt.cabinet(0.0) + [apt.stove(190.0)] + apt.table(190.0) + apt.LAMPS
    img, lvl = screen(t)
    glow = 0.0 if img is None else float(img.mean()) * lvl
    pe = pend(t)

    def scr(Px, Py, Pz, tt):
        if img is None:
            return np.zeros((Px.shape[0], 3), f32) + 0.008
        x0, x1 = ph[0] + 0.004, ph[1] - 0.004; z0, z1 = ph[2] + 0.006, ph[3] - 0.006
        u = np.clip((x1 - Px) / (x1 - x0), 0, 0.999); v = np.clip((z1 - Pz) / (z1 - z0), 0, 0.999)
        h, w, _ = img.shape
        return img[(v * h).astype(int), (u * w).astype(int)] * (0.85 * lvl) + 0.008

    def bulbs(Px, Py, Pz, tt):
        out = np.zeros((Px.shape[0], 3), f32) + 0.02
        d = (Px - 0.8) ** 2 + (Py - 1.65) ** 2 + (Pz - 4.8) ** 2
        out[d < 0.01] = np.array([1.0, 0.82, 0.58], f32) * (0.03 + 5 * pe)
        return out

    lights = [dict(p=(3.2, 2.6, 5.25), col=(0.45, 0.55, 0.85), I=0.35, att=(0.6, 0.15), dir=(-1, -0.55, 0), cos=(0.55, 0.9), shadow=False)]
    if pe > 0.002:
        lights.append(dict(p=(0.8, 1.6, 4.8), col=(1.0, 0.82, 0.58), I=pe, att=(0.2, 1.2), dir=(0, -1, 0), cos=(0.2, 0.75)))
    if glow > 0.001:
        lights.append(dict(p=(PCX, 0.86, PCZ), col=(0.75, 0.82, 1.0), I=0.05 * glow, att=(0.005, 4.0), shadow=False))
    emit = {B['bulb']: bulbs, B['screen']: scr, B['window']: np.array([0.05, 0.08, 0.16], f32),
            B['disp']: np.array([0.06, 0.3, 0.12], f32), B['flame']: np.zeros(3, f32)}
    return dict(cam=tuple(cam), tgt=tuple(tgt), prims=prims, alb=apt.ALB, spec=apt.SPEC, tex=apt.tex, post=apt.post,
                amb=0.003, exp=1.35, emit=emit, lights=lights)


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

    fade = ssv(0, 1.5, t) * (1 - ssv(35.0, DUR, t))
    room = lowpass(rng.normal(0, 1, n), 180); out += room / np.abs(room).max() * 0.03 * fade
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 300); hum += pk / np.abs(pk).max() * 0.12
    out += hum * 0.07 * fade
    for tt, _, _ in cs.TAPS:
        click(tt, 0.12, 0.008)
    click(cs.ON, 0.2, 0.015)
    for f0, at in ((220, cs.PAY + 0.2), (196, cs.PAY + 0.38)):
        m = int(0.16 * SR); tm = np.arange(m) / SR
        add_at(at, np.sign(np.sin(2 * np.pi * f0 * tm)) * np.exp(-tm * 14) * 0.12)
    click(cs.OFF1 - 0.1, 0.25, 0.02)
    # pendant flicker + off
    buzzl = np.sin(2 * np.pi * 100 * t) * 0.04 + np.sin(2 * np.pi * 200 * t) * 0.02
    tc = np.arange(0, DUR, 0.02)
    fl = np.array([1.0 if (32.0 < x < 34 and pend(x) < 0.15) else 0.0 for x in tc])
    out += buzzl * np.interp(t, tc, fl)
    click(34.0, 0.5, 0.02)
    out = out / np.abs(out).max() * 0.8
    with wave.open('bal.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    import assemble
    assemble.CARD_T = DUR
    ev = assemble.card_events()
    open('bal.ass', 'w').write(assemble.HDR + "\n".join(ev) + "\n")


def final():
    chunks = [f'bal_c{k}.mp4' for k in range(4)]
    open('bal_list.txt', 'w').write("".join(f"file '{f}'\n" for f in chunks + ['card_da.mp4']))
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'bal_list.txt', '-c', 'copy', 'bal_base.mp4'], check=True)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'bal_base.mp4', '-i', 'bal.wav', '-vf', 'subtitles=bal.ass,format=yuv420p',
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k',
                    '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_balans_tmp.mp4'], check=True)
    os.rename('shorts_balans_tmp.mp4', 'shorts_balans.mp4')


def main():
    mode = sys.argv[1]
    if mode == 'preview':
        for s in sys.argv[2:]:
            t = float(s)
            Image.fromarray(render(build(t), t)).resize((360, 640)).save(os.path.join(HERE, f'bal_prev_{s}.png'))
    elif mode == 'chunk':
        k = int(sys.argv[2]); nch = 4
        per = NF // nch; a = k * per; b = NF if k == nch - 1 else (k + 1) * per
        out = os.path.join(HERE, f'bal_c{k}.mp4')
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
