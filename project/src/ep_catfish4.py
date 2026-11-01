"""«Кот принёс ужин» v3 (cheap & smooth): one large still with the fish and the cat looking at the camera (+ a blink still).
The camera glide is done in montage (ep_catfish4_edit.py). Scene (fish, cat, light) comes from ep_catfish2.py.
Run: EP_OUT=ep_catfish4 BL_ENGINE=EEVEE EV_SAMPLES=24 WORLD_STR=1.0 python3 ep_catfish4.py x 24 2400 1800"""
import os, sys, json
os.environ.setdefault('EP_OUT', 'ep_catfish4')
_src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ep_catfish2.py')).read()
exec(_src.split('# ---------------- one continuous camera path')[0])

POS, TGT, TANY = (1.05, 0.8, 1.45), (0.74, 0.14, 0.5), float(os.environ.get('TANY', '0.36'))
state(['rug', 'fish', 'cat'], ['mwin', 'hall'], world=MORN, exp=0.35)
kitty.head(*kitty.look_angles(np.array(POS))); kitty.tail(-0.9)
cam(POS, TGT, TANY)
info = {'fish': screen_pos(FP + np.array((0, 0.02, 0))), 'fish_head': screen_pos(np.array((L1 - 0.03, FP[1] + 0.03, FP[2]))),
        'cat_head': screen_pos(CATP + np.array((0.05, 0.42, 0))), 'cat_body': screen_pos(CATP + np.array((0, 0.2, 0)))}
json.dump(info, open(os.path.join(OUT, 'pos.json'), 'w')); print(info)
shoot(os.path.join(OUT, 'big.png'), force=True)
kitty.blink(0.08); shoot(os.path.join(OUT, 'big_blink.png'), force=True)
print('all done')
