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


cam_e, tgt_e = (0.68, 1.4, 1.8), (0.64, 0.6, -0.4)
S = studio.scene(cam_e, tgt_e)
t0 = time.time()
emit(S['prims'])
print('objects', len(coll.objects), 'build', round(time.time() - t0, 1), 's', flush=True)


# ================= «Утро» =================
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

# (no note this time)
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





# ---- fridge rig: group all fridge parts under one root so it can move
bpy.context.view_layer.update()
FRIDGE_PARTS = []
for o in list(coll.objects):
    if o.type != 'MESH' or o.parent is not None:
        continue
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    ex0, ex1 = min(p.x for p in pts), max(p.x for p in pts); ez0, ez1 = -max(p.y for p in pts), -min(p.y for p in pts); ey1 = max(p.z for p in pts)
    if ex0 > 2.2 and ex1 < 3.0 and ez0 > 1.1 and ez1 < 1.9 and ey1 < 1.9:
        FRIDGE_PARTS.append(o)
FRIDGE = bpy.data.objects.new('fridge_root', None); coll.objects.link(FRIDGE); FRIDGE.location = P((2.65, 0.0, 1.5))
bpy.context.view_layer.update()
for o in FRIDGE_PARTS + [hinge]:
    mw = o.matrix_world.copy(); o.parent = FRIDGE; o.matrix_parent_inverse = FRIDGE.matrix_world.inverted()
print('fridge parts', len(FRIDGE_PARTS), flush=True)

# ================= «Посылка от мамы» =================
import bmesh
from bpy_extras.object_utils import world_to_camera_view
try:
    sc.view_settings.look = 'AgX - Medium Low Contrast'; sc.view_settings.exposure = 0.0
except Exception as e:
    print('look', e)
try:
    sc.eevee.taa_render_samples = int(os.environ.get('EV_SAMPLES', '32'))
except Exception:
    pass

for m in bpy.data.materials:
    if m.name.startswith('s_lamp'):
        m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0
BG = sc.world.node_tree.nodes['Background']
BG.inputs[0].default_value = (0.05, 0.042, 0.036, 1); BG.inputs[1].default_value = 1.0

ALL = {}          # group name -> list of objects (visibility per shot)


def grp_add(name, o):
    ALL.setdefault(name, []).append(o); return o


def tex_mat(name, path, mode='top', rough=0.85, emit=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = bpy.data.images.load(os.path.join(HERE, path)); tx.extension = 'EXTEND'
    tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); cb = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(tc.outputs['Generated'], sp.inputs[0])

    def inv(sock):
        mth = nt.nodes.new('ShaderNodeMath'); mth.operation = 'SUBTRACT'; mth.inputs[0].default_value = 1.0
        nt.links.new(sock, mth.inputs[1]); return mth.outputs[0]
    if mode == 'top':          # lying flat, viewed from -z (engine), text up = +z engine
        nt.links.new(inv(sp.outputs['X']), cb.inputs['X']); nt.links.new(inv(sp.outputs['Y']), cb.inputs['Y'])
    elif mode == 'front_pz':   # face looking +z engine (towards the room from outside)
        nt.links.new(sp.outputs['X'], cb.inputs['X']); nt.links.new(sp.outputs['Z'], cb.inputs['Y'])
    elif mode == 'top180':
        nt.links.new(sp.outputs['X'], cb.inputs['X']); nt.links.new(sp.outputs['Y'], cb.inputs['Y'])
    elif mode == 'front_mx':   # face looking -x engine (fridge note)
        nt.links.new(inv(sp.outputs['Y']), cb.inputs['X']); nt.links.new(sp.outputs['Z'], cb.inputs['Y'])
    nt.links.new(cb.outputs[0], tx.inputs['Vector'])
    if emit:
        nt.links.new(tx.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = emit
        b.inputs['Base Color'].default_value = (0, 0, 0, 1)
    else:
        nt.links.new(tx.outputs['Color'], b.inputs['Base Color'])
    return m


def cyl(c, r, h, m, verts=32, smooth=True):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=P((c[0], c[1] + h / 2, c[2])))
    o = bpy.context.object; o.data.materials.append(m); link(o)
    if smooth:
        bpy.ops.object.shade_smooth()
    return o


