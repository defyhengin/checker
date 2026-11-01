"""Convert the fast-engine studio scene to Blender and render one view with Cycles."""
import os, sys, time, math
import numpy as np
os.environ.setdefault('ENG_W', '1280'); os.environ.setdefault('ENG_H', '720'); os.environ.setdefault('ENG_TANY', '0.5')
import bpy
from mathutils import Vector, Matrix
from PIL import Image
import studio, apt

HERE = os.path.dirname(os.path.abspath(__file__))
VIEW = sys.argv[1] if len(sys.argv) > 1 else 'v1_vhod'
SAMPLES = int(sys.argv[2]) if len(sys.argv) > 2 else 32
RX, RY = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (1280, 720)


def P(v):
    """engine (x, y-up, z) -> blender (x, -z, y)"""
    return Vector((v[0], -v[2], v[1]))


bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
cy = sc.cycles
cy.device = 'CPU'; cy.samples = SAMPLES; cy.use_adaptive_sampling = True; cy.adaptive_threshold = 0.05
cy.use_denoising = True; cy.max_bounces = 4; cy.diffuse_bounces = 3; cy.glossy_bounces = 2; cy.transmission_bounces = 2
cy.caustics_reflective = False; cy.caustics_refractive = False
try:
    cy.use_light_tree = True
except Exception:
    pass
sc.render.resolution_x, sc.render.resolution_y = RX, RY
ENGINE = os.environ.get('BL_ENGINE', 'CYCLES')
if ENGINE == 'EEVEE':
    sc.render.engine = 'BLENDER_EEVEE'
    ee = sc.eevee
    for k, v in dict(taa_render_samples=int(os.environ.get('EV_SAMPLES', '32')), use_raytracing=os.environ.get('EV_RT','0')=='1', use_shadows=True, fast_gi_method='GLOBAL_ILLUMINATION').items():
        try: setattr(ee, k, v)
        except Exception as e: print('eevee opt', k, e)
try:
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - High Contrast'; sc.view_settings.exposure = -0.4
except Exception:
    pass
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.02, 0.025, 0.04, 1)
w.node_tree.nodes['Background'].inputs[1].default_value = float(os.environ.get('WORLD_STR', '0.15'))

# ---------------- materials ----------------
NAMES = {v: k for k, v in apt.M.items()}
MATS = {}


def make_window_image():
    n = 256
    u, v = np.meshgrid(np.linspace(0, 1, n), np.linspace(0, 1, n))
    X = studio.WIN[0] + u * (studio.WIN[1] - studio.WIN[0]); Y = studio.WIN[2] + v * (studio.WIN[3] - studio.WIN[2])
    col = studio.window_emit(X.ravel(), Y.ravel(), np.zeros(n * n), 0).reshape(n, n, 3)
    img = bpy.data.images.new('win', n, n)
    rgba = np.concatenate([np.clip(col, 0, 1), np.ones((n, n, 1))], -1).astype(np.float32)
    img.pixels = rgba.ravel()
    return img


