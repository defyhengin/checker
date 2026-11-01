"""Night street: small standalone grocery 'ПРОДУКТЫ 24', lamps, U-shaped five-storey panel blocks. Blender coords (z up), shop front faces -y."""
import os, sys, math, time
import numpy as np
import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__)); SH = os.path.join(HERE, 'shop')
RX, RY = int(sys.argv[1]) if len(sys.argv) > 1 else 540, int(sys.argv[2]) if len(sys.argv) > 2 else 960

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'BLENDER_EEVEE'
ee = sc.eevee
for k, v in dict(taa_render_samples=int(os.environ.get('EV_SAMPLES', '16')), use_raytracing=os.environ.get('EV_RT', '0') == '1', use_shadows=True).items():
    try: setattr(ee, k, v)
    except Exception as e: print('eevee', k, e)
sc.render.resolution_x, sc.render.resolution_y = RX, RY
sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'; sc.view_settings.exposure = float(os.environ.get('EXP', '0'))
w = bpy.data.worlds.new('W'); sc.world = w; w.use_nodes = True
w.node_tree.nodes['Background'].inputs[0].default_value = (0.012, 0.016, 0.03, 1); w.node_tree.nodes['Background'].inputs[1].default_value = 1.0
ALL = {}


def g(name, o):
    ALL.setdefault(name, []).append(o); return o


def mat(name, col, rough=0.6, metal=0.0, emit=None, es=0.0, alpha=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1); b.inputs['Emission Strength'].default_value = es
    if alpha is not None:
        b.inputs['Alpha'].default_value = alpha
        try: m.surface_render_method = 'BLENDED'
        except Exception: m.blend_method = 'BLEND'
    return m


def img_mat(name, alb, emi=None, es=1.0, rough=0.8, mode='xz'):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; b = nt.nodes['Principled BSDF']; b.inputs['Roughness'].default_value = rough
    tc = nt.nodes.new('ShaderNodeTexCoord'); sp = nt.nodes.new('ShaderNodeSeparateXYZ'); cb = nt.nodes.new('ShaderNodeCombineXYZ')
    nt.links.new(tc.outputs['Generated'], sp.inputs[0])
    a, c = {'xz': ('X', 'Z'), 'yz': ('Y', 'Z'), 'xy': ('X', 'Y')}[mode]
    nt.links.new(sp.outputs[a], cb.inputs['X']); nt.links.new(sp.outputs[c], cb.inputs['Y'])
    t1 = nt.nodes.new('ShaderNodeTexImage'); t1.image = bpy.data.images.load(os.path.join(SH, alb)); nt.links.new(cb.outputs[0], t1.inputs['Vector'])
    nt.links.new(t1.outputs['Color'], b.inputs['Base Color'])
    if emi:
        t2 = nt.nodes.new('ShaderNodeTexImage'); t2.image = bpy.data.images.load(os.path.join(SH, emi)); nt.links.new(cb.outputs[0], t2.inputs['Vector'])
        nt.links.new(t2.outputs['Color'], b.inputs['Emission Color']); b.inputs['Emission Strength'].default_value = es
    return m


def box(c, s, m, gname='static', bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=c); o = bpy.context.object; o.scale = s; o.data.materials.append(m)
    if bevel:
        md = o.modifiers.new('b', 'BEVEL'); md.width = bevel; md.segments = 2; md.limit_method = 'NONE'
    return g(gname, o)


def cyl(c, r, h, m, gname='static', v=24, rot=None):
    bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h, location=c); o = bpy.context.object; o.data.materials.append(m)
    if rot: o.rotation_euler = rot
    bpy.ops.object.shade_smooth(); return g(gname, o)


def sph(c, s, m, gname='static', sub=2):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=1, location=c); o = bpy.context.object; o.scale = s; o.data.materials.append(m)
    bpy.ops.object.shade_smooth(); return g(gname, o)


def light(kind, loc, energy, col, size=0.1, rot=None, spot=None, gname='lights'):
    ld = bpy.data.lights.new('L', kind); ld.energy = energy; ld.color = col; ld.shadow_soft_size = size
    if kind == 'AREA': ld.size = size
    if kind == 'SPOT' and spot: ld.spot_size = spot; ld.spot_blend = 0.6
    o = bpy.data.objects.new('L', ld); sc.collection.objects.link(o); o.location = loc
    if rot: o.rotation_euler = rot
    return g(gname, o)