def sph(c, sc_, m, sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=1, location=P(c))
    o = bpy.context.object; o.scale = (sc_[0], sc_[2], sc_[1]); o.data.materials.append(m); link(o); bpy.ops.object.shade_smooth()
    return o


def noise_mat(name, c1, c2, rough=0.4, scale=40.0):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'
    mx.inputs[6].default_value = (*c1, 1); mx.inputs[7].default_value = (*c2, 1)
    nt.links.new(nz.outputs['Fac'], mx.inputs[0]); nt.links.new(mx.outputs[2], b.inputs['Base Color'])
    return m


M_CARD = simple_mat('card', (0.5, 0.36, 0.22), 0.9)
M_CARD_IN = simple_mat('card_in', (0.42, 0.3, 0.18), 0.95)
M_TAPE = simple_mat('tape', (0.62, 0.5, 0.33), 0.35)
M_GLASS = bpy.data.materials.new('glass'); M_GLASS.use_nodes = True
_b = M_GLASS.node_tree.nodes['Principled BSDF']; _b.inputs['Base Color'].default_value = (0.85, 0.92, 0.9, 1); _b.inputs['Roughness'].default_value = 0.04
_b.inputs['Alpha'].default_value = 0.22
try:
    M_GLASS.surface_render_method = 'BLENDED'
except Exception:
    M_GLASS.blend_method = 'BLEND'
M_LID = simple_mat('lid', (0.75, 0.6, 0.25), 0.3, 1.0)
M_PICK = noise_mat('pickles', (0.18, 0.32, 0.08), (0.35, 0.45, 0.15), 0.35, 25)
M_JAM = noise_mat('jam', (0.32, 0.02, 0.05), (0.5, 0.06, 0.1), 0.25, 15)
M_LECHO = noise_mat('lecho', (0.75, 0.25, 0.05), (0.85, 0.45, 0.1), 0.3, 20)
M_SOUP = noise_mat('soup', (0.6, 0.3, 0.08), (0.75, 0.5, 0.2), 0.3, 12)
M_CHECK = bpy.data.materials.new('checkcloth'); M_CHECK.use_nodes = True
_nt = M_CHECK.node_tree; _ch = _nt.nodes.new('ShaderNodeTexChecker'); _ch.inputs['Scale'].default_value = 12
_ch.inputs['Color1'].default_value = (0.7, 0.08, 0.08, 1); _ch.inputs['Color2'].default_value = (0.9, 0.88, 0.82, 1)
_nt.links.new(_ch.outputs['Color'], _nt.nodes['Principled BSDF'].inputs['Base Color']); _nt.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.9
M_STR = simple_mat('string', (0.85, 0.8, 0.7), 0.9)
M_FOIL = simple_mat('foil', (0.82, 0.82, 0.84), 0.28, 1.0)
M_PULP = simple_mat('pulp', (0.6, 0.58, 0.53), 1.0)
M_EGG = simple_mat('egg', (0.93, 0.87, 0.76), 0.5)
M_EGG2 = simple_mat('egg2', (0.78, 0.58, 0.4), 0.5)
M_PHONE = simple_mat('phone', (0.03, 0.03, 0.035), 0.25, 0.3)
M_STAIRG = simple_mat('stair_green', (0.22, 0.38, 0.3), 0.7)
M_STAIRW = simple_mat('stair_white', (0.8, 0.78, 0.72), 0.9)
M_CONC = simple_mat('concrete', (0.42, 0.4, 0.38), 0.9)
M_MAT = simple_mat('doormat', (0.2, 0.15, 0.12), 1.0)
M_LEAK = simple_mat('leak', (1, 0.8, 0.5), 0.5, emit=(1.0, 0.75, 0.45), es=25)