def brick_mat(name, c1, c2, mortar, scale, w_ratio, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    br = nt.nodes.new('ShaderNodeTexBrick')
    br.inputs['Color1'].default_value = (*c1, 1); br.inputs['Color2'].default_value = (*c2, 1)
    br.inputs['Mortar'].default_value = (*mortar, 1); br.inputs['Scale'].default_value = scale
    br.inputs['Mortar Size'].default_value = 0.01; br.inputs['Brick Width'].default_value = w_ratio; br.inputs['Row Height'].default_value = 0.25 if w_ratio > 1 else 0.5
    br.offset = 0.5
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nt.links.new(tc.outputs['Object'], br.inputs['Vector'])
    nt.links.new(br.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough
    return m


def material(mid):
    if mid in MATS:
        return MATS[mid]
    name = NAMES.get(mid, f'm{mid}')
    col = tuple(float(c) for c in apt.ALB[mid]); spec = float(apt.SPEC[mid])
    if name == 's_floor':
        m = brick_mat(name, (0.42, 0.25, 0.12), (0.55, 0.34, 0.18), (0.2, 0.12, 0.06), 3.2, 5.0, 0.45)
    elif name in ('s_tile', 's_splash'):
        m = brick_mat(name, (0.82, 0.85, 0.86), (0.78, 0.81, 0.83), (0.45, 0.45, 0.45), 2.5 if name == 's_tile' else 5.0, 1.0, 0.15)
    else:
        m = bpy.data.materials.new(name); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']
        b.inputs['Base Color'].default_value = (*col, 1)
        rough = float(np.clip(0.75 - spec * 0.45, 0.06, 0.9))
        metal = 1.0 if name in ('f_steel', 'f_copper', 'f_mirror') else 0.0
        if name == 'f_mirror':
            rough = 0.03
        b.inputs['Roughness'].default_value = rough
        b.inputs['Metallic'].default_value = metal
        if name == 's_win':
            img = make_window_image()
            nt = m.node_tree; tex = nt.nodes.new('ShaderNodeTexImage'); tex.image = img; tex.extension = 'EXTEND'
            tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); cmb = nt.nodes.new('ShaderNodeCombineXYZ')
            nt.links.new(tc.outputs['Generated'], sep.inputs[0])
            nt.links.new(sep.outputs['X'], cmb.inputs['X']); nt.links.new(sep.outputs['Z'], cmb.inputs['Y'])
            nt.links.new(cmb.outputs[0], tex.inputs['Vector'])
            nt.links.new(tex.outputs['Color'], b.inputs['Emission Color'])
            b.inputs['Emission Strength'].default_value = 3.0
            b.inputs['Base Color'].default_value = (0, 0, 0, 1)
        if name == 's_lamp':
            b.inputs['Emission Color'].default_value = (1.0, 0.85, 0.6, 1); b.inputs['Emission Strength'].default_value = 3
        if name == 'f_screen_f':
            b.inputs['Roughness'].default_value = 0.08
    MATS[mid] = m
    return m


# ---------------- geometry ----------------
BIG = 1.2   # boxes larger than this (walls, floor) get no bevel
coll = bpy.data.collections.new('studio'); sc.collection.children.link(coll)


def link(o):
    for c in o.users_collection:
        c.objects.unlink(o)
    coll.objects.link(o)


def add_box(a, b, mid, yaw=0.0, pivot=None):
    a = np.array(a, float); b = np.array(b, float)
    size = b - a; c = (a + b) / 2
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object
    o.scale = (size[0], size[2], size[1])
    o.location = P(c)
    if yaw:
        piv = P((pivot[0], 0, pivot[1])); rel = o.location - piv
        o.location = piv + Matrix.Rotation(yaw, 3, 'Z') @ rel; o.rotation_euler = (0, 0, yaw)
    if max(size) < BIG and min(size) > 0.012:
        md = o.modifiers.new('b', 'BEVEL'); md.width = min(0.006, min(size) * 0.25); md.segments = 2; md.limit_method = 'NONE'
    o.data.materials.append(material(mid)); link(o)


def add_cyl(cx, cz, r, y0, y1, mid):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=r, depth=max(y1 - y0, 1e-4), location=P((cx, (y0 + y1) / 2, cz)))
    o = bpy.context.object; bpy.ops.object.shade_smooth(); o.data.materials.append(material(mid)); link(o)


def add_disc(cx, cy_, cz, r, mid, axis='y'):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=r, depth=0.002, location=P((cx, cy_, cz)))
    o = bpy.context.object
    if axis == 'z':
        o.rotation_euler = (math.pi / 2, 0, 0)
    o.data.materials.append(material(mid)); link(o)


def add_sph(c, r, mid):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=r, location=P(c))
    o = bpy.context.object; bpy.ops.object.shade_smooth(); o.data.materials.append(material(mid)); link(o)


def add_cap(a, b, r, mid):
    A, Bv = P(a), P(b)
    d = Bv - A; L = d.length
    if L > 1e-5:
        bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=r, depth=L, location=(A + Bv) / 2)
        o = bpy.context.object
        o.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
        bpy.ops.object.shade_smooth(); o.data.materials.append(material(mid)); link(o)
    for p in (a, b):
        add_sph(p, r, mid)


def emit(prims):
    for p in prims:
        k = p['k']
        if k == 'grp':
            emit(p['items'])
        elif k == 'box':
            add_box(p['a'], p['b'], p['m'])
        elif k == 'obox':
            a = np.array(p['a']); b = np.array(p['b'])
            add_box((a[0] + p['p'][0], a[1], a[2] + p['p'][1]), (b[0] + p['p'][0], b[1], b[2] + p['p'][1]), p['m'], yaw=p['yaw'], pivot=p['p'])
        elif k == 'cyl':
            add_cyl(p['cx'], p['cz'], p['r'], p['y0'], p['y1'], p['mo'])
        elif k == 'disc':
            add_disc(p['cx'], p['cy'], p['cz'], p['r'], p['m'])
        elif k == 'zdisc':
            add_disc(p['cx'], p['cy'], p['cz'], p['r'], p['m'], 'z')
        elif k == 'sph':
            add_sph(p['c'], p['r'], p['m'])
        elif k == 'cap':
            add_cap(p['a'], p['b'], p['r'], p['m'])


