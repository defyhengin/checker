import os, subprocess, wave, sys
import numpy as np
import assemble
from film import lowpass, bandpass, ssv

DUR = 12.0; CARD = 3.5; TOTAL = DUR + CARD; SR = 44100


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
    out += hum * 0.16 * (0.75 + 0.25 * ssv(3.4, 8.0, t)) * fade

    def seal_pop(at, amp):
        k = int(0.07 * SR); tm = np.arange(k) / SR
        thump = np.sin(2 * np.pi * 70 * tm) * np.exp(-tm * 50)
        air = bandpass(rng.normal(0, 1, k), 500, 3000) * np.exp(-tm * 70) * 0.5
        add_at(at, (thump + air) * amp)

    def hinge(at, dur, amp):
        m = int(dur * SR); tm = np.arange(m) / SR
        f = 95 + 25 * np.sin(2 * np.pi * 0.7 * tm)
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        env = np.sin(np.pi * np.clip(tm / dur, 0, 1)) ** 1.5
        add_at(at, lowpass(tone * env, 600) * amp)

    seal_pop(7.6, 0.35); hinge(7.65, 1.1, 0.06)
    for at in (1.8, 2.0, 3.1, 3.25, 3.4, 4.6, 5.9, 6.05, 8.4, 10.2, 10.35):   # birds wake up
        m = int(0.09 * SR); tm = np.arange(m) / SR
        f = 3600 + 1400 * np.sin(np.pi * tm / 0.09) * rng.uniform(0.6, 1.0)
        add_at(at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tm / 0.09) ** 2 * 0.035 * min(1, at / 4))
    out = out / np.abs(out).max() * 0.8
    with wave.open('morn.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    lines = assemble.HDR.split('\n'); k = [i for i, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = assemble.typed(1.0, 5.2, "Новый день.", 'Default')
    ev += assemble.typed(9.0, 11.8, "Старый холодильник.", 'Box')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('morn.ass', 'w').write('\n'.join(lines) + "\n".join(ev) + "\n")


def final():
    fc = ("[0:v]scale=720:1280:flags=lanczos,"
          "noise=alls=5:allf=t,setsar=1,format=yuv420p[m];"
          "[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=morn.ass,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', 'morn/f_%04d.png', '-i', 'card_da.mp4', '-i', 'morn.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_morn.mp4'], check=True)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    else:
        final(); print('final ok')
