import os, subprocess, wave, sys
import numpy as np
import assemble
from film import lowpass, bandpass, ssv

DUR = 11.0; CARD = 3.5; TOTAL = DUR + CARD; SR = 44100


def make_audio():
    rng = np.random.default_rng(11)
    n = int(TOTAL * SR); t = np.arange(n) / SR; out = np.zeros(n)

    def add_at(at, sig):
        i0 = int(at * SR); m = min(len(sig), n - i0)
        if m > 0:
            out[i0:i0 + m] += sig[:m]

    fade = ssv(0, 0.4, t) * (1 - 0.7 * ssv(DUR - 0.5, DUR + 0.5, t))
    room = lowpass(rng.normal(0, 1, n), 150); out += room / np.abs(room).max() * 0.025 * fade
    # the fridge hums at the neighbours': muffled through the wall, louder as we approach
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 200); hum += pk / np.abs(pk).max() * 0.1
    hum = lowpass(hum, 160)
    out += hum * 0.16 * (0.45 + 0.55 * ssv(2.0, 6.4, t)) * fade
    # morning birds outside
    for at in (0.4, 0.62, 1.9, 2.05, 4.3, 4.45, 4.6, 7.1, 7.3, 9.4):
        m = int(0.09 * SR); tm = np.arange(m) / SR
        f = 3600 + 1400 * np.sin(np.pi * tm / 0.09) * rng.uniform(0.6, 1.0)
        add_at(at, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tm / 0.09) ** 2 * 0.035)
    for at in np.arange(2.2, 4.9, 0.56):   # footsteps
        k = int(0.09 * SR); tm = np.arange(k) / SR
        add_at(at, lowpass(rng.normal(0, 1, k), 220) * np.exp(-tm * 45) * 1.2)
    out = out / np.abs(out).max() * 0.8
    with wave.open('move.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    lines = assemble.HDR.split('\n'); k = [i for i, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = assemble.typed(0.3, 4.6, "Утро.\nХолодильника нет.", 'Default')
    ev += assemble.typed(8.0, 10.8, "Даже он\nне выдержал.", 'Box')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('move.ass', 'w').write('\n'.join(lines) + "\n".join(ev) + "\n")


def final():
    fc = ("[0:v]scale=720:1280:flags=lanczos,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,"
          "noise=alls=5:allf=t,setsar=1,format=yuv420p[m];"
          "[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=move.ass,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', 'move/f_%04d.png', '-i', 'card_da.mp4', '-i', 'move.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_move.mp4'], check=True)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    else:
        final(); print('final ok')