cam_e, tgt_e = (1.25, 0.32, 0.75), (1.85, 0.4, 1.4)
S = studio.scene(cam_e, tgt_e)
t0 = time.time()
emit(S['prims'])
print('objects', len(coll.objects), 'build', round(time.time() - t0, 1), 's', flush=True)


# ================= «Кот» =================
FPS = 12
DUR = 11.5
TX, TZ = studio.TABLE
CAT = np.array((1.85, 0.0, 1.4)); BOWL = np.array((1.55, 0.0, 1.22))
PLATE = np.array((TX - 0.05, 0.77, TZ - 0.12))
C_A = np.array((1.2, 0.3, 0.72)); L_A = np.array((1.75, 0.3, 1.36))
C_B = np.array((1.22, 1.22, 1.72)); L_B = PLATE
C_A2 = np.array((1.12, 0.36, 0.62)); L_A2 = np.array((1.72, 0.3, 1.34))
T1, T2, T3, T4 = 3.2, 5.0, 7.0, 8.4
T_LOOK0, T_LOOK1 = 8.2, 9.0
BLINKS = (1.9, 10.0)

# few windows lit, evening
lit = studio._LIT.copy()
img = bpy.data.images['win']


def simple_mat(name, col, rough=0.5, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m


M_FUR = simple_mat('cat_fur', (0.62, 0.3, 0.09), 0.85)
M_FUR2 = simple_mat('cat_fur2', (0.9, 0.78, 0.6), 0.85)
M_EYE = simple_mat('cat_eye', (0.6, 0.8, 0.2), 0.2, emit=(0.55, 0.85, 0.2), es=2.5)
M_PUP = simple_mat('cat_pupil', (0.01, 0.01, 0.01), 0.1)
M_NOSE = simple_mat('cat_nose', (0.75, 0.35, 0.38), 0.5)
M_BOWL = simple_mat('bowl', (0.75, 0.76, 0.78), 0.25, 1.0)
M_PLATE = simple_mat('plate', (0.92, 0.91, 0.88), 0.2)
M_CRUMB = simple_mat('crumb', (0.55, 0.36, 0.17), 0.8)


def obj_link(o):
    for c in o.users_collection:
        c.objects.unlink(o)
    coll.objects.link(o)


def lp_sphere(loc, scale, m, parent, seg=8, ring=6):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=1, location=(0, 0, 0))
    o = bpy.context.object; o.scale = scale; o.location = loc
    o.data.materials.append(m); obj_link(o); o.parent = parent
    return o


def lp_cone(loc, r, d, rot, m, parent):
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=r, radius2=0.0, depth=d)
    o = bpy.context.object; o.location = loc; o.rotation_euler = rot
    o.data.materials.append(m); obj_link(o); o.parent = parent
    return o


def lp_cyl(loc, r, d, m, parent):
    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=r, depth=d)
    o = bpy.context.object; o.location = loc
    o.data.materials.append(m); obj_link(o); o.parent = parent
    return o


# ---- cat (local frame: faces +X, Z up), parented to empties
cat = bpy.data.objects.new('cat', None); coll.objects.link(cat); cat.location = P(CAT)
dcam = P(C_A) - P(CAT); cat.rotation_euler = (0, 0, math.atan2(dcam.y, dcam.x) - math.radians(15))
lp_sphere((-0.03, 0, 0.12), (0.17, 0.15, 0.13), M_FUR, cat)
lp_sphere((0.04, 0, 0.24), (0.11, 0.115, 0.16), M_FUR, cat)
lp_sphere((0.1, 0, 0.24), (0.05, 0.08, 0.1), M_FUR2, cat)
for sy in (-1, 1):
    lp_cyl((0.09, sy * 0.045, 0.11), 0.026, 0.22, M_FUR, cat)
    lp_sphere((0.11, sy * 0.045, 0.02), (0.035, 0.03, 0.022), M_FUR2, cat)
    lp_sphere((-0.02, sy * 0.13, 0.08), (0.08, 0.04, 0.07), M_FUR, cat)
