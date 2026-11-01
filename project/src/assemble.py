import subprocess, sys, os

LINES = {
    'cup': [(1.5, "Так. Что тут у нас."), (5.0, "Пусто."), (7.0, "Тоже пусто."), (10.0, "О! Соль."), (12.0, "Значит, почти суп.")],
    'pot': [(2.0, "Варится суп."), (4.6, "Ну, почти суп."), (7.6, "Вода."), (9.4, "Горячая вода."), (11.8, "Главное — верить.")],
    'prc': [(1.5, "Макароны."), (3.6, "89 рублей. Беру."), (6.8, "Так. Уже 149."), (9.4, "Пока думал — 199."), (11.8, "Посмотрю в следующий раз.")],
    'crm': [(2.0, "Праздничный ужин."), (5.0, "Шеф рекомендует:"), (7.6, "крошка хлеба."), (9.6, "Подаётся одна."), (11.8, "Приятного аппетита.")],
    'tea': [(1.6, "Чай."), (3.4, "Пакетик тот же."), (6.0, "Пятый заход."), (8.6, "Цвет — почти вода."), (11.0, "На вкус — воспоминание о чае.")],
    'mic': [(1.8, "Разогреваю ужин."), (4.8, "Минута."), (6.6, "Вторая."), (8.6, "Там ничего нет."), (11.0, "Зато тёплое ничего.")],
}
CARD_T = 15.0
CARD_D = 3.5

HDR = """[Script Info]
ScriptType: v4.00+
PlayResX: 720
PlayResY: 1280

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Default,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H99000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,70,70,400,1
Style: Head,Liberation Mono,30,&H00F0F0F0,&H00F0F0F0,&H99000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,8,60,60,250,1
Style: Link,Liberation Mono,34,&H00FFFFFF,&H00FFFFFF,&H99000000,&H00000000,1,0,0,0,100,100,0,0,1,2,0,2,40,40,430,1

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
            body = "{\\fad(0,300)}" + body
        out.append(f"Dialogue: 0,{ts(s)},{ts(e)},{style},,0,0,0,,{body}")
    return out


def card_events():
    end = CARD_T + CARD_D
    return (typed(CARD_T + 0.3, end, "Чтобы холодильник\nне пустовал:", 'Head', 0.04, False)
            + typed(CARD_T + 1.3, end, "boosty.to/whatwhatwhat", 'Link', 0.04, False))


def write_ass(name, lines):
    ev = []
    for i, (a, txt) in enumerate(lines):
        b = lines[i + 1][0] - 0.5 if i + 1 < len(lines) else 13.9
        ev += typed(a, b, txt, 'Default')
    ev += card_events()
    open(f'{name}.ass', 'w').write(HDR + "\n".join(ev) + "\n")


def run(cmd):
    subprocess.run(cmd, check=True)


def make_card():
    if os.path.exists('card.mp4'):
        return
    run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '30', '-i', 'card.png', '-vf',
         f'format=yuv420p,loop=-1:1,trim=duration={CARD_D},fade=t=in:d=0.5', '-c:v', 'libx264', '-preset', 'veryfast',
         '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', 'card_tmp.mp4'])
    os.rename('card_tmp.mp4', 'card.mp4')


def scene(name, out):
    write_ass(name, LINES[name])
    open(f'{name}_list.txt', 'w').write(f"file '{name}_seg0.mp4'\nfile '{name}_seg1.mp4'\nfile 'card.mp4'\n")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', f'{name}_list.txt', '-c', 'copy', f'{name}_base.mp4'])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', f'{name}_base.mp4', '-i', f'a_{name}.wav',
         '-vf', f'subtitles={name}.ass,format=yuv420p', '-af', 'apad', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20',
         '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-t', str(CARD_T + CARD_D), out + '.tmp.mp4'])
    os.rename(out + '.tmp.mp4', out)


def old(src, out):
    open('card_only.ass', 'w').write(HDR + "\n".join(card_events()) + "\n")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-i', 'card.mp4', '-filter_complex',
         '[0:v][1:v]concat=n=2:v=1:a=0,subtitles=card_only.ass,format=yuv420p[v];[0:a]apad[a]',
         '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '128k', '-t', str(CARD_T + CARD_D), out + '.tmp.mp4'])
    os.rename(out + '.tmp.mp4', out)


if __name__ == '__main__':
    make_card()
    what = sys.argv[1]
    if what == 'old':
        old('shorts_fridge.mp4', 'final_fridge.mp4')
        old('shorts_plate.mp4', 'final_plate.mp4')
    else:
        scene(what, sys.argv[2])
    print('ok', what)