def jar(gname, c, r, h, content, lid='metal'):
    out = [cyl((c[0], c[1] + 0.004, c[2]), r * 0.9, h * 0.82, content), cyl(c, r, h, M_GLASS, 32)]
    if lid == 'metal':
        out.append(cyl((c[0], c[1] + h, c[2]), r * 1.02, 0.02, M_LID))
    else:
        out.append(cyl((c[0], c[1] + h - 0.025, c[2]), r * 1.25, 0.045, M_CHECK))
        bpy.ops.mesh.primitive_torus_add(major_radius=r * 1.06, minor_radius=0.003, location=P((c[0], c[1] + h - 0.01, c[2])))
        o = bpy.context.object; o.data.materials.append(M_STR); link(o); out.append(o)
    for o in out:
        grp_add(gname, o)


def foil(gname, c, s=(0.13, 0.05, 0.075)):
    o = sph(c, s, M_FOIL, 3)
    tx = bpy.data.textures.new('crumple', 'CLOUDS'); tx.noise_scale = 0.08
    md = o.modifiers.new('d', 'DISPLACE'); md.texture = tx; md.strength = 0.25; md.mid_level = 0.5
    grp_add(gname, o)


def eggs(gname, c, rot=0.0):
    o = mbox((c[0] - 0.105, c[1], c[2] - 0.055), (c[0] + 0.105, c[1] + 0.04, c[2] + 0.055), M_PULP); grp_add(gname, o)
    for i in range(3):
        for j in range(2):
            e = sph((c[0] - 0.066 + i * 0.066, c[1] + 0.05, c[2] - 0.027 + j * 0.054), (0.022, 0.028, 0.022), M_EGG if (i + j) % 3 else M_EGG2, 2)
            grp_add(gname, e)


def note(gname, a, b, mode):
    o = mbox(a, b, tex_mat(f'note_{gname}', 'note_mom.png', mode, 0.8), bevel=False); grp_add(gname, o); return o


# ---------- stairwell behind the entrance door ----------
DOOR = [o for o in coll.objects if o.type == 'MESH' and o.data.materials and o.data.materials[0].name in ('s_door',)]
KNOB = [o for o in coll.objects if o.type == 'MESH' and o.data.materials and o.data.materials[0].name == 'f_steel'
        and abs(o.location.x - 1.0) < 0.02 and abs(o.location.y - 0.01) < 0.03]
for o in (mbox((-0.8, -0.02, -2.0), (2.2, 0.0, -0.1), M_CONC, False), mbox((-0.8, 0, -2.05), (2.2, 1.2, -2.0), M_STAIRG, False),
          mbox((-0.8, 1.2, -2.05), (2.2, 2.6, -2.0), M_STAIRW, False), mbox((-0.85, 0, -2.05), (-0.8, 2.6, -0.1), M_STAIRG, False),
          mbox((2.2, 0, -2.05), (2.25, 2.6, -0.1), M_STAIRG, False), mbox((-0.8, 2.6, -2.05), (2.25, 2.65, -0.1), M_STAIRW, False),
          mbox((0.3, 0.0, -0.75), (1.0, 0.01, -0.3), M_MAT, False)):
    grp_add('stair', o)
LEAK = grp_add('leak', mbox((0.24, 0.0, -0.025), (1.06, 0.006, -0.015), M_LEAK, False))

# ---------- the parcel: closed (door + table) and open (table) ----------
def closed_box(gname, c, label_top=True, label_side=False, top_mode='top'):
    w, d, h = 0.42, 0.3, 0.28
    a = (c[0] - w / 2, c[1], c[2] - d / 2); b = (c[0] + w / 2, c[1] + h, c[2] + d / 2)
    grp_add(gname, mbox(a, b, M_CARD))
    if label_top:
        grp_add(gname, mbox((a[0] + 0.005, b[1], a[2] + 0.005), (b[0] - 0.005, b[1] + 0.001, b[2] - 0.005), tex_mat(f'bt_{gname}', 'box_top.png', top_mode, 0.85), False))
    if label_side:
        grp_add(gname, mbox((a[0] + 0.005, a[1] + 0.005, b[2]), (b[0] - 0.005, b[1] - 0.005, b[2] + 0.001), tex_mat(f'bs_{gname}', 'box_side.png', 'front_pz', 0.85), False))
        grp_add(gname, mbox((c[0] - 0.035, b[1] - 0.06, b[2]), (c[0] + 0.035, b[1] + 0.0015, b[2] + 0.0015), M_TAPE, False))