# ---------------- materials ----------------
M_ASPH = mat('asphalt', (0.06, 0.06, 0.065), 0.32)
M_WALK = mat('sidewalk', (0.16, 0.16, 0.16), 0.5)
M_PUD = mat('puddle', (0.045, 0.05, 0.058), 0.12)
M_PLAST = mat('plaster', (0.72, 0.66, 0.55), 0.85)
M_BASE = mat('base', (0.25, 0.23, 0.21), 0.9)
M_ROOF = mat('roof', (0.12, 0.12, 0.12), 0.9)
M_FRAME = mat('frame', (0.75, 0.75, 0.73), 0.4, 0.2)
M_SILL = mat('sill', (0.55, 0.56, 0.58), 0.35, 0.6)
M_GLASS = mat('glass', (0.6, 0.7, 0.75), 0.03, alpha=0.12)
M_FLOOR = mat('tiles', (0.62, 0.6, 0.56), 0.35)
M_INWALL = mat('inwall', (0.85, 0.82, 0.74), 0.8)
M_SHELF = mat('shelf', (0.82, 0.82, 0.8), 0.4, 0.3)
M_TUBE = mat('tube', (1, 1, 1), 0.3, emit=(1.0, 0.9, 0.72), es=12)
M_SIGN = img_mat('sign', 'sign.png', 'sign.png', 3.0, 0.4, 'xz')
M_POLE = mat('pole', (0.18, 0.19, 0.2), 0.5, 0.6)
M_LAMPH = mat('lamphead', (1, 1, 1), 0.3, emit=(1.0, 0.62, 0.28), es=30)
M_BREAD = mat('bread', (0.62, 0.36, 0.12), 0.55); M_BREAD2 = mat('bread2', (0.75, 0.5, 0.22), 0.55)
M_BASKET = mat('basket', (0.45, 0.28, 0.15), 0.8)
M_COUNTER = mat('counter', (0.35, 0.22, 0.14), 0.5)
M_REG = mat('register', (0.08, 0.08, 0.09), 0.4); M_REGS = mat('regscr', (0, 0, 0), 0.3, emit=(0.3, 0.8, 0.5), es=3)
M_SKIN = mat('skin', (0.85, 0.66, 0.52), 0.6); M_HAIR = mat('hair', (0.55, 0.52, 0.5), 0.8)
M_SHIRT = mat('shirt', (0.88, 0.88, 0.86), 0.7); M_VEST = mat('vest', (0.42, 0.16, 0.55), 0.7)
M_PANTS = mat('pants', (0.12, 0.12, 0.14), 0.8); M_COAT = mat('coat', (0.18, 0.28, 0.24), 0.8); M_HAIR2 = mat('hair2', (0.15, 0.1, 0.07), 0.8)
M_RBASK = mat('redbasket', (0.75, 0.08, 0.08), 0.5)
PROD = [img_mat(f'prod{i}', f'prod_{i}.png', None, 0, 0.5, 'yz') for i in range(6)]
M_CANR = mat('canr', (0.7, 0.1, 0.1), 0.3, 0.6); M_CANS = mat('cans', (0.7, 0.7, 0.72), 0.25, 1.0)
M_BOT = mat('bottle', (0.2, 0.45, 0.25), 0.1); M_BOT2 = mat('bottle2', (0.75, 0.4, 0.1), 0.1)
M_PANEL = img_mat('panel', 'panel_alb.png', 'panel_emi.png', 4.0, 0.85, 'xz')
M_PANEL_Y = img_mat('panel_y', 'panel_alb.png', 'panel_emi.png', 4.0, 0.85, 'yz')
M_BARK = mat('bark', (0.08, 0.06, 0.05), 0.9)

# ---------------- ground ----------------
box((0, 0, -0.05), (140, 140, 0.1), M_ASPH)
box((-4.0, -26.0-0.5, 0.06), (14, 10, 0.12), M_WALK)
rng = np.random.default_rng(5)
for i in range(14):
    x, y = rng.uniform(-18, 10), rng.uniform(-48, -33) if i < 9 else rng.uniform(-14, 18)
    o = cyl((x, y, 0.006), 1.0, 0.004, M_PUD, v=24); o.scale = (rng.uniform(0.4, 1.3), rng.uniform(0.3, 0.7), 1)

