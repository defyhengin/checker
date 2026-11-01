import os, sys, subprocess, wave
import numpy as np
from PIL import Image
import assemble
from film import lowpass, bandpass, ssv

FPS = 24; DUR = 28.0; CARD = 3.5; TOTAL = DUR + CARD; SR = 44100
OW, OH = 720, 1280
D = 'parcel_hi'
NOTE = (0.48, 1 - 0.5783)


def sst(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


# (start, end, image, zoom0, zoom1, center0, center1)
TL = [
    (0.0, 0.9, 's1_closed', 1.0, 1.02, (0.5, 0.5), (0.5, 0.5)),
    (0.9, 3.0, 's1_open', 1.0, 1.08, (0.5, 0.52), (0.5, 0.55)),
    (3.0, 6.0, 's2_table', 1.02, 1.1, (0.5, 0.5), (0.48, 0.5)),
    (6.0, 11.0, 's3_open', 1.0, 1.12, (0.5, 0.5), (0.47, 0.45)),
    (11.0, 13.0, 's4_0', 1.0, 1.02, (0.5, 0.5), (0.5, 0.5)),
    (13.0, 14.5, 's4_1', 1.02, 1.03, (0.5, 0.5), (0.5, 0.5)),
    (14.5, 16.0, 's4_2', 1.03, 1.04, (0.5, 0.5), (0.5, 0.5)),
    (16.0, 17.5, 's4_3', 1.04, 1.05, (0.5, 0.5), (0.5, 0.5)),
    (17.5, 19.0, 's4_4', 1.05, 1.06, (0.5, 0.5), (0.5, 0.5)),
    (19.0, 25.0, 's4_4', 1.06, 3.0, (0.5, 0.5), NOTE),
    (25.0, 26.0, 's6_p3', 1.0, 1.02, (0.5, 0.5), (0.5, 0.5)),
    (26.0, 27.0, 's6_p4', 1.02, 1.04, (0.5, 0.5), (0.5, 0.5)),
    (27.0, 28.0, 's6_p5', 1.04, 1.06, (0.5, 0.5), (0.5, 0.5)),
]
XF = {13.0: 0.3, 14.5: 0.3, 16.0: 0.3, 17.5: 0.3, 3.0: 0.25, 6.0: 0.25, 11.0: 0.25}   # crossfades at these cuts
IM = {}


def img(name):
    if name not in IM:
        IM[name] = Image.open(os.path.join(D, name + '.png')).convert('RGB')
    return IM[name]


def view(seg, t, eased=True):
    a, b, name, z0, z1, c0, c1 = seg
    u = (t - a) / (b - a); s = sst(u) if (b - a) > 3 else u
    z = z0 + (z1 - z0) * s; cx = c0[0] + (c1[0] - c0[0]) * s; cy = c0[1] + (c1[1] - c0[1]) * s
    im = img(name); W, H = im.size
    cw, ch = W / z, H / z
    x0 = min(max(cx * W - cw / 2, 0), W - cw); y0 = min(max(cy * H - ch / 2, 0), H - ch)
    return np.asarray(im.resize((OW, OH), Image.LANCZOS, box=(x0, y0, x0 + cw, y0 + ch)), np.float32)


def frame(t):
    for i, seg in enumerate(TL):
        if seg[0] <= t < seg[1]:
            out = view(seg, t)
            xf = XF.get(seg[0])
            if xf and i > 0 and t < seg[0] + xf:
                w = sst((t - seg[0]) / xf)
                prev = TL[i - 1]; out = view(prev, prev[1] - 1e-3) * (1 - w) + out * w
            return out
    return view(TL[-1], TL[-1][1] - 1e-3)


def make_video():
    p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{OW}x{OH}', '-r', str(FPS), '-i', '-',
                          '-vf', 'noise=alls=4:allf=t,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '17', 'parcel_main.mp4'], stdin=subprocess.PIPE)
    for fi in range(int(DUR * FPS)):
        p.stdin.write(np.clip(frame(fi / FPS), 0, 255).astype(np.uint8).tobytes())
    p.stdin.close(); p.wait()


def make_audio():
    rng = np.random.default_rng(21)
    n = int(TOTAL * SR); t = np.arange(n) / SR; out = np.zeros(n)

    def add_at(at, sig):
        i0 = int(at * SR); m = min(len(sig), n - i0)
        if m > 0:
            out[i0:i0 + m] += sig[:m]

    fade = ssv(0, 0.1, t) * (1 - 0.7 * ssv(DUR - 0.5, DUR + 0.5, t))
    room = lowpass(rng.normal(0, 1, n), 150); out += room / np.abs(room).max() * 0.025 * fade
    # fridge hum: present all along; after it is full (17.5 s) it gets lower and softer
    full = ssv(17.3, 18.5, t)
    f1 = 50 - 6 * full
    ph = 2 * np.pi * np.cumsum(f1) / SR
    hum = (0.5 * np.sin(ph) + (0.25 - 0.17 * full) * np.sin(2 * ph)) * (1 + 0.15 * (1 - full) * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 300); hum += pk / np.abs(pk).max() * 0.12 * (1 - 0.6 * full)
    near = 0.7 + 0.3 * ssv(10.8, 11.3, t) * (1 - ssv(24.8, 25.2, t))
    out += hum * 0.14 * near * (1 - 0.35 * full) * fade
    # three knocks
    for at in (0.06, 0.33, 0.6):
        k = int(0.12 * SR); tm = np.arange(k) / SR
        add_at(at, (lowpass(rng.normal(0, 1, k), 500) * 2.5 + np.sin(2 * np.pi * 110 * tm) * 0.8) * np.exp(-tm * 38))
    # stairwell air when the door is open
    st = bandpass(rng.normal(0, 1, n), 200, 1500); out += st / np.abs(st).max() * 0.03 * ssv(0.9, 1.1, t) * (1 - ssv(2.9, 3.0, t))
    # cardboard flaps
    for at, dur in ((5.85, 0.25), (6.05, 0.3)):
        k = int(dur * SR); tm = np.arange(k) / SR
        add_at(at, bandpass(rng.normal(0, 1, k), 800, 5000) * np.sin(np.pi * tm / dur) ** 2 * 0.25)
    # glass clinks as the shelves fill
    def clink(at, amp=0.18, base=2300):
        k = int(0.5 * SR); tm = np.arange(k) / SR
        sig = sum(np.sin(2 * np.pi * base * r * tm) * np.exp(-tm * dcy) for r, dcy in ((1, 9), (1.53, 12), (2.31, 16)))
        add_at(at, sig * amp)
    for at in (13.0, 13.15, 14.5, 14.62, 14.78, 16.0, 16.1):
        clink(at, 0.12, rng.uniform(2000, 2800))
    k = int(0.4 * SR); add_at(16.05, bandpass(rng.normal(0, 1, k), 2500, 8000) * np.sin(np.pi * np.arange(k) / k) * 0.12)   # foil
    k = int(0.15 * SR); add_at(17.5, bandpass(rng.normal(0, 1, k), 1500, 5000) * np.sin(np.pi * np.arange(k) / k) * 0.08)   # paper
    # ringback tone, then the call connects
    for a_, b_ in ((25.0, 25.8),):
        m = int((b_ - a_) * SR); tm = np.arange(m) / SR
        add_at(a_, np.sin(2 * np.pi * 425 * tm) * 0.06 * np.clip(tm / 0.01, 0, 1) * np.clip((b_ - a_ - tm) / 0.01, 0, 1))
    k = int(0.02 * SR); add_at(26.0, bandpass(rng.normal(0, 1, k), 1000, 4000) * 0.25)
    out = out / np.abs(out).max() * 0.8
    with wave.open('parcel.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    lines = assemble.HDR.split('\n'); k = [i for i, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = assemble.typed(3.3, 5.9, "Посылка. От мамы.", 'Box')
    ev += assemble.typed(6.4, 10.8, "Соленья. Варенье.\nПирожки.", 'Box', 0.07)
    ev += assemble.typed(11.3, 15.9, "Впервые за месяц…", 'Box')
    ev += assemble.typed(16.2, 18.9, "…он полный.", 'Box')
    ev += assemble.typed(25.6, 27.9, "Позвонил.", 'Box')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('parcel.ass', 'w').write('\n'.join(lines) + "\n".join(ev) + "\n")


def final():
    fc = "[0:v]setsar=1,format=yuv420p[m];[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=parcel.ass,format=yuv420p[v]"
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'parcel_main.mp4', '-i', 'card_da.mp4', '-i', 'parcel.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_parcel.mp4'], check=True)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    elif sys.argv[1] == 'video':
        make_video(); print('video ok')
    else:
        final(); print('final ok')
