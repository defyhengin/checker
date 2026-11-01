"""«Кот принёс ужин» v2: proper fish (fins attached, eye on the head) and ONE continuous camera move instead of cuts.
Run: EP_OUT=ep_catfish2 BL_ENGINE=EEVEE EV_SAMPLES=12 WORLD_STR=1.0 STEP=2 python3 ep_catfish2.py x 12 720 1280
(TEST=0,120,240 renders only those frames; existing frames are skipped, so a killed run can be resumed.)"""
import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_catfish2')
from bkit import *

DUR = float(os.environ.get('DUR', '15')); FPS_ = 24; STEP = int(os.environ.get('STEP', '2'))
# morning window + sun (as in v1)
_d = bpy.data.images.load(os.path.join(HERE, 'dawn_tex.png')); bpy.data.images['win'].pixels.foreach_set(np.array(_d.pixels[:], np.float32)); bpy.data.images['win'].update()
_sun = bpy.data.lights.new('sun', 'SUN'); _sun.energy = 2.5; _sun.color = (1.0, 0.75, 0.5); _sun.angle = math.radians(3)
SUN = bpy.data.objects.new('sun', _sun); coll.objects.link(SUN); SUN.rotation_euler = P(np.array((-0.2, -0.45, -1.0))).to_track_quat('-Z', 'Y').to_euler()
light('mwin', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 80, (1.0, 0.75, 0.52), 1.5, (0, 0, -1))
light('hall', 'AREA', (0.9, 2.4, 1.0), 25, (1.0, 0.86, 0.7), 1.6, (0, -1, 0))
MORN = ((0.3, 0.27, 0.25), 0.9)
M_RUG = noise_mat('rug2', (0.45, 0.22, 0.18), (0.55, 0.3, 0.22), 0.95, 60)
box((0.3, 0.0, 0.25), (1.0, 0.012, 0.7), M_RUG, 'rug', False)

# ---------------- the fish: one lofted body + attached tail / dorsal / pectoral fins + eye on the head ----------------
FP = np.array((0.58, 0.012, 0.47))     # centre on the rug; fish lies on its side, nose toward +x
L0, L1 = FP[0] - 0.115, FP[0] + 0.125   # body from tail root to nose (absolute x)


def prof(u):
    """half-width of the body at u in 0..1 (tail -> nose)"""
    return 0.074 * (max(u, 0.0) ** 0.62) * (max(1 - u, 0.0) ** 0.5) + 0.006 * (1 - u)


def hy(u):
    return 0.6 * prof(u) + 0.002


def fish_mesh(name, verts, faces, mat, solid=0.0):
    me = bpy.data.meshes.new(name); me.from_pydata([tuple(P(v)) for v in verts], [], faces); me.update()
    o = bpy.data.objects.new(name, me); coll.objects.link(o); o.data.materials.append(mat)
    for p in me.polygons:
        p.use_smooth = True
    if solid:
        md = o.modifiers.new('s', 'SOLIDIFY'); md.thickness = solid; md.offset = 0
    grp_add('fish', o); return o


M_FBODY = bpy.data.materials.new('fishbody'); M_FBODY.use_nodes = True
_nt = M_FBODY.node_tree; _b = _nt.nodes['Principled BSDF']; _b.inputs['Roughness'].default_value = 0.28
try:
    _b.inputs['Specular IOR Level'].default_value = 0.7
except Exception:
    pass