BOX_DOOR = (0.62, 0.0, -0.5)
closed_box('box_door', BOX_DOOR, True, True, 'top180')
TX, TZ = studio.TABLE
BOX_T = (TX - 0.18, 0.76, TZ + 0.05)
closed_box('box_table', BOX_T, True, False)

# open box with contents
OB = (TX - 0.18, 0.76, TZ + 0.05); w, d, h = 0.42, 0.3, 0.28
oa = (OB[0] - w / 2, OB[1], OB[2] - d / 2); ob = (OB[0] + w / 2, OB[1] + h, OB[2] + d / 2)
for a_, b_ in (((oa[0], oa[1], oa[2]), (ob[0], oa[1] + 0.01, ob[2])), ((oa[0], oa[1], oa[2]), (oa[0] + 0.006, ob[1], ob[2])),
               ((ob[0] - 0.006, oa[1], oa[2]), (ob[0], ob[1], ob[2])), ((oa[0], oa[1], oa[2]), (ob[0], ob[1], oa[2] + 0.006)),
               ((oa[0], oa[1], ob[2] - 0.006), (ob[0], ob[1], ob[2]))):
    grp_add('box_open', mbox(a_, b_, M_CARD_IN, False))
# flaps folded outwards (lying tilted)
for (piv, size, axis, sgn) in (((OB[0], ob[1], oa[2]), (w, 0.004, 0.14), 'z', -1), ((OB[0], ob[1], ob[2]), (w, 0.004, 0.14), 'z', 1),
                               ((oa[0], ob[1], OB[2]), (0.14, 0.004, d), 'x', -1), ((ob[0], ob[1], OB[2]), (0.14, 0.004, d), 'x', 1)):
    bpy.ops.mesh.primitive_cube_add(size=1); o = bpy.context.object
    o.scale = (size[0], size[2], size[1]); o.data.materials.append(M_CARD); link(o)
    ang = math.radians(35)
    if axis == 'z':
        off = np.array((0, -math.sin(ang) * 0.07, sgn * math.cos(ang) * 0.07)); o.rotation_euler = (sgn * ang * -1 * -1, 0, 0)
        o.rotation_euler = (-sgn * ang, 0, 0)
    else:
        off = np.array((sgn * math.cos(ang) * 0.07, -math.sin(ang) * 0.07, 0)); o.rotation_euler = (0, sgn * ang, 0)
    o.location = P(np.array(piv) + off)
    grp_add('box_open', o)
jar('box_open', (OB[0] - 0.13, OB[1] + 0.01, OB[2] - 0.06), 0.045, 0.14, M_PICK)
jar('box_open', (OB[0] - 0.13, OB[1] + 0.01, OB[2] + 0.07), 0.04, 0.12, M_JAM, 'cloth')
jar('box_open', (OB[0] - 0.035, OB[1] + 0.01, OB[2] + 0.07), 0.042, 0.13, M_LECHO)
foil('box_open', (OB[0] + 0.09, OB[1] + 0.06, OB[2] - 0.06))
eggs('box_open', (OB[0] + 0.08, OB[1] + 0.01, OB[2] + 0.075))
note('box_open', (OB[0] - 0.06, OB[1] + 0.2, OB[2] - 0.11), (OB[0] + 0.12, OB[1] + 0.201, OB[2] + 0.02), 'top')

