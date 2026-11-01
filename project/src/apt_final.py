import os, sys, subprocess, wave
import numpy as np
from film import HDR, typed, lowpass, bandpass, ssv, run
import apt
from phone import total

SR = 44100
SCENE = apt.DUR          # 207
TOTAL = SCENE + 5 + 6    # + title + card
rng = np.random.default_rng(33)

SUBS = [
    (24.0, "Так. Что у нас на ужин."), (28.0, "Лимон."), (31.5, "Лимон — это фрукт."), (35.0, "Фрукты — это еда."), (39.0, "...Нет.", 41.0),
    (45.2, "Свет опять выбило. Ладно."), (51.0, "Пусто."), (54.0, "Тоже пусто."), (56.6, "О! Соль."), (59.3, "Значит, почти суп.", 62.5),
    (64.5, "Суп."), (67.0, "Рецепт: вода, соль, надежда."), (72.0, "Вода закипает."), (76.0, "Соль растворяется."), (80.0, "Надежда закончилась первой.", 84.5),
    (89.0, "Может, доставка?"), (94.3, "Макароны — 149. Нормально."), (99.3, "Так..."), (104.8, "Итого — 899."), (108.3, "Из них еда — 149."), (112.3, "Экран гаснет сам.", 115.5),
    (119.0, "Разогреваю ужин."), (123.0, "Минута."), (126.0, "Вторая."), (129.5, "Там ничего нет."), (133.0, "Зато тёплое ничего.", 136.5),
    (141.5, "Чай."), (144.0, "Пакетик тот же."), (147.5, "Шестой заход."), (151.0, "Цвет — почти вода."), (154.5, "На вкус — воспоминание о чае.", 157.5),
    (162.0, "Праздничный ужин."), (166.0, "Шеф рекомендует:"), (169.5, "крошка хлеба."), (173.0, "Подаётся одна."), (178.0, "Ну и ладно.", 181.0),
    (183.0, "Завтра — то же самое.", 188.0),
    (199.5, "Даже лимон ушёл.", 205.0),
]


def make_ass():
    ev = []
    for i, ln in enumerate(SUBS):
        a, txt = ln[0], ln[1]
        b = ln[2] if len(ln) > 2 else SUBS[i + 1][0] - 0.5
        ev += typed(a, b, txt, 'Default')
    ev += typed(0.5, 3.3, "Один вечер", 'Title', 0.12)
    ev += typed(SCENE + 0.5, SCENE + 4.7, "Один вечер", 'Title', 0.12)
    c = SCENE + 5
    ev += typed(c + 0.3, c + 6.0, "Чтобы холодильник не пустовал:", 'Head', 0.035, False)
    ev += typed(c + 1.4, c + 6.0, "boosty.to/whatwhatwhat", 'Link', 0.04, False)
    open('apt.ass', 'w').write(HDR + "\n".join(ev) + "\n")


