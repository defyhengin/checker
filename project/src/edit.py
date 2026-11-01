"""Generic short assembler: stills with Ken-Burns, 24 fps image sequences, crossfades, overlays, audio helpers, subtitles."""
import os, subprocess, wave
import numpy as np
from PIL import Image
import assemble
from film import lowpass, bandpass, ssv

FPS = 24; SR = 44100; OW, OH = 720, 1280; CARD = 3.5
_IM = {}


def sst(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


def _img(p):
    if p not in _IM:
        _IM[p] = Image.open(p).convert('RGB')
    return _IM[p]


def seg(a, b, src, z0=1.0, z1=1.04, c0=(0.5, 0.5), c1=None, seq=False, ease=None, xf=0.0, overlay=None):
    return dict(a=a, b=b, src=src, z0=z0, z1=z1, c0=c0, c1=c1 or c0, seq=seq, ease=ease, xf=xf, overlay=overlay)


def _view(sg, t):
    u = (t - sg['a']) / (sg['b'] - sg['a'])
    ease = sg['ease'] if sg['ease'] is not None else (sg['b'] - sg['a']) > 3
    s = sst(u) if ease else min(max(u, 0), 1)
    z = sg['z0'] + (sg['z1'] - sg['z0']) * s
    cx = sg['c0'][0] + (sg['c1'][0] - sg['c0'][0]) * s; cy = sg['c0'][1] + (sg['c1'][1] - sg['c0'][1]) * s
    if sg['seq']:
        d, n = sg['src']; fi = min(int(round((t - sg['a']) * FPS)), n - 1)
        im = _img(os.path.join(d, f'f_{fi:04d}.png'))
    else:
        im = _img(sg['src'])
    W, H = im.size; cw, ch = W / z, H / z
    x0 = min(max(cx * W - cw / 2, 0), W - cw); y0 = min(max(cy * H - ch / 2, 0), H - ch)
    out = np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)
    if sg['overlay']:
        out = sg['overlay'](out, t)
    return out


def frame(TL, t):
    for i, sg in enumerate(TL):
        if sg['a'] <= t < sg['b']:
            out = _view(sg, t)
            if sg['xf'] and i > 0 and t < sg['a'] + sg['xf']:
                w = sst((t - sg['a']) / sg['xf']); pv = TL[i - 1]
                out = _view(pv, min(t, pv['b'] - 1e-3)) * (1 - w) + out * w
            return out
    return _view(TL[-1], TL[-1]['b'] - 1e-3)


