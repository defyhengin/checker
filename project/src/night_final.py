import os, subprocess, wave, sys
import numpy as np
import assemble
from film import lowpass, bandpass, ssv

DUR = 14.5; CARD = 3.5; TOTAL = DUR + CARD; SR = 44100


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

    seal_pop(0.6, 0.35); hinge(0.65, 1.6, 0.06)
    hinge(7.4, 0.9, 0.08)
    for at in (0.68, 0.84):            # the lamp ticking on
        k = int(0.01 * SR); add_at(at, rng.normal(0, 1, k) * np.exp(-np.linspace(0, 6, k)) * 0.12)
    for at in np.arange(3.7, 7.2, 0.56):   # footsteps
        k = int(0.09 * SR); tm = np.arange(k) / SR
        add_at(at, lowpass(rng.normal(0, 1, k), 220) * np.exp(-tm * 45) * 1.2)
    out = out / np.abs(out).max() * 0.8
    with wave.open('night.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    lines = assemble.HDR.split('\n'); k = [i for i, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = assemble.typed(0.2, 3.2, "03:00.", 'Default')
    ev += assemble.typed(3.5, 7.4, "Холодильник\nоткрылся сам.", 'Default')
    ev += assemble.typed(11.0, 14.3, "Понимаю тебя, брат.", 'Box')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('night.ass', 'w').write('\n'.join(lines) + "\n".join(ev) + "\n")


def final():
    fc = ("[0:v]scale=720:1280:flags=lanczos,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,"
          "noise=alls=5:allf=t,setsar=1,format=yuv420p[m];"
          "[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=night.ass,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', 'night/f_%04d.png', '-i', 'card_da.mp4', '-i', 'night.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_night.mp4'], check=True)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    else:
        final(); print('final ok')
