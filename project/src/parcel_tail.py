
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
def closed_box(gname, c, label_top=True, label_side=False):
    w, d, h = 0.42, 0.3, 0.28
    a = (c[0] - w / 2, c[1], c[2] - d / 2); b = (c[0] + w / 2, c[1] + h, c[2] + d / 2)
    grp_add(gname, mbox(a, b, M_CARD))
    if label_top:
        grp_add(gname, mbox((a[0] + 0.005, b[1], a[2] + 0.005), (b[0] - 0.005, b[1] + 0.001, b[2] - 0.005), tex_mat(f'bt_{gname}', 'box_top.png', 'top', 0.85), False))
    if label_side:
        grp_add(gname, mbox((a[0] + 0.005, a[1] + 0.005, b[2]), (b[0] - 0.005, b[1] - 0.005, b[2] + 0.001), tex_mat(f'bs_{gname}', 'box_side.png', 'front_pz', 0.85), False))
        grp_add(gname, mbox((c[0] - 0.035, b[1] - 0.06, b[2]), (c[0] + 0.035, b[1] + 0.0015, b[2] + 0.0015), M_TAPE, False))


BOX_DOOR = (0.62, 0.0, -0.5)
closed_box('box_door', BOX_DOOR, True, True)
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
eggs('f1', (FX, 0.145, 1.36)); jar('f1', (FX, 0.145, 1.64), 0.058, 0.18, M_SOUP)
jar('f2', (FX, 0.562, 1.33), 0.045, 0.15, M_PICK); jar('f2', (FX, 0.562, 1.49), 0.045, 0.15, M_PICK); jar('f2', (FX, 0.562, 1.66), 0.042, 0.14, M_LECHO)
jar('f3', (FX, 0.962, 1.36), 0.042, 0.13, M_JAM, 'cloth'); foil('f3', (FX, 1.0, 1.6), (0.12, 0.045, 0.1))
note('f4', (2.88, 1.362, 1.4), (2.886, 1.502, 1.6), 'front_mx')

# ---------- lights ----------
LIGHTS = {}


def light(name, kind, pos, energy, col, size, direction=None, sy=None):
    o = add_light(kind, pos, energy, col, size, direction)
    if kind == 'AREA' and sy:
        o.data.shape = 'RECTANGLE'; o.data.size_y = sy
    if kind == 'SPOT':
        o.data.spot_size = math.radians(120); o.data.spot_blend = 0.8
    LIGHTS[name] = o; return o


light('stair', 'AREA', (0.65, 2.45, -1.1), 160, (1.0, 0.78, 0.5), 1.4, (0, -1, 0.3))
light('win', 'AREA', ((studio.WIN[0] + studio.WIN[1]) / 2, 1.55, studio.Z1 + 0.04), 14, (0.4, 0.5, 0.9), 1.5, (0, 0, -1))
light('pend', 'SPOT', (TX, 1.52, TZ), 55, (1.0, 0.76, 0.5), 0.22, (0, -1, 0))
light('ceilsoft', 'AREA', (TX, 2.5, TZ), 30, (1.0, 0.82, 0.62), 1.6, (0, -1, 0))
light('fill', 'AREA', (0.2, 1.8, 1.4), 12, (1.0, 0.85, 0.7), 1.5, (1, -0.4, 0.6))
light('fr1', 'POINT', (2.55, 1.62, 1.5), 30, (0.82, 0.92, 1.0), 0.15)
light('fr2', 'POINT', (2.5, 0.75, 1.5), 15, (0.82, 0.92, 1.0), 0.15)
light('frfill', 'AREA', (1.0, 2.2, 1.5), 22, (1.0, 0.82, 0.62), 1.6, (1, -0.6, 0))
light('phone', 'POINT', (PH[0], PH[1] + 0.06, PH[2]), 0.6, (0.75, 0.75, 1.0), 0.05)

cd = bpy.data.cameras.new('C'); cd.sensor_fit = 'VERTICAL'; cd.angle_y = 2 * math.atan(0.62); cd.clip_start = 0.02
co = bpy.data.objects.new('C', cd); coll.objects.link(co); sc.camera = co


def lerp(a, b, s):
    return np.array(a) + (np.array(b) - np.array(a)) * s