def make_audio():
    n = int(TOTAL * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)

    def add_at(at, sig, g=1.0):
        i0 = int(at * SR); m = min(len(sig), n - i0)
        if m > 0 and i0 >= 0:
            out[i0:i0 + m] += sig[:m] * g

    def click(at, amp=0.5, dur=0.02):
        k = int(dur * SR); add_at(at, rng.normal(0, 1, k) * np.exp(-np.linspace(0, 6, k)) * amp)

    def thump(at, amp=0.5, fc=120, dur=0.4, dec=0.06):
        k = int(dur * SR); s = lowpass(rng.normal(0, 1, k), fc) * np.exp(-np.arange(k) / (dec * SR))
        add_at(at, s / (np.abs(s).max() + 1e-9) * amp)

    def creak(at, dur, amp=0.1, f0=260, f1=420):
        k = int(dur * SR); tc = np.arange(k) / SR
        c = np.sin(2 * np.pi * np.cumsum(f0 + (f1 - f0) * tc / dur + 30 * np.sin(tc * 23)) / SR)
        c = bandpass(c * (0.6 + 0.4 * rng.random(k)), 200, 3000) * np.sin(np.pi * tc / dur)
        add_at(at, c / (np.abs(c).max() + 1e-9) * amp)

    end_fade = 1 - ssv(SCENE, SCENE + 3, t)
    room = lowpass(rng.normal(0, 1, n), 180); out += room / np.abs(room).max() * 0.035 * end_fade

    # fridge hum, louder near the fridge
    tc = np.arange(0, TOTAL, 0.1)
    dcam = np.array([np.linalg.norm(apt.camera(min(x, SCENE - 0.01))[0][[0, 2]] - np.array([-1.85, 3.65])) for x in tc])
    lvl = np.interp(t, tc, 0.04 + 0.16 * np.exp(-dcam / 1.2))
    lvl *= ssv(5.0, 9.0, t)   # inaudible outside the flat
    hum = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * (1 + 0.15 * np.sin(2 * np.pi * 6 * t))
    pk = lowpass(rng.normal(0, 1, n), 300); hum += pk / np.abs(pk).max() * 0.12
    out += hum * lvl * end_fade

    # footsteps from camera motion
    d = apt._dist; ts_ = apt._ts
    steps = np.nonzero(np.diff(np.floor(d / 0.72)) > 0)[0]
    for i in steps:
        tt = ts_[i + 1]
        if apt._spd[i] < 0.25:
            continue
        kitchen = apt.raw_cam(tt)[0][2] > 3.0
        thump(tt, 0.22 if kitchen else 0.28, fc=260 if kitchen else 160, dur=0.18, dec=0.03)
        if kitchen:
            click(tt + 0.01, 0.04, 0.01)

    # entrance
    for k in range(26):
        at = 0.5 + rng.random() * 1.7; m = int(0.08 * SR); fr = rng.uniform(3000, 6500)
        add_at(at, np.sin(2 * np.pi * fr * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.015 * SR)) * 0.08)
    click(2.8, 0.5, 0.03); click(3.0, 0.35, 0.02)
    creak(3.5, 2.0, 0.12)
    click(10.5, 0.5); click(18.0, 0.5)
    # kitchen bulb flicker buzz and pop
    buzz = np.sin(2 * np.pi * 100 * t) * 0.05 + np.sin(2 * np.pi * 200 * t) * 0.03
    fl = np.array([1.0 if (apt.L_kitchen(x) < 0.5 and 18 < x < 44.5) else 0.0 for x in tc])
    out += buzz * np.interp(t, tc, fl)
    thump(44.5, 0.35, fc=400, dur=0.25, dec=0.03); click(44.5, 0.6, 0.04)
    # fridge door
    thump(22.0, 0.25, fc=300, dur=0.2, dec=0.03); creak(22.1, 0.9, 0.04, 500, 700)
    thump(42.3, 0.45, fc=150, dur=0.35, dec=0.05)
    thump(196.0, 0.25, fc=300, dur=0.2, dec=0.03); creak(196.1, 0.9, 0.04, 500, 700)
    # bulb dies inside fridge
    m = int(0.3 * SR); add_at(205.0, np.sin(2 * np.pi * 3200 * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.02 * SR)) * 0.15)
    click(205.0, 0.3)
    # flashlight, cabinet
    click(47.0, 0.6); creak(48.0, 1.4, 0.1, 380, 300)
    # burner
    for k in range(3):
        click(62.7 + k * 0.18, 0.4, 0.012)
    w = int(1.0 * SR); wh = bandpass(rng.normal(0, 1, w), 150, 1500) * ssv(0, 0.15, np.arange(w) / SR) * np.exp(-np.arange(w) / (0.4 * SR))
    add_at(63.2, wh / np.abs(wh).max() * 0.2)
    gas = bandpass(rng.normal(0, 1, n), 800, 6000); gas /= np.abs(gas).max()
    out += gas * 0.025 * np.interp(t, tc, [apt.L_flame(x) for x in tc])
    boil = bandpass(rng.normal(0, 1, n), 250, 2600); boil /= np.abs(boil).max()
    gate = lowpass(np.abs(rng.normal(0, 1, n)), 12); gate = (gate - gate.min()) / (gate.max() - gate.min())
    benv = ssv(64, 75, t) * (1 - ssv(84, 90, t))
    out += boil * (0.3 + 0.7 * gate) * 0.2 * benv
    for pt in apt.BT:
        if 64 < pt < 88:
            m = int(0.03 * SR); fr = rng.uniform(350, 900)
            add_at(pt, np.sin(2 * np.pi * fr * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.006 * SR)) * 0.09 * float(ssv(64, 75, pt)))
    click(84.0, 0.5)
    # phone
    prev = total(0)
    for i in range(int(28 * 90)):
        tl = i / 90; v = total(tl)
        if v != prev and i % 2 == 0 and tl < 25:
            m = int(0.006 * SR)
            add_at(apt.PH0 + tl, np.sin(2 * np.pi * 2500 * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.0015 * SR)) * 0.2)
        prev = v
    click(apt.PH0 + 0.5, 0.25)
    vb = int(0.45 * SR); tv = np.arange(vb) / SR
    add_at(apt.PH0 + 24.3, np.sin(2 * np.pi * 160 * tv) * (np.sin(2 * np.pi * 8 * tv) > 0) * 0.15)
    click(apt.PH0 + 26.2, 0.4)
    # microwave
    for bt in (117.5, 117.8, 118.05):
        m = int(0.1 * SR); add_at(bt, np.sin(2 * np.pi * 1000 * np.arange(m) / SR) * 0.15)
    motor = (0.25 * np.sin(2 * np.pi * 120 * t) + 0.12 * np.sin(2 * np.pi * 240 * t)) * (1 + 0.1 * np.sin(2 * np.pi * 0.7 * t))
    out += motor * 0.4 * ssv(118.2, 118.4, t) * (1 - ssv(135.9, 136.0, t))
    dk = int(3 * SR); td = np.arange(dk) / SR
    add_at(136.0, (np.sin(2 * np.pi * 1760 * td) + 0.4 * np.sin(2 * np.pi * 2640 * td) + 0.2 * np.sin(2 * np.pi * 3520 * td)) * np.exp(-td * 2.2) * 0.3)
    # pendant lamp, tea, chair
    click(138.0, 0.5)
    k = 0
    while 140.0 + 2.9 * k + 0.5 < 156.5:
        m = int(0.25 * SR)
        b = bandpass(rng.normal(0, 1, m * 2), 500, 4000)[:m] * np.exp(-np.arange(m) / (0.05 * SR))
        add_at(140.0 + 2.9 * k + 0.5, b / np.abs(b).max() * 0.13); k += 1
    creak(159.3, 1.2, 0.08, 200, 160); creak(188.4, 1.0, 0.08, 160, 220)
    pfl = np.array([1.0 if (176 < x < 181 and apt.L_pend(x) < 0.5) else 0.0 for x in tc])
    out += buzz * 0.8 * np.interp(t, tc, pfl)
    click(181.0, 0.6)

    out = out / np.abs(out).max() * 0.8
    with wave.open('apt.wav', 'wb') as wv:
        wv.setnchannels(1); wv.setsampwidth(2); wv.setframerate(SR)
        wv.writeframes((out * 32767).astype(np.int16).tobytes())


def final():
    chunks = [f'apt_c{k:02d}.mp4' for k in range(12)]
    for f in chunks + ['blk_5.mp4', 'card_h.mp4']:
        assert os.path.exists(f), f
    open('apt_list.txt', 'w').write("".join(f"file '{f}'\n" for f in chunks + ['blk_5.mp4', 'card_h.mp4']))
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'apt_list.txt', '-c', 'copy', 'apt_base.mp4'])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'apt_base.mp4', '-i', 'apt.wav', '-vf', 'subtitles=apt.ass,format=yuv420p',
         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k',
         '-t', str(TOTAL), '-movflags', '+faststart', 'odin_vecher_v2_tmp.mp4'])
    os.rename('odin_vecher_v2_tmp.mp4', 'odin_vecher_v2.mp4')


if __name__ == '__main__':
    if sys.argv[1] == 'prep':
        make_ass(); make_audio(); print('prep ok', TOTAL)
    else:
        final(); print('final ok')