_tc = _nt.nodes.new('ShaderNodeTexCoord'); _sp = _nt.nodes.new('ShaderNodeSeparateXYZ'); _cr = _nt.nodes.new('ShaderNodeValToRGB')
_nt.links.new(_tc.outputs['Generated'], _sp.inputs[0]); _nt.links.new(_sp.outputs['Y'], _cr.inputs[0])       # blender Y == engine -z: dorsal edge ~ 0
_cr.color_ramp.elements[0].position = 0.0; _cr.color_ramp.elements[0].color = (0.10, 0.2, 0.33, 1)
_cr.color_ramp.elements[1].position = 1.0; _cr.color_ramp.elements[1].color = (0.9, 0.9, 0.88, 1)
_e = _cr.color_ramp.elements.new(0.35); _e.color = (0.62, 0.7, 0.76, 1)
_wv = _nt.nodes.new('ShaderNodeTexWave'); _wv.inputs['Scale'].default_value = 90; _wv.inputs['Distortion'].default_value = 3
_mx = _nt.nodes.new('ShaderNodeMix'); _mx.data_type = 'RGBA'; _mx.inputs[0].default_value = 0.12
_nt.links.new(_cr.outputs['Color'], _mx.inputs[6]); _nt.links.new(_wv.outputs['Color'], _mx.inputs[7]); _nt.links.new(_mx.outputs[2], _b.inputs['Base Color'])
M_FIN2 = simple_mat('fishfin', (0.22, 0.3, 0.4), 0.45)
M_EYEW = simple_mat('fisheye_w', (0.95, 0.95, 0.9), 0.15); M_EYEB = simple_mat('fisheye_b', (0.01, 0.01, 0.01), 0.05)

NU, NS = 28, 14
V = []; F = []
for i in range(NU + 1):
    u = i / NU; x = L0 + (L1 - L0) * u; w = prof(u); h = hy(u); yc = FP[1] + h
    for j in range(NS):
        a = 2 * math.pi * j / NS
        V.append((x, yc + h * math.sin(a), FP[2] + w * math.cos(a)))
for i in range(NU):
    for j in range(NS):
        a, b = i * NS + j, i * NS + (j + 1) % NS
        F.append((a, b, b + NS, a + NS))
V.append((L0 - 0.002, FP[1] + hy(0), FP[2])); V.append((L1 + 0.002, FP[1] + hy(1), FP[2]))
for j in range(NS):
    F.append((NU * NS + (j + 1) % NS, NU * NS + j, len(V) - 1)); F.append((j, (j + 1) % NS, len(V) - 2))
body = fish_mesh('fishbody', V, F, M_FBODY)
bpy.context.view_layer.update()
# tail fin: a fan whose root overlaps the peduncle, slightly curled up
yt = FP[1] + 0.006
fish_mesh('tail', [(L0 + 0.01, yt, FP[2] - 0.006), (L0 + 0.01, yt, FP[2] + 0.006), (L0 - 0.05, yt + 0.004, FP[2] + 0.052), (L0 - 0.075, yt + 0.006, FP[2] + 0.02),
                   (L0 - 0.075, yt + 0.006, FP[2] - 0.02), (L0 - 0.05, yt + 0.004, FP[2] - 0.052)], [(0, 1, 2), (0, 2, 3), (0, 3, 4), (0, 4, 5)], M_FIN2, 0.003)
# dorsal fin: on the +z (back) edge, base buried in the body
xm = L0 + (L1 - L0) * 0.5; wm = prof(0.5)
fish_mesh('dorsal', [(xm - 0.05, yt + 0.012, FP[2] + wm - 0.008), (xm + 0.035, yt + 0.012, FP[2] + wm - 0.008), (xm - 0.008, yt + 0.016, FP[2] + wm + 0.04)], [(0, 1, 2)], M_FIN2, 0.003)
# pectoral fin on the upper side behind the gill
xp = L0 + (L1 - L0) * 0.72
fish_mesh('pect', [(xp, FP[1] + 2 * hy(0.72) - 0.004, FP[2] - 0.004), (xp - 0.045, FP[1] + 2 * hy(0.72) - 0.006, FP[2] - 0.03), (xp - 0.02, FP[1] + 2 * hy(0.72) - 0.003, FP[2] - 0.045)], [(0, 1, 2)], M_FIN2, 0.003)
# eye: embedded in the head's upper side (top of body near the nose)
xe = L0 + (L1 - L0) * 0.86; ye = FP[1] + 2 * hy(0.86)
ellip((xe, ye - 0.003, FP[2] + 0.004), (0.0125, 0.0085, 0.0125), M_EYEW, 'fish', 2)
ellip((xe + 0.001, ye + 0.0035, FP[2] + 0.004), (0.0075, 0.0045, 0.0075), M_EYEB, 'fish', 2)
# mouth line and gill arc as thin dark slivers
ellip((L1 - 0.004, FP[1] + hy(0.99), FP[2] - 0.004), (0.006, 0.002, 0.0015), M_EYEB, 'fish', 1)
ellip((L0 + (L1 - L0) * 0.7, ye - 0.008, FP[2] + 0.002), (0.0015, 0.0012, 0.034), M_FIN2, 'fish', 1)

