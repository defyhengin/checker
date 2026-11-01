import os, sys, math
os.environ.setdefault('EP_OUT', 'ep_pie')
from bkit import *

MODE = os.environ.get('MODE', 'stills')
# ---- the chair we sit on (hidden by default)
bpy.context.view_layer.update()
for o in list(coll.objects):
    if o.type != 'MESH' or o.parent is not None or any(o in v for v in ALL.values()):
        continue
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    ex0, ex1 = min(p.x for p in pts), max(p.x for p in pts); ez0, ez1 = -max(p.y for p in pts), -min(p.y for p in pts); ey1 = max(p.z for p in pts)
    if ex0 > 0.85 and ex1 < 1.45 and ez0 > 1.6 and ez1 < 2.2 and ey1 < 1.1:
        grp_add('mychair', o)

M_PIE = noise_mat('pie', (0.62, 0.34, 0.1), (0.8, 0.52, 0.2), 0.45, 18)
M_FILL = noise_mat('filling', (0.82, 0.74, 0.45), (0.7, 0.6, 0.3), 0.7, 30)


def pie(c, gname, half=0, yaw=0.0, s=1.0):
    """half: 0 whole, -1 left half, +1 right half (cut face towards the gap)"""
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=12, radius=1)
    o = bpy.context.object; me = o.data
    o.data.materials.append(M_PIE); o.data.materials.append(M_FILL)
    if half:
        bm = bmesh.new(); bm.from_mesh(me)
        res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(half, 0, 0), clear_inner=True)
        edges = [e for e in res['geom_cut'] if isinstance(e, bmesh.types.BMEdge)]
        f = bmesh.ops.edgeloop_fill(bm, edges=edges)
        for fc in f['faces']:
            fc.material_index = 1
        bm.to_mesh(me); bm.free()
    o.scale = (0.1 * s, 0.05 * s, 0.038 * s)
    o.location = P(c); o.rotation_euler = (0, 0, yaw); link(o)
    bpy.ops.object.shade_smooth()
    grp_add(gname, o)
    # pinched seam on top
    for i in range(7):
        x = -0.07 + i * 0.0233
        if half and x * half < 0:
            continue
        sx = math.cos(yaw) * x * s; sy = math.sin(yaw) * x * s
        e = sph((c[0] + sx, c[1] + 0.03 * s, c[2] - sy), (0.013 * s, 0.006 * s, 0.009 * s), M_PIE, 2)
        grp_add(gname, e)
    return o


def foil_sheet(c, r, gname):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=30, y_subdivisions=30, size=2 * r, location=P(c))
    o = bpy.context.object; o.data.materials.append(M_FOIL); link(o)
    tx = bpy.data.textures.new('crumple2', 'CLOUDS'); tx.noise_scale = 0.03
    md = o.modifiers.new('d', 'DISPLACE'); md.texture = tx; md.strength = 0.012; md.direction = 'Z'
    grp_add(gname, o); return o


# ---- props
foil('fr_foil', (2.62, 1.0, 1.5), (0.11, 0.045, 0.09))
for _m in (M_FOIL,):
    _b = _m.node_tree.nodes['Principled BSDF']; _b.inputs['Roughness'].default_value = 0.42; _b.inputs['Base Color'].default_value = (0.92, 0.92, 0.94, 1); _b.inputs['Metallic'].default_value = 0.45
PL = (TXc, 0.762, TZc - 0.22)
plate(PL, 'plate')
pie((PL[0], PL[1] + 0.045, PL[2]), 'pie_whole', 0, 0.3)
pie((PL[0] - 0.022, PL[1] + 0.045, PL[2] + 0.006), 'pie_cut', -1, 0.3)
pie((PL[0] + 0.04, PL[1] + 0.045, PL[2] - 0.012), 'pie_cut', 1, 0.3)
pie((PL[0] - 0.01, PL[1] + 0.045, PL[2] + 0.003), 'pie_mine', -1, 0.3)

CATP = np.array((1.74, 0.0, 1.9))
kitty = Cat(CATP, yaw_to(CATP, (1.15, 0, 1.8), 20))
th = kitty.root.rotation_euler.z
BOWLP = CATP + np.array((math.cos(th), 0.0, -math.sin(th))) * 0.27
bowl(BOWLP, 'cat')
pie((BOWLP[0], BOWLP[1] + 0.045, BOWLP[2]), 'cat', 1, th + 0.4, 0.95)
light('catfill', 'POINT', (1.45, 0.65, 1.45), 9, (1.0, 0.7, 0.45), 0.15)
EYE = np.array((1.15, 1.18, 1.8))
LOOK_CAT = (CATP + BOWLP) / 2 + np.array((0.0, 0.18, 0.0))
A_BOWL = kitty.look_angles(BOWLP + np.array((0, 0.03, 0)))
A_CAM = kitty.look_angles(EYE)

TBL = ['pend', 'ceilsoft', 'fill', 'win']
if MODE == 'stills':
    state(['fr_foil'], ['fr1', 'fr2', 'frfill', 'win'], fr=105, fr_warm=0.25)
    cam((1.55, 1.05, 1.5), (2.6, 0.98, 1.5)); print('FOIL', screen_pos((2.6, 1.0, 1.5)), flush=True)
    shoot(os.path.join(OUT, 'p1.png'))
    state(['plate', 'pie_whole'], TBL)
    cam((TXc, 1.22, 2.0), (PL[0], PL[1] + 0.02, PL[2] + 0.02)); shoot(os.path.join(OUT, 'p2.png'))
    state(['plate', 'pie_cut'], TBL); shoot(os.path.join(OUT, 'p3.png'))
    state(['plate', 'pie_mine'], TBL); shoot(os.path.join(OUT, 'p5.png'))
else:
    # cat eating loop (30 frames) then the look-up (24 fps)
    D = os.path.join(OUT, 'cat'); os.makedirs(D, exist_ok=True)
    state(['cat'], ['pend', 'ceilsoft', 'win', 'catfill'])
    cam(EYE, LOOK_CAT)
    NL = 30; NUP = 36
    for fi in range(NL + NUP):
        p = os.path.join(D, f'f_{fi:04d}.png')
        if fi < NL:
            t = fi / 24.0
            bob = 0.13 * max(0.0, math.sin(2 * math.pi * t / 0.625))
            kitty.head(A_BOWL[0], A_BOWL[1] + bob); kitty.tail(0.45 * math.sin(2 * math.pi * fi / NL)); kitty.blink(1.0)
        else:
            k = (fi - NL) / (NUP - 1); s_ = k * k * (3 - 2 * k)
            kitty.head(A_BOWL[0] + (A_CAM[0] - A_BOWL[0]) * s_, A_BOWL[1] + (A_CAM[1] - A_BOWL[1]) * s_)
            kitty.tail(0.45 * math.sin(2 * math.pi * fi / NL)); kitty.blink([1, 1, 0.4, 0.08, 0.4][min(max(fi - NL - 26, 0), 4)] if fi - NL > 26 else 1.0)
        shoot(p)
