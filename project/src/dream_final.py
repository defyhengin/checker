import os, sys, subprocess, wave
import numpy as np
import qrcode
from PIL import Image
from film import HDR, typed, lowpass, bandpass, ssv, run

S1, S2, S3, S4, S5 = 14.0, 62.0, 104.0, 152.0, 174.0
SCENE = 192.0
CARD = 6.0
TOTAL = SCENE + CARD
SR = 44100
rng = np.random.default_rng(91)

SUBS = [(20.0, "Опять эта кухня."), (29.0, "И эта."), (38.0, "И эта тоже."), (48.0, "Сколько их здесь?", 59.5),
        (68.0, "Он большой."), (82.0, "Он откроется."), (95.0, "Он пустой.", 102.0),
        (109.0, "Еда."), (116.0, "Настоящая."), (124.0, "Ещё чуть-чуть."), (133.0, "Ещё."), (142.0, "Она уходит.", 150.0),
        (179.0, "Приснится же.", 186.0)]


def make_ass():
    hdr = HDR.replace("Style: Link,Liberation Mono,32,", "Style: Link,Liberation Mono,28,")
    ev = []
    for i, ln in enumerate(SUBS):
        a, txt = ln[0], ln[1]
        b = ln[2] if len(ln) > 2 else SUBS[i + 1][0] - 0.6
        ev += typed(a, b, txt, 'Default', 0.07)
    ev += typed(9.5, 13.4, "Сон", 'Title', 0.25)
    c = SCENE
    ev += typed(c + 0.3, c + CARD, "Чтобы холодильник не пустовал:", 'Head', 0.035, False)
    ev += typed(c + 1.2, c + CARD, "donationalerts.com/r/whatwhatwhat", 'Link', 0.03, False)
    open('dream.ass', 'w').write(hdr + "\n".join(ev) + "\n")


