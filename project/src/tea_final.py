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
    # steady fridge hum, as in the series, always present and a bit louder near the fridge
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 300); hum += pk / np.abs(pk).max() * 0.12
    out += hum * 0.16 * (0.75 + 0.25 * ssv(3.4, 8.0, t)) * fade

    # boiling kettle: rumble + bubbling, click at 4.0, then subsiding hiss
    boil_env = ssv(0, 0.3, t) * (1 - ssv(4.0, 4.6, t))
    rum = lowpass(rng.normal(0, 1, n), 400); rum = rum / np.abs(rum).max()
    bub = bandpass(rng.normal(0, 1, n), 900, 3000); bub = bub / np.abs(bub).max()
    am = (np.sin(2 * np.pi * 9 * t + 3 * np.sin(2 * np.pi * 1.3 * t)) > 0.3).astype(float) * 0.7 + 0.3
    out += (rum * 0.35 + bub * am * 0.25) * boil_env
    hiss = bandpass(rng.normal(0, 1, n), 2000, 7000); hiss = hiss / np.abs(hiss).max()
    out += hiss * 0.03 * ssv(4.0, 4.3, t) * (1 - ssv(4.3, 9.0, t))
    k = int(0.02 * SR); add_at(4.0, bandpass(rng.normal(0, 1, k), 1500, 6000) * np.exp(-np.linspace(0, 7, k)) * 1.2)
    k = int(0.05 * SR); add_at(4.0, np.sin(2 * np.pi * 180 * np.arange(k) / SR) * np.exp(-np.linspace(0, 9, k)) * 0.5)
    out = out / np.abs(out).max() * 0.8
    with wave.open('tea.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    lines = assemble.HDR.split('\n'); k = [i for i, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = assemble.typed(0.4, 4.2, "Горячая вода —\nэто тоже ужин.", 'Box')
    ev += assemble.typed(7.0, 10.8, "Если верить.", 'Box')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('tea.ass', 'w').write('\n'.join(lines) + "\n".join(ev) + "\n")


def final():
    fc = ("[0:v]scale=720:1280:flags=lanczos,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,"
          "noise=alls=5:allf=t,setsar=1,format=yuv420p[m];"
          "[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=tea.ass,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', 'tea/f_%04d.png', '-i', 'card_da.mp4', '-i', 'tea.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_tea.mp4'], check=True)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    else:
        final(); print('final ok')