_before = set(bpy.data.objects)
# ---------------- shop shell (x -5..5, y -3..3, h 3.5) ----------------
X0, X1, Y0, Y1, H = -5.0, 5.0, -3.0, 3.0, 3.5
T = 0.25
DOOR = (-3.7, -2.5)            # x range, h 2.2
WINS = [(-1.6, 0.8), (1.4, 3.8)]   # x ranges, z 0.95..2.5
WZ0, WZ1 = 1.0, 2.5
box((0, Y1 + T / 2, H / 2), (X1 - X0 + 2 * T, T, H), M_PLAST); box((X0 - T / 2, 0, H / 2), (T, Y1 - Y0, H), M_PLAST); box((X1 + T / 2, 0, H / 2), (T, Y1 - Y0, H), M_PLAST)
box((0, 0, H + 0.1), (X1 - X0 + 2 * T + 0.2, Y1 - Y0 + 2 * T + 0.2, 0.2), M_ROOF)
# front wall pieces
yF = Y0 - T / 2
cuts = sorted([DOOR] + WINS)
xs = [X0 - T] + [v for r in cuts for v in r] + [X1 + T]
for i in range(0, len(xs), 2):
    a, b = xs[i], xs[i + 1]
    box(((a + b) / 2, yF, H / 2), (b - a, T, H), M_PLAST)
for a, b in WINS:
    box(((a + b) / 2, yF, WZ0 / 2), (b - a, T, WZ0), M_PLAST); box(((a + b) / 2, yF, (WZ1 + H) / 2), (b - a, T, H - WZ1), M_PLAST)
    box(((a + b) / 2, Y0 - T - 0.06, WZ0 - 0.03), (b - a + 0.15, 0.2, 0.05), M_SILL)            # outer sill
    box(((a + b) / 2, Y0 + 0.08, WZ0 - 0.02), (b - a, 0.25, 0.04), M_SILL)                     # inner sill
    box(((a + b) / 2, yF, WZ0 + 0.02), (b - a, 0.08, 0.04), M_FRAME); box(((a + b) / 2, yF, WZ1 - 0.02), (b - a, 0.08, 0.04), M_FRAME)
    box((a + 0.02, yF, (WZ0 + WZ1) / 2), (0.04, 0.08, WZ1 - WZ0), M_FRAME); box((b - 0.02, yF, (WZ0 + WZ1) / 2), (0.04, 0.08, WZ1 - WZ0), M_FRAME)
    box(((a + b) / 2, yF, (WZ0 + WZ1) / 2), (0.04, 0.08, WZ1 - WZ0), M_FRAME)
    box(((a + b) / 2, yF, (WZ0 + WZ1) / 2), (b - a, 0.01, WZ1 - WZ0), M_GLASS, 'glass')
a, b = DOOR
box(((a + b) / 2, yF, (2.2 + H) / 2), (b - a, T, H - 2.2), M_PLAST)
box(((a + b) / 2, yF, 1.1), (b - a, 0.01, 2.2), M_GLASS, 'glass')
for xx in (a + 0.03, b - 0.03):
    box((xx, yF, 1.1), (0.06, 0.08, 2.2), M_FRAME)
box(((a + b) / 2, yF, 2.17), (b - a, 0.08, 0.06), M_FRAME); box(((a + b) / 2 + 0.4, yF - 0.06, 1.05), (0.03, 0.04, 0.5), M_SILL)
box(((a + b) / 2, Y0 - 0.9, 0.09), (1.8, 1.2, 0.18), M_WALK)        # porch step
box((0, Y0 - T - 0.02, 3.0), (8.2, 0.08, 0.55), M_SIGN, 'sign')
box((0, Y0 - T + 0.02, 0.15), (X1 - X0 + 2 * T, 0.06, 0.3), M_BASE)

