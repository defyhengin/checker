import os, subprocess, wave, sys
import numpy as np
import assemble
from film import lowpass, bandpass, ssv

DUR = 10.0; CARD = 3.5; TOTAL = DUR + CARD; SR = 44100


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

    # cheesy ad jingle from tiny monitor speakers
    notes = [72, 76, 79, 84, 79, 76, 77, 81, 84, 81, 79, 76, 74, 79, 83, 86]
    beat = 0.25; jing = np.zeros(n)
    for i in range(int(DUR / beat)):
        nt_ = notes[i % len(notes)]; f = 440 * 2 ** ((nt_ - 69) / 12)
        m = int(beat * 0.9 * SR); tm = np.arange(m) / SR
        tone = np.sign(np.sin(2 * np.pi * f * tm)) * 0.5 + np.sin(2 * np.pi * f / 2 * tm) * 0.4
        i0 = int(i * beat * SR); mm = min(m, n - i0)
        if mm > 0:
            jing[i0:i0 + mm] += (tone * np.exp(-tm * 6))[:mm]
        if i % 2 == 0:
            k = int(0.04 * SR); i1 = i0; kk = min(k, n - i1)
            if kk > 0:
                jing[i1:i1 + kk] += rng.normal(0, 1, k)[:kk] * np.exp(-np.linspace(0, 8, k))[:kk] * 0.5
    jing = bandpass(jing, 500, 4000)
    out += jing / np.abs(jing).max() * 0.22 * (1 - 0.6 * ssv(3.6, 6.6, t)) * (t < DUR)
    out = out / np.abs(out).max() * 0.8
    with wave.open('ad.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    lines = assemble.HDR.split('\n'); k = [i for i, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Box,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H90000000,&H90000000,0,0,0,0,100,100,0,0,3,6,0,2,70,70,330,1')
    ev = assemble.typed(0.4, 4.0, "Реклама знает,\nчто я голоден.", 'Default')
    ev += assemble.typed(6.8, 9.8, "Но не знает,\nчто у меня 12 ₽.", 'Default')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    open('ad.ass', 'w').write('\n'.join(lines) + "\n".join(ev) + "\n")


def final():
    fc = ("[0:v]scale=720:1280:flags=lanczos,minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:vsbmc=1,"
          "noise=alls=5:allf=t,setsar=1,format=yuv420p[m];"
          "[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=ad.ass,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '12', '-i', 'ad/f_%04d.png', '-i', 'card_da.mp4', '-i', 'ad.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_ad.mp4'], check=True)


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    else:
        final(); print('final ok')