def make_card():
    if os.path.exists('card_da_h.mp4'):
        return
    qr = qrcode.QRCode(border=3, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
    qr.add_data('https://www.donationalerts.com/r/whatwhatwhat'); qr.make(fit=True)
    q = qr.make_image(fill_color='black', back_color='white').convert('RGB')
    n = q.size[0]; side = (300 // n) * n if (300 // n) * n >= 260 else 300
    q = q.resize((side, side), Image.NEAREST)
    im = Image.new('RGB', (1280, 720), (6, 6, 6)); im.paste(q, ((1280 - side) // 2, 165 + (300 - side) // 2)); im.save('card_da_h.png')
    run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', 'card_da_h.png', '-vf',
         f'format=yuv420p,loop=-1:1,trim=duration={CARD},fade=t=in:d=0.6', '-c:v', 'libx264', '-preset', 'veryfast',
         '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', 'card_da_h.mp4'])


def make_audio():
    n = int(TOTAL * SR); t = np.arange(n) / SR; out = np.zeros(n)

    def add_at(at, sig):
        i0 = int(at * SR); m = min(len(sig), n - i0)
        if m > 0 and i0 >= 0:
            out[i0:i0 + m] += sig[:m]

    def click(at, amp=0.3, dur=0.015):
        k = int(dur * SR); add_at(at, rng.normal(0, 1, k) * np.exp(-np.linspace(0, 6, k)) * amp)

    def win(a, b, fa=1.5, fb=1.5):
        return ssv(a, a + fa, t) * (1 - ssv(b - fb, b, t))

    home = win(0, S1 - 0.5, 1.0, 3.0) + ssv(S5, S5 + 0.05, t) * (1 - ssv(SCENE - 1.5, SCENE, t))
    room = lowpass(rng.normal(0, 1, n), 180); room /= np.abs(room).max()
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    out += (room * 0.03 + hum * 0.06) * home
    tk = int(0.012 * SR)
    tick = bandpass(rng.normal(0, 1, tk * 4), 1500, 6000)[:tk] * np.exp(-np.arange(tk) / (0.002 * SR)); tick /= np.abs(tick).max()
    for sec in range(int(SCENE)):
        if sec < S1 - 1 or sec >= S5:
            add_at(sec + 0.5, tick * 0.08)
    # dream drone
    dream = win(S1 - 2, S5, 3.0, 0.05)
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)
    drone = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.4 * t + np.sin(t * 0.3)) + 0.3 * np.sin(2 * np.pi * 110.3 * t)) * lfo
    pad = lowpass(rng.normal(0, 1, n), 400); pad /= np.abs(pad).max()
    out += (drone * 0.09 + pad * 0.05) * dream
    # corridor: echoing footsteps, fast clocks
    for st in np.arange(S1 + 0.6, S2 - 1.0, 0.62):
        k = int(0.15 * SR)
        s_ = lowpass(rng.normal(0, 1, k), 220) * np.exp(-np.arange(k) / (0.03 * SR)); s_ /= np.abs(s_).max()
        for dl, g in ((0, 0.2), (0.21, 0.08), (0.42, 0.04)):
            add_at(st + dl, s_ * g)
    for i in range(int((S2 - S1) * 6)):
        add_at(S1 + 1 + i / 6 + rng.random() * 0.05, tick * 0.035)
    # giants: deep hum, door groan, bright chord
    giant = win(S2, S3)
    deep = (np.sin(2 * np.pi * 25 * t) + 0.6 * np.sin(2 * np.pi * 50 * t)) * (1 + 0.2 * np.sin(2 * np.pi * 2 * t))
    out += deep * 0.12 * giant
    for st in list(np.arange(S2 + 1, S2 + 32, 0.7)):
        k = int(0.15 * SR)
        s_ = lowpass(rng.normal(0, 1, k), 200) * np.exp(-np.arange(k) / (0.03 * SR)); s_ /= np.abs(s_).max()
        add_at(st, s_ * 0.15); add_at(st + 0.35, s_ * 0.06)
    gd = int(8 * SR); tg = np.arange(gd) / SR
    groan = np.sin(2 * np.pi * np.cumsum(55 + 40 * tg / 8 + 6 * np.sin(tg * 9)) / SR) * np.sin(np.pi * tg / 8)
    add_at(S2 + 22, bandpass(groan * (0.7 + 0.3 * rng.random(gd)), 40, 900) * 0.35)
    chord = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 554.4 * t) + np.sin(2 * np.pi * 659.3 * t)) / 3
    out += chord * 0.06 * win(S2 + 28, S3, 3.0, 2.0)
    # banquet: distant chatter, clinks, heartbeat
    feast = win(S3, S4)
    chat = bandpass(rng.normal(0, 1, n), 300, 2500); chat /= np.abs(chat).max()
    syl = lowpass(np.abs(rng.normal(0, 1, n)), 6); syl = (syl - syl.min()) / (syl.max() - syl.min())
    out += chat * syl * 0.06 * feast * (1 - 0.7 * ssv(S3 + 20, S4, t))
    for at in S3 + 2 + np.sort(rng.random(40)) * 40:
        m = int(0.3 * SR); tm = np.arange(m) / SR
        add_at(at, np.sin(2 * np.pi * rng.uniform(2500, 4200) * tm) * np.exp(-tm * 18) * 0.05)
    hbs = []; a_ = S3 + 20; st_ = 0.9
    while a_ < S5:
        hbs.append(a_); a_ += st_; st_ = max(0.45, st_ * 0.985)
    for at in hbs:
        k = int(0.12 * SR)
        hb = lowpass(rng.normal(0, 1, k), 90) * np.exp(-np.arange(k) / (0.025 * SR)); hb /= np.abs(hb).max()
        g = 0.12 + 0.18 * ssv(S3 + 20, S5, at)
        add_at(at, hb * g); add_at(at + 0.18, hb * g * 0.6)
    # fall: rising wind
    wind = bandpass(rng.normal(0, 1, n), 200, 3000); wind /= np.abs(wind).max()
    out += wind * 0.18 * ssv(S4, S5 - 0.5, t) * (t < S5)
    # wake: hard cut
    out[int(S5 * SR):int((S5 + 0.02) * SR)] *= 0
    click(S5 + 0.01, 0.4, 0.02)
    out *= (t < SCENE)
    out = out / np.abs(out).max() * 0.85
    with wave.open('dream.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def final():
    chunks = [f'dr_c{k:02d}.mp4' for k in range(12)]
    for f in chunks + ['card_da_h.mp4']:
        assert os.path.exists(f), f
    open('dr_list.txt', 'w').write("".join(f"file '{f}'\n" for f in chunks + ['card_da_h.mp4']))
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'dr_list.txt', '-c', 'copy', 'dr_base.mp4'])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'dr_base.mp4', '-i', 'dream.wav', '-vf', 'subtitles=dream.ass,format=yuv420p',
         '-c:v', 'libx264', '-preset', 'medium', '-b:v', '3000k', '-maxrate', '3600k', '-bufsize', '6000k', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '128k',
         '-t', str(TOTAL), '-movflags', '+faststart', 'son_tmp.mp4'])
    os.rename('son_tmp.mp4', 'son.mp4')


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_card(); make_ass(); make_audio(); print('prep ok')
    else:
        final(); print('final ok')
