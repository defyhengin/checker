import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_recipe')
from bkit import *

MODE = os.environ.get('MODE', 'stills')
# hide the original closed pot
bpy.context.view_layer.update()
for o in list(coll.objects):
    if o.type != 'MESH' or o.parent is not None or any(o in v for v in ALL.values()):
        continue
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    ex0, ex1 = min(p.x for p in pts), max(p.x for p in pts); ez0, ez1 = -max(p.y for p in pts), -min(p.y for p in pts)
    ey0, ey1 = min(p.z for p in pts), max(p.z for p in pts)
    if ex0 > 2.4 and ex1 < 2.95 and ez0 > 3.1 and ez1 < 3.6 and ey0 > 0.9 and ey1 < 1.1:
        grp_add('oldpot', o)

M_POTATO = noise_mat('potato', (0.62, 0.48, 0.28), (0.5, 0.36, 0.2), 0.8, 25)
M_ONION = noise_mat('onion', (0.72, 0.45, 0.2), (0.62, 0.32, 0.12), 0.45, 8)
M_CARROT = noise_mat('carrot', (0.85, 0.35, 0.05), (0.75, 0.28, 0.03), 0.5, 20)
M_LEAF = simple_mat('leaf', (0.2, 0.45, 0.12), 0.6)
M_BOARD = noise_mat('board', (0.55, 0.36, 0.18), (0.62, 0.42, 0.22), 0.6, 6)
M_BROTH = noise_mat('broth', (0.75, 0.48, 0.15), (0.85, 0.6, 0.22), 0.08, 10)
M_POT = simple_mat('pot2', (0.75, 0.76, 0.78), 0.25, 1.0)
M_GLOW = simple_mat('glow', (1, 0.3, 0.05), 0.5, emit=(1.0, 0.25, 0.04), es=6)

# cutting board + vegetables
BD = (2.55, 0.9, 4.25)
box((BD[0] - 0.13, BD[1], BD[2] - 0.18), (BD[0] + 0.13, BD[1] + 0.018, BD[2] + 0.18), M_BOARD, 'board')
ellip((BD[0] - 0.02, BD[1] + 0.05, BD[2] - 0.09), (0.045, 0.034, 0.035), M_POTATO, 'veg1', 2, (0.2, 0.1, 0.5))
ellip((BD[0] + 0.03, BD[1] + 0.055, BD[2] + 0.02), (0.04, 0.04, 0.04), M_ONION, 'veg2', 3)
grp_add('veg2', cyl((BD[0] + 0.03, BD[1] + 0.09, BD[2] + 0.02), 0.006, 0.03, M_ONION, 8))
# carrot: a long cone lying on the board
bpy.ops.mesh.primitive_cone_add(vertices=12, radius1=0.022, radius2=0.004, depth=0.17, location=P((BD[0] - 0.03, BD[1] + 0.04, BD[2] + 0.11)))
o = bpy.context.object; o.rotation_euler = (math.radians(90), 0, math.radians(-70)); o.data.materials.append(M_CARROT); link(o); bpy.ops.object.shade_smooth(); grp_add('veg3', o)
for a_ in (-0.4, 0.0, 0.4):
    bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.006, radius2=0.0, depth=0.06, location=P((BD[0] - 0.03 + 0.1 * math.cos(math.radians(70)) * -1, BD[1] + 0.045, BD[2] + 0.11 - 0.09)))
    o = bpy.context.object; o.rotation_euler = (math.radians(90) + a_ * 0.5, a_, math.radians(-70)); o.data.materials.append(M_LEAF); link(o); grp_add('veg3', o)

# open pot with soup on the stove + burner glow
PC = (2.66, 0.92, 3.36)
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.11, depth=0.14, location=P((PC[0], PC[1] + 0.07, PC[2])))
o = bpy.context.object; bm = bmesh.new(); bm.from_mesh(o.data)
bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.normal.z > 0.9], context='FACES'); bm.to_mesh(o.data); bm.free()
o.modifiers.new('s', 'SOLIDIFY').thickness = 0.005; o.data.materials.append(M_POT); link(o); bpy.ops.object.shade_smooth(); grp_add('pot', o)
grp_add('pot', cyl((PC[0], PC[1] + 0.105, PC[2]), 0.104, 0.002, M_BROTH, 32))
_r = np.random.default_rng(3)
for i in range(16):
    a = _r.uniform(0, 6.28); rr = _r.uniform(0, 0.08)
    m = [M_POTATO, M_CARROT, M_ONION][i % 3]
    bpy.ops.mesh.primitive_cube_add(size=0.018, location=P((PC[0] + rr * math.cos(a), PC[1] + 0.106, PC[2] + rr * math.sin(a))))
    o = bpy.context.object; o.rotation_euler = tuple(_r.uniform(0, 1, 3)); o.data.materials.append(m); link(o); grp_add('pot', o)
