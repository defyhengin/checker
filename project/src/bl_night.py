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


cam_e, tgt_e = (-1.3, 1.0, 4.0), (2.4, 0.9, 1.5)
S = studio.scene(cam_e, tgt_e)
t0 = time.time()
emit(S['prims'])
print('objects', len(coll.objects), 'build', round(time.time() - t0, 1), 's', flush=True)


# ================= «Ночной холодильник» =================
FPS = 12
DUR = 14.5
T_OPEN0, T_OPEN1 = 0.6, 2.4
T_WALK0, T_WALK1 = 3.4, 7.4
T_SWING0, T_SWING1 = 7.4, 8.4
T_PUSH0, T_PUSH1 = 8.4, 9.6
A_CRACK, A_FULL = 18.0, 75.0

# 3 a.m.: only a few windows across the street are still lit
lit = np.zeros_like(studio._LIT); lit[1, 2] = True; lit[4, 6] = True; lit[3, 1] = True
studio._LIT[:] = lit
n = 256
u, v = np.meshgrid(np.linspace(0, 1, n), np.linspace(0, 1, n))
X = studio.WIN[0] + u * (studio.WIN[1] - studio.WIN[0]); Y = studio.WIN[2] + v * (studio.WIN[3] - studio.WIN[2])
col = studio.window_emit(X.ravel(), Y.ravel(), np.zeros(n * n), 0).reshape(n, n, 3)
img = bpy.data.images['win']
img.pixels.foreach_set(np.concatenate([np.clip(col, 0, 1), np.ones((n, n, 1))], -1).astype(np.float32).ravel()); img.update()


def eng_bbox(o):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    xs = [p.x for p in pts]; ys = [p.y for p in pts]; zs = [p.z for p in pts]
    return (min(xs), min(zs), -max(ys)), (max(xs), max(zs), -min(ys))


bpy.context.view_layer.update()
rm = [o for o in coll.objects if o.type == 'MESH' and (lambda ab: ab[0][0] > 2.24 and ab[1][0] < 3.0 and ab[0][2] > 1.1 and ab[1][2] < 1.9 and ab[1][1] < 1.9)(eng_bbox(o))]
for o in rm:
    bpy.data.objects.remove(o, do_unlink=True)
print('removed fridge parts', len(rm), flush=True)


def simple_mat(name, col, rough=0.4, metal=0.0, emit=None, es=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    return m


M_FW = simple_mat('fr_white', (0.82, 0.83, 0.84), 0.3)
M_FIN = simple_mat('fr_in', (0.9, 0.95, 1.0), 0.5, emit=(0.8, 0.9, 1.0), es=0.5)
M_SHELF = simple_mat('fr_shelf', (0.85, 0.92, 0.95), 0.15)
M_FST = simple_mat('fr_steel', (0.7, 0.7, 0.72), 0.25, 1.0)
M_FBL = simple_mat('fr_black', (0.02, 0.02, 0.02), 0.6)
M_STRIP = simple_mat('fr_strip', (1, 1, 1), 0.3, emit=(0.85, 0.93, 1.0), es=12)

# note material: image mapped on the face looking to -x
M_NOTE = bpy.data.materials.new('note'); M_NOTE.use_nodes = True
nt = M_NOTE.node_tree; bn = nt.nodes['Principled BSDF']; bn.inputs['Roughness'].default_value = 0.8
tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(os.path.join(HERE, 'note_tex.png')); tx.extension = 'EXTEND'
tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); cb = nt.nodes.new('ShaderNodeCombineXYZ')
inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
nt.links.new(tc.outputs['Generated'], sp.inputs[0]); nt.links.new(sp.outputs['Y'], inv.inputs[1])
nt.links.new(inv.outputs[0], cb.inputs['X']); nt.links.new(sp.outputs['Z'], cb.inputs['Y'])
nt.links.new(cb.outputs[0], tx.inputs['Vector']); nt.links.new(tx.outputs['Color'], bn.inputs['Base Color'])


