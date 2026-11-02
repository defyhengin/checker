"""«Мама прислала фото»: on my empty table the phone lights up — Mum sent a photo of her dinner (soup, pies, salad) and «Приезжай».
I answer «Еду.».
MODE=photo:  p0 — Mum's table (checked cloth, borscht, a plate of pies, salad, bread), daylight, square 1080×1080 (used in the chat and full-frame)
MODE=stills: m1 my evening table: empty plate + phone with the notification; m2 phone close (chat with photo + «Приезжай»);
             m4 same with my reply «Еду.»
Run: EP_OUT=ep_mom MODE=photo  BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_mom.py x 24 1080 1080
     python3 gen_mom_tex.py
     EP_OUT=ep_mom MODE=stills BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_mom.py x 24 1080 1920"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_mom')
from bkit import *
from pelmen import deep_bowl, water
MODE = os.environ.get('MODE', 'stills')
WANT = [x for x in os.environ.get('SHOTS', '').split(',') if x]
want = lambda n: not WANT or n in WANT
rng = np.random.default_rng(5)
Y = 0.767

# ================= Mum's table (group 'mum') =================
cloth = box((TXc - 0.62, 0.76, TZc - 0.42), (TXc + 0.62, Y, TZc + 0.42), M_CHECK, 'mum', False)
# borscht
M_SBOWL = simple_mat('m_bowl', (0.85, 0.84, 0.8), 0.35)
M_BORSCHT = noise_mat('borscht', (0.28, 0.01, 0.02), (0.42, 0.03, 0.03), 0.15, 18)
M_SMET = simple_mat('smetana', (0.95, 0.93, 0.88), 0.5)
M_DILL = simple_mat('dill', (0.15, 0.45, 0.1), 0.6)
SB = (TXc - 0.05, Y, TZc + 0.02)
deep_bowl(SB, M_SBOWL, 'mum')
water((SB[0], SB[1] + 0.062, SB[2]), 0.1, M_BORSCHT, 'mum')
ellip((SB[0] + 0.015, SB[1] + 0.066, SB[2] - 0.01), (0.03, 0.008, 0.026), M_SMET, 'mum', 2)
for i in range(7):
    ellip((SB[0] + rng.uniform(-0.06, 0.06), SB[1] + 0.064, SB[2] + rng.uniform(-0.06, 0.06)), (0.008, 0.002, 0.003), M_DILL, 'mum', 1,
          (0, 0, rng.uniform(0, 3)))
M_SPOON = simple_mat('m_spoon', (0.78, 0.78, 0.8), 0.25, 1.0)
box((SB[0] + 0.15, Y, SB[2] - 0.08), (SB[0] + 0.164, Y + 0.006, SB[2] + 0.07), M_SPOON, 'mum')
ellip((SB[0] + 0.157, Y + 0.006, SB[2] - 0.1), (0.018, 0.005, 0.026), M_SPOON, 'mum', 2)
# pies on a plate
M_PIE = noise_mat('pie', (0.72, 0.42, 0.12), (0.88, 0.6, 0.25), 0.45, 30)
PP = (TXc + 0.24, Y, TZc + 0.14)
plate(PP, 'mum', 0.15)
for i, (dx, dz, a) in enumerate(((-0.05, -0.04, 0.3), (0.05, -0.045, -0.2), (-0.055, 0.05, -0.4), (0.055, 0.05, 0.25), (0.0, 0.0, 1.2))):
    ellip((PP[0] + dx, Y + 0.035 + (0.02 if i == 4 else 0), PP[2] + dz), (0.05, 0.026, 0.03), M_PIE, 'mum', 2, (0, 0, a))
# salad
M_SAL = simple_mat('s_bowl', (0.3, 0.55, 0.42), 0.35)
M_CUC = simple_mat('cucumber', (0.3, 0.6, 0.18), 0.5)
M_TOM = simple_mat('tomato', (0.8, 0.12, 0.08), 0.35)
M_LEAF = simple_mat('leaf', (0.4, 0.7, 0.2), 0.6)
SL = (TXc + 0.24, Y, TZc - 0.16)
deep_bowl(SL, M_SAL, 'mum', 0.085, 0.055)
for i in range(26):
    a = rng.uniform(0, 2 * math.pi); r = rng.uniform(0, 0.065)
    m = (M_CUC, M_TOM, M_LEAF)[i % 3]
    ellip((SL[0] + r * math.cos(a), Y + 0.05 + rng.uniform(0, 0.015), SL[2] + r * math.sin(a)), (0.018, 0.008, 0.014), m, 'mum', 1, (0, 0, a))
# bread
M_BREAD = noise_mat('bread', (0.85, 0.75, 0.55), (0.95, 0.88, 0.7), 0.6, 30)
M_CRUST = simple_mat('crust', (0.55, 0.3, 0.1), 0.6)
BR = (TXc - 0.27, Y, TZc - 0.16)
plate(BR, 'mum', 0.11)
for k in range(3):
    box((BR[0] - 0.05 + k * 0.03, Y + 0.016, BR[2] - 0.05), (BR[0] - 0.03 + k * 0.03, Y + 0.09, BR[2] + 0.05), M_CRUST, 'mum')
    box((BR[0] - 0.048 + k * 0.03, Y + 0.018, BR[2] - 0.047), (BR[0] - 0.026 + k * 0.03, Y + 0.088, BR[2] + 0.047), M_BREAD, 'mum')
# a cup of tea
M_CUP = simple_mat('cup', (0.85, 0.82, 0.75), 0.35)
M_TEA = simple_mat('tea', (0.35, 0.15, 0.05), 0.1)
CP = (TXc - 0.26, Y, TZc + 0.17)
grp_add('mum', cyl(CP, 0.045, 0.08, M_CUP)); grp_add('mum', cyl((CP[0], Y + 0.07, CP[2]), 0.04, 0.012, M_TEA))

# ================= my table (groups 'mine', 'phone') =================
MP = (TXc, 0.762, TZc - 0.26)
plate(MP, 'mine', 0.12)
M_FORK = simple_mat('fork', (0.75, 0.75, 0.77), 0.25, 1.0)
box((MP[0] - 0.165, MP[1], MP[2] - 0.08), (MP[0] - 0.152, MP[1] + 0.005, MP[2] + 0.08), M_FORK, 'mine')

light('day', 'AREA', (TXc + 0.3, 2.3, TZc + 0.8), 60, (1.0, 0.95, 0.88), 2.0, (-0.2, -1, -0.5))
light('warm', 'AREA', (1.2, 2.3, 1.9), 30, (1.0, 0.8, 0.58), 1.8, (0.6, -1, -0.4))
EVE = ((0.06, 0.055, 0.055), 1.1)
DAY = ((0.55, 0.6, 0.7), 1.0)
L = ['pend', 'ceilsoft', 'fill', 'win', 'warm']

if MODE == 'photo':
    sc.view_settings.look = 'AgX - Medium High Contrast'
    state(['mum'], ['day', 'ceilsoft', 'win', 'fill'], world=DAY, exp=-0.45)
    cam((TXc - 0.02, 1.42, TZc - 0.5), (TXc + 0.0, 0.76, TZc + 0.06), 0.34)
    shoot(os.path.join(OUT, 'p0.png'))
else:
    M_OFF = simple_mat('scr_off', (0.02, 0.02, 0.025), 0.15)
    M_N = tex_mat('ph_mom_n', 'phone_mom_n.png', 'top', 0.9, emit=1.8)
    M_1 = tex_mat('ph_mom_1', 'phone_mom_1.png', 'top', 0.9, emit=1.8)
    M_2 = tex_mat('ph_mom_2', 'phone_mom_2.png', 'top', 0.9, emit=1.8)
    if want('m1'):
        state(['mine', 'phone'], L, world=EVE, exp=0.0, phone=M_N)
        cam((PH[0] - 0.04, 1.2, PH[2] - 0.42), (PH[0] - 0.04, 0.76, PH[2] - 0.02), 0.38)
        print('PH', screen_pos(np.array(PH)), 'MP', screen_pos(np.array(MP)), PH, MP)
        shoot(os.path.join(OUT, 'm1.png'))
    for nm, mt in (('m2', M_1), ('m4', M_2)):
        if want(nm):
            state(['mine', 'phone'], L, world=EVE, exp=-0.2, phone=mt)
            cam((PH[0] - 0.005, 0.99, PH[2] - 0.045), (PH[0], 0.765, PH[2] + 0.004), 0.36)
            shoot(os.path.join(OUT, f'{nm}.png'))
print('all done')