# ---------------- interior ----------------
box((0, 0, 0.005), (X1 - X0, Y1 - Y0, 0.01), M_FLOOR)
box((0, 0, H - 0.2), (X1 - X0, Y1 - Y0, 0.02), M_INWALL)
for x in (-3.0, 0.0, 3.0):
    for y in (-1.6, 0.6):
        box((x, y, H - 0.24), (1.2, 0.12, 0.04), M_TUBE)
for x, y in ((-2.5, -1.2), (1.5, -1.2), (-2.5, 1.5), (1.5, 1.5)):
    light('AREA', (x, y, H - 0.3), 160, (1.0, 0.86, 0.66), 1.6, gname='interior')


def shelf_unit(cx, cy, length, along='x', tiers=(0.25, 0.7, 1.15, 1.6), depth=0.45, facing=-1):
    hgt = tiers[-1] + 0.3
    if along == 'x':
        box((cx, cy + facing * -depth / 2, hgt / 2), (length, 0.04, hgt), M_SHELF)
        for z in tiers:
            box((cx, cy, z), (length, depth, 0.03), M_SHELF)
            n = int(length / 0.2)
            for i in range(n):
                x = cx - length / 2 + 0.1 + i * 0.2; kind = rng.integers(0, 4)
                if kind < 2:
                    bh = rng.uniform(0.2, 0.3); o = box((x, cy + facing * 0.08, z + bh / 2 + 0.015), (0.15, 0.12, bh), PROD[rng.integers(0, 6)])
                    o.rotation_euler = (0, 0, math.radians(90 if facing < 0 else -90))
                elif kind == 2:
                    for j in range(2):
                        cyl((x - 0.04 + j * 0.08, cy + facing * 0.1, z + 0.07), 0.035, 0.11, M_CANR if rng.random() < 0.5 else M_CANS, v=12)
                else:
                    cyl((x, cy + facing * 0.08, z + 0.13), 0.035, 0.24, M_BOT if rng.random() < 0.5 else M_BOT2, v=12)


shelf_unit(0.0, 2.65, 9.0, 'x', facing=-1)
shelf_unit(-0.6, 0.55, 3.6, 'x', tiers=(0.25, 0.7, 1.15), facing=-1)
# bread rack right behind window 1
for z in (0.55, 0.95):
    box((-0.4, -2.35, z), (2.2, 0.5, 0.03), M_SHELF)
    for i in range(9):
        x = -1.35 + i * 0.24
        sph((x, -2.35, z + 0.07), (0.1, 0.055, 0.055), M_BREAD if i % 2 else M_BREAD2)
for x in (-1.5, 0.7):
    box((x, -2.35, 0.5), (0.04, 0.5, 1.0), M_SHELF)
# counter + register
box((3.2, -1.3, 0.5), (1.8, 0.7, 1.0), M_COUNTER, bevel=0.01)
box((3.6, -1.3, 1.1), (0.4, 0.35, 0.2), M_REG); box((3.6, -1.42, 1.28), (0.3, 0.02, 0.18), M_REGS)


def person(x, y, yaw, top, hair, gname, h=1.68, basket=False, vest=None):
    import bpy as _b
    root = bpy.data.objects.new(gname, None); sc.collection.objects.link(root); root.location = (x, y, 0); root.rotation_euler = (0, 0, yaw); g(gname, root)
    parts = []
    s = h / 1.7
    parts.append(cyl((0.09, 0, 0.42 * s), 0.07 * s, 0.84 * s, M_PANTS, gname, 12)); parts.append(cyl((-0.09, 0, 0.42 * s), 0.07 * s, 0.84 * s, M_PANTS, gname, 12))
    parts.append(cyl((0, 0, 1.12 * s), 0.19 * s, 0.6 * s, top, gname, 16))
    if vest:
        parts.append(cyl((0, 0, 1.12 * s), 0.2 * s, 0.56 * s, vest, gname, 16))
    parts.append(sph((0, 0, 1.44 * s), (0.2 * s, 0.13 * s, 0.07 * s), top, gname))
    for sx in (-1, 1):
        o = cyl((sx * 0.24 * s, 0, 1.12 * s), 0.055 * s, 0.6 * s, top, gname, 10); o.rotation_euler = (0, sx * 0.08, 0); parts.append(o)
        parts.append(sph((sx * 0.26 * s, 0, 0.8 * s), (0.05 * s, 0.05 * s, 0.06 * s), M_SKIN, gname))
    parts.append(cyl((0, 0, 1.52 * s), 0.05 * s, 0.1 * s, M_SKIN, gname, 10))
    parts.append(sph((0, 0, 1.64 * s), (0.11 * s, 0.12 * s, 0.13 * s), M_SKIN, gname))
    parts.append(sph((0, 0.02 * s, 1.69 * s), (0.115 * s, 0.12 * s, 0.1 * s), hair, gname))
    if basket:
        parts.append(box((0.3 * s, -0.05, 0.75 * s), (0.18, 0.35, 0.2), M_RBASK, gname))
        parts.append(box((0.3 * s, -0.1, 0.83 * s), (0.08, 0.1, 0.1), PROD[0], gname))
    for o in parts:
        o.parent = root
    return root