def mbox(a, b, m, bevel=True):
    a = np.array(a, float); b = np.array(b, float); size = b - a; c = (a + b) / 2
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object
    o.scale = (size[0], size[2], size[1]); o.location = P(c)
    if bevel and min(size) > 0.012:
        md = o.modifiers.new('b', 'BEVEL'); md.width = min(0.006, min(size) * 0.25); md.segments = 2; md.limit_method = 'NONE'
    o.data.materials.append(m); link(o)
    return o


x0, x1, z0, z1, h = 2.32, 2.98, 1.15, 1.85, 1.85
mbox((x1 - 0.04, 0.04, z0), (x1, h, z1), M_FW)
mbox((x0, 0.04, z0), (x1, h, z0 + 0.04), M_FW); mbox((x0, 0.04, z1 - 0.04), (x1, h, z1), M_FW)
mbox((x0, h - 0.09, z0), (x1, h, z1), M_FW); mbox((x0, 0.04, z0), (x1, 0.14, z1), M_FW)
mbox((x0 + 0.04, 0.0, z0 + 0.02), (x1 - 0.02, 0.04, z1 - 0.02), M_FBL)
mbox((x1 - 0.05, 0.14, z0 + 0.04), (x1 - 0.04, h - 0.04, z1 - 0.04), M_FIN)
mbox((x0 + 0.02, 0.14, z0 + 0.04), (x1 - 0.05, 0.145, z1 - 0.04), M_FIN)
for yy in (0.55, 0.95, 1.35):
    mbox((x0 + 0.04, yy, z0 + 0.04), (x1 - 0.05, yy + 0.012, z1 - 0.04), M_SHELF)
mbox((x0 + 0.15, h - 0.11, z0 + 0.2), (x0 + 0.3, h - 0.09, z1 - 0.2), M_STRIP)
# the note leaning against the back wall on the middle shelf
NOTE_C = (2.86, 1.45, 1.5)
note = mbox((2.86, 1.362, 1.39), (2.866, 1.52, 1.61), M_NOTE, bevel=False)
note.rotation_euler = (0, math.radians(-12), 0)   # lean back a little

# door parented to a hinge empty
PIV = (x0 - 0.03, z0)
hinge = bpy.data.objects.new('hinge', None); coll.objects.link(hinge); hinge.location = P((PIV[0], 0.0, PIV[1]))
bpy.context.view_layer.update()
for o in (mbox((x0 - 0.06, 0.06, z0), (x0, h - 0.01, z1), M_FW),
          mbox((x0 - 0.11, 0.85, z1 - 0.07), (x0 - 0.06, 1.35, z1 - 0.05), M_FST)):
    o.parent = hinge; o.matrix_parent_inverse = hinge.matrix_world.inverted()

for m in bpy.data.materials:
    if m.name.startswith('s_lamp'):
        m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0


def add_light(kind, pos, energy, col, size=0.05, direction=None):
    ld = bpy.data.lights.new('L', kind); ld.energy = energy; ld.color = col; ld.shadow_soft_size = size
    if kind == 'AREA':
        ld.size = size
    o = bpy.data.objects.new('L', ld); coll.objects.link(o); o.location = P(pos)
    if direction is not None:
        o.rotation_euler = P(direction).to_track_quat('-Z', 'Y').to_euler()
    return o


