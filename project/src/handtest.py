import os, sys, subprocess
import numpy as np
import bal, apt, eng, hand
from eng import ss
from PIL import Image

FPS = 30; DUR = 7.0
F = (0.12, -0.5, 0.86)
TAP1, TAP2 = 4.0, 5.1


def screen_pt(px, py):
    ph = bal.PHONE0
    x0, x1 = ph[0] + 0.004, ph[1] - 0.004; z0, z1 = ph[2] + 0.006, ph[3] - 0.006
    u, v = px / 300, py / 560
    return np.array([x1 - u * (x1 - x0), apt.TY + 0.0095 + 0.0085, z1 - v * (z1 - z0)])


P1 = screen_pt(220, 352); P2 = screen_pt(150, 520)


def tip_at(s):
    k = float(ss(TAP1 + 0.15, TAP2 - 0.25, s))
    base = P1 * (1 - k) + P2 * k
    lift = 0.03 - 0.03 * np.exp(-((s - TAP1) / 0.09) ** 2) - 0.03 * np.exp(-((s - TAP2) / 0.09) ** 2)
    lift += 0.008 * np.sin(s * 2.1)
    off = -np.array(hand.frame(F)[0]) * (0.35 * (1 - float(ss(0.0, 1.8, s))) + 0.4 * float(ss(5.6, 7.0, s)))
    return base + np.array([0, lift, 0]) + off


def build(s):
    sc = bal.build(8.5 + s)
    sc['prims'] = [hand.hand(tip_at(s), F)] + sc['prims']
    sc['cam'] = (0.66 + 0.002 * np.sin(s), 1.02, 4.29); sc['tgt'] = (0.62, 0.8, 4.50)
    sc['alb'] = apt.ALB; sc['spec'] = apt.SPEC
    return sc


if __name__ == '__main__':
    if sys.argv[1] == 'preview':
        for x in sys.argv[2:]:
            Image.fromarray(eng.render(build(float(x)), float(x))).save(f'ht_{x}.png')
    else:
        k = int(sys.argv[2]); n = int(DUR * FPS); a, b = (0, n // 2) if k == 0 else (n // 2, n)
        out = f'ht_c{k}.mp4'
        p = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{eng.W}x{eng.H}', '-r', '30', '-i', '-',
                              '-vf', 'scale=720:1280:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', out], stdin=subprocess.PIPE)
        for fi in range(a, b):
            s = fi / FPS
            p.stdin.write(eng.render(build(s), 8.5 + s).tobytes())
        p.stdin.close(); p.wait(); print('chunk', k)