for sx in (-1, 1):
    grp_add('pot', mbox((PC[0] - 0.012, PC[1] + 0.11, PC[2] + sx * 0.11), (PC[0] + 0.012, PC[1] + 0.125, PC[2] + sx * 0.16), simple_mat('ph', (0.05, 0.05, 0.05), 0.4)))
bpy.ops.mesh.primitive_torus_add(major_radius=0.105, minor_radius=0.006, location=P((PC[0], PC[1] - 0.004, PC[2])))
o = bpy.context.object; o.data.materials.append(M_GLOW); link(o); grp_add('pot', o)

# steam
def make_puffs(n, tag):
    out = []
    for i in range(n):
        m = bpy.data.materials.new(f'st_{tag}{i}'); m.use_nodes = True
        b = m.node_tree.nodes['Principled BSDF']; b.inputs['Base Color'].default_value = (0.9, 0.92, 0.95, 1)
        b.inputs['Emission Color'].default_value = (1, 0.95, 0.9, 1); b.inputs['Emission Strength'].default_value = 0.4; b.inputs['Roughness'].default_value = 1.0
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            m.blend_method = 'BLEND'
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=1)
        o = bpy.context.object; o.data.materials.append(m); link(o); bpy.ops.object.shade_smooth(); grp_add('steam', o)
        out.append((o, b, i / n, np.random.default_rng(i + 7).uniform(-1, 1, 3)))
    return out


PUFFS = make_puffs(18, 'p')


def set_steam(src, ph_, inten=1.0, rise=0.38, spread=0.09, r0=0.03, r1=0.09):
    for o, b, ph, rnd in PUFFS:
        a = (ph_ + ph) % 1.0
        pos = np.array(src) + np.array((rnd[0] * 0.06 + rnd[0] * spread * a + 0.02 * math.sin(6 * a + rnd[2] * 3), a * rise, rnd[1] * 0.06 + rnd[1] * spread * a))
        o.location = P(pos); r = r0 + (r1 - r0) * a; o.scale = (r, r, r * 1.2)
        b.inputs['Alpha'].default_value = float(0.12 * math.sin(math.pi * a) ** 1.5 * inten)


light('hood', 'SPOT', (2.62, 1.5, 3.55), 26, (1.0, 0.72, 0.45), 0.12, (0.05, -1, 0.0))
light('ksoft', 'AREA', (2.0, 2.3, 3.9), 20, (1.0, 0.82, 0.62), 1.5, (1, -0.8, 0))
PHR = tex_mat('phrec', 'phone_recipe.png', 'top', 0.2, emit=1.6)
if MODE == 'stills':
    state(['phone'], ['pend', 'ceilsoft', 'win'], phone=PHR)
    cam((PH[0] - 0.01, 0.98, PH[2] - 0.06), (PH[0], 0.765, PH[2] + 0.005)); shoot(os.path.join(OUT, 'r1.png'))
    for i, gs in enumerate((['board'], ['board', 'veg1'], ['board', 'veg1', 'veg2'], ['board', 'veg1', 'veg2', 'veg3'])):
        state(gs + ['pot'], ['hood', 'ksoft', 'win'])
        cam((2.12, 1.22, 4.06), (2.57, 0.93, 4.26)); shoot(os.path.join(OUT, f'r2_{i}.png'))
else:
    D = os.path.join(OUT, 'pot'); os.makedirs(D, exist_ok=True)
    state(['pot', 'steam', 'board', 'veg1', 'veg2', 'veg3'], ['hood', 'ksoft', 'win'])
    cam((2.05, 1.32, 3.12), (2.66, 1.0, 3.38))
    for fi in range(36):
        set_steam((PC[0], PC[1] + 0.11, PC[2]), fi / 36.0)
        shoot(os.path.join(D, f'f_{fi:04d}.png'))
