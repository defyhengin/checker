import bpy, math, sys, time, os
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = int(sys.argv[1]) if len(sys.argv) > 1 else 64
OUT = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'bl_test.png')

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = SAMPLES
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.render.resolution_x, sc.render.resolution_y = 1280, 720
sc.render.film_transparent = False
try:
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Medium High Contrast'
except Exception:
    pass

world = bpy.data.worlds.new('W'); sc.world = world
world.use_nodes = True
world.node_tree.nodes['Background'].inputs[0].default_value = (0.004, 0.005, 0.012, 1)


def mat(name, color, rough=0.5, metal=0.0, emit=None, estr=0.0, transm=0.0, ior=1.45):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if transm:
        b.inputs['Transmission Weight'].default_value = transm
        b.inputs['IOR'].default_value = ior
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = estr
    return m


def checker_mat(name, c1, c2, scale):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    ch = nt.nodes.new('ShaderNodeTexChecker'); ch.inputs['Scale'].default_value = scale
    ch.inputs['Color1'].default_value = (*c1, 1); ch.inputs['Color2'].default_value = (*c2, 1)
    nt.links.new(ch.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.35
    return m


def cube(name, loc, size, m, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(location=loc, rotation=rot)
    o = bpy.context.object; o.name = name
    o.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    bpy.ops.object.transform_apply(scale=True)
    if bevel:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = 3
    o.data.materials.append(m)
    bpy.ops.object.shade_smooth() if bevel else None
    return o


def cylinder(name, loc, r, depth, m, verts=48, bevel=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=depth, location=loc)
    o = bpy.context.object; o.name = name
    if bevel:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = 3
        bpy.ops.object.shade_smooth()
    o.data.materials.append(m)
    return o


M_WALL = mat('wall', (0.42, 0.47, 0.44), 0.85)
M_FLOOR = checker_mat('floor', (0.16, 0.16, 0.17), (0.32, 0.32, 0.31), 14)
M_FR = mat('fridge', (0.86, 0.87, 0.88), 0.25)
M_FRIN = mat('fridge_in', (0.9, 0.93, 0.95), 0.4)
M_GLASS = mat('glass', (0.85, 0.95, 1.0), 0.02, transm=1.0, ior=1.5)
M_HANDLE = mat('handle', (0.05, 0.05, 0.06), 0.3, 0.6)
M_WOOD = mat('wood', (0.33, 0.18, 0.09), 0.45)
M_PLATE = mat('plate', (0.92, 0.91, 0.88), 0.12)
M_CRUMB = mat('crumb', (0.55, 0.36, 0.17), 0.8)
M_SHADE = mat('shade', (0.08, 0.08, 0.09), 0.35, 0.7)
M_BULB = mat('bulb', (1, 0.85, 0.6), 0.2, emit=(1.0, 0.8, 0.55), estr=30)
M_FRLIGHT = mat('frlight', (1, 1, 1), 0.2, emit=(0.85, 0.93, 1.0), estr=12)

# room
cube('floor', (0, 0, -0.01), (6, 6, 0.02), M_FLOOR)
cube('wall_back', (0, 2.05, 1.3), (6, 0.1, 2.6), M_WALL)
cube('wall_left', (-2.05, 0, 1.3), (0.1, 6, 2.6), M_WALL)

# fridge (hollow), front faces -y
FX, FY = -1.45, 1.6
W, D, H, T = 0.72, 0.68, 1.9, 0.05
cube('fr_back', (FX, FY + D / 2 - T / 2, H / 2), (W, T, H), M_FR, 0.01)
cube('fr_l', (FX - W / 2 + T / 2, FY, H / 2), (T, D, H), M_FR, 0.015)
cube('fr_r', (FX + W / 2 - T / 2, FY, H / 2), (T, D, H), M_FR, 0.015)
cube('fr_top', (FX, FY, H - T / 2), (W, D, T), M_FR, 0.015)
cube('fr_bot', (FX, FY, T / 2 + 0.06), (W, D, T + 0.12), M_FR, 0.015)
cube('fr_inback', (FX, FY + D / 2 - T - 0.004, H / 2), (W - 2 * T, 0.008, H - 0.2), M_FRIN)
for z in (0.55, 1.0, 1.42):
    cube(f'shelf{z}', (FX, FY + 0.03, z), (W - 2 * T - 0.01, D - 0.12, 0.008), M_GLASS)
# light strip inside top
cube('frlamp', (FX, FY + 0.05, H - T - 0.03), (0.3, 0.06, 0.02), M_FRLIGHT)
bpy.ops.object.light_add(type='AREA', location=(FX, FY + 0.05, H - T - 0.06))
la = bpy.context.object; la.data.energy = 18; la.data.size = 0.3; la.data.color = (0.85, 0.93, 1.0)
la.rotation_euler = (0, 0, 0)
# open door, hinge on the left front edge
bpy.ops.object.empty_add(location=(FX - W / 2, FY - D / 2, 0))
hinge = bpy.context.object
door = cube('door', (FX - W / 2 + W / 2, FY - D / 2 - 0.03, H / 2), (W, 0.06, H), M_FR, 0.02)
handle = cube('handle', (FX + W / 2 - 0.07, FY - D / 2 - 0.09, 1.15), (0.025, 0.04, 0.45), M_HANDLE, 0.008)
for o in (door, handle):
    o.parent = hinge
    o.matrix_parent_inverse = hinge.matrix_world.inverted()
hinge.rotation_euler = (0, 0, math.radians(-105))


def import_glb(path, target_size, loc, rot_z=0.0):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    objs = [o for o in bpy.data.objects if o not in before]
    roots = [o for o in objs if o.parent is None]
    bpy.context.view_layer.update()
    pts = []
    for o in objs:
        if o.type == 'MESH':
            pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    s = target_size / max(mx - mn)
    for r in roots:
        r.scale = r.scale * s
        r.rotation_euler.z += rot_z
    bpy.context.view_layer.update()
    pts = []
    for o in objs:
        if o.type == 'MESH':
            pts += [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    off = Vector(loc) - Vector(((mn.x + mx.x) / 2, (mn.y + mx.y) / 2, mn.z))
    for r in roots:
        r.location += off
    return objs


MD = os.path.join(HERE, 'models')
import_glb(os.path.join(MD, 'Avocado.glb'), 0.11, (FX + 0.12, FY - 0.02, 1.004), 0.6)

# table with plate, crumb, empty bottle
TX, TY = 0.55, 0.35
cube('top', (TX, TY, 0.76), (1.2, 0.8, 0.04), M_WOOD, 0.006)
for dx in (-0.55, 0.55):
    for dy in (-0.35, 0.35):
        cube('leg', (TX + dx, TY + dy, 0.37), (0.05, 0.05, 0.74), M_WOOD, 0.004)
cylinder('plate', (TX - 0.05, TY - 0.05, 0.788), 0.13, 0.016, M_PLATE, 64, 0.006)
cylinder('plate_in', (TX - 0.05, TY - 0.05, 0.792), 0.09, 0.012, M_PLATE, 64, 0.004)
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.006, location=(TX - 0.04, TY - 0.06, 0.8))
bpy.context.object.data.materials.append(M_CRUMB)
import_glb(os.path.join(MD, 'WaterBottle.glb'), 0.24, (TX + 0.33, TY + 0.18, 0.78), 0.3)

# pendant lamp
LX, LY, LZ = TX - 0.05, TY - 0.05, 1.62
cylinder('cord', (LX, LY, (LZ + 2.6) / 2 + 0.08), 0.004, 2.6 - LZ - 0.16, M_HANDLE, 8)
bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=0.17, radius2=0.03, depth=0.16, location=(LX, LY, LZ + 0.08))
shade = bpy.context.object; shade.data.materials.append(M_SHADE)
md = shade.modifiers.new('sol', 'SOLIDIFY'); md.thickness = 0.004
bpy.ops.object.shade_smooth()
bpy.ops.mesh.primitive_uv_sphere_add(radius=0.035, location=(LX, LY, LZ + 0.02))
bpy.context.object.data.materials.append(M_BULB)
bpy.ops.object.light_add(type='SPOT', location=(LX, LY, LZ))
sp = bpy.context.object; sp.data.energy = 90; sp.data.spot_size = math.radians(110); sp.data.spot_blend = 0.6
sp.data.color = (1.0, 0.78, 0.5); sp.data.shadow_soft_size = 0.04
# faint moonlight from the right
bpy.ops.object.light_add(type='AREA', location=(2.6, -0.5, 1.8))
moon = bpy.context.object; moon.data.energy = 25; moon.data.size = 1.2; moon.data.color = (0.45, 0.55, 0.9)
moon.rotation_euler = (0, math.radians(-75), 0)

# camera
bpy.ops.object.camera_add(location=(1.55, -1.45, 1.5))
cam = bpy.context.object; sc.camera = cam
cam.data.lens = 26
target = Vector((-0.55, 1.2, 0.95))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
cam.data.dof.use_dof = True
cam.data.dof.focus_distance = (target - cam.location).length * 0.9
cam.data.dof.aperture_fstop = 4.0

sc.render.filepath = OUT
t0 = time.time()
bpy.ops.render.render(write_still=True)
print('render_time', round(time.time() - t0, 1), 's', 'samples', SAMPLES)
