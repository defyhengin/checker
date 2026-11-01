import os, sys, subprocess, wave
import numpy as np
import qrcode
from PIL import Image

SR = 44100
rng = np.random.default_rng(21)
# (name, file, duration, stretch for 3D scenes or None)
SEG = [
    ('prologue', 'blk_14.mp4', 14, None),
    ('fridge', 'fr_h', 32, 32 / 15),
    ('cup', 'cup_h', 32, 32 / 15),
    ('pot', 'pot_h', 30, 30 / 15),
    ('phone', 'phone.mp4', 28, None),
    ('mic', 'mic_h', 26, 26 / 15),
    ('tea', 'tea_h', 26, 26 / 15),
    ('table', 'crh', 34, 34 / 15),
    ('dark', 'blk_6.mp4', 6, None),
    ('empty', 'fr_e', 20, 20 / 15),
    ('title', 'blk_5.mp4', 5, None),
    ('card', 'card_h.mp4', 6, None),
]
STARTS = np.cumsum([0] + [s[2] for s in SEG])[:-1]
TOTAL = sum(s[2] for s in SEG)
START = {s[0]: float(st) for s, st in zip(SEG, STARTS)}
SCALE = {s[0]: s[3] for s in SEG}

SUBS = {
    'fridge': [(3.0, "Так. Что у нас на ужин."), (9.0, "Лимон."), (13.0, "Лимон — это фрукт."), (17.0, "Фрукты — это еда."), (22.0, "...Нет.", 28.5)],
    'cup': [(2.5, "Свет опять выбило. Ладно."), (7.0, "Пусто."), (12.0, "Тоже пусто."), (17.0, "И тут пусто."), (21.8, "О! Соль."), (25.0, "Значит, почти суп.", 29.3)],
    'pot': [(3.0, "Суп."), (7.0, "Рецепт: вода, соль, надежда."), (14.0, "Вода закипает."), (19.0, "Соль растворяется."), (23.5, "Надежда закончилась первой.", 27.6)],
    'phone': [(2.0, "Может, доставка?"), (6.0, "Макароны — 149. Нормально."), (11.0, "Так..."), (16.5, "Итого — 899."), (20.0, "Из них еда — 149."), (24.0, "Экран гаснет сам.", 27.5)],
    'mic': [(3.0, "Разогреваю ужин."), (8.0, "Минута."), (11.5, "Вторая."), (15.0, "Там ничего нет."), (19.5, "Зато тёплое ничего.", 23.4)],
    'tea': [(3.0, "Чай."), (6.5, "Пакетик тот же."), (10.5, "Шестой заход."), (15.0, "Цвет — почти вода."), (19.0, "На вкус — воспоминание о чае.", 23.9)],
    'table': [(3.5, "Праздничный ужин."), (9.0, "Шеф рекомендует:"), (13.0, "крошка хлеба."), (18.0, "Подаётся одна."), (24.0, "Ну и ладно.", 30.5)],
    'dark': [(1.0, "Завтра — то же самое.", 5.8)],
    'empty': [(5.0, "Даже лимон ушёл.", 17.5)],
}

HDR = """[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Liberation Mono,28,&H00F0F0F0,&H00F0F0F0,&H99000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,60,60,50,1
Style: Title,Liberation Mono,46,&H00F0F0F0,&H00F0F0F0,&H99000000,&H00000000,0,0,0,0,100,100,2,0,1,2,0,5,60,60,0,1
Style: Head,Liberation Mono,28,&H00F0F0F0,&H00F0F0F0,&H99000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,8,60,60,95,1
Style: Link,Liberation Mono,32,&H00FFFFFF,&H00FFFFFF,&H99000000,&H00000000,1,0,0,0,100,100,0,0,1,2,0,2,40,40,150,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
"""


def ts(x):
    cs = int(round(x * 100)); return f"{cs // 360000}:{cs // 6000 % 60:02d}:{cs // 100 % 60:02d}.{cs % 100:02d}"


def typed(a, b, txt, style, step=0.06, fade=True):
    out = []
    n = len(txt)
    for i in range(1, n + 1):
        s = a + (i - 1) * step; e = a + i * step if i < n else b
        rest = txt[i:]
        body = txt[:i].replace('\n', '\\N') + ("{\\alpha&HFF&}" + rest.replace('\n', '\\N') if rest else "")
        if i == n and fade:
            body = "{\\fad(0,400)}" + body
        out.append(f"Dialogue: 0,{ts(s)},{ts(e)},{style},,0,0,0,,{body}")
    return out


def make_ass():
    ev = []
    for name, lines in SUBS.items():
        o = START[name]
        for i, ln in enumerate(lines):
            a, txt = ln[0], ln[1]
            b = ln[2] if len(ln) > 2 else lines[i + 1][0] - 0.5
            ev += typed(o + a, o + b, txt, 'Default')
    ev += typed(START['prologue'] + 9.0, START['prologue'] + 13.3, "Один вечер", 'Title', 0.12)
    ev += typed(START['title'] + 0.5, START['title'] + 4.7, "Один вечер", 'Title', 0.12)
    c = START['card']
    ev += typed(c + 0.3, c + 6.0, "Чтобы холодильник не пустовал:", 'Head', 0.035, False)
    ev += typed(c + 1.4, c + 6.0, "boosty.to/whatwhatwhat", 'Link', 0.04, False)
    open('film.ass', 'w').write(HDR + "\n".join(ev) + "\n")