neck = bpy.data.objects.new('neck', None); coll.objects.link(neck); neck.parent = cat; neck.location = (0.05, 0, 0.36)
lp_sphere((0.02, 0, 0.06), (0.09, 0.095, 0.08), M_FUR, neck)
lp_sphere((0.085, 0, 0.035), (0.045, 0.055, 0.035), M_FUR2, neck)
lp_sphere((0.128, 0, 0.05), (0.01, 0.013, 0.009), M_NOSE, neck)
EYES = []
for sy in (-1, 1):
    lp_cone((0.0, sy * 0.055, 0.135), 0.04, 0.08, (sy * -0.25, 0, 0.78), M_FUR, neck)
    e = lp_sphere((0.088, sy * 0.036, 0.075), (0.012, 0.019, 0.019), M_EYE, neck); EYES.append(e)
    p = lp_sphere((0.099, sy * 0.036, 0.075), (0.004, 0.005, 0.015), M_PUP, neck); EYES.append(p)
lids = [(o, tuple(o.scale)) for o in EYES]

# tail: a bevelled poly curve, rebuilt per frame
cdata = bpy.data.curves.new('tail', 'CURVE'); cdata.dimensions = '3D'; cdata.bevel_depth = 0.022; cdata.bevel_resolution = 1
spl = cdata.splines.new('POLY'); spl.points.add(9)
tail = bpy.data.objects.new('tail', cdata); tail.data.materials.append(M_FUR); coll.objects.link(tail); tail.parent = cat


def set_tail(sway):
    for i, pt in enumerate(spl.points):
        s = i / 9
        ang = math.radians(170) + s * math.radians(115) + sway * s * s
        r = 0.17 + 0.04 * s
        z = 0.05 - 0.02 * s + (0.05 * s * s if sway > 0 else 0.0) + 0.04 * max(0, sway) * s ** 3
        pt.co = (r * math.cos(ang) - 0.02, r * math.sin(ang), max(z, 0.022), 1.0)
        pt.radius = 1.0 - 0.6 * s


# ---- bowl and plate
def mesh_cyl(c_eng, r, h, m, verts=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=P((c_eng[0], c_eng[1] + h / 2, c_eng[2])))
    o = bpy.context.object; o.data.materials.append(m); obj_link(o); return o


mesh_cyl(BOWL, 0.085, 0.045, M_BOWL); mesh_cyl(BOWL + (0, 0.008, 0), 0.068, 0.04, simple_mat('bowl_in', (0.25, 0.26, 0.28), 0.3, 1.0))
mesh_cyl(PLATE, 0.13, 0.014, M_PLATE, 32); mesh_cyl(PLATE + (0, 0.004, 0), 0.09, 0.012, M_PLATE, 32)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.006, location=P(PLATE + (0.03, 0.02, -0.02)))
bpy.context.object.data.materials.append(M_CRUMB); obj_link(bpy.context.object)


def add_light(kind, pos, energy, col, size=0.05, direction=None, spot=None):
    ld = bpy.data.lights.new('L', kind); ld.energy = energy; ld.color = col; ld.shadow_soft_size = size
    if kind == 'SPOT' and spot:
        ld.spot_size = spot; ld.spot_blend = 0.6
    if kind == 'AREA':
        ld.size = size
    o = bpy.data.objects.new('L', ld); coll.objects.link(o); o.location = P(pos)
    if direction is not None:
        o.rotation_euler = P(direction).to_track_quat('-Z', 'Y').to_euler()
    return o