# phone on the table
PH = (TX + 0.32, 0.76, TZ - 0.18)
grp_add('phone', mbox((PH[0] - 0.038, PH[1], PH[2] - 0.078), (PH[0] + 0.038, PH[1] + 0.009, PH[2] + 0.078), M_PHONE))
PHONE_M = [tex_mat(f'ph{s}', f'phone_{s}.png', 'top', 0.2, emit=1.6) for s in (3, 4, 5)]
PSCR = grp_add('phone', mbox((PH[0] - 0.034, PH[1] + 0.009, PH[2] - 0.072), (PH[0] + 0.034, PH[1] + 0.0095, PH[2] + 0.072), PHONE_M[0], False))

# ---------- fridge contents (stages) ----------
FX = 2.62
eggs('f1', (FX - 0.02, 0.145, 1.33)); jar('f1', (FX, 0.145, 1.56), 0.062, 0.2, M_SOUP); jar('f1', (FX + 0.05, 0.145, 1.72), 0.05, 0.17, M_PICK)
jar('f2', (FX, 0.562, 1.29), 0.055, 0.19, M_PICK); jar('f2', (FX, 0.562, 1.43), 0.055, 0.19, M_PICK)
jar('f2', (FX, 0.562, 1.575), 0.052, 0.17, M_LECHO); jar('f2', (FX + 0.02, 0.562, 1.715), 0.05, 0.17, M_LECHO)
jar('f3', (FX - 0.02, 0.962, 1.265), 0.05, 0.15, M_JAM, 'cloth')
foil('f3', (FX - 0.03, 1.0, 1.71), (0.13, 0.05, 0.1))
note('f4', (2.86, 0.962, 1.37), (2.866, 1.122, 1.59), 'front_mx')

# ---------- lights ----------
LIGHTS = {}


def light(name, kind, pos, energy, col, size, direction=None, sy=None):
    o = add_light(kind, pos, energy, col, size, direction)
    if kind == 'AREA' and sy:
        o.data.shape = 'RECTANGLE'; o.data.size_y = sy
    if kind == 'SPOT':
        o.data.spot_size = math.radians(120); o.data.spot_blend = 0.8
    LIGHTS[name] = o; return o


light('stair', 'AREA', (0.65, 2.45, -1.1), 60, (1.0, 0.78, 0.5), 1.4, (0, -1, 0.3))
light('win', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 14, (0.4, 0.5, 0.9), 1.5, (0, 0, -1))
light('pend', 'SPOT', (TX, 1.52, TZ), 55, (1.0, 0.76, 0.5), 0.22, (0, -1, 0))
light('ceilsoft', 'AREA', (TX, 2.5, TZ), 30, (1.0, 0.82, 0.62), 1.6, (0, -1, 0))
light('fill', 'AREA', (0.2, 1.8, 1.4), 12, (1.0, 0.85, 0.7), 1.5, (1, -0.4, 0.6))
light('fr1', 'POINT', (2.55, 1.62, 1.5), 12, (0.82, 0.92, 1.0), 0.15)
light('fr2', 'POINT', (2.5, 0.75, 1.5), 6, (0.82, 0.92, 1.0), 0.15)
light('frfill', 'AREA', (1.0, 2.2, 1.5), 22, (1.0, 0.82, 0.62), 1.6, (1, -0.6, 0))
light('phone', 'POINT', (PH[0], PH[1] + 0.06, PH[2]), 0.6, (0.75, 0.75, 1.0), 0.05)

cd = bpy.data.cameras.new('C'); cd.sensor_fit = 'VERTICAL'; cd.angle_y = 2 * math.atan(0.62); cd.clip_start = 0.02
co = bpy.data.objects.new('C', cd); coll.objects.link(co); sc.camera = co


def lerp(a, b, s):
    return np.array(a) + (np.array(b) - np.array(a)) * s



# ======================= generic kit =======================
M_FUR = simple_mat('cat_fur', (0.62, 0.3, 0.09), 0.85)
M_FUR2 = simple_mat('cat_fur2', (0.9, 0.78, 0.6), 0.85)
M_EYE = simple_mat('cat_eye', (0.6, 0.8, 0.2), 0.2, emit=(0.55, 0.85, 0.2), es=2.5)
M_PUP = simple_mat('cat_pupil', (0.01, 0.01, 0.01), 0.1)
M_NOSE = simple_mat('cat_nose', (0.75, 0.35, 0.38), 0.5)
M_BOWL = simple_mat('bowl', (0.75, 0.76, 0.78), 0.25, 1.0)
M_PLATE = simple_mat('plate', (0.62, 0.62, 0.6), 0.4)