def run(cmd):
    subprocess.run(cmd, check=True)


def enc_args(out):
    return ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', out]


def make_static():
    for d in (14, 6, 5):
        f = f'blk_{d}.mp4'
        if not os.path.exists(f):
            run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', f'color=c=0x020202:s=1280x720:r=30:d={d}'] + enc_args(f))
    if not os.path.exists('card_h.mp4'):
        qr = qrcode.QRCode(border=3, box_size=10, error_correction=qrcode.constants.ERROR_CORRECT_M)
        qr.add_data('https://boosty.to/whatwhatwhat'); qr.make(fit=True)
        q = qr.make_image(fill_color='black', back_color='white').convert('RGB').resize((300, 300), Image.NEAREST)
        im = Image.new('RGB', (1280, 720), (6, 6, 6)); im.paste(q, (490, 165)); im.save('card_h.png')
        run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', 'card_h.png', '-vf',
             'format=yuv420p,loop=-1:1,trim=duration=6,fade=t=in:d=0.6'] + enc_args('card_h.mp4'))


# ---------------- audio ----------------
def lowpass(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[f > fc] = 0
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def ssv(a, b, x):
    x = np.clip((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x)


def make_audio():
    n = int(TOTAL * SR)
    t = np.arange(n) / SR
    out = np.zeros(n)

    def add_at(at, sig):
        i0 = int(at * SR)
        m = min(len(sig), n - i0)
        if m > 0:
            out[i0:i0 + m] += sig[:m]

    def click(at, amp=0.5, dur=0.02):
        k = int(dur * SR)
        add_at(at, rng.normal(0, 1, k) * np.exp(-np.linspace(0, 6, k)) * amp)

    def win(name, a=0.0, b=None):
        s = START[name]; d = [x[2] for x in SEG if x[0] == name][0]
        return ((t >= s + a) & (t < s + (d if b is None else b))).astype(float)

    room = lowpass(rng.normal(0, 1, n), 180); room = room / np.abs(room).max() * 0.04
    out += room * (1 - win('card')) * (1 - win('title') * ssv(START['title'], START['title'] + 4, t))
    tremolo = 1 + 0.15 * np.sin(2 * np.pi * 6 * t)
    hum_src = (0.5 * np.sin(2 * np.pi * 50 * t) + 0.25 * np.sin(2 * np.pi * 100 * t)) * tremolo
    pk = lowpass(rng.normal(0, 1, n), 300); hum_src += pk / np.abs(pk).max() * 0.12

    def fridge_hum(name, off_at, lvl):
        s = START[name]
        env = win(name) * ssv(s, s + 0.8, t) * (t < s + off_at) * lvl
        return hum_src * env

    # prologue: keys, lock, creak, door, steps
    p = START['prologue']
    for k in range(26):
        at = p + 1.0 + rng.random() * 1.6
        dd = int(0.08 * SR); fr = rng.uniform(3000, 6500)
        add_at(at, np.sin(2 * np.pi * fr * np.arange(dd) / SR) * np.exp(-np.arange(dd) / (0.015 * SR)) * 0.08)
    click(p + 3.0, 0.5, 0.03); click(p + 3.15, 0.35, 0.02)
    cd = int(1.8 * SR); tc = np.arange(cd) / SR
    creak = np.sin(2 * np.pi * np.cumsum(260 + 140 * tc / 1.8 + 30 * np.sin(tc * 23)) / SR)
    creak = bandpass(creak * (0.6 + 0.4 * rng.random(cd)), 200, 3000) * np.sin(np.pi * tc / 1.8) * 0.12
    add_at(p + 3.4, creak)
    th = lowpass(rng.normal(0, 1, int(0.4 * SR)), 120) * np.exp(-np.arange(int(0.4 * SR)) / (0.06 * SR))
    add_at(p + 5.6, th / np.abs(th).max() * 0.5)
    for st in (6.6, 7.3, 8.0):
        s_ = lowpass(rng.normal(0, 1, int(0.15 * SR)), 200) * np.exp(-np.arange(int(0.15 * SR)) / (0.03 * SR))
        add_at(p + st, s_ / np.abs(s_).max() * 0.2)

    # fridge
    sc = SCALE['fridge']
    out += fridge_hum('fridge', 14 * sc, 0.16)
    click(START['fridge'] + 0.2, 0.4); click(START['fridge'] + 14 * sc, 0.6)

    # cupboard
    sc = SCALE['cup']; s0 = START['cup']
    out += fridge_hum('cup', 32, 0.04)
    click(s0 + 0.6 * sc, 0.6); click(s0 + 14 * sc, 0.6)

    # pot
    sc = SCALE['pot']; s0 = START['pot']
    boil = bandpass(rng.normal(0, 1, n), 250, 2600); boil /= np.abs(boil).max()
    gate = lowpass(np.abs(rng.normal(0, 1, n)), 12); gate = (gate - gate.min()) / (gate.max() - gate.min())
    out += boil * (0.3 + 0.7 * gate) * 0.22 * ssv(s0 + 1.5 * sc, s0 + 10 * sc, t) * (t < s0 + 14 * sc) * win('pot')
    for pt in 1.5 + 12.5 * np.sqrt(rng.random(220)):
        at = s0 + pt * sc
        if pt > 14:
            continue
        k = int(0.03 * SR); fr = rng.uniform(350, 900)
        add_at(at, np.sin(2 * np.pi * fr * np.arange(k) / SR) * np.exp(-np.arange(k) / (0.006 * SR)) * 0.1 * ssv(1.5, 10, pt))
    out += fridge_hum('pot', 14 * sc, 0.05)
    click(s0 + 14 * sc, 0.6)

    # phone
    s0 = START['phone']
    from phone import ITEMS, total
    prev = total(0)
    for i in range(int(28 * 90)):
        tt = i / 90
        v = total(tt)
        if v != prev and tt < 25:
            if i % 2 == 0:
                k = int(0.006 * SR)
                add_at(s0 + tt, np.sin(2 * np.pi * 2500 * np.arange(k) / SR) * np.exp(-np.arange(k) / (0.0015 * SR)) * 0.2)
        prev = v
    click(s0 + 0.5, 0.25)
    vb = int(0.45 * SR); tv = np.arange(vb) / SR
    buzz = np.sin(2 * np.pi * 160 * tv) * (np.sin(2 * np.pi * 8 * tv) > 0) * 0.15
    add_at(s0 + 24.3, buzz)
    click(s0 + 26.2, 0.4)

    # microwave
    sc = SCALE['mic']; s0 = START['mic']
    run_env = ssv(s0 + 0.8 * sc, s0 + 0.9 * sc, t) * (1 - ssv(s0 + 13.55 * sc, s0 + 13.62 * sc, t)) * win('mic')
    motor = (0.25 * np.sin(2 * np.pi * 120 * t) + 0.12 * np.sin(2 * np.pi * 240 * t)) * (1 + 0.1 * np.sin(2 * np.pi * 0.7 * t))
    out += motor * run_env * 0.5
    bk = int(0.15 * SR)
    add_at(s0 + 0.6 * sc, np.sin(2 * np.pi * 1000 * np.arange(bk) / SR) * 0.2)
    dk = int(3 * SR); td = np.arange(dk) / SR
    add_at(s0 + 13.6 * sc, (np.sin(2 * np.pi * 1760 * td) + 0.4 * np.sin(2 * np.pi * 2640 * td) + 0.2 * np.sin(2 * np.pi * 3520 * td)) * np.exp(-td * 2.2) * 0.3)
    click(s0 + 13.58 * sc, 0.4)

    # tea
    sc = SCALE['tea']; s0 = START['tea']
    out += fridge_hum('tea', 14 * sc, 0.06)
    k = 0
    while True:
        st = 1.5 + 1.7 * k + 0.28
        if st > 13.3:
            break
        m = int(0.25 * SR)
        b = bandpass(rng.normal(0, 1, m * 2), 500, 4000)[:m] * np.exp(-np.arange(m) / (0.05 * SR))
        add_at(s0 + st * sc, b / np.abs(b).max() * 0.15)
        k += 1
    click(s0 + 14 * sc, 0.6)

    # table, dark, empty fridge: one continuous hum
    sc = SCALE['table']
    out += fridge_hum('table', 34, 0.12) + fridge_hum('dark', 6, 0.12) * 1.0
    click(START['table'] + 14 * sc, 0.6)
    sc = SCALE['empty']; s0 = START['empty']
    out += hum_src * win('empty') * (t < s0 + 14 * sc) * 0.16
    click(s0 + 0.3, 0.4); click(s0 + 14 * sc, 0.7)

    out = out / np.abs(out).max() * 0.8
    with wave.open('film.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())


def seg_files(f):
    if f.endswith('.mp4'):
        return [f]
    return [f'{f}_seg0.mp4', f'{f}_seg1.mp4']


def final():
    lst = []
    for _, f, d, _ in SEG:
        lst += seg_files(f)
    for f in lst:
        assert os.path.exists(f), f
    open('film_list.txt', 'w').write("".join(f"file '{f}'\n" for f in lst))
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'film_list.txt', '-c', 'copy', 'film_base.mp4'])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', 'film_base.mp4', '-i', 'film.wav', '-vf', 'subtitles=film.ass,format=yuv420p',
         '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '160k',
         '-t', str(TOTAL), '-movflags', '+faststart', 'odin_vecher_tmp.mp4'])
    os.rename('odin_vecher_tmp.mp4', 'odin_vecher.mp4')


if __name__ == '__main__':
    what = sys.argv[1]
    if what == 'prep':
        make_static(); make_ass(); make_audio(); print('prep ok', TOTAL, dict(zip([s[0] for s in SEG], STARTS)))
    elif what == 'final':
        final(); print('final ok')