CASHIER = person(3.25, -0.65, math.radians(180), M_SHIRT, M_HAIR, 'cashier', 1.62, vest=M_VEST)
BUYER = person(-1.6, -0.9, math.radians(200), M_COAT, M_HAIR2, 'buyer', 1.75, basket=True)

_shop = [o for o in bpy.data.objects if o not in _before and o.parent is None]
for o in _shop:
    o.location.x += -4.0; o.location.y += -26.0
SHOP_OFF = Vector((-4.0, -26.0, 0))

# ---------------- playground in the middle of the yard ----------------
M_SAND = mat('sand', (0.55, 0.47, 0.33), 0.95); M_WOOD = mat('woodframe', (0.4, 0.25, 0.14), 0.8)
M_PRED = mat('pg_red', (0.6, 0.12, 0.1), 0.5, 0.3); M_PBLUE = mat('pg_blue', (0.12, 0.25, 0.55), 0.5, 0.3); M_PYEL = mat('pg_yel', (0.75, 0.6, 0.12), 0.5, 0.3)
PG = (0.0, 6.0)
box((PG[0] - 5, PG[1], 0.1), (3, 3, 0.2), M_WOOD); box((PG[0] - 5, PG[1], 0.12), (2.7, 2.7, 0.2), M_SAND)
for sx in (-1, 1):   # swings frame
    for sy in (-1, 1):
        o = cyl((PG[0] + 1 + sx * 1.2, PG[1] + sy * 0.5, 1.2), 0.05, 2.5, M_PBLUE, v=8); o.rotation_euler = (sy * 0.2, 0, 0)
box((PG[0] + 1, PG[1], 2.4), (2.6, 0.08, 0.08), M_PBLUE)
for sx in (-0.5, 0.5):
    for k in (-0.2, 0.2):
        cyl((PG[0] + 1 + sx + k, PG[1], 1.45), 0.01, 1.9, M_POLE, v=6)
    box((PG[0] + 1 + sx, PG[1], 0.5), (0.45, 0.2, 0.04), M_PRED)
# slide
box((PG[0] + 5.5, PG[1] - 0.5, 0.75), (0.8, 0.8, 1.5), M_PYEL); o = box((PG[0] + 5.5, PG[1] + 1.1, 0.75), (0.6, 2.4, 0.06), M_PRED); o.rotation_euler = (math.radians(-35), 0, 0)
for k in range(5):
    box((PG[0] + 5.5, PG[1] - 1.0 - 0.1 * 0, 0.25 + k * 0.3), (0.6, 0.06, 0.04), M_POLE)
# benches
for bx, by in ((PG[0] - 2, PG[1] - 4), (PG[0] + 3, PG[1] - 4)):
    box((bx, by, 0.45), (1.8, 0.4, 0.06), M_WOOD); box((bx, by + 0.2, 0.75), (1.8, 0.06, 0.4), M_WOOD)
    for sx in (-0.8, 0.8):
        box((bx + sx, by, 0.22), (0.06, 0.4, 0.44), M_POLE)

# ---------------- street lamps ----------------
for (x, y) in ((-13.0, -32.0), (5.0, -32.0), (-4.0, -42.0), (-9.0, 2.0), (9.0, 10.0)):
    cyl((x, y, 3.0), 0.07, 6.0, M_POLE, v=10)
    box((x, y + 0.5, 6.0), (0.12, 1.0, 0.06), M_POLE)
    box((x, y + 0.95, 5.95), (0.3, 0.45, 0.1), M_LAMPH)
    light('SPOT', (x, y + 0.95, 5.85), 900, (1.0, 0.62, 0.3), 0.15, (0, 0, 0), math.radians(110), 'street')

