import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_catfish')
from bkit import *
MODE = os.environ.get('MODE', 'stills')
# morning window + sun
_d = bpy.data.images.load(os.path.join(HERE, 'dawn_tex.png')); bpy.data.images['win'].pixels.foreach_set(np.array(_d.pixels[:], np.float32)); bpy.data.images['win'].update()
_sun = bpy.data.lights.new('sun', 'SUN'); _sun.energy = 2.5; _sun.color = (1.0, 0.75, 0.5); _sun.angle = math.radians(3)
SUN = bpy.data.objects.new('sun', _sun); coll.objects.link(SUN); SUN.rotation_euler = P(np.array((-0.2, -0.45, -1.0))).to_track_quat('-Z', 'Y').to_euler()
light('mwin', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 80, (1.0, 0.75, 0.52), 1.5, (0, 0, -1))
light('hall', 'AREA', (0.9, 2.4, 1.0), 25, (1.0, 0.86, 0.7), 1.6, (0, -1, 0))
MORN = ((0.3, 0.27, 0.25), 0.9)
M_RUG = noise_mat('rug2', (0.45, 0.22, 0.18), (0.55, 0.3, 0.22), 0.95, 60)
box((0.3, 0.0, 0.25), (1.0, 0.012, 0.7), M_RUG, 'rug', False)
# fish lying on its side on the rug
M_FISH = noise_mat('fish', (0.55, 0.6, 0.66), (0.75, 0.78, 0.82), 0.3, 30)
M_FISHD = simple_mat('fishd', (0.3, 0.35, 0.42), 0.35, 0.3)
FP = np.array((0.58, 0.012, 0.47))
ellip(FP + (0, 0.022, 0), (0.11, 0.022, 0.036), M_FISH, 'fish', 3, (0, 0, math.radians(-15)))
ellip(FP + (0.0, 0.03, -0.005), (0.08, 0.014, 0.012), M_FISHD, 'fish', 2, (0, 0, math.radians(-15)))
bpy.ops.mesh.primitive_cone_add(vertices=3, radius1=0.04, radius2=0.0, depth=0.06, location=P(FP + (-0.125, 0.022, 0.034)))
o = bpy.context.object; o.rotation_euler = (math.radians(90), 0, math.radians(75)); o.scale = (1, 0.25, 1); o.data.materials.append(M_FISHD); link(o); grp_add('fish', o)
ellip(FP + (0.085, 0.042, -0.025), (0.008, 0.004, 0.008), simple_mat('fisheye', (0.02, 0.02, 0.02), 0.1), 'fish', 2)
CATP = np.array((0.9, 0.012, 0.55))
EYEP = np.array((0.85, 1.5, 1.65))
kitty = Cat(CATP, yaw_to(CATP, (EYEP[0], 0, EYEP[2]), -10))
A_CAM = kitty.look_angles(EYEP)
if MODE == 'stills':
    state(['rug', 'fish', 'cat'], ['mwin', 'hall'], world=MORN)
    kitty.head(*A_CAM); kitty.tail(0.2)
    cam((0.72, 0.42, 0.95), FP + (0, 0.02, 0)); shoot(os.path.join(OUT, 'f1.png'))
else:
    D = os.path.join(OUT, 'cat'); os.makedirs(D, exist_ok=True)
    state(['rug', 'fish', 'cat'], ['mwin', 'hall'], world=MORN)
    cam(EYEP, (0.75, 0.18, 0.52))
    for fi in range(60):
        kitty.head(A_CAM[0], A_CAM[1] + 0.03 * math.sin(2 * math.pi * fi / 60)); kitty.tail(0.4 * math.sin(2 * math.pi * fi / 30))
        kitty.blink([1, 0.4, 0.08, 0.4][fi - 40] if 40 <= fi < 44 else 1.0)
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