add_light('AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 22, (0.35, 0.45, 0.95), 1.4, (0, 0, -1))
FR_W = float(os.environ.get('FR_W', '60'))
L1 = add_light('POINT', (2.55, 1.62, 1.5), FR_W, (0.82, 0.92, 1.0), 0.08)
L2 = add_light('POINT', (2.55, 0.7, 1.5), FR_W * 0.5, (0.82, 0.92, 1.0), 0.08)

cd = bpy.data.cameras.new('C'); cd.sensor_fit = 'VERTICAL'; cd.angle_y = 2 * math.atan(0.62); cd.clip_start = 0.03
co = bpy.data.objects.new('C', cd); coll.objects.link(co); sc.camera = co


def sstep(x):
    x = min(max(x, 0.0), 1.0); return x * x * (3 - 2 * x)


# camera path (engine coords): sit on the bed -> stand -> around the table -> in front of the fridge
PATH = np.array([(-1.3, 1.0, 4.0), (-0.5, 1.58, 3.8), (0.6, 1.6, 3.45), (1.6, 1.6, 3.25), (1.85, 1.58, 2.7), (1.25, 1.55, 1.9)])
LOOK_FR = np.array((2.6, 1.0, 1.5))
END_POS = PATH[-1]; NOTE_POS = np.array((2.33, 1.5, 1.52)); NOTE_T = np.array(NOTE_C)


def path_at(s):
    seg = np.linalg.norm(np.diff(PATH, axis=0), axis=1); cum = np.concatenate([[0], np.cumsum(seg)]) / seg.sum()
    i = min(np.searchsorted(cum, s, side='right') - 1, len(seg) - 1)
    f = (s - cum[i]) / (cum[i + 1] - cum[i])
    # Catmull-Rom for smoothness
    p0 = PATH[max(i - 1, 0)]; p1 = PATH[i]; p2 = PATH[i + 1]; p3 = PATH[min(i + 2, len(PATH) - 1)]
    return 0.5 * ((2 * p1) + (-p0 + p2) * f + (2 * p0 - 5 * p1 + 4 * p2 - p3) * f * f + (-p0 + 3 * p1 - 3 * p2 + p3) * f ** 3)


def cam_state(t):
    if t < T_WALK0:
        return PATH[0], LOOK_FR
    if t < T_WALK1:
        s = sstep((t - T_WALK0) / (T_WALK1 - T_WALK0))
        pos = path_at(s).copy()
        pos[1] += 0.025 * math.sin((t - T_WALK0) * 2 * math.pi * 1.8) * min(1, s * 6) * min(1, (1 - s) * 6)   # steps
        look = LOOK_FR + np.array((0, 0, 0.0))
        return pos, look
    if t < T_PUSH0:
        return END_POS, LOOK_FR
    s = sstep((t - T_PUSH0) / (T_PUSH1 - T_PUSH0))
    return END_POS + (NOTE_POS - END_POS) * s, LOOK_FR + (NOTE_T - LOOK_FR) * s


def door_angle(t):
    if t < T_OPEN0:
        return 0.0
    if t < T_SWING0:
        return A_CRACK * sstep((t - T_OPEN0) / (T_OPEN1 - T_OPEN0))
    return A_CRACK + (A_FULL - A_CRACK) * sstep((t - T_SWING0) / (T_SWING1 - T_SWING0))


def light_level(t):
    if t < T_OPEN0:
        return 0.0
    k = (t - T_OPEN0)
    if k < 0.35:   # the old lamp flickers on
        return [0.0, 0.7, 0.1, 1.0, 0.3][min(int(k * 12), 4)]
    return 1.0


def frame_key(fi):
    t = fi / FPS
    pos, look = cam_state(t)
    return f'{door_angle(t):.2f}_{light_level(t):.2f}_' + '_'.join(f'{v:.4f}' for v in np.concatenate([pos, look]))


def render_at(t, path):
    pos, look = cam_state(t)
    co.location = P(pos); co.rotation_euler = (P(look) - P(pos)).to_track_quat('-Z', 'Y').to_euler()
    hinge.rotation_euler = (0, 0, -math.radians(door_angle(t)))
    lv = light_level(t); L1.data.energy = FR_W * lv; L2.data.energy = FR_W * 0.5 * lv
    for m in (M_FIN, M_STRIP):
        m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = (0.5 if m is M_FIN else 12) * lv
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


MODE = os.environ.get('OKNA_MODE', 'preview')
OD = os.path.join(HERE, 'night'); os.makedirs(OD, exist_ok=True)
if MODE == 'preview':
    for ts_ in os.environ.get('OKNA_T', '0.3,2.5,5.5,8.5,10').split(','):
        t1 = time.time(); render_at(float(ts_), os.path.join(HERE, f'night_prev_{ts_}.png')); print('prev', ts_, round(time.time() - t1, 1), flush=True)
else:
    NF = int(DUR * FPS)
    keys = [frame_key(fi) for fi in range(NF)]
    uniq = {}
    for fi, k in enumerate(keys):
        uniq.setdefault(k, fi)
    print('unique renders', len(uniq), 'of', NF, flush=True)
    names = {k: f'u_{i:04d}.png' for i, k in enumerate(uniq)}
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