add_light('SPOT', (TX, 1.54, TZ), 75, (1.0, 0.72, 0.42), 0.05, (0, -1, 0), math.radians(110))
add_light('AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 22, (0.35, 0.45, 0.95), 1.4, (0, 0, -1))
add_light('POINT', (1.5, 0.75, 0.95), 5, (1.0, 0.7, 0.45), 0.15)
for m in bpy.data.materials:
    if m.name.startswith('s_lamp'):
        m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 4.0

cd = bpy.data.cameras.new('C'); cd.sensor_fit = 'VERTICAL'; cd.angle_y = 2 * math.atan(0.55); cd.clip_start = 0.03
co = bpy.data.objects.new('C', cd); coll.objects.link(co); sc.camera = co


def sstep(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


def lerp(a, b, s):
    return a + (b - a) * s


def cam_state(t):
    if t < T1:
        return C_A, L_A
    if t < T2:
        u = (t - T1) / (T2 - T1); sy = sstep(u * 1.8); sz = sstep(u * 1.6 - 0.6)
        pos = np.array((lerp(C_A[0], C_B[0], sz), lerp(C_A[1], C_B[1], sy), lerp(C_A[2], C_B[2], sz)))
        return pos, lerp(L_A, L_B, sstep(u))
    if t < T3:
        return C_B, L_B
    if t < T4:
        u = (t - T3) / (T4 - T3); sz = sstep(u * 1.6); sy = sstep(u * 1.8 - 0.8)
        pos = np.array((lerp(C_B[0], C_A2[0], sz), lerp(C_B[1], C_A2[1], sy), lerp(C_B[2], C_A2[2], sz)))
        return pos, lerp(L_B, L_A2, sstep(u))
    return C_A2, L_A2


# head: looking down at the bowl, later up at the camera
def head_pose(t):
    s = sstep((t - T_LOOK0) / (T_LOOK1 - T_LOOK0))
    yaw = lerp(math.radians(40), math.radians(-6), s)
    pitch = lerp(math.radians(38), math.radians(-8), s)
    return yaw, pitch


def blink(t):
    for b in BLINKS:
        k = (t - b) * FPS
        if 0 <= k < 3:
            return [0.35, 0.08, 0.4][int(k)]
    return 1.0


def sway(t):
    return 0.45 * math.sin(2 * math.pi * t / 2.5)


def cat_visible(t):
    return t < T1 + 1.0 or t > T3 - 0.4


def frame_key(fi):
    t = fi / FPS
    pos, look = cam_state(t)
    k = '_'.join(f'{v:.4f}' for v in np.concatenate([pos, look]))
    if cat_visible(t):
        y, p = head_pose(t)
        k += f'_{y:.3f}_{p:.3f}_{blink(t):.2f}_{(fi % 30) if True else 0}'
    return k


def render_at(t, path):
    pos, look = cam_state(t)
    co.location = P(pos); co.rotation_euler = (P(look) - P(pos)).to_track_quat('-Z', 'Y').to_euler()
    y, p = head_pose(t); neck.rotation_euler = (0, p, y)
    bl = blink(t)
    for o, sc0 in lids:
        o.scale = (sc0[0], sc0[1], sc0[2] * bl)
    fi = int(round(t * FPS)); set_tail(sway((fi % 30) / FPS))
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


MODE = os.environ.get('OKNA_MODE', 'preview')
if MODE == 'keys':
    import json
    NF = int(DUR * FPS); u = {}
    for fi in range(NF):
        u.setdefault(frame_key(fi), fi)
    os.makedirs(os.path.join(HERE, 'cat'), exist_ok=True)
    json.dump(list(u), open(os.path.join(HERE, 'cat', 'old_keys.json'), 'w')); print('keys saved', len(u)); sys.exit(0)
OD = os.path.join(HERE, 'cat'); os.makedirs(OD, exist_ok=True)
if MODE == 'preview':
    for ts_ in os.environ.get('OKNA_T', '0.5,6,10').split(','):
        t1 = time.time(); render_at(float(ts_), os.path.join(HERE, f'cat_prev_{ts_}.png')); print('prev', ts_, round(time.time() - t1, 1), flush=True)
else:
    NF = int(DUR * FPS)
    keys = [frame_key(fi) for fi in range(NF)]
    uniq = {}
    for fi, k in enumerate(keys):
        uniq.setdefault(k, fi)
    print('unique renders', len(uniq), 'of', NF, flush=True)
    import hashlib, json
    names = {k: 'h_' + hashlib.md5(k.encode()).hexdigest()[:14] + '.png' for k in uniq}
    old = os.path.join(OD, 'old_keys.json')
    if os.path.exists(old):
        for i, k in enumerate(json.load(open(old))):
            src = os.path.join(OD, f'u_{i:04d}.png'); dst = os.path.join(OD, 'h_' + hashlib.md5(k.encode()).hexdigest()[:14] + '.png')
            if os.path.exists(src) and not os.path.exists(dst):
                os.rename(src, dst)
        os.remove(old)
    t1 = time.time()
    for i, (k, fi) in enumerate(uniq.items()):
        p = os.path.join(OD, names[k])
        if not os.path.exists(p):
            render_at(fi / FPS, p)
        if i % 10 == 0:
            print('done', i, round(time.time() - t1), flush=True)
    for fi, k in enumerate(keys):
        dst = os.path.join(OD, f'f_{fi:04d}.png')
        if os.path.exists(dst):
            os.remove(dst)
        os.link(os.path.join(OD, names[k]), dst)
    print('render done', round(time.time() - t1), flush=True)