def build_video(TL, dur, out):
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-',
                          '-vf', 'noise=alls=4:allf=t,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', out], stdin=subprocess.PIPE)
    for fi in range(int(round(dur * FPS))):
        p.stdin.write(np.clip(frame(TL, fi / FPS), 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()


class Mix:
    def __init__(self, dur, seed=1):
        self.dur = dur; self.total = dur + CARD; self.n = int(self.total * SR)
        self.t = np.arange(self.n) / SR; self.out = np.zeros(self.n); self.rng = np.random.default_rng(seed)

    def add_at(self, at, sig):
        i0 = int(at * SR); m = min(len(sig), self.n - i0)
        if m > 0 and i0 >= 0:
            self.out[i0:i0 + m] += sig[:m]

    def fade(self):
        t = self.t; return ssv(0, 0.15, t) * (1 - 0.7 * ssv(self.dur - 0.5, self.dur + 0.5, t))

    def room(self, lvl=0.025):
        r = lowpass(self.rng.normal(0, 1, self.n), 150); self.out += r / np.abs(r).max() * lvl * self.fade()

    def hum(self, lvl=0.14, env=None, f=50.0, soft=0.0, muffle=None):
        t = self.t; ff = f - 6 * soft if np.ndim(soft) == 0 else f - 6 * soft
        ph = 2 * np.pi * np.cumsum(np.broadcast_to(ff, t.shape)) / SR
        h = (0.5 * np.sin(ph) + (0.25 - 0.17 * soft) * np.sin(2 * ph)) * (1 + 0.15 * (1 - soft) * np.sin(2 * np.pi * 6 * t))
        pk = lowpass(self.rng.normal(0, 1, self.n), 300); h = h + pk / np.abs(pk).max() * 0.12 * (1 - 0.6 * soft)
        if muffle:
            h = lowpass(h, muffle)
        self.out += h * lvl * (1 if env is None else env) * self.fade()

    def knock(self, at, amp=1.0):
        k = int(0.12 * SR); tm = np.arange(k) / SR
        self.add_at(at, (lowpass(self.rng.normal(0, 1, k), 500) * 2.5 + np.sin(2 * np.pi * 110 * tm) * 0.8) * np.exp(-tm * 38) * amp)

    def thud(self, at, amp=1.0):
        k = int(0.35 * SR); tm = np.arange(k) / SR
        self.add_at(at, (lowpass(self.rng.normal(0, 1, k), 180) * 2.0 + np.sin(2 * np.pi * 55 * tm) * 1.2) * np.exp(-tm * 14) * amp)

    def clink(self, at, amp=0.12, base=2300):
        k = int(0.5 * SR); tm = np.arange(k) / SR
        self.add_at(at, sum(np.sin(2 * np.pi * base * r * tm) * np.exp(-tm * d) for r, d in ((1, 9), (1.53, 12), (2.31, 16))) * amp)

    def noise_burst(self, at, dur, lo, hi, amp):
        k = int(dur * SR); self.add_at(at, bandpass(self.rng.normal(0, 1, k), lo, hi) * np.sin(np.pi * np.arange(k) / k) ** 2 * amp)

    def steps(self, a, b, every=0.56, amp=1.2):
        for at in np.arange(a, b, every):
            k = int(0.09 * SR); tm = np.arange(k) / SR
            self.add_at(at, lowpass(self.rng.normal(0, 1, k), 220) * np.exp(-tm * 45) * amp)

    def birds(self, times, amp=0.035):
        for at in times:
            m = int(0.09 * SR); tm = np.arange(m) / SR
            f = 3600 + 1400 * np.sin(np.pi * tm / 0.09) * self.rng.uniform(0.6, 1.0)
            self.add_at(at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tm / 0.09) ** 2 * amp)

    def purr(self, a, b, lvl=0.5):
        t = self.t; pn = lowpass(self.rng.normal(0, 1, self.n), 120); pn = pn / np.abs(pn).max()
        p = pn * (0.55 + 0.45 * np.sin(2 * np.pi * 26 * t)) * (0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 0.45 * t)))
        self.out += p * lvl * ssv(a, a + 0.8, t) * (1 - ssv(b - 0.4, b, t))

    def meow(self, at, dur=0.75, base=430.0, amp=0.32):
        m = int(dur * SR); tm = np.arange(m) / SR; x = tm / dur
        f0 = base * (0.92 + 0.32 * np.sin(np.pi * np.clip(x * 1.15, 0, 1)) ** 1.2 - 0.12 * x) * (1 + 0.012 * np.sin(2 * np.pi * 6 * tm))
        ph = 2 * np.pi * np.cumsum(f0) / SR
        F1 = 320 + 520 * np.sin(np.pi * np.clip(x * 1.3, 0, 1)) - 120 * x
        F2 = 1100 + 700 * np.sin(np.pi * np.clip(x * 1.2, 0, 1)) - 500 * np.clip(x - 0.6, 0, 1)
        sig = np.zeros(m)
        for k in range(1, 18):
            fk = f0 * k; g = np.exp(-((fk - F1) / 260) ** 2) + 0.6 * np.exp(-((fk - F2) / 380) ** 2) + 0.05
            sig += g * np.sin(k * ph) / k ** 0.3
        env = np.clip(tm / 0.07, 0, 1) * np.clip((dur - tm) / 0.25, 0, 1) ** 1.3
        sig = lowpass(sig * env, 3500); self.add_at(at, sig / np.abs(sig).max() * amp)

    def save(self, path):
        o = self.out / np.abs(self.out).max() * 0.8
        with wave.open(path, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((o * 32767).astype(np.int16).tobytes())


def subs(path, dur, lines):
    """lines: list of (a, b, text, style) ; style Default/Box"""
    L = assemble.HDR.split('\n'); k = [i for i, l in enumerate(L) if l.startswith('Style: Link')][0]
    L.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = []
    for a, b, txt, st in lines:
        ev += assemble.typed(a, b, txt, st)
    ev += assemble.typed(dur + 0.3, dur + CARD, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(dur + 0.9, dur + CARD, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open(path, 'w').write('\n'.join(L) + "\n".join(ev) + "\n")


def final(main, wav, ass, out, dur):
    fc = f"[0:v]setsar=1,format=yuv420p[m];[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles={ass},format=yuv420p[v]"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', main, '-i', 'card_da.mp4', '-i', wav, '-filter_complex', fc, '-map', '[v]', '-map', '2:a',
                    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-c:a', 'aac', '-b:a', '160k', '-t', str(dur + CARD), '-movflags', '+faststart', out], check=True)


def sheet(video, times, out, w=180, h=320):
    ims = []
    for t in times:
        p = f'_sh_{t}.png'
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(t), '-i', video, '-frames:v', '1', '-vf', f'scale={w}:{h}', p], check=True)
        ims.append(Image.open(p))
    s = Image.new('RGB', ((w + 5) * len(ims), h), 'white')
    for i, im in enumerate(ims):
        s.paste(im, (i * (w + 5), 0))
    s.save(out)