class Cat:
    def __init__(self, pos, yaw, gname='cat'):
        self.root = bpy.data.objects.new('cat', None); coll.objects.link(self.root)
        self.root.location = P(pos); self.root.rotation_euler = (0, 0, yaw); self.g = gname
        grp_add(gname, self.root)

        def sphr(loc, s_, m, par, seg=8, ring=6):
            bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=ring, radius=1)
            o = bpy.context.object; o.scale = s_; o.location = loc; o.data.materials.append(m); link(o); o.parent = par; grp_add(gname, o); return o

        def cone(loc, r, d, rot, m, par):
            bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=r, radius2=0.0, depth=d)
            o = bpy.context.object; o.location = loc; o.rotation_euler = rot; o.data.materials.append(m); link(o); o.parent = par; grp_add(gname, o); return o

        def lcyl(loc, r, d, m, par):
            bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=r, depth=d)
            o = bpy.context.object; o.location = loc; o.data.materials.append(m); link(o); o.parent = par; grp_add(gname, o); return o
        c = self.root
        sphr((-0.03, 0, 0.12), (0.17, 0.15, 0.13), M_FUR, c); sphr((0.04, 0, 0.24), (0.11, 0.115, 0.16), M_FUR, c)
        sphr((0.1, 0, 0.24), (0.05, 0.08, 0.1), M_FUR2, c)
        for sy in (-1, 1):
            lcyl((0.09, sy * 0.045, 0.11), 0.026, 0.22, M_FUR, c); sphr((0.11, sy * 0.045, 0.02), (0.035, 0.03, 0.022), M_FUR2, c)
            sphr((-0.02, sy * 0.13, 0.08), (0.08, 0.04, 0.07), M_FUR, c)
        self.neck = bpy.data.objects.new('neck', None); coll.objects.link(self.neck); self.neck.parent = c; self.neck.location = (0.05, 0, 0.36)
        n = self.neck
        sphr((0.02, 0, 0.06), (0.09, 0.095, 0.08), M_FUR, n); sphr((0.085, 0, 0.035), (0.045, 0.055, 0.035), M_FUR2, n)
        sphr((0.128, 0, 0.05), (0.01, 0.013, 0.009), M_NOSE, n)
        eyes = []
        for sy in (-1, 1):
            cone((0.0, sy * 0.055, 0.135), 0.04, 0.08, (sy * -0.25, 0, 0.78), M_FUR, n)
            eyes.append(sphr((0.088, sy * 0.036, 0.075), (0.012, 0.019, 0.019), M_EYE, n))
            eyes.append(sphr((0.099, sy * 0.036, 0.075), (0.004, 0.005, 0.015), M_PUP, n))
        self.lids = [(o, tuple(o.scale)) for o in eyes]
        cd_ = bpy.data.curves.new('tail', 'CURVE'); cd_.dimensions = '3D'; cd_.bevel_depth = 0.022; cd_.bevel_resolution = 1
        self.spl = cd_.splines.new('POLY'); self.spl.points.add(9)
        tl = bpy.data.objects.new('tail', cd_); tl.data.materials.append(M_FUR); coll.objects.link(tl); tl.parent = c; grp_add(gname, tl)
        self.tail(0.0)

    def tail(self, sway):
        for i, pt in enumerate(self.spl.points):
            s = i / 9
            ang = math.radians(170) + s * math.radians(115) + sway * s * s
            r = 0.17 + 0.04 * s
            z = 0.05 - 0.02 * s + (0.05 * s * s if sway > 0 else 0.0) + 0.04 * max(0, sway) * s ** 3
            pt.co = (r * math.cos(ang) - 0.02, r * math.sin(ang), max(z, 0.022), 1.0); pt.radius = 1.0 - 0.6 * s

    def blink(self, k):
        for o, s0 in self.lids:
            o.scale = (s0[0], s0[1], s0[2] * k)

    def look_angles(self, target):
        bpy.context.view_layer.update()
        loc = self.root.matrix_world.inverted() @ P(target) - self.neck.location
        return math.atan2(loc.y, loc.x), -math.atan2(loc.z, math.hypot(loc.x, loc.y))

    def head(self, yaw, pitch):
        self.neck.rotation_euler = (0, max(min(pitch, 0.9), -0.9), yaw)


