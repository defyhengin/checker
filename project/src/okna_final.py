import os, subprocess, wave
import numpy as np
import assemble
from film import lowpass, ssv

DUR = 16.0; CARD = 3.5; TOTAL = DUR + CARD; SR = 44100


def make_audio():
    rng = np.random.default_rng(5)
    n = int(TOTAL * SR); t = np.arange(n) / SR; out = np.zeros(n)

    def add_at(at, sig):
        i0 = int(at * SR); m = min(len(sig), n - i0)
        if m > 0:
            out[i0:i0 + m] += sig[:m]

    fade = ssv(0, 1.2, t) * (1 - ssv(DUR - 0.6, DUR + 0.4, t)) * 0.85 + 0.15 * ssv(0, 1.2, t)
    room = lowpass(rng.normal(0, 1, n), 160); out += room / np.abs(room).max() * 0.035 * fade
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 300); hum += pk / np.abs(pk).max() * 0.12
    near = 0.45 + 0.55 * ssv(9.0, 12.0, t)          # the fridge gets closer as we turn
    out += hum * 0.08 * near * fade
    # an open fridge door beeps
    for at in (13.2, 14.6):
        m = int(0.22 * SR); tm = np.arange(m) / SR
        add_at(at, np.sin(2 * np.pi * 2300 * tm) * np.minimum(1, tm * 200) * np.exp(-tm * 9) * 0.05)
    out = out / np.abs(out).max() * 0.8
    with wave.open('okna.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def make_ass():
    ev = assemble.typed(1.6, 8.9, "В доме напротив\nвсе поужинали.", 'Default')
    ev += assemble.typed(12.4, 15.8, "У нас горит\nтолько холодильник.", 'Low')
    ev += assemble.typed(DUR + 0.3, TOTAL, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
    ev += assemble.typed(DUR + 0.9, TOTAL, "donationalerts.com/r/whatwhatwhat", 'Link', 0.025, False)
    lines = assemble.HDR.split('\n'); k = [n for n, l in enumerate(lines) if l.startswith('Style: Link')][0]
    lines.insert(k + 1, 'Style: Low,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H99000000,&H00000000,0,0,0,0,100,100,0,0,1,3,0,2,70,70,270,1')
    hdr = '\n'.join(lines)
    open('okna.ass', 'w').write(hdr + "\n".join(ev) + "\n")


def final():
    nf = int(DUR * 24)
    fc = (f"[0:v]scale=1440:2560:flags=lanczos,zoompan=z='1+0.05*on/{nf}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=720x1280:fps=24,"
          "noise=alls=5:allf=t,setsar=1,format=yuv420p[m];"
          "[1:v]fps=24,setsar=1,format=yuv420p[c];[m][c]concat=n=2:v=1:a=0,subtitles=okna.ass,format=yuv420p[v]")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '24', '-i', 'okna/f_%04d.png', '-i', 'card_da.mp4', '-i', 'okna.wav',
                    '-filter_complex', fc, '-map', '[v]', '-map', '2:a', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19',
                    '-c:a', 'aac', '-b:a', '160k', '-t', str(TOTAL), '-movflags', '+faststart', 'shorts_okna.mp4'], check=True)


if __name__ == '__main__':
    import sys
    if sys.argv[1] == 'prep':
        make_audio(); make_ass(); print('prep ok')
    else:
        final(); print('final ok')