SHOTS = {
    # name: (camera, target, visible groups, lights on, extra)
    's1_closed': ((0.68, 1.4, 1.8), (0.64, 0.75, -0.2), [], ['win'], dict(door=True, leak=True)),
    's1_open': ((0.68, 1.4, 1.8), (0.64, 0.6, -0.4), ['stair', 'box_door'], ['stair', 'win'], dict(door=False)),
    's2_table': ((0.25, 1.38, 1.8), (BOX_T[0], 0.9, BOX_T[2]), ['box_table', 'phone'], ['pend', 'ceilsoft', 'win', 'fill', 'phone'], dict(phone=0)),
    's3_open': ((OB[0] - 0.05, 1.45, OB[2] - 0.52), (OB[0], 0.82, OB[2] + 0.01), ['box_open'], ['pend', 'ceilsoft', 'win', 'fill'], {}),
    's4_0': ((1.15, 1.0, 1.5), (2.6, 0.95, 1.5), [], ['fr1', 'fr2', 'frfill', 'win'], dict(fr=0)),
    's4_1': ((1.15, 1.0, 1.5), (2.6, 0.95, 1.5), ['f1'], ['fr1', 'fr2', 'frfill', 'win'], dict(fr=1)),
    's4_2': ((1.15, 1.0, 1.5), (2.6, 0.95, 1.5), ['f1', 'f2'], ['fr1', 'fr2', 'frfill', 'win'], dict(fr=2)),
    's4_3': ((1.15, 1.0, 1.5), (2.6, 0.95, 1.5), ['f1', 'f2', 'f3'], ['fr1', 'fr2', 'frfill', 'win'], dict(fr=3)),
    's4_4': ((1.15, 1.0, 1.5), (2.6, 0.95, 1.5), ['f1', 'f2', 'f3', 'f4'], ['fr1', 'fr2', 'frfill', 'win'], dict(fr=4)),
    's6_p3': ((PH[0] - 0.12, 1.08, PH[2] - 0.3), (PH[0], 0.77, PH[2] + 0.01), ['phone', 'box_open'], ['pend', 'ceilsoft', 'win', 'phone'], dict(phone=0)),
    's6_p4': ((PH[0] - 0.12, 1.08, PH[2] - 0.3), (PH[0], 0.77, PH[2] + 0.01), ['phone', 'box_open'], ['pend', 'ceilsoft', 'win', 'phone'], dict(phone=1)),
    's6_p5': ((PH[0] - 0.12, 1.08, PH[2] - 0.3), (PH[0], 0.77, PH[2] + 0.01), ['phone', 'box_open'], ['pend', 'ceilsoft', 'win', 'phone'], dict(phone=2)),
}


def setup(name):
    cam, tgt, groups, lights, ex = SHOTS[name]
    for g, objs in ALL.items():
        for o in objs:
            o.hide_render = g not in groups and not (g == 'leak' and ex.get('leak'))
    for o in DOOR + KNOB:
        o.hide_render = not ex.get('door', True)
    for k, o in LIGHTS.items():
        o.hide_render = k not in lights
    fr = ex.get('fr', None)
    hinge.rotation_euler = (0, 0, -math.radians(105 if fr is not None else 0))
    on = fr is not None
    if on:
        k = fr / 4.0
        col = tuple(lerp((0.82, 0.92, 1.0), (1.0, 0.86, 0.66), k))
        LIGHTS['fr1'].data.color = col; LIGHTS['fr2'].data.color = col
        M_FIN.node_tree.nodes['Principled BSDF'].inputs['Emission Color'].default_value = (*col, 1)
    for m, v in ((M_FIN, 0.35), (M_STRIP, 8)):
        m.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = v if on else 0.0
    if 'phone' in ex:
        PSCR.data.materials[0] = PHONE_M[ex['phone']]
    co.location = P(cam); co.rotation_euler = (P(tgt) - P(cam)).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()


OD = os.path.join(HERE, 'parcel'); os.makedirs(OD, exist_ok=True)
names = os.environ.get('SHOTS', ','.join(SHOTS)).split(',')
for nm in names:
    setup(nm)
    if nm == 's4_4':
        for o in ALL['f4']:
            v = world_to_camera_view(sc, co, o.matrix_world.translation)
            print('NOTE_SCREEN', round(v.x, 4), round(v.y, 4), flush=True)
    sc.render.filepath = os.path.join(OD, f'{nm}.png')
    t1 = time.time(); bpy.ops.render.render(write_still=True); print('shot', nm, round(time.time() - t1, 1), flush=True)