# ---------------- the cat ----------------
CATP = np.array((0.9, 0.012, 0.55))
EYEP = np.array((0.85, 1.5, 1.65))
kitty = Cat(CATP, yaw_to(CATP, (EYEP[0], 0, EYEP[2]), -10))

# ---------------- one continuous camera path ----------------
WP = [  # t, camera pos, target, tany
    (0.0, (1.55, 0.55, 2.0), (0.80, 0.42, 0.45), 0.60),
    (3.2, (1.1, 0.5, 1.3), (0.66, 0.05, 0.52), 0.50),
    (6.2, (0.5, 0.52, 0.8), (0.58, 0.03, 0.47), 0.38),
    (8.4, (0.72, 0.4, 0.72), (0.58, 0.03, 0.47), 0.38),
    (10.6, (1.05, 0.34, 1.20), (0.86, 0.26, 0.55), 0.50),
    (12.8, (0.95, 0.95, 1.55), (0.80, 0.28, 0.52), 0.56),
    (DUR, tuple(EYEP), (0.78, 0.2, 0.52), 0.62),
]


def hermite(t):
    ts = [w[0] for w in WP]
    k = max(0, min(len(WP) - 2, next((i for i in range(len(WP) - 1) if ts[i] <= t < ts[i + 1]), len(WP) - 2)))
    t0, t1 = ts[k], ts[k + 1]; u = (t - t0) / (t1 - t0)
    out = []
    for idx in (1, 2, 3):
        def val(i):
            return np.array(WP[i][idx], float)
        p0, p1 = val(k), val(k + 1)
        def tan(i):
            a, b = max(i - 1, 0), min(i + 1, len(WP) - 1)
            return (val(b) - val(a)) / (ts[b] - ts[a])
        m0, m1 = tan(k) * (t1 - t0), tan(k + 1) * (t1 - t0)
        h00, h10, h01, h11 = 2 * u ** 3 - 3 * u ** 2 + 1, u ** 3 - 2 * u ** 2 + u, -2 * u ** 3 + 3 * u ** 2, u ** 3 - u ** 2
        out.append(h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1)
    return out


def ss(a, b, t):
    x = min(max((t - a) / (b - a), 0), 1); return x * x * (3 - 2 * x)


D = os.path.join(OUT, 'mov'); os.makedirs(D, exist_ok=True)
N = int(DUR * FPS_)
FR = [int(x) for x in os.environ['TEST'].split(',')] if os.environ.get('TEST') else list(range(0, N + 1, STEP))
state(['rug', 'fish', 'cat'], ['mwin', 'hall'], world=MORN, exp=0.35)
BLINKS = (11.0, 13.6)
for fi in FR:
    path = os.path.join(D, f'f_{fi:04d}.png')
    if os.path.exists(path):
        continue
    t = fi / FPS_
    pos, tgt, tany = hermite(t)
    # head: first on the fish, then up to the camera
    a_f = kitty.look_angles(FP + np.array((0, 0.02, 0))); a_c = kitty.look_angles(pos)
    s = ss(7.6, 10.4, t)
    kitty.head(a_f[0] + (a_c[0] - a_f[0]) * s, a_f[1] + (a_c[1] - a_f[1]) * s + 0.02 * math.sin(2 * math.pi * t / 2.5))
    kitty.tail(0.35 * math.sin(2 * math.pi * t / 1.25) * (0.4 + 0.6 * ss(8, 12, t)))
    bl = [1, 0.4, 0.08, 0.4]; k = int(round((t - BLINKS[0]) * FPS_)); k2 = int(round((t - BLINKS[1]) * FPS_))
    kitty.blink(bl[k] if 0 <= k < 4 else (bl[k2] if 0 <= k2 < 4 else 1.0))
    cam(pos, tgt, float(tany))
    shoot(path, force=True)
print('frames', len(FR))