def yaw_to(src, dst, extra=0.0):
    d = P(dst) - P(src); return math.atan2(d.y, d.x) + math.radians(extra)


def state(groups=(), lights=(), fr=None, fr_warm=0.0, fr_light=1.0, door=True, leak=False, exp=0.0, phone=None, world=None):
    for g, objs in ALL.items():
        for o in objs:
            o.hide_render = g not in groups and not (g == 'leak' and leak)
    for o in DOOR + KNOB:
        o.hide_render = not door
    for k, o in LIGHTS.items():
        o.hide_render = k not in lights
    hinge.rotation_euler = (0, 0, -math.radians(fr if fr is not None else 0))
    on = fr is not None and fr > 0.5 and fr_light > 0
    col = tuple(lerp((0.82, 0.92, 1.0), (1.0, 0.86, 0.66), fr_warm))
    LIGHTS['fr1'].data.color = col; LIGHTS['fr2'].data.color = col
    LIGHTS['fr1'].data.energy = 12 * fr_light; LIGHTS['fr2'].data.energy = 6 * fr_light
    if not on:
        LIGHTS['fr1'].hide_render = True; LIGHTS['fr2'].hide_render = True
    M_FIN.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (*col, 1)
    for m, v in ((M_FIN, 0.12), (M_STRIP, 3)):
        m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = v * fr_light if on else 0.0
    if phone is not None:
        PSCR.data.materials[0] = phone
    if world is not None:
        BG.inputs[0].default_value = (*world[0], 1); BG.inputs[1].default_value = world[1]
    sc.view_settings.exposure = exp


def cam(pos, tgt, tany=0.62):
    co.data.angle_y = 2 * math.atan(tany)
    co.location = P(pos); co.rotation_euler = (P(tgt) - P(pos)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()


def shoot(path, force=False):
    if os.path.exists(path) and not force and not os.environ.get('FORCE'):
        return
    sc.render.filepath = path
    t1 = time.time(); bpy.ops.render.render(write_still=True); print('shot', os.path.basename(path), round(time.time() - t1, 1), flush=True)


def screen_pos(eng_pt):
    v = world_to_camera_view(sc, co, P(eng_pt)); return (round(v.x, 4), round(1 - v.y, 4))


def plate(c, gname, r=0.13):
    o1 = cyl(c, r, 0.014, M_PLATE, 32); o2 = cyl((c[0], c[1] + 0.004, c[2]), r * 0.7, 0.012, M_PLATE, 32)
    grp_add(gname, o1); grp_add(gname, o2)


def bowl(c, gname):
    grp_add(gname, cyl(c, 0.085, 0.045, M_BOWL)); grp_add(gname, cyl((c[0], c[1] + 0.008, c[2]), 0.068, 0.04, simple_mat('bowl_in', (0.25, 0.26, 0.28), 0.3, 1.0)))


def ellip(c, s_, m, gname, sub=2, rot=None):
    o = sph(c, s_, m, sub)
    if rot is not None:
        o.rotation_euler = rot
    grp_add(gname, o); return o


def box(a, b, m, gname, bevel=True):
    return grp_add(gname, mbox(a, b, m, bevel))


def label_mat(name, path, mode, rough=0.8, emit=0.0):
    return tex_mat(name, path, mode, rough, emit)


TXc, TZc = studio.TABLE
OUT = os.path.join(HERE, os.environ.get('EP_OUT', 'ep'))
os.makedirs(OUT, exist_ok=True)
