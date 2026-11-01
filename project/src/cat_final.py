import os, subprocess, wave, sys
import numpy as np
import assemble
from film import lowpass, bandpass, ssv

DUR = 11.5; CARD = 3.5; TOTAL = DUR + CARD; SR = 44100


def make_audio():
    rng = np.random.default_rng(11)
    n = int(TOTAL * SR); t = np.arange(n) / SR; out = np.zeros(n)

    def add_at(at, sig):
        i0 = int(at * SR); m = min(len(sig), n - i0)
        if m > 0:
            out[i0:i0 + m] += sig[:m]

    fade = ssv(0, 0.4, t) * (1 - 0.7 * ssv(DUR - 0.5, DUR + 0.5, t))
    room = lowpass(rng.normal(0, 1, n), 150); out += room / np.abs(room).max() * 0.025 * fade
    # steady fridge hum, as in the series, always present and a bit louder near the fridge
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 300); hum += pk / np.abs(pk).max() * 0.12
    out += hum * 0.16 * 1.0 * fade

    # soft purr when the cat looks at us
    pn = lowpass(rng.normal(0, 1, n), 120); pn = pn / np.abs(pn).max()
    purr = pn * (0.55 + 0.45 * np.sin(2 * np.pi * 26 * t)) * (0.7 + 0.3 * np.sign(np.sin(2 * np.pi * 0.45 * t)))
    out += purr * 0.5 * ssv(8.6, 9.6, t) * (1 - ssv(DUR - 0.4, DUR + 0.2, t))
    # warm meow when the cat looks up ("m-ia-u")
    def meow(at, dur=0.75, base=430.0, amp=0.32):
        m = int(dur * SR); tm = np.arange(m) / SR; x = tm / dur
        f0 = base * (0.92 + 0.32 * np.sin(np.pi * np.clip(x * 1.15, 0, 1)) ** 1.2 - 0.12 * x) * (1 + 0.012 * np.sin(2 * np.pi * 6 * tm))
        ph = 2 * np.pi * np.cumsum(f0) / SR
        F1 = 320 + 520 * np.sin(np.pi * np.clip(x * 1.3, 0, 1)) - 120 * x
        F2 = 1100 + 700 * np.sin(np.pi * np.clip(x * 1.2, 0, 1)) - 500 * np.clip(x - 0.6, 0, 1)
        sig = np.zeros(m)
        for k in range(1, 18):
            fk = f0 * k
            g = np.exp(-((fk - F1) / 260) ** 2) + 0.6 * np.exp(-((fk - F2) / 380) ** 2) + 0.05
            sig += g * np.sin(k * ph) / k ** 0.3
        env = np.clip(tm / 0.07, 0, 1) * np.clip((dur - tm) / 0.25, 0, 1) ** 1.3
        sig = lowpass(sig * env, 3500)
        add_at(at, sig / np.abs(sig).max() * amp)

    meow(9.05)
    out = out / np.abs(out).max() * 0.8
    with wave.open('cat.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    lines = assemble.HDR.split('\n'); k = [i for i, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = assemble.typed(0.3, 3.0, "Коту — последний\nпакетик корма.", 'Default')
    ev += assemble.typed(5.0, 7.0, "Мне — то, что осталось.", 'Box')
    ev += assemble.typed(8.8, 11.3, "Главное,\nчто он сыт.", 'Default')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('cat.ass', 'w').write('\n'.join(lines) + "\n".join(ev) + "\n")


def final():
    fc = ("[0:v]scale=720:1280:flags=lanczos,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,"
          "noise=alls=5:allf=t,setsar=1,format=yuv420p[m];"
          "[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=cat.ass,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', 'cat2/f_%04d.png', '-i', 'card_da.mp4', '-i', 'cat.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_cat.mp4'], check=True)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    else:
        final(); print('final ok')