# window light spilling onto the sidewalk + lamp over the door + faint sky light
for a_, b_ in WINS:
    light('AREA', ((a_ + b_) / 2, Y0 - 0.6, 2.3), 140, (1.0, 0.82, 0.55), 2.2, (math.radians(60), 0, 0), gname='spill')
light('POINT', ((DOOR[0] + DOOR[1]) / 2, Y0 - 0.5, 2.6), 40, (1.0, 0.85, 0.65), 0.1, gname='spill')
_mo = bpy.data.lights.new('moon', 'SUN'); _mo.energy = 0.12; _mo.color = (0.55, 0.65, 1.0); _mo.angle = math.radians(5)
_moo = bpy.data.objects.new('moon', _mo); sc.collection.objects.link(_moo); _moo.rotation_euler = (math.radians(55), 0, math.radians(30)); g('moon', _moo)

# ---------------- five-storey blocks (U around the yard) ----------------
FL = 15.0
box((0, 28, FL / 2), (60, 12, FL), M_PANEL)                     # back block, face at y=22
box((-34, 7, FL / 2), (12, 54, FL), M_PANEL_Y)                  # left block, face at x=-28
box((34, 7, FL / 2), (12, 54, FL), M_PANEL_Y)                   # right block, face at x=28
for c, s in (((0, 28, FL + 0.3), (60.4, 12.4, 0.6)), ((-34, 7, FL + 0.3), (12.4, 54.4, 0.6)), ((34, 7, FL + 0.3), (12.4, 54.4, 0.6))):
    box(c, s, M_ROOF)
# bare trees
for (x, y) in ((-12, 14), (12.5, 16), (-18, -2), (19, -4), (-16, -30)):
    cyl((x, y, 2.0), 0.15, 4.0, M_BARK, v=8)
    for k in range(6):
        a = k * 1.05 + rng.uniform(0, 0.5); L = rng.uniform(1.2, 2.2)
        o = cyl((x + math.cos(a) * L * 0.35, y + math.sin(a) * L * 0.35, 3.2 + rng.uniform(0, 1.2)), 0.05, L, M_BARK, v=6)
        o.rotation_euler = (math.radians(50) * math.sin(a + 1.57), math.radians(50) * math.cos(a + 1.57) * -1, 0)

# ---------------- camera ----------------
cd = bpy.data.cameras.new('C'); cd.sensor_fit = 'VERTICAL'; cd.clip_start = 0.05; cd.clip_end = 400
co = bpy.data.objects.new('C', cd); sc.collection.objects.link(co); sc.camera = co


def cam(pos, tgt, tany=0.62):
    cd.angle_y = 2 * math.atan(tany); co.location = pos; co.rotation_euler = (Vector(tgt) - Vector(pos)).to_track_quat('-Z', 'Y').to_euler()


def shoot(path):
    sc.render.filepath = path; t1 = time.time(); bpy.ops.render.render(write_still=True); print('shot', os.path.basename(path), round(time.time() - t1, 1), flush=True)


if __name__ == '__main__' and os.environ.get('SHOP_PREVIEW') == '1':
    OD = os.path.join(HERE, 'shop_prev'); os.makedirs(OD, exist_ok=True)
    cam((-1.0, -48, 1.65), (-3.7, -26, 2.2), 0.5); shoot(os.path.join(OD, 'v1.png'))
    cam((-4.2, -34.0, 1.65), (-4.0, -29, 1.7)); shoot(os.path.join(OD, 'v2.png'))
    cam((-3.75, -29.7, 1.6), (-3.85, -25.5, 1.15), 0.55)
    for o in ALL.get('spill', []): o.hide_render = True
    shoot(os.path.join(OD, 'v3.png'))
    for o in ALL.get('spill', []): o.hide_render = False

    sc.render.resolution_x, sc.render.resolution_y = RY, RX
    cam((32, -72, 34), (0, -6, 2), 0.42); shoot(os.path.join(OD, 'v4.png'))
