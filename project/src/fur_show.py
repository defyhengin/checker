import os, sys, time
os.environ['ENG_W'] = sys.argv[1] if len(sys.argv) > 1 else '1280'
os.environ['ENG_H'] = sys.argv[2] if len(sys.argv) > 2 else '720'
os.environ['ENG_TANY'] = '0.175'
import numpy as np
from PIL import Image
import eng, apt
from eng import box, f32
import furniture as F

# catalogue layout: groups on a grey floor, fronts facing -z (towards the camera)
L = [
    # kitchen row (back)
    (F.fridge, -4.6, 3.2), (F.base_cabinet, -3.85, 3.15), (F.sink_cabinet, -3.2, 3.15), (F.stove, -2.55, 3.15),
    (F.wall_cabinet, -3.85, 3.28), (F.range_hood, -2.55, 3.2), (F.microwave, -3.85, 3.15), (F.kettle, -2.69, 3.02), (F.pot, -2.41, 3.29),
    # bedroom (back right)
    (F.bed, 2.6, 3.0), (F.nightstand, 3.75, 3.6), (F.wardrobe, 4.8, 3.45), (F.bookshelf, 1.3, 3.55),
    # living (middle)
    (lambda: F.sofa(3, 'sofa_g'), -0.3, 1.2), (lambda: F.sofa(2, 'sofa_r'), 1.9, 1.0), (F.coffee_table, 0.4, 0.15), (F.rug, 0.4, 0.2),
    (F.tv_stand, -2.6, 0.9), (F.floor_lamp, 3.2, 1.2), (F.plant, -1.45, 1.4),
    # dining + work (front left)
    (F.dining_table, -3.6, -1.2), (F.chair, -3.6, -1.75), (F.chair, -4.45, -1.2), (F.desk, -1.3, -1.3), (F.office_chair, -1.3, -1.95),
    # bathroom (front right)
    (F.bathtub, 4.6, -0.9), (F.toilet, 2.4, -1.5), (F.bath_sink, 3.25, -1.25), (F.washer, 1.55, -1.5),
]
ROT = {id(L[2 - 2][0]): 0}
EXTRA_ROT = {F.bathtub: 1}


def build():
    prims = [box((-30, -0.02, -30), (30, 0.0, 30), apt.M['floor'])]
    for fn, x, z in L:
        parts = fn()
        y_off = {F.microwave: 0.9, F.kettle: 0.92, F.pot: 0.92}.get(fn, 0.0)
        if y_off:
            parts = [(p[0],) + tuple(((q[0], q[1] + y_off, q[2]) if isinstance(q, tuple) and len(q) == 3 else q) for q in p[1:]) if p[0] in ('box', 'sph', 'cap') else
                     (p[:4] + (p[4] + y_off, p[5] + y_off) + p[6:] if p[0] == 'cyl' else (p[:2] + (p[2] + y_off,) + p[3:] if p[0] in ('disc', 'zdisc') else p)) for p in parts]
        prims += F.place(parts, x, z, 1 if fn is F.bathtub else 0)
    return prims


def main():
    t0 = time.time()
    alb = apt.ALB.copy(); alb[apt.M['floor']] = (0.42, 0.44, 0.48)
    sc = dict(cam=(9.0, 14.0, -16.0), tgt=(0.1, 0.4, 1.0), prims=build(), alb=alb, spec=apt.SPEC, amb=0.32, exp=1.25,
              lights=[dict(p=(-12.0, 22.0, -16.0), col=(1.0, 0.97, 0.92), I=1.6, att=(1.0, 0.0)),
                      dict(p=(14.0, 10.0, 6.0), col=(0.6, 0.7, 0.9), I=0.35, att=(1.0, 0.0), shadow=False)], bg=0.4)
    img = eng.render(sc, 5.0)
    Image.fromarray(img).save(sys.argv[3] if len(sys.argv) > 3 else 'fur_show.png')
    print('time', round(time.time() - t0, 1))


main()
